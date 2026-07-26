import { Router } from 'express';
import { prisma } from '../db/index';
import requireAuth from '../middleware/requireAuth';

const posts = Router();

// GET: search through posts
posts.get('/', async (req, res) => {
  try {
    const search = String(req.query.q ?? '').trim();

    return res.json(await prisma.post.findMany({
      where: search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
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

    const { count } = await prisma.post.updateMany({
      where: {
        id: Number(req.params.id),
        userId: (req.user as { id: number }).id,
        isComplete: false,
      },
      data: {
        title,
        message,
        isLocal,
        zipCode: isLocal ? String(zipCode) : null,
        radiusMiles: isLocal ? Number(radiusMiles) : null,
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
        isComplete: false,
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

// PATCH: allows a user to mark a trade as complete
posts.patch('/:id/complete', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);

    const { count } = await prisma.post.updateMany({
      where: {
        id: postId,
        userId: (req.user as { id: number }).id,
        isComplete: false,
      },
      data: {
        isComplete: true,
      },
    });

    if (!count) {
      return res.status(404).json({ error: 'Post not found to PATCH as complete.' });
    }

    return res.json({ success: true, id: postId, isComplete: true });
  } catch (error) {
    console.error('Failed to complete trade:', error);
    return res.status(500).json({ error: 'Unable to complete trade.' });
  }
});

export default posts;
