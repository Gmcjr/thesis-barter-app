/* eslint-disable no-underscore-dangle */
import { Router } from 'express';
import { prisma } from '../db/index';
import requireAuth from '../middleware/requireAuth';
import { Status } from '../db/generated/client';
import { queueScreening } from '../services/moderation';

const reviews = Router();

const MIN_RATING = 1;
const MAX_RATING = 5;
const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function isValidRating(rating: unknown): rating is number {
  return Number.isInteger(rating)
    && (rating as number) >= MIN_RATING
    && (rating as number) <= MAX_RATING;
}

// Leave a review for the other participant on a completed trade
reviews.post('/', requireAuth, async (req, res) => {
  try {
    const reviewerId = (req.user as { id: number }).id;
    const { tradeId, rating, comment } = req.body;

    if (!Number.isInteger(tradeId)) {
      return res.status(400).json({ error: 'tradeId is required.' });
    }

    if (!isValidRating(rating)) {
      return res.status(400).json({
        error: `rating must be between ${MIN_RATING} and ${MAX_RATING}.`,
      });
    }

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: {
        id: true, ownerId: true, requesterId: true, status: true,
      },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found.' });
    }

    if (reviewerId !== trade.ownerId && reviewerId !== trade.requesterId) {
      return res.sendStatus(403);
    }

    if (trade.status !== Status.COMPLETED) {
      return res.status(400).json({ error: 'Trade must be complete for review.' });
    }

    const revieweeId = reviewerId === trade.ownerId ? trade.requesterId : trade.ownerId;

    const review = await prisma.review.create({
      data: {
        tradeId: trade.id,
        reviewerId,
        revieweeId,
        rating,
        comment: comment ?? null,
        isPendingScreening: !!comment,
      },
    });

    if (comment) {
      queueScreening({
        targetType: 'REVIEW',
        targetId: review.id,
        authorId: reviewerId,
        text: comment,
        onApproved: async () => {
          await prisma.review.update({
            where: { id: review.id },
            data: { isPendingScreening: false },
          });
        },
        onRemoved: async () => {
          await prisma.review.update({
            where: { id: review.id },
            data: { isPendingScreening: false, isRemoved: true },
          });
        },
      });
    }

    return res.status(201).json(review);
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') {
      return res.status(400).json({ error: 'Review has been submit already.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Unable to create review.' });
  }
});

// Reviewer can edit their own review within 24 hours of posting
reviews.patch('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!review) {
      return res.sendStatus(404);
    }

    if (review.reviewerId !== userId) {
      return res.sendStatus(403);
    }

    const ageMs = Date.now() - review.createdAt.getTime();

    if (ageMs > EDIT_WINDOW_MS) {
      return res.status(400).json({ error: 'Reviews can only be edited within 24 hours.' });
    }

    const data: { rating?: number, comment?: string | null } = {};

    if (rating !== undefined) {
      if (!isValidRating(rating)) {
        return res.status(400).json({
          error: `rating must be between ${MIN_RATING} and ${MAX_RATING}.`,
        });
      }
      data.rating = rating;
    }

    if (comment !== undefined) {
      data.comment = comment;
    }

    const updated = await prisma.review.update({
      where: { id: review.id },
      data,
    });

    if (data.comment) {
      await prisma.review.update({
        where: { id: review.id },
        data: { isPendingScreening: true },
      });
      queueScreening({
        targetType: 'REVIEW',
        targetId: review.id,
        authorId: userId,
        text: data.comment,
        onApproved: async () => {
          await prisma.review.update({
            where: { id: review.id },
            data: { isPendingScreening: false },
          });
        },
        onRemoved: async () => {
          await prisma.review.update({
            where: { id: review.id },
            data: { isPendingScreening: false, isRemoved: true },
          });
        },
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to update review.' });
  }
});

// Get all reviews written by self
reviews.get('/mine', requireAuth, async (req, res) => {
  try {
    const reviewerId = (req.user as { id: number }).id;
    const myReviews = await prisma.review.findMany({
      where: { reviewerId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(myReviews);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to retrieve your reviews.' });
  }
});

// Get all reviews received by a user, plus their average rating (e.g. for a profile page)
reviews.get('/user/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user id.' });
    }

    const [
      reviewList, aggregate, completedTradeCount, completedOfferCount, ownedCompletedOfferPostCount,
    ] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId, isRemoved: false },
        include: {
          reviewer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.aggregate({
        where: { revieweeId: userId, isRemoved: false },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.trade.count({
        where: { status: Status.COMPLETED, OR: [{ ownerId: userId }, { requesterId: userId }] },
      }),
      prisma.tradeOffer.count({ where: { status: 'COMPLETED', offererId: userId } }),
      prisma.post.count({ where: { userId, tradeOffers: { some: { status: 'COMPLETED' } } } }),
    ]);

    res.json({
      reviews: reviewList,
      averageRating: aggregate._avg.rating,
      totalReviews: aggregate._count.rating,
      totalTrades: completedTradeCount + completedOfferCount + ownedCompletedOfferPostCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to retrieve reviews.' });
  }
});

export default reviews;
