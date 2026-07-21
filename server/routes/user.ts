import { Router } from 'express';
import { prisma } from '../db/index.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { email, name } = req.body;
    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;
