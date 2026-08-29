import { Router } from 'express';
import { prisma } from '../db/index.js';
import requireAuth from '../middleware/requireAuth.js';
import { Status, TradeRequestStatus } from '../db/generated/enums.js';
import { enqueueJob } from '../services/jobQueue.js';

const tradeRequests = Router();

// Request to trade on someone else's open post
tradeRequests.post('/', requireAuth, async (req, res) => {
  try {
    const requesterId = (req.user as { id: number }).id;
    const { postId, message } = req.body;

    if (!Number.isInteger(postId)) {
      return res.status(400).json({ error: 'postId is required.' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true, userId: true, status: true, isRemoved: true, title: true,
      },
    });

    if (!post || post.isRemoved) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.userId === requesterId) {
      return res.status(400).json({ error: 'Trade requires two parties :/' });
    }

    if (post.status !== Status.OPEN) {
      return res.status(400).json({ error: 'Post is no longer open for trade requests.' });
    }

    const existingRequest = await prisma.tradeRequest.findUnique({
      where: { postId_requesterId: { postId, requesterId } },
    });

    // Only a currently-open (PENDING) request counts as a duplicate. An ACCEPTED
    // request whose trade was later cancelled shouldn't block a new one - if the
    // trade were still active, post.status !== OPEN would already have blocked us above.
    if (existingRequest && existingRequest.status === TradeRequestStatus.PENDING) {
      return res.status(400).json({ error: 'Duplicate trade request' });
    }

    const trimmedMessage = typeof message === 'string' && message.trim() ? message.trim() : null;

    const tradeRequest = await prisma.$transaction(async (tx) => {
      const upserted = await tx.tradeRequest.upsert({
        where: { postId_requesterId: { postId, requesterId } },
        create: {
          postId,
          requesterId,
          message: trimmedMessage,
          isPendingScreening: !!trimmedMessage,
        },
        update: {
          status: TradeRequestStatus.PENDING,
          message: trimmedMessage,
          createdAt: new Date(),
          isPendingScreening: !!trimmedMessage,
        },
      });

      if (trimmedMessage) {
        const preview = trimmedMessage.length > 80 ? `${trimmedMessage.slice(0, 80)}...` : trimmedMessage;
        await enqueueJob(tx, 'SCREEN_CONTENT', {
          targetType: 'TRADE_REQUEST',
          targetId: upserted.id,
          authorId: requesterId,
          text: trimmedMessage,
          notifyOnApprove: {
            userId: post.userId,
            type: 'TRADE_REQUEST_RECEIVED',
            title: `New trade request on "${post.title}"`,
            body: preview,
            link: `/profile/requests/${postId}/${upserted.id}`,
            entityType: 'TRADE_REQUEST',
            entityId: upserted.id,
          },
        });
      }

      return upserted;
    });

    // No message = nothing to screen, notify immediately
    if (!trimmedMessage) {
      await enqueueJob(prisma, 'SEND_NOTIFICATION', {
        userId: post.userId,
        type: 'TRADE_REQUEST_RECEIVED',
        title: `New trade request on "${post.title}"`,
        link: `/profile/requests/${postId}/${tradeRequest.id}`,
        entityType: 'TRADE_REQUEST',
        entityId: tradeRequest.id,
      });
    }

    return res.status(201).json(tradeRequest);
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') {
      return res.status(400).json({ error: 'Cannot request trade twice' });
    }
    console.error(err);
    return res.sendStatus(500);
  }
});

// Requests I've sent (see status)
tradeRequests.get('/mine', requireAuth, async (req, res) => {
  try {
    const requesterId = (req.user as { id: number }).id;

    const myRequests = await prisma.tradeRequest.findMany({
      where: { requesterId, isRemoved: false },
      include: {
        post: {
          select: {
            id: true, title: true, status: true, userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(myRequests);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

// Trade requests received on a post I own
tradeRequests.get('/for-post/:postId', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const postId = Number(req.params.postId);

    if (!Number.isInteger(postId)) {
      return res.status(400).json({ error: 'Invalid post id.' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId, isRemoved: false },
      select: { id: true, userId: true },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.userId !== userId) {
      return res.sendStatus(403);
    }

    const requestsForPost = await prisma.tradeRequest.findMany({
      where: { postId, isRemoved: false, isPendingScreening: false },
      include: {
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(requestsForPost);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

// Trade requests received across ALL posts
tradeRequests.get('/received', requireAuth, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');

    const ownerId = (req.user as { id: number }).id;

    const openPosts = await prisma.post.findMany({
      where: {
        userId: ownerId,
        status: Status.OPEN,
        isRemoved: false,
        isPendingScreening: false,
      },
      select: {
        id: true,
      },
    });

    const openPostIds = openPosts.map((post) => post.id);

    if (openPostIds.length === 0) {
      return res.json([]);
    }

    const receivedRequests = await prisma.tradeRequest.findMany({
      where: {
        postId: {
          in: openPostIds,
        },
        status: TradeRequestStatus.PENDING,
        isRemoved: false,
      },
      include: {
        requester: {
          select: {
            id: true, name: true, email: true,
          },
        },
        post: {
          select: {
            id: true, title: true, status: true, userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(receivedRequests);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

// Owner accepts one trade request (reject others)
tradeRequests.patch('/:id/accept', requireAuth, async (req, res) => {
  try {
    const ownerId = (req.user as { id: number }).id;
    const requestId = Number(req.params.id);

    const tradeRequest = await prisma.tradeRequest.findUnique({
      where: { id: requestId },
      include: {
        post: {
          select: {
            id: true, userId: true, status: true, title: true,
          },
        },
      },
    });

    if (!tradeRequest) {
      return res.sendStatus(404);
    }

    if (tradeRequest.post.userId !== ownerId) {
      return res.sendStatus(403);
    }

    if (tradeRequest.status !== TradeRequestStatus.PENDING) {
      return res.status(400).json({
        error: `Cannot accept trade from ${tradeRequest.status} status.`,
      });
    }

    if (tradeRequest.post.status !== Status.OPEN) {
      return res.status(400).json({ error: 'This post is no longer open.' });
    }

    const trade = await prisma.$transaction(async (tx) => {
      const newTrade = await tx.trade.create({
        data: {
          postId: tradeRequest.postId,
          ownerId,
          requesterId: tradeRequest.requesterId,
        },
      });

      await tx.post.update({
        where: { id: tradeRequest.postId },
        data: { status: Status.ACCEPTED },
      });

      await tx.tradeRequest.update({
        where: { id: tradeRequest.id },
        data: { status: TradeRequestStatus.ACCEPTED },
      });

      await tx.tradeRequest.deleteMany({
        where: {
          postId: tradeRequest.postId,
          status: TradeRequestStatus.PENDING,
        },
      });

      await enqueueJob(tx, 'SEND_NOTIFICATION', {
        userId: tradeRequest.requesterId,
        type: 'TRADE_REQUEST_ACCEPTED',
        title: 'Your trade request was accepted',
        body: `Your trade request for "${tradeRequest.post.title}" was accepted.`,
        link: '/profile?mine=true',
        entityType: 'TRADE_REQUEST',
        entityId: tradeRequest.id,
      });

      return newTrade;
    });

    return res.status(201).json(trade);
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') {
      return res.status(400).json({
        error: 'This post already has a trade on record and cannot start a new one yet.',
      });
    }
    console.error(err);
    return res.sendStatus(500);
  }
});

// Requester cancels trade request
tradeRequests.patch('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const requestId = Number(req.params.id);

    const tradeRequest = await prisma.tradeRequest.findUnique({
      where: { id: requestId },
    });

    if (!tradeRequest) {
      return res.sendStatus(404);
    }

    if (tradeRequest.requesterId !== userId) {
      return res.sendStatus(403);
    }

    if (tradeRequest.status !== TradeRequestStatus.PENDING) {
      return res.status(400).json({
        error: `Cannot cancel trade request from ${tradeRequest.status} status.`,
      });
    }

    await prisma.tradeRequest.update({
      where: { id: tradeRequest.id },
      data: { status: TradeRequestStatus.CANCELLED },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

export default tradeRequests;
