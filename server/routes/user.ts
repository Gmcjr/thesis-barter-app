import { Router } from 'express';
import { prisma } from '../db/index.js';
import requireAuth from '../middleware/requireAuth.js';
import { isBlocked } from '../services/blocks.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const {
      email, name, phone,
    } = req.body.user ?? {};

    if (!email) {
      return res.status(400).json({ error: 'email REQUIRED' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name REQUIRED' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name.trim(),
        phone,
      },
    });
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
      return res.status(409).json({ error: 'email in use already' });
    }
    return res.sendStatus(500);
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        posts: true,
        rep: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  const {
    name, bio, phone, zipCode,
  } = req.body.user ?? {};

  if (name !== undefined && (!name || !name.trim())) {
    return res.status(400).json({ error: 'name cannot be empty' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        bio,
        phone,
        zipCode,
      },
    });
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid user id' });
  }
  try {
    if (req.user && await isBlocked(req.user.id, id)) {
      return res.status(404).json({ error: 'user not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: true,
        rep: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

export default router;
