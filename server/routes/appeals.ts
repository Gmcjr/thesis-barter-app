import { Router } from 'express';
import { prisma } from '../db/index.js';
import { Prisma } from '../db/generated/client.js';
import requireAuth from '../middleware/requireAuth';
import requireModerator from '../middleware/requireModerator';
import { ReportStatus, AppealStatus, ReportReason } from '../db/generated/enums';

const appeals = Router();

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
          ...(typeof dateFrom === 'string' ? { gte: new Date(dateFrom) } : {}),
          ...(typeof dateTo === 'string' ? { lte: new Date(`${dateTo}T23:59:59.999`) } : {}),
        };
      }

      if (typeof req.query.appellantQuery === 'string' && req.query.appellantQuery.trim()) {
        where.appellant = { name: { contains: req.query.appellantQuery.trim(), mode: 'insensitive' } };
      }
    }

    const queue = await prisma.appeal.findMany({
      where,
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
    }

    const isGrant = action === 'grant';
    const resolverId = (req.user as { id: number }).id;

    const appealUpdate = prisma.appeal.update({
      where: { id },
      data: {
        status: isGrant ? 'GRANTED' : 'DENIED',
        resolution: isGrant ? 'Appeal granted' : 'Appeal denied',
        resolverId,
        resolvedAt: new Date(),
      },
    });

    const extraUpdates = [];
    if (isGrant) {
      // Reinstate the content and flip the original report back to Allowed
      // Same as a moderator directly clicking 'Allow' on the report itself
      extraUpdates.push(prisma.report.update({
        where: { id: appeal.reportId },
        data: {
          status: ReportStatus.APPROVED,
          resolution: 'Reinstated via granted appeal',
          resolverId,
          resolvedAt: new Date(),
        },
      }));
      if (appeal.report.postId) {
        extraUpdates.push(prisma.post.update({
          where: { id: appeal.report.postId },
          data: { isRemoved: false },
        }));
      }
      if (appeal.report.messageId) {
        extraUpdates.push(prisma.message.update({
          where: { id: appeal.report.messageId },
          data: { isRemoved: false },
        }));
      }
    }

    const [resolved] = await prisma.$transaction([appealUpdate, ...extraUpdates]);
    res.json(resolved);
  } catch (err) {
    console.error('Failed to PATCH appeal:', err);
    res.sendStatus(500);
  }
});

export default appeals;
