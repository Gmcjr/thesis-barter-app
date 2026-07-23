import { Router } from 'express';
import { prisma } from '../db/index.js';
import userRouter from './user.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.get('/health/db', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ status: 'ok', userCount: users.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

router.use('/users', userRouter);

export default router;
