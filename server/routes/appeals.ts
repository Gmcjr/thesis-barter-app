import { Router } from 'express';
import { prisma } from '../db/index.js';
import { Prisma } from '../db/generated/client.js';
import requireAuth from '../middleware/requireAuth';
import requireModerator from '../middleware/requireModerator';
import { ReportStatus, AppealStatus } from '../db/generated/enums';

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
    const status = typeof req.query.status === 'string' && req.query.status in AppealStatus
      ? req.query.status as AppealStatus
      : undefined;

    const queue = await prisma.appeal.findMany({
      where: status ? { status } : undefined,
      include: {
        appellant: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
        report: {
          include: {
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
