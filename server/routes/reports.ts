import { Router } from 'express';
import { prisma } from '../db/index.js';
import requireAuth from '../middleware/requireAuth.js';
import requireModerator from '../middleware/requireModerator.js';
import { TargetType, ReportReason, ReportStatus } from '../db/generated/enums.js';
import { Prisma } from '../db/generated/client.js';
import { enqueueJob } from '../services/jobQueue.js';

const reports = Router();

const QUEUE_PAGE_SIZE = 50;

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

    // Only these three target types are reportable from the client today -
    // Explicit 400 rather than silently falling to USER lookup
    if (
      targetType === TargetType.TRADE_OFFER
      || targetType === TargetType.REVIEW
      || targetType === TargetType.TRADE_REQUEST
    ) {
      res.status(400).json({ error: `Reporting a ${targetType} is not supported yet.` });
      return;
    }

    // Resolve the reported content's text (for screening) and its author
    // A rescreen must notify the content's author, not the reporter
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
    } else {
      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (!target) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
    }

    // Create report and enqueue its screening in one transaction
    // Prevents reports left permanently unscreened if disaster between separate report/screen
    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          reporterId: req.user!.id,
          targetType,
          postId: targetType === TargetType.POST ? targetId : null,
          messageId: targetType === TargetType.MESSAGE ? targetId : null,
          targetUserId: targetType === TargetType.USER ? targetId : null,
          reason,
          details: details || null,
        },
      });

      // USER reports aren't screened today (come back to this later)
      if (text !== null && authorId !== null) {
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
        ];
      }
    }

    const queue = await prisma.report.findMany({
      where,
      take: QUEUE_PAGE_SIZE,
      include: {
        reporter: { select: { id: true, name: true } },
        post: true,
        targetUser: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
        message: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(queue);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

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

        if (report.postId) {
          const current = await tx.post.findUniqueOrThrow({
            where: { id: report.postId },
            select: { version: true, userId: true },
          });
          const { count } = await tx.post.updateMany({
            where: { id: report.postId, version: current.version },
            data: { isRemoved: isRemove, isPendingScreening: false, version: { increment: 1 } },
          });
          if (count === 0) throw new ScreeningConflict();
          if (isRemove) {
            await enqueueJob(tx, 'SEND_NOTIFICATION', {
              userId: current.userId,
              type: 'REPORT_RESOLVED',
              title: 'Your post was removed',
              body: 'A moderator removed your post after a report.',
              link: '/profile?mine=true',
              entityType: 'POST',
              entityId: report.postId,
            });
          }
        }

        if (report.messageId) {
          const current = await tx.message.findUniqueOrThrow({
            where: { id: report.messageId },
            select: { version: true, senderId: true, dmId: true },
          });
          const { count } = await tx.message.updateMany({
            where: { id: report.messageId, version: current.version },
            data: { isRemoved: isRemove, version: { increment: 1 } },
          });
          if (count === 0) throw new ScreeningConflict();
          if (isRemove) {
            await enqueueJob(tx, 'SEND_NOTIFICATION', {
              userId: current.senderId,
              type: 'REPORT_RESOLVED',
              title: 'Your message was removed',
              body: 'A moderator removed a message you sent after a report.',
              link: `/messages/${current.dmId}`,
              entityType: 'MESSAGE',
              entityId: report.messageId,
            });
          }
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

    res.json(resolved);
  } catch (err) {
    console.error('PATCH /reports/:id failed:', err);
    res.sendStatus(500);
  }
});

export default reports;
