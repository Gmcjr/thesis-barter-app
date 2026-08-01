import { Router } from 'express';
import { prisma } from '../db/index';
import requireAuth from '../middleware/requireAuth';

const posts = Router();

// GET: search through posts
posts.get('/', async (req, res) => {
  try {
    const search = String(req.query.q ?? '').trim();

    return res.json(await prisma.post.findMany({
      where: {
        isRemoved: false,
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { message: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      take: 50,
      include: {
        user: { select: { id: true, name: true } },
        products: true,
        services: true,
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
    }));
  } catch (error) {
    console.error('Failed to GET posts:', error);
    return res.status(500).json({ error: 'Unable to retrieve posts.' });
  }
});

// POST: allows user to create a new post
posts.post('/', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;

    const {
      title,
      message,
      images = [],
      isLocal = false,
      zipCode,
      radiusMiles,
    } = req.body;

    const newPost = await prisma.post.create({
      data: {
        userId,
        title,
        message,
        images,
        isLocal,
        zipCode: isLocal ? zipCode : null,
        radiusMiles: isLocal ? radiusMiles : null,
      },
    });

    return res.status(201).json(newPost);
  } catch (error) {
    console.error('Failed to POST new post:', error);
    return res.status(500).json({ error: 'Unable to create post' });
  }
});

// PATCH: allows user to update an existing post
posts.patch('/:id', requireAuth, async (req, res) => {
  try {
    const {
      title, message, isLocal = false, zipCode, radiusMiles,
    } = req.body;

    if (isLocal && (zipCode === undefined || zipCode === null || zipCode === '')) {
      return res.status(400).json({ error: 'zipCode is required when isLocal is true.' });
    }

    const parsedRadius = isLocal ? Number(radiusMiles) : null;

    if (isLocal && !Number.isFinite(parsedRadius)) {
      return res.status(400).json({ error: 'radiusMiles must be a number when isLocal is true.' });
    }

    const { count } = await prisma.post.updateMany({
      where: {
        id: Number(req.params.id),
        userId: (req.user as { id: number }).id,
        status: 'OPEN',
      },
      data: {
        title,
        message,
        isLocal,
        zipCode: isLocal ? String(zipCode) : null,
        radiusMiles: parsedRadius,
      },
    });

    if (!count) {
      return res.status(404).json({ error: 'Post not found to PATCH as update.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to PATCH post:', error);
    return res.status(500).json({ error: 'Unable to update post.' });
  }
});

// DELETE: allows user to delete a post
posts.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { count } = await prisma.post.deleteMany({
      where: {
        id: Number(req.params.id),
        userId: (req.user as { id: number }).id,
        status: 'OPEN',
      },
    });

    if (!count) {
      return res.status(404).json({ error: 'Post not found to DELETE.' });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Failed to DELETE post:', error);
    return res.status(500).json({ error: 'Unable to delete post.' });
  }
});

export default posts;
