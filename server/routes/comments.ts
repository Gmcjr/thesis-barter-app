import { Router } from 'express';
import { prisma } from '../db/index.js';
import requireAuth from '../middleware/requireAuth.js';
import { isBlocked } from '../services/blocks.js';
import { queueScreening } from '../services/moderation.js';
import { enqueueJob } from '../services/jobs.js';
import { getIo } from '../middleware/socket.js';
import { withAvatarUrl } from '../services/userMedia.js';

const comments = Router();

// POST: add a comment to a post. Screening runs in the background (queueScreening
// is fire-and-forget) so the commenter isn't blocked waiting on it - the comment
// is created right away and only shown to its own author until it's approved,
// same pattern as posts/trade requests/offers.
comments.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { postId, text } = req.body;
    const trimmed = typeof text === 'string' ? text.trim() : '';

    if (!Number.isInteger(postId)) {
      return res.status(400).json({ error: 'postId is required.' });
    }
    if (!trimmed) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, isRemoved: true },
    });

    if (!post || post.isRemoved) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.userId !== userId && await isBlocked(userId, post.userId)) {
      return res.status(403).json({ error: 'Unable to comment on this post.' });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        text: trimmed,
        isPendingScreening: true,
      },
    });

    // Only the comment refreshes for the author right away (they can see their
    // own pending comment); everyone else picks it up once it's approved below.
    getIo().emit('posts:changed');

    queueScreening({
      targetType: 'COMMENT',
      targetId: comment.id,
      authorId: userId,
      text: trimmed,
      onApproved: async () => {
        await prisma.comment.update({
          where: { id: comment.id },
          data: { isPendingScreening: false },
        });
        getIo().emit('posts:changed');

        if (post.userId !== userId) {
          const preview = trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
          await enqueueJob(prisma, 'SEND_NOTIFICATION', {
            userId: post.userId,
            type: 'COMMENT_RECEIVED',
            title: 'New comment on your post',
            body: preview,
            link: `/profile?postId=${postId}`,
            entityType: 'COMMENT',
            entityId: comment.id,
          });
        }
      },
      onRemoved: async () => {
        await prisma.comment.update({
          where: { id: comment.id },
          data: { isPendingScreening: false, isRemoved: true },
        });
        getIo().emit('posts:changed');
      },
    });

    const author = await withAvatarUrl({
      id: userId,
      name: req.user!.name,
      email: req.user!.email,
    });

    return res.status(201).json({ ...comment, user: author });
  } catch (error) {
    console.error('Failed to POST comment:', error);
    return res.status(500).json({ error: 'Unable to add comment.' });
  }
});

// DELETE: a user can remove their own comment
comments.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const commentId = Number(req.params.id);

    const { count } = await prisma.comment.deleteMany({
      where: { id: commentId, userId },
    });

    if (!count) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    getIo().emit('posts:changed');
    return res.sendStatus(200);
  } catch (error) {
    console.error('Failed to DELETE comment:', error);
    return res.status(500).json({ error: 'Unable to delete comment.' });
  }
});

export default comments;
