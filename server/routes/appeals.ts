import { Router } from 'express';
import { prisma } from '../db/index.js';
import { Prisma } from '../db/generated/client.js';
import requireAuth from '../middleware/requireAuth';
import requireModerator from '../middleware/requireModerator';
import {
  ReportStatus, AppealStatus, ReportReason, TargetType,
} from '../db/generated/enums';
import { enqueueJob } from '../services/jobQueue.js';
import { getIo } from '../middleware/socket.js';

const appeals = Router();
const QUEUE_PAGE_SIZE = 50;

// Signals an OCC conflict out of a $transaction callback
// The screening system already wrote this row since it was read
class ScreeningConflict extends Error {}

// File an appeal (owner of the removed content)
appeals.post('/', requireAuth, async (req, res) => {
  try {
    const { reportId, message } = req.body;
    const userId = (req.user as { id: number }).id;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Appeal message is required' });
      return;
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { post: true, message: true, targetUser: true },
    });

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    if (report.status !== ReportStatus.REMOVED) {
      res.status(400).json({ error: 'Only removed content can be appealed' });
      return;
    }

    const ownerId = report.post?.userId ?? report.message?.senderId ?? report.targetUserId;
    if (ownerId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const appeal = await prisma.appeal.create({
      data: {
        reportId,
        appellantId: userId,
        message: message.trim(),
      },
    });

    res.status(201).json(appeal);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'An appeal for this report already exists' });
      return;
    }
    console.error('Failed to file appeal', err);
    res.sendStatus(500);
  }
});

// Moderator queue
appeals.get('/', requireModerator, async (req, res) => {
  try {
    const scope = req.query.scope === 'history' ? 'history' : 'pending';
    const where: Prisma.AppealWhereInput = {};

    if (scope === 'pending') {
      where.status = AppealStatus.PENDING;
    } else {
      const statusParam = typeof req.query.status === 'string' && req.query.status in AppealStatus
        ? req.query.status as AppealStatus
        : undefined;
      where.status = statusParam ?? { not: AppealStatus.PENDING };

      const reportWhere: Prisma.ReportWhereInput = {};

      const reasonParam = typeof req.query.reason === 'string' && req.query.reason in ReportReason
        ? req.query.reason as ReportReason
        : undefined;
      if (reasonParam) reportWhere.reason = reasonParam;

      if (typeof req.query.reporterQuery === 'string' && req.query.reporterQuery.trim()) {
        reportWhere.reporter = { name: { contains: req.query.reporterQuery.trim(), mode: 'insensitive' } };
      }

      if (Object.keys(reportWhere).length) where.report = reportWhere;

      const { dateFrom, dateTo } = req.query;
      if (typeof dateFrom === 'string' || typeof dateTo === 'string') {
        where.createdAt = {
          ...(typeof dateFrom === 'string' ? { gte: new Date(`${dateFrom}T00:00:00.000`) } : {}),
          ...(typeof dateTo === 'string' ? { lte: new Date(`${dateTo}T23:59:59.999`) } : {}),
        };
      }

      if (typeof req.query.appellantQuery === 'string' && req.query.appellantQuery.trim()) {
        where.appellant = { name: { contains: req.query.appellantQuery.trim(), mode: 'insensitive' } };
      }
    }

    const queue = await prisma.appeal.findMany({
      where,
      take: QUEUE_PAGE_SIZE,
      include: {
        appellant: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
        report: {
          include: {
            reporter: { select: { id: true, name: true } },
            post: true,
            message: true,
            targetUser: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(queue);
  } catch (err) {
    console.error('Failed to GET appeals:', err);
    res.sendStatus(500);
  }
});

// Grant or deny an appeal
appeals.patch('/:id', requireModerator, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { action } = req.body;

    if (action !== 'grant' && action !== 'deny') {
      res.status(400).json({ error: 'action must be "grant" or "deny"' });
      return;
    }

    const appeal = await prisma.appeal.findUnique({
      where: { id },
      include: { report: true },
    });
    if (!appeal) {
      res.status(404).json({ error: 'Appeal not found' });
      return;
    } if (appeal.status !== AppealStatus.PENDING) {
      res.status(409).json({ error: 'This appeal has already been resolved' });
      return;
    }

    const isGrant = action === 'grant';
    const resolverId = (req.user as { id: number }).id;

    let ownerId: number | undefined;
    let resolved;
    try {
      resolved = await prisma.$transaction(async (tx) => {
        const updatedAppeal = await tx.appeal.update({
          where: { id },
          data: {
            status: isGrant ? 'GRANTED' : 'DENIED',
            resolution: isGrant ? 'Appeal granted' : 'Appeal denied',
            resolverId,
            resolvedAt: new Date(),
          },
        });

        if (isGrant) {
          // Reinstate the content and flip the original report back to Allowed
          // Same as a moderator directly clicking 'Allow' on the report itself
          await tx.report.update({
            where: { id: appeal.reportId },
            data: {
              status: ReportStatus.APPROVED,
              resolution: 'Reinstated via granted appeal',
              resolverId,
              resolvedAt: new Date(),
            },
          });

          if (appeal.report.postId) {
            const current = await tx.post.findUniqueOrThrow({
              where: { id: appeal.report.postId },
              select: { version: true, userId: true },
            });
            const { count } = await tx.post.updateMany({
              where: { id: appeal.report.postId, version: current.version },
              data: { isRemoved: false, isPendingScreening: false, version: { increment: 1 } },
            });
            if (count === 0) throw new ScreeningConflict();
            ownerId = current.userId;
          }
          if (appeal.report.messageId) {
            const current = await tx.message.findUniqueOrThrow({
              where: { id: appeal.report.messageId },
              select: { version: true, senderId: true },
            });
            const { count } = await tx.message.updateMany({
              where: { id: appeal.report.messageId, version: current.version },
              data: { isRemoved: false, version: { increment: 1 } },
            });
            if (count === 0) throw new ScreeningConflict();
            ownerId = current.senderId;
          }
        }

        await enqueueJob(tx, 'SEND_NOTIFICATION', {
          userId: appeal.appellantId,
          type: 'APPEAL_RESOLVED',
          title: isGrant ? 'Your appeal was granted' : 'Your appeal was denied',
          body: isGrant ? 'Your content has been reinstated.' : 'A moderator reviewed your appeal and upheld the original decision.',
          link: '/profile?mine=true',
          entityType: 'APPEAL',
          entityId: appeal.id,
        });

        return updatedAppeal;
      });
    } catch (err) {
      if (err instanceof ScreeningConflict) {
        res.status(409).json({ error: 'This item was already updated by the screening system - refresh and try, try again' });
        return;
      }
      throw err; // Falls through to the route's own outer catch
    }

    // Post-commit, best-effort - a socket failure must never fail a request already committed
    if (isGrant && ownerId !== undefined) {
      try {
        getIo().to(`user:${ownerId}`).emit('content:screened', {
          targetType: appeal.report.postId ? TargetType.POST : TargetType.MESSAGE,
          targetId: (appeal.report.postId ?? appeal.report.messageId)!,
          ok: true,
          pending: false,
          rationale: resolved.resolution,
        });
        if (appeal.report.postId) getIo().emit('posts:changed');
      } catch (err) {
        console.error('content:screened emit failed (appeal already committed):', err);
      }
    }

    res.json(resolved);
  } catch (err) {
    console.error('Failed to PATCH appeal:', err);
    res.sendStatus(500);
  }
});

export default appeals;
