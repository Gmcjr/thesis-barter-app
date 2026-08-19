import { Router } from 'express';
import { prisma } from '../db/index.js';
import requireAuth from '../middleware/requireAuth.js';
import { isBlocked } from '../services/blocks.js';
import { getIo } from '../middleware/socket';
import { enqueueJob } from '../services/jobs.js';

const dms = Router();

dms.use(requireAuth);

dms.get('/', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const wantArchived = req.query.archived === 'true';

    const threads = await prisma.dM.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        messages: { some: {} },
      },
      include: {
        user1: { select: { id: true, name: true } },
        user2: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const inbox = threads
      .filter((dm) => {
        const archivedByMe = dm.user1Id === userId ? dm.user1Archived : dm.user2Archived;
        return wantArchived ? archivedByMe : !archivedByMe;
      })
      .map((dm) => ({
        id: dm.id,
        otherUser: dm.user1Id === userId ? dm.user2 : dm.user1,
        lastMessage: dm.messages[0] ?? null,
      }))
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? 0;
        const bTime = b.lastMessage?.createdAt ?? 0;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

    return res.json(inbox);
  } catch (error) {
    console.error('Failed to GET dms: ', error);
    return res.sendStatus(500);
  }
});

dms.get('/:id', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const dmId = Number(req.params.id);

    const dm = await prisma.dM.findUnique({
      where: { id: dmId },
      include: {
        user1: { select: { id: true, name: true } },
        user2: { select: { id: true, name: true } },
      },
    });
    if (!dm || (dm.user1Id !== userId && dm.user2Id !== userId)) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    return res.json({
      id: dm.id,
      otherUser: dm.user1Id === userId ? dm.user2 : dm.user1,
    });
  } catch (error) {
    console.error('Failed to GET dm: ', error);
    return res.sendStatus(500);
  }
});

dms.patch('/:id/archive', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const dmId = Number(req.params.id);
    const archived = Boolean(req.body.archived);

    const dm = await prisma.dM.findUnique({ where: { id: dmId } });
    if (!dm || (dm.user1Id !== userId && dm.user2Id !== userId)) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const isUser1 = dm.user1Id === userId;
    await prisma.dM.update({
      where: { id: dmId },
      data: isUser1 ? { user1Archived: archived } : { user2Archived: archived },
    });

    return res.sendStatus(204);
  } catch (error) {
    console.error('Failed to PATCH dm archive: ', error);
    return res.sendStatus(500);
  }
});

dms.post('/', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const targetId = Number(req.body.userId);

    if (!targetId || targetId === userId) {
      return res.status(400).json({ error: 'Invalid user Id.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (await isBlocked(userId, targetId)) {
      return res.status(403).json({ error: 'Blocked' });
    }

    const [user1Id, user2Id] = userId < targetId ? [userId, targetId] : [targetId, userId];

    const restoreField = userId === user1Id ? 'user1Archived' : 'user2Archived';

    const dm = await prisma.dM.upsert({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      update: { [restoreField]: false },
      create: { user1Id, user2Id },
      include: {
        user1: { select: { id: true, name: true } },
        user2: { select: { id: true, name: true } },
      },
    });

    return res.json(dm);
  } catch (error) {
    console.error('Failed to POST dm: ', error);
    return res.sendStatus(500);
  }
});

dms.get('/:id/messages', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const dmId = Number(req.params.id);

    const dm = await prisma.dM.findUnique({ where: { id: dmId } });
    if (!dm || (dm.user1Id !== userId && dm.user2Id !== userId)) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const messages = await prisma.message.findMany({
      where: { dmId, isRemoved: false },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(messages);
  } catch (error) {
    console.error('Failed to GET dm messages: ', error);
    return res.sendStatus(500);
  }
});

dms.post('/:id/messages', async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const dmId = Number(req.params.id);
    const text = String(req.body.text ?? '').trim();

    if (!text) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const dm = await prisma.dM.findUnique({ where: { id: dmId } });
    if (!dm || (dm.user1Id !== userId && dm.user2Id !== userId)) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const recieverId = dm.user1Id === userId ? dm.user2Id : dm.user1Id;

    if (await isBlocked(userId, recieverId)) {
      return res.status(403).json({ error: 'Blocked' });
    }
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          dmId, senderId: userId, recieverId, text,
        },
      });

      await enqueueJob(tx, 'SEND_NOTIFICATION', {
        userId: recieverId,
        type: 'DM_MESSAGE',
        title: sender?.name ?? sender?.email ?? 'New message',
        body: text.length > 80 ? `${text.slice(0, 80)}...` : text,
        link: `/messages/${dmId}`,
        entityType: 'DM',
        entityId: dmId,
      });

      return created;
    });

    getIo().to(`user:${userId}`).to(`user:${recieverId}`).emit('dm:message', {
      dmId,
      message,
      senderName: sender?.name ?? sender?.email ?? null,
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error('Failed to POST message:', error);
    return res.sendStatus(500);
  }
});

export default dms;
