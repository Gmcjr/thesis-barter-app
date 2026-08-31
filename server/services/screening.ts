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
  // Present only for a report-triggered rescreen of already-published content
  // Update this report row in place instead of filing a new system report
  existingReportId?: number;
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
  isRescreen: boolean,
  expectedVersion: number,
): Promise<void> {
  const removed = action?.status === ReportStatus.REMOVED;
  const noVerdict = action === null;

  switch (targetType) {
    case TargetType.POST: {
      if (isRescreen) {
        if (noVerdict || !removed) return; // Rescreen only acts on removal
        // OCC: read current version, only write if it hasn't moved
        const { count } = await db.post.updateMany({
          where: { id: targetId, version: expectedVersion },
          data: { isRemoved: true, version: { increment: 1 } },
        });
        if (count === 0) console.warn(`OCC conflict on POST:${targetId} rescreen - already resolved, skipping stale verdict`);
        return;
      }
      if (noVerdict) return; // Fail-closed leave isPendingScreening: true, no write
      {
        const { count } = await db.post.updateMany({
          where: { id: targetId, version: expectedVersion },
          data: {
            isPendingScreening: false,
            ...(removed
              ? { isRemoved: true }
              : {}),
            version: { increment: 1 },
          },
        });
        if (count === 0) console.warn(`OCC conflict on POST:${targetId} - already resolved, skipping stale verdict`);
      }
      return;
    }
    case TargetType.TRADE_OFFER: {
      if (noVerdict) return; // Fail-closed
      const { count } = await db.tradeOffer.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: {
          isPendingScreening: false,
          ...(removed
            ? { isRemoved: true }
            : {}),
          version: { increment: 1 },
        },
      });
      if (count === 0) console.warn(`OCC conflict on TRADE_OFFER:${targetId} - already resolved, skipping stale verdict`);
      return;
    }
    case TargetType.TRADE_REQUEST: {
      if (noVerdict) return; // Fail-closed
      const { count } = await db.tradeRequest.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: {
          isPendingScreening: false,
          ...(removed
            ? { isRemoved: true }
            : {}),
          version: { increment: 1 },
        },
      });
      if (count === 0) console.warn(`OCC conflict on TRADE_REQUEST:${targetId} - already resolved, skipping stale verdict`);
      return;
    }
    case TargetType.REVIEW: {
      if (noVerdict) return; // Fail-closed
      const { count } = await db.review.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: {
          isPendingScreening: false,
          ...(removed
            ? { isRemoved: true }
            : {}),
          version: { increment: 1 },
        },
      });
      if (count === 0) console.warn(`OCC conflict on REVIEW:${targetId} - already resolved, skipping stale verdict`);
      return;
    }
    case TargetType.USER: {
      if (noVerdict) return; // Fail-closed: pendingBio stays queued, bio untouched
      // Approve: promote pendingBio into bio / remove: drop pendingBio, keep old bio
      const { count } = await db.user.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: removed
          ? { pendingBio: null, isPendingScreening: false, version: { increment: 1 } }
          : {
            bio: text, pendingBio: null, isPendingScreening: false, version: { increment: 1 },
          },
      });
      if (count === 0) console.warn(`OCC conflict on USER:${targetId} - already resolved, skipping stale verdict`);
      return;
    }
    case TargetType.COMMENT: {
      if (noVerdict) return; // Fail-closed
      const { count } = await db.comment.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: {
          isPendingScreening: false,
          ...(removed
            ? { isRemoved: true }
            : {}),
          version: { increment: 1 },
        },
      });
      if (count === 0) console.warn(`OCC conflict on COMMENT:${targetId} - already resolved, skipping stale verdict`);
      return;
    }
    case TargetType.MESSAGE: {
      // DMs are private by design
      // Only rescreened when reported
      // Throw loudly if a fresh-content call site ever reaches here w/o updating this file first
      if (!isRescreen) {
        throw new Error(`processScreenContent: no fresh-content handler for targetType ${targetType}`);
      }
      // No isPendingScreening field on Message - nothing to do otherwise
      if (noVerdict || !removed) return;
      const { count } = await db.message.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: { isRemoved: true, version: { increment: 1 } },
      });
      if (count === 0) console.warn(`OCC conflict on MESSAGE:${targetId} rescreen - already resolved, skipping stale verdict`);
      return;
    }
    default:
      throw new Error(`processScreenContent: no handler for targetType ${targetType}`);
  }
}

async function getCurrentVersion(
  db: Db,
  targetType: TargetTypeT,
  targetId: number,
): Promise<number> {
  switch (targetType) {
    case TargetType.POST:
      return (await db.post.findUniqueOrThrow({
        where: { id: targetId },
        select: { version: true },
      })).version;
    case TargetType.TRADE_OFFER:
      return (await db.tradeOffer.findUniqueOrThrow({
        where: { id: targetId },
        select: { version: true },
      })).version;
    case TargetType.TRADE_REQUEST:
      return (await db.tradeRequest.findUniqueOrThrow({
        where: { id: targetId },
        select: { version: true },
      })).version;
    case TargetType.REVIEW:
      return (await db.review.findUniqueOrThrow({
        where: { id: targetId },
        select: { version: true },
      })).version;
    case TargetType.USER:
      return (await db.user.findUniqueOrThrow({
        where: { id: targetId },
        select: { version: true },
      })).version;
    case TargetType.MESSAGE:
      return (await db.message.findUniqueOrThrow({
        where: { id: targetId },
        select: { version: true },
      })).version;
    case TargetType.COMMENT:
      return (await db.comment.findUniqueOrThrow({
        where: { id: targetId },
        select: { version: true },
      })).version;
    default:
      throw new Error(`getCurrentVersion: no handler for targetType ${targetType}`);
  }
}

function autoApproveIfScreeningSkipped(): ReturnType<typeof decideAutoAction> {
  if (process.env.SKIP_SCREENING !== 'true') return null;
  return {
    status: ReportStatus.APPROVED,
    resolution: 'Screening skipped (SKIP_SCREENING=true) - auto-approved for local development',
  };
}

export async function processScreenContent(payload: ScreenContentPayload): Promise<void> {
  const expectedVersion = await getCurrentVersion(prisma, payload.targetType, payload.targetId);
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
  const action = screening ? decideAutoAction(screening) : autoApproveIfScreeningSkipped();
  const systemUserId = await getSystemUserId();
  // A rescreen is a report re-checking already-published content, not fresh content
  const isRescreen = payload.existingReportId !== undefined;

  await prisma.$transaction(async (tx) => {
    // Row flip (or no-op if fail-closed) - see flipTargetRow per-case
    await flipTargetRow(
      tx,
      payload.targetType,
      payload.targetId,
      payload.text,
      action,
      isRescreen,
      expectedVersion,
    );

    if (payload.existingReportId !== undefined) {
      //  The report already exists (user-filed) - update it in place, never file a duplicate
      await tx.report.update({
        where: { id: payload.existingReportId },
        data: {
          aiScore: screening?.score ?? null,
          aiCategories: screening?.categories ?? [],
          aiRationale: screening?.rationale ?? null,
          ...(action ? {
            status: action.status,
            resolution: action.resolution,
            resolvedAt: new Date(),
          } : {}), // No verdict - leave status PENDING, it's already sitting there for a moderator
        },
      });
      return;
    }

    // Fresh-content path
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
