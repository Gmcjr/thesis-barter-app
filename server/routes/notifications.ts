import { Router } from 'express';
import { prisma } from '../db/index.js';
import requireAuth from '../middleware/requireAuth.js';

const notifications = Router();
const PAGE_SIZE = 30;

notifications.use(requireAuth);

notifications.get('/', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const list = await prisma.notification.findMany({
      where: { userId },
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
    const count = await prisma.notification.count({ where: { userId, readAt: null } });
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

notifications.patch('/read-all', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error('Failed to mark all notifications read:', error);
    return res.sendStatus(500);
  }
});

export default notifications;
