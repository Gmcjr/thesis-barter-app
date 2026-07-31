import { Router } from 'express';
import { prisma } from '../db/index.js';
import { Prisma } from '../db/generated/client.js';
import requireAuth from '../middleware/requireAuth.js';

const blocks = Router();

// List who the current user has blocked
blocks.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await prisma.block.findMany({
      where: { blockerId: req.user!.id },
      include: { blocked: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) {
    console.error('Failed to GET blocks:', err);
    res.sendStatus(500);
  }
});

// Block a user
blocks.post('/', requireAuth, async (req, res) => {
  try {
    const blockerId = req.user!.id;
    const blockedId = Number(req.body.blockedId);

    if (!blockedId || Number.isNaN(blockedId)) {
      res.status(400).json({ error: 'blockedId is required' });
      return;
    }
    if (blockedId === blockerId) {
      res.status(400).json({ error: 'You cannot block yourself' });
      return;
    }

    const target = await prisma.user.findUnique({ where: { id: blockedId } });
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const block = await prisma.block.create({ data: { blockerId, blockedId } });
    res.status(201).json(block);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'You have already blocked this user' });
      return;
    }
    console.error('Failed to POST block:', err);
    res.sendStatus(500);
  }
});

// Unblock a user
blocks.delete('/:blockedUserId', requireAuth, async (req, res) => {
  try {
    const { count } = await prisma.block.deleteMany({
      where: { blockerId: req.user!.id, blockedId: Number(req.params.blockedUserId) },
    });
    if (!count) {
      res.status(404).json({ error: 'Block not found' });
      return;
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Failed to DELETE block:', err);
    res.sendStatus(500);
  }
});

export default blocks;
