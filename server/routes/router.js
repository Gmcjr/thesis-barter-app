import { Router } from 'express';
import { prisma } from '../db/index.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.get('/health/db', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ status: 'ok', userCount: users.length });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
