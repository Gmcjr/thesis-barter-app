import { Router } from 'express';
import { prisma } from '../db/index.js';
import requireAuth from '../middleware/requireAuth.js';
import { isBlocked } from '../services/blocks.js';
import { enqueueJob } from '../services/jobQueue.js';
import { getIo } from '../middleware/socket.js';
import { withAvatarUrl } from '../services/userMedia.js';

const comments = Router();

// POST: add a comment to a post. Screening runs as a background SCREEN_CONTENT job
// so the commenter isn't blocked waiting on it - the comment is created right away
// and only shown to its own author until it's approved, same pattern as
// posts/trade requests/offers.
comments.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      postId, text, parentId,
    } = req.body;
    const trimmed = typeof text === 'string' ? text.trim() : '';

    if (!Number.isInteger(postId)) {
      return res.status(400).json({ error: 'postId is required.' });
    }
    if (!trimmed) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }
    if (parentId !== undefined && parentId !== null && !Number.isInteger(parentId)) {
      return res.status(400).json({ error: 'parentId must be an integer.' });
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

    // Replies are only ever one level deep: replying to a reply re-parents onto that
    // reply's own top-level comment instead of erroring or nesting further.
    let resolvedParentId: number | null = null;
    if (Number.isInteger(parentId)) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true, isRemoved: true },
      });
      if (!parent || parent.postId !== postId || parent.isRemoved) {
        return res.status(404).json({ error: 'Comment being replied to was not found.' });
      }
      resolvedParentId = parent.id;
    }

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          postId,
          userId,
          text: trimmed,
          parentId: resolvedParentId,
          isPendingScreening: true,
        },
      });

      const preview = trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;

      await enqueueJob(tx, 'SCREEN_CONTENT', {
        targetType: 'COMMENT',
        targetId: created.id,
        authorId: userId,
        text: trimmed,
        ...(post.userId !== userId ? {
          notifyOnApprove: {
            userId: post.userId,
            type: 'COMMENT_RECIEVED',
            title: 'New comment on your post',
            body: preview,
            link: `/profile?postId=${postId}`,
            entityType: 'COMMENT',
            entityId: created.id,
          },
        } : {}),
      });

      return created;
    });

    // Only the comment author sees their own pending comment right away;
    // everyone else picks it up once processScreenContent approves it and
    // emits content:screened / posts:changed.
    getIo().emit('posts:changed');

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
