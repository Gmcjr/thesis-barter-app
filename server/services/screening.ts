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

// Shared by report-triggered rescreens (Gemini) and manual moderator resolution
// (PATCH /reports/:id) - the only thing either of those can ever do to content that's
// already published is remove it. Approval is a no-op: the content is already live,
// there's nothing to write. USER has no isRemoved column, so "removing" a bio clears it
// instead - the account itself isn't touched.
// Returns false on an OCC conflict (row moved since expectedVersion was read) so callers
// can tell a stale verdict from an applied one.
export async function applyRemovalVerdict(
  db: Db,
  targetType: TargetTypeT,
  targetId: number,
  removed: boolean,
  expectedVersion: number,
): Promise<boolean> {
  if (!removed) return true; // Nothing to write - already-published content stays as-is

  switch (targetType) {
    case TargetType.POST: {
      const { count } = await db.post.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: { isRemoved: true, version: { increment: 1 } },
      });
      return count > 0;
    }
    case TargetType.MESSAGE: {
      const { count } = await db.message.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: { isRemoved: true, version: { increment: 1 } },
      });
      return count > 0;
    }
    case TargetType.TRADE_OFFER: {
      const { count } = await db.tradeOffer.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: { isRemoved: true, version: { increment: 1 } },
      });
      return count > 0;
    }
    case TargetType.TRADE_REQUEST: {
      const { count } = await db.tradeRequest.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: { isRemoved: true, version: { increment: 1 } },
      });
      return count > 0;
    }
    case TargetType.REVIEW: {
      const { count } = await db.review.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: { isRemoved: true, version: { increment: 1 } },
      });
      return count > 0;
    }
    case TargetType.COMMENT: {
      const { count } = await db.comment.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: { isRemoved: true, version: { increment: 1 } },
      });
      return count > 0;
    }
    case TargetType.USER: {
      const { count } = await db.user.updateMany({
        where: { id: targetId, version: expectedVersion },
        data: { bio: null, pendingBio: null, version: { increment: 1 } },
      });
      return count > 0;
    }
    default:
      throw new Error(`applyRemovalVerdict: no handler for targetType ${targetType}`);
  }
}

// Applies a screening verdict to the target row.
// `null` action means no verdict was reached - either Gemini's API call failed after
// retries, or it succeeded but came back genuinely ambiguous (mid-confidence band).
// processScreenContent tells those two apart when deciding whether to file a report;
// this function doesn't need to, because the row-level effect is identical either way.
// Fail-OPEN: a fresh POST always publishes immediately no matter what the verdict is -
// only a confident REMOVED verdict ever hides it. A rescreen never blocks anything either,
// since the content it's re-checking was already live before the report was filed.
async function flipTargetRow(
  db: Db,
  targetType: TargetTypeT,
  targetId: number,
  action: ReturnType<typeof decideAutoAction>,
  isRescreen: boolean,
  expectedVersion: number,
): Promise<void> {
  const removed = action?.status === ReportStatus.REMOVED;
  const noVerdict = action === null;

  if (isRescreen) {
    // A report re-checking already-published content - only acts on removal.
    // Approval/ambiguous leaves the content exactly as it was: already live.
    if (noVerdict || !removed) return;
    const ok = await applyRemovalVerdict(db, targetType, targetId, true, expectedVersion);
    if (!ok) console.warn(`OCC conflict on ${targetType}:${targetId} rescreen - already resolved, skipping stale verdict`);
    return;
  }

  // Fresh-content (pre-publish) screening only runs for POST today. Every other type
  // publishes immediately and is only ever rescreened if reported - throw loudly if a
  // fresh-content call site for one of them ever reaches here w/o updating this file first.
  if (targetType !== TargetType.POST) {
    throw new Error(`processScreenContent: no fresh-content handler for targetType ${targetType} (screening is reactive-only for this type)`);
  }

  // Publish immediately regardless of verdict (including a failed or ambiguous one) -
  // only a confident REMOVED verdict flips isRemoved too. See processScreenContent for
  // the report that gets filed alongside a genuinely ambiguous (not failed) verdict.
  const { count } = await db.post.updateMany({
    where: { id: targetId, version: expectedVersion },
    data: {
      isPendingScreening: false,
      ...(removed ? { isRemoved: true } : {}),
      version: { increment: 1 },
    },
  });
  if (count === 0) console.warn(`OCC conflict on POST:${targetId} - already resolved, skipping stale verdict`);
}

// Exported for reports.ts (manual moderator resolution needs the same OCC read).
export async function getTargetVersion(
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
      throw new Error(`getTargetVersion: no handler for targetType ${targetType}`);
  }
}

// Owner/author of the target row, for the moderator-resolution notification + socket room.
// Kept separate from getTargetVersion so that function's shape doesn't change for its
// one existing caller (processScreenContent, which never needs the owner - it already has it).
export async function getTargetOwnerId(
  db: Db,
  targetType: TargetTypeT,
  targetId: number,
): Promise<number> {
  switch (targetType) {
    case TargetType.POST:
      return (await db.post.findUniqueOrThrow({
        where: { id: targetId },
        select: { userId: true },
      })).userId;
    case TargetType.TRADE_OFFER:
      return (await db.tradeOffer.findUniqueOrThrow({
        where: { id: targetId },
        select: { offererId: true },
      })).offererId;
    case TargetType.TRADE_REQUEST:
      return (await db.tradeRequest.findUniqueOrThrow({
        where: { id: targetId },
        select: { requesterId: true },
      })).requesterId;
    case TargetType.REVIEW:
      return (await db.review.findUniqueOrThrow({
        where: { id: targetId },
        select: { reviewerId: true },
      })).reviewerId;
    case TargetType.USER:
      return targetId; // The report's target user IS the author of their own bio
    case TargetType.MESSAGE:
      return (await db.message.findUniqueOrThrow({
        where: { id: targetId },
        select: { senderId: true },
      })).senderId;
    case TargetType.COMMENT:
      return (await db.comment.findUniqueOrThrow({
        where: { id: targetId },
        select: { userId: true },
      })).userId;
    default:
      throw new Error(`getTargetOwnerId: no handler for targetType ${targetType}`);
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
  const expectedVersion = await getTargetVersion(prisma, payload.targetType, payload.targetId);
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
    // Row flip - see flipTargetRow for the fail-open/rescreen-only-removes rules
    await flipTargetRow(
      tx,
      payload.targetType,
      payload.targetId,
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

    // Fresh-content path (POST only). flipTargetRow already published it either way -
    // this only decides whether a moderator needs to know about it afterward.
    if (action === null) {
      if (screening) {
        // Gemini answered, just genuinely ambiguous - flag it for a second look.
        // The post is already live; this never blocks anything.
        await fileSystemReport({
          db: tx,
          targetType: payload.targetType,
          targetId: payload.targetId,
          reporterId: systemUserId,
          status: ReportStatus.PENDING,
          resolution: 'Ambiguous screening result - published, flagged for moderator review',
          screening,
        });
      }
      // else: Gemini's API call itself failed after retries - no real answer came back,
      // so there's nothing worth telling a moderator. Publish silently, no report filed.
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
      // Nothing is ever left blocked-and-invisible anymore - only a confident REMOVED
      // verdict is not "ok". A failed/ambiguous verdict (action === null) already
      // published, same as a clean APPROVED one.
      ok: action?.status !== ReportStatus.REMOVED,
      pending: false,
      rationale: action?.status === ReportStatus.REMOVED ? screening?.rationale : undefined,
    });
    // Feed listeners need a refresh signal too, same as the optimistic emit in posts.ts
    if (
      payload.targetType === TargetType.POST
      || payload.targetType === TargetType.COMMENT
      || payload.targetType === TargetType.TRADE_REQUEST
      || payload.targetType === TargetType.REVIEW
    ) {
      getIo().emit('posts:changed');
    }
  } catch (err) {
    console.error('content:screened emit failed (job already committed):', err);
  }
}
