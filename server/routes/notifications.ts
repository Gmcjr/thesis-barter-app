import { Router } from 'express';
import { prisma } from '../db/index.js';
import requireAuth from '../middleware/requireAuth.js';

const notifications = Router();
const PAGE_SIZE = 30;

notifications.use(requireAuth);

notifications.get('/', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const archived = req.query.archived === 'true';
    const list = await prisma.notification.findMany({
      where: { userId, archivedAt: archived ? { not: null } : null },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
    });
    return res.json(list);
  } catch (error) {
    console.error('Failed to GET notifications:', error);
    return res.sendStatus(500);
  }
});

notifications.get('/unread-count', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const count = await prisma.notification.count({
      where: { userId, readAt: null, archivedAt: null },
    });
    return res.json({ count });
  } catch (error) {
    console.error('Failed to GET unread notificatoin count:', error);
    return res.sendStatus(500);
  }
});

notifications.patch('/:id/read', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const id = Number(req.params.id);

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      return res.sendStatus(404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: notification.readAt ?? new Date() },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Failed to PATCH notification:', error);
    return res.sendStatus(500);
  }
});

notifications.patch('/:id/unread', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const id = Number(req.params.id);

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      return res.sendStatus(404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: null },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Failed to PATCH notification unread:', error);
    return res.sendStatus(500);
  }
});

notifications.patch('/:id/archive', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const id = Number(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.userId !== userId) {
      return res.sendStatus(404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        archivedAt: notification.archivedAt ?? new Date(),
        readAt: notification.readAt ?? new Date(),
      },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Failed to PATCH notification archive:', error);
    return res.sendStatus(500);
  }
});

notifications.patch('/:id/unarchive', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const id = Number(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.userId !== userId) {
      return res.sendStatus(404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { archivedAt: null },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Failed to PATCH notification unarchive:', error);
    return res.sendStatus(500);
  }
});

notifications.patch('/archive', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.some((id) => !Number.isInteger(id))) {
      return res.status(400).json({ error: 'ids must be an array of integers.' });
    }
    if (ids.length > PAGE_SIZE) {
      return res.status(400).json({ error: `ids cannot exceed ${PAGE_SIZE}.` });
    }

    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId },
      data: { archivedAt: new Date(), readAt: new Date() },
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error('Failed to bulk-archive notifications:', error);
    return res.sendStatus(500);
  }
});

notifications.delete('/:id', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const id = Number(req.params.id);

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      return res.sendStatus(404);
    }

    await prisma.notification.delete({ where: { id } });
    return res.sendStatus(204);
  } catch (error) {
    console.error('Failed to DELETE notification:', error);
    return res.sendStatus(500);
  }
});

notifications.patch('/read-all', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    await prisma.notification.updateMany({
      where: { userId, readAt: null, archivedAt: null },
      data: { readAt: new Date() },
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error('Failed to mark all notifications read:', error);
    return res.sendStatus(500);
  }
});

notifications.delete('/', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.some((id) => !Number.isInteger(id))) {
      return res.status(400).json({ error: 'ids must be an array of integers.' });
    }
    if (ids.length > PAGE_SIZE) {
      return res.status(400).json({ error: `ids cannot exceed ${PAGE_SIZE}.` });
    }

    await prisma.notification.deleteMany({
      where: { id: { in: ids }, userId },
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error('Failed to bulk-delete notifications:', error);
    return res.sendStatus(500);
  }
});

export default notifications;
