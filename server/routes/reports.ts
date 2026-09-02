import { Router } from 'express';
import { prisma } from '../db/index.js';
import requireAuth from '../middleware/requireAuth.js';
import requireModerator from '../middleware/requireModerator.js';
import { TargetType, ReportReason, ReportStatus } from '../db/generated/enums.js';
import { Prisma } from '../db/generated/client.js';
import { enqueueJob } from '../services/jobQueue.js';
import type { Db } from '../services/jobQueue.js';
import { getIo } from '../middleware/socket.js';
import { getDownloadUrl } from '../services/s3.js';
import { REPORT_FK_FIELD } from '../services/moderation.js';
import {
  applyRemovalVerdict, getTargetOwnerId, getTargetVersion,
} from '../services/screening.js';
import type { SendNotificationPayload } from '../services/notifications.js';

const reports = Router();

const QUEUE_PAGE_SIZE = 50;

interface QueueMediaItem {
  media?: { s3Key: string; variant: string | null } | null;
  sortOrder?: number | null;
}

// Real images, sorted for display, mirrors posts.ts getPostImageUrls
const getQueueImageUrls = async (mediaArray?: QueueMediaItem[]): Promise<string[]> => {
  if (!mediaArray) return [];

  const images = mediaArray
    .filter((m) => m.media?.variant == null && m.media?.s3Key)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const urls = await Promise.all(
    images.map((item) => {
      const key = item.media?.s3Key;
      if (!key) return Promise.resolve(null);
      return getDownloadUrl(key).catch((err) => {
        console.error('Error getting queue image URL:', err);
        return null;
      });
    }),
  );

  return urls.filter((url): url is string => Boolean(url));
};

// Signals an OCC conflict out of a $transaction callback
// The screening system already wrote this row since it was read, moderator action didn't land
class ScreeningConflict extends Error {}

// File a report (any logged-in user)
reports.post('/', requireAuth, async (req, res) => {
  try {
    const {
      targetType, targetId, reason, details,
    } = req.body;

    if (!(targetType in TargetType) || !(reason in ReportReason)) {
      res.status(400).json({ error: 'Invalid targetType or reason' });
      return;
    }

    // Resolve the reported content's text (for screening) and its author -
    // a rescreen must notify the content's author, not the reporter.
    // Empty/no text (e.g. a bio-less profile, a message-less trade request) means
    // there's nothing to screen - the report is still filed for a moderator either way.
    let text: string | null = null;
    let authorId: number | null = null;

    if (targetType === TargetType.POST) {
      const post = await prisma.post.findUnique({ where: { id: targetId } });
      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }
      text = `${post.title}\n\n${post.message}`;
      authorId = post.userId;
    } else if (targetType === TargetType.MESSAGE) {
      const message = await prisma.message.findUnique({ where: { id: targetId } });
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      // Only a DM participant may report a message
      if (message.senderId !== req.user!.id && message.recieverId !== req.user!.id) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      text = message.text;
      authorId = message.senderId;
    } else if (targetType === TargetType.TRADE_OFFER) {
      const offer = await prisma.tradeOffer.findUnique({ where: { id: targetId } });
      if (!offer) {
        res.status(404).json({ error: 'Trade offer not found' });
        return;
      }
      text = offer.message ?? '';
      authorId = offer.offererId;
    } else if (targetType === TargetType.TRADE_REQUEST) {
      const tradeRequest = await prisma.tradeRequest.findUnique({ where: { id: targetId } });
      if (!tradeRequest) {
        res.status(404).json({ error: 'Trade request not found' });
        return;
      }
      text = tradeRequest.message ?? '';
      authorId = tradeRequest.requesterId;
    } else if (targetType === TargetType.REVIEW) {
      const review = await prisma.review.findUnique({ where: { id: targetId } });
      if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }
      text = review.comment ?? '';
      authorId = review.reviewerId;
    } else if (targetType === TargetType.COMMENT) {
      const comment = await prisma.comment.findUnique({ where: { id: targetId } });
      if (!comment) {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }
      text = comment.text;
      authorId = comment.userId;
    } else {
      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (!target) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      text = target.bio ?? '';
      authorId = target.id;
    }

    // Create report and enqueue its screening in one transaction
    // Prevents reports left permanently unscreened if disaster between separate report/screen
    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          reporterId: req.user!.id,
          targetType,
          [REPORT_FK_FIELD[targetType]]: targetId,
          reason,
          details: details || null,
        },
      });

      if (text && authorId !== null) {
        await enqueueJob(tx, 'SCREEN_CONTENT', {
          targetType,
          targetId,
          authorId,
          text,
          existingReportId: created.id,
        });
      }

      return created;
    });

    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Moderator queue
reports.get('/', requireModerator, async (req, res) => {
  try {
    const scope = req.query.scope === 'history' ? 'history' : 'pending';
    const where: Prisma.ReportWhereInput = {};

    if (scope === 'pending') {
      where.status = ReportStatus.PENDING;
    } else {
      const statusParam = typeof req.query.status === 'string' && req.query.status in ReportStatus
        ? req.query.status as ReportStatus
        : undefined;
      where.status = statusParam ?? { not: ReportStatus.PENDING };

      const reasonParam = typeof req.query.reason === 'string' && req.query.reason in ReportReason
        ? req.query.reason as ReportReason
        : undefined;
      if (reasonParam) where.reason = reasonParam;

      const { dateFrom, dateTo } = req.query;
      if (typeof dateFrom === 'string' || typeof dateTo === 'string') {
        where.createdAt = {
          ...(typeof dateFrom === 'string' ? { gte: new Date(`${dateFrom}T00:00:00.000`) } : {}),
          ...(typeof dateTo === 'string' ? { lte: new Date(`${dateTo}T23:59:59.999`) } : {}),
        };
      }

      if (typeof req.query.reporterQuery === 'string' && req.query.reporterQuery.trim()) {
        where.reporter = { name: { contains: req.query.reporterQuery.trim(), mode: 'insensitive' } };
      }

      if (typeof req.query.reporteeQuery === 'string' && req.query.reporteeQuery.trim()) {
        const q = req.query.reporteeQuery.trim();
        where.OR = [
          { targetType: TargetType.POST, post: { user: { name: { contains: q, mode: 'insensitive' } } } },
          { targetType: TargetType.MESSAGE, message: { sender: { name: { contains: q, mode: 'insensitive' } } } },
          { targetType: TargetType.USER, targetUser: { name: { contains: q, mode: 'insensitive' } } },
          { targetType: TargetType.TRADE_OFFER, offer: { offerer: { name: { contains: q, mode: 'insensitive' } } } },
          { targetType: TargetType.REVIEW, review: { reviewer: { name: { contains: q, mode: 'insensitive' } } } },
          {
            targetType: TargetType.TRADE_REQUEST,
            tradeRequest: { requester: { name: { contains: q, mode: 'insensitive' } } },
          },
          { targetType: TargetType.COMMENT, comment: { user: { name: { contains: q, mode: 'insensitive' } } } },
        ];
      }
    }

    const queue = await prisma.report.findMany({
      where,
      take: QUEUE_PAGE_SIZE,
      include: {
        reporter: { select: { id: true, name: true } },
        post: { include: { postMedia: { include: { media: true } } } },
        targetUser: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
        message: true,
        offer: { include: { tradeOfferMedia: { include: { media: true } } } },
        review: { include: { reviewer: { select: { id: true, name: true } } } },
        tradeRequest: { include: { requester: { select: { id: true, name: true } } } },
        comment: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Presign image URLs per row
    const queueWithImages = await Promise.all(queue.map(async (report) => ({
      ...report,
      post: report.post ? {
        id: report.post.id,
        title: report.post.title,
        message: report.post.message,
        isRemoved: report.post.isRemoved,
        imageUrls: await getQueueImageUrls(report.post.postMedia),
      } : null,
      offer: report.offer ? {
        id: report.offer.id,
        message: report.offer.message,
        isRemoved: report.offer.isRemoved,
        imageUrls: await getQueueImageUrls(report.offer.tradeOfferMedia),
      } : null,
      review: report.review ? {
        id: report.review.id,
        comment: report.review.comment,
        reviewer: report.review.reviewer,
      } : null,
      tradeRequest: report.tradeRequest ? {
        id: report.tradeRequest.id,
        message: report.tradeRequest.message,
        requester: report.tradeRequest.requester,
      } : null,
      comment: report.comment ? {
        id: report.comment.id,
        text: report.comment.text,
        user: report.comment.user,
      } : null,
    })));

    res.json(queueWithImages);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Builds the "your content was removed" notification for a moderator-resolved report.
// Only called when isRemove is true, so targetType/targetId/ownerId are all already resolved.
async function buildRemovalNotification(
  tx: Db,
  targetType: TargetType,
  targetId: number,
  ownerId: number,
): Promise<SendNotificationPayload> {
  const base = { userId: ownerId, type: 'REPORT_RESOLVED' as const };
  switch (targetType) {
    case TargetType.POST:
      return {
        ...base,
        title: 'Your post was removed',
        body: 'A moderator removed your post after a report.',
        link: '/profile?mine=true',
        entityType: 'POST',
        entityId: targetId,
      };
    case TargetType.MESSAGE: {
      const message = await tx.message.findUniqueOrThrow({
        where: { id: targetId },
        select: { dmId: true },
      });
      return {
        ...base,
        title: 'Your message was removed',
        body: 'A moderator removed a message you sent after a report.',
        link: `/messages/${message.dmId}`,
        entityType: 'MESSAGE',
        entityId: targetId,
      };
    }
    case TargetType.TRADE_OFFER:
      return {
        ...base,
        title: 'Your trade offer was removed',
        body: 'A moderator removed your trade offer after a report.',
        link: `/profile/offers/${targetId}`,
        entityType: 'TRADE_OFFER',
        entityId: targetId,
      };
    case TargetType.TRADE_REQUEST:
      return {
        ...base,
        title: 'Your trade request was removed',
        body: 'A moderator removed your trade request message after a report.',
        link: '/profile?mine=true',
        entityType: 'TRADE_REQUEST',
        entityId: targetId,
      };
    case TargetType.REVIEW:
      return {
        ...base,
        title: 'Your review was removed',
        body: 'A moderator removed your review after a report.',
        link: '/profile?mine=true',
        entityType: 'REVIEW',
        entityId: targetId,
      };
    case TargetType.COMMENT: {
      const comment = await tx.comment.findUniqueOrThrow({
        where: { id: targetId },
        select: { postId: true },
      });
      return {
        ...base,
        title: 'Your comment was removed',
        body: 'A moderator removed your comment after a report.',
        link: `/profile?postId=${comment.postId}`,
        entityType: 'COMMENT',
        entityId: targetId,
      };
    }
    default: // USER
      return {
        ...base,
        title: 'Your bio was removed',
        body: 'A moderator removed your bio after a report.',
        link: '/profile',
        entityType: 'USER',
        entityId: targetId,
      };
  }
}

// Resolve a report
reports.patch('/:id', requireModerator, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { action } = req.body;

    if (action !== 'approve' && action !== 'remove') {
      res.status(400).json({ error: 'action must be "approve" or "remove"' });
      return;
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    if (report.status !== ReportStatus.PENDING) {
      res.status(409).json({ error: 'This report has already been resolved' });
      return;
    }

    const isRemove = action === 'remove';
    // The report's FKs are mutually exclusive per target type - exactly one is set
    const targetId = report.postId ?? report.messageId ?? report.offerId
      ?? report.reviewId ?? report.tradeRequestId ?? report.commentId ?? report.targetUserId;

    let ownerId: number | undefined;
    let resolved;
    try {
      resolved = await prisma.$transaction(async (tx) => {
        const updatedReport = await tx.report.update({
          where: { id },
          data: {
            status: isRemove ? ReportStatus.REMOVED : ReportStatus.APPROVED,
            resolution: isRemove ? 'Removed by moderator' : 'Allowed: no action needed',
            resolverId: req.user!.id,
            resolvedAt: new Date(),
          },
        });

        // Defensive - every report has exactly one FK set
        if (targetId === null) return updatedReport;

        if (report.targetType === TargetType.POST) {
          // POST is the only type still gated by proactive pre-publish screening, so a
          // report can exist while the post is still isPendingScreening (a system-filed
          // ambiguous verdict) - resolving it must release that gate too, not just isRemoved.
          const current = await tx.post.findUniqueOrThrow({
            where: { id: targetId },
            select: { version: true, userId: true },
          });
          ownerId = current.userId;
          const { count } = await tx.post.updateMany({
            where: { id: targetId, version: current.version },
            data: { isRemoved: isRemove, isPendingScreening: false, version: { increment: 1 } },
          });
          if (count === 0) throw new ScreeningConflict();
        } else {
          // Every other type publishes immediately and is never gated - moderator
          // resolution here is the same shape as an automatic report-triggered rescreen:
          // approving is a no-op (already live), removing flips isRemoved (or clears bio).
          const expectedVersion = await getTargetVersion(tx, report.targetType, targetId);
          ownerId = await getTargetOwnerId(tx, report.targetType, targetId);
          const ok = await applyRemovalVerdict(
            tx,
            report.targetType,
            targetId,
            isRemove,
            expectedVersion,
          );
          if (!ok) throw new ScreeningConflict();
        }

        if (isRemove) {
          const notification = await buildRemovalNotification(
            tx,
            report.targetType,
            targetId,
            ownerId!,
          );
          await enqueueJob(tx, 'SEND_NOTIFICATION', notification);
        }

        return updatedReport;
      });
    } catch (err) {
      if (err instanceof ScreeningConflict) {
        res.status(409).json({ error: 'This item was already updated by the screening system - refresh and try, try again' });
        return;
      }
      throw err; // Falls through to the route's own outer catch
    }

    // Post-commit, best-effort - a socket failure must never fail a request already committed
    if (ownerId !== undefined && targetId !== null) {
      try {
        getIo().to(`user:${ownerId}`).emit('content:screened', {
          targetType: report.targetType,
          targetId,
          ok: !isRemove,
          pending: false,
          rationale: resolved.resolution,
        });
        if (
          report.targetType === TargetType.POST
          || report.targetType === TargetType.COMMENT
          || report.targetType === TargetType.TRADE_REQUEST
          || report.targetType === TargetType.REVIEW
        ) getIo().emit('posts:changed');
      } catch (err) {
        console.error('content:screened emit failed (report already committed):', err);
      }
    }

    res.json(resolved);
  } catch (err) {
    console.error('PATCH /reports/:id failed:', err);
    res.sendStatus(500);
  }
});

export default reports;
