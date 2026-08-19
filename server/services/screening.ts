import { prisma } from '../db/index.js';
import { ReportStatus, TargetType } from '../db/generated/enums.js';
import type { TargetType as TargetTypeT } from '../db/generated/enums.js';
import { getIo } from '../middleware/socket.js';
import type { Db } from './jobQueue.js';
import { enqueueJob } from './jobQueue.js';
import type { SendNotificationPayload } from './notifications.js';
import {
  screenContent, decideAutoAction, fetchAsBase64, getSystemUserId, fileSystemReport,
} from './moderation.js';

export interface ScreenContentPayload {
  targetType: TargetTypeT;
  targetId: number;
  authorId: number;
  text: string;
  imageKeys?: string[];
  notifyOnApprove?: SendNotificationPayload;
}

// Applies a screening verdict to the target row.
// `null` action means no verdict was reached
// (Gemini exhausted retries, or ambiguous - mid-confidence band)
// Fail-closed: leave isPendingScreening true, never approve on an absent verdict
async function flipTargetRow(
  db: Db,
  targetType: TargetTypeT,
  targetId: number,
  text: string,
  action: ReturnType<typeof decideAutoAction>,
): Promise<void> {
  const removed = action?.status === ReportStatus.REMOVED;
  const noVerdict = action === null;

  switch (targetType) {
    case TargetType.POST:
      if (noVerdict) return; // Fail-closed: leave isPendingScreening: true, no write
      // Approve: clear pending flag / remove: also flag isRemoved
      await db.post.update({
        where: { id: targetId },
        data: { isPendingScreening: false, ...(removed ? { isRemoved: true } : {}) },
      });
      return;
    case TargetType.TRADE_OFFER:
      if (noVerdict) return; // Fail-closed
      await db.tradeOffer.update({
        where: { id: targetId },
        data: { isPendingScreening: false, ...(removed ? { isRemoved: true } : {}) },
      });
      return;
    case TargetType.TRADE_REQUEST:
      if (noVerdict) return; // Fail-closed
      await db.tradeRequest.update({
        where: { id: targetId },
        data: { isPendingScreening: false, ...(removed ? { isRemoved: true } : {}) },
      });
      return;
    case TargetType.REVIEW:
      if (noVerdict) return; // Fail-closed
      await db.review.update({
        where: { id: targetId },
        data: { isPendingScreening: false, ...(removed ? { isRemoved: true } : {}) },
      });
      return;
    case TargetType.USER:
      if (noVerdict) return; // Fail-closed: pendingBio stays queued, bio untouched
      // Approve: promote pendingBio into bio / remove: drop pendingBio, keep old bio
      await db.user.update({
        where: { id: targetId },
        data: removed
          ? { pendingBio: null, isPendingScreening: false }
          : { bio: text, pendingBio: null, isPendingScreening: false },
      });
      return;
    case TargetType.MESSAGE:
    default:
      // No call site reaches MESSAGE yet (reports.ts message screening is coming later)
      // Throw error in case I forget
      throw new Error(`processScreenContent: no handler for targetType ${targetType}`);
  }
}

export async function processScreenContent(payload: ScreenContentPayload): Promise<void> {
  // Fetch each reported image as base64 / Fallback to text-only screening
  const images = payload.imageKeys?.length
    ? (await Promise.all(payload.imageKeys.map(async (key) => {
      try {
        return await fetchAsBase64(key);
      } catch (err) {
        console.error(`Image fetch failed for ${key}, screening text-only:`, err);
        return null;
      }
    }))).filter((img): img is { mimeType: string; data: string } => img !== null)
    : [];

  // Ask Gemini for verdict (internal 3x retry/backoff, returns null on exhaustion
  const screening = await screenContent(payload.text, images);
  // Translate score/categories into approve/remove, or null if ambiguous/unscreened
  const action = screening ? decideAutoAction(screening) : null;
  const systemUserId = await getSystemUserId();

  await prisma.$transaction(async (tx) => {
    // Row flip (or no-op if fail-closed) - see flipTargetRow per-case
    await flipTargetRow(tx, payload.targetType, payload.targetId, payload.text, action);

    if (action === null) {
      // No verdict reached - file for human review
      await fileSystemReport({
        db: tx,
        targetType: payload.targetType,
        targetId: payload.targetId,
        reporterId: systemUserId,
        status: ReportStatus.PENDING,
        resolution: screening
          ? 'Ambiguous screening result - needs manual review'
          : 'Screening unavailable after retries - needs manual review',
        screening: screening ?? undefined,
      });
      return;
    }

    if (action.status === ReportStatus.REMOVED) {
      // Auto-removed - file the system report documenting why
      await fileSystemReport({
        db: tx,
        targetType: payload.targetType,
        targetId: payload.targetId,
        reporterId: systemUserId,
        status: ReportStatus.REMOVED,
        resolution: action.resolution,
        screening: screening ?? undefined,
      });
    } else if (payload.notifyOnApprove) {
      // Approved - fire whichever notification this call site asked for, if any
      await enqueueJob(tx, 'SEND_NOTIFICATION', payload.notifyOnApprove);
    }
  });

  // Post-commit, best-effort - a socket failure must never fail a job already committed
  try {
    getIo().to(`user:${payload.authorId}`).emit('content:screened', {
      targetType: payload.targetType,
      targetId: payload.targetId,
      ok: action !== null && action.status !== ReportStatus.REMOVED,
      pending: action === null,
      rationale: action?.status === ReportStatus.REMOVED ? screening?.rationale : undefined,
    });
    // Feed listeners need a refresh signal too, same as the optimistic emit in posts.ts
    if (payload.targetType === TargetType.POST) getIo().emit('posts:changed');
  } catch (err) {
    console.error('content:screened emit failed (job already committed):', err);
  }
}
