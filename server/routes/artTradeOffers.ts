/* eslint-disable max-len */
/* eslint-disable object-curly-newline */
import { Router, type Request } from 'express';
import { prisma } from '../db/index.js';
import requireAuth from '../middleware/requireAuth.js';
import { getDownloadUrl } from '../services/s3.js';

const artTradeOffers = Router();

// type definitions
interface MediaItem {
  variant?: string | null;
  s3Key: string;
}

interface NestedMediaItem {
  media?: MediaItem | null;
}

// helpers

const getUserId = (req: Request): number => req.user!.id;

const getMediaUrls = async (
  mediaArray?: NestedMediaItem[],
  allowFull: boolean = false,
  fallbackPreviewToFirst: boolean = false,
) => {
  if (!mediaArray) return { previewUrl: null, fullUrl: null };
  const items = mediaArray.map((m) => m.media).filter(Boolean) as MediaItem[];
  const [firstItem] = items;

  const fetchUrl = async (variant: string, useFallback: boolean = false) => {
    const item = items.find((m) => m.variant === variant) || (useFallback ? firstItem : undefined);

    if (!item || !item.s3Key) return null;
    return getDownloadUrl(item.s3Key).catch((err) => {
      console.error(`S3 error for key ${item.s3Key}:`, err);
      return null;
    });
  };

  const [previewUrl, fullUrl] = await Promise.all([
    fetchUrl('PREVIEW', fallbackPreviewToFirst),
    allowFull ? fetchUrl('FULL') : Promise.resolve(null),
  ]);

  return { previewUrl, fullUrl };
};

// GET: the receiver of offers will be able to view them, others will not (including the user who offered trade)
artTradeOffers.get('/', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const numericPostId = req.query.postId ? Number(req.query.postId) : undefined;
    let post = null;

    if (numericPostId) {
      post = await prisma.post.findUnique({
        where: { id: numericPostId },
        include: { postMedia: { include: { media: true } } },
      });

      if (!post || post.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized or post not found.' });
      }
    }

    const rawOffers = await prisma.tradeOffer.findMany({
      where: numericPostId ? {
        postId: numericPostId,
        ...(post?.isComplete ? { status: 'COMPLETED' } : { status: 'PENDING' }),
      } : {
        post: { userId, isComplete: false },
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
      include: {
        offerer: { select: { id: true, name: true, email: true } },
        post: { include: { postMedia: { include: { media: true } } } },
        tradeOfferMedia: { include: { media: true } },
      },
    });

    const offers = await Promise.all(
      rawOffers.map(async (offer) => {
        const urls = await getMediaUrls(offer.tradeOfferMedia, offer.status === 'COMPLETED', true);

        return {
          id: offer.id,
          message: offer.message,
          createdAt: offer.createdAt,
          status: offer.status,
          ownerApproved: offer.ownerApproved,
          offererApproved: offer.offererApproved,
          offerer: offer.offerer,
          post: { id: offer.post.id, title: offer.post.title },
          ...urls,
        };
      }),
    );

    if (numericPostId && post) {
      const { previewUrl: postPreviewUrl, fullUrl: postFullUrl } = await getMediaUrls(post.postMedia, post.isComplete, false);

      return res.json({
        isOwner: true,
        isCompleted: post.isComplete,
        postPreviewUrl,
        postFullUrl,
        offers,
      });
    }

    return res.json(offers);
  } catch (error) {
    console.error('Failed to get trade offers:', error);
    return res.status(500).json({ error: 'Unable to retrieve trade offers.' });
  }
});

// POST: submit a new offer
artTradeOffers.post('/', requireAuth, async (req, res) => {
  try {
    const offererId = getUserId(req);
    const { postId, message, previewMediaId, fullMediaId } = req.body;

    const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
    if (!post || post.isComplete) {
      return res.status(400).json({ error: 'Post not found or trade already completed.' });
    }

    if (post.userId === offererId) {
      return res.status(400).json({ error: 'Cannot offer on your own post.' });
    }

    const offer = await prisma.tradeOffer.create({
      data: {
        postId: Number(postId),
        offererId,
        message,
        tradeOfferMedia: {
          create: [
            { mediaId: Number(previewMediaId), sortOrder: 0 },
            { mediaId: Number(fullMediaId), sortOrder: 1 },
          ],
        },
      },
      include: {
        offerer: { select: { id: true, name: true, email: true } },
        tradeOfferMedia: { include: { media: true } },
      },
    });

    return res.status(201).json(offer);
  } catch (error) {
    console.error('Failed to submit trade offer:', error);
    return res.status(500).json({ error: 'Unable to submit trade offer.' });
  }
});

// PATCH: mutual approval for trade logic
artTradeOffers.patch('/:offerId/approve', requireAuth, async (req, res) => {
  try {
    const offerId = Number(req.params.offerId);
    const userId = getUserId(req);

    const offer = await prisma.tradeOffer.findUnique({
      where: { id: offerId },
      include: { post: true },
    });

    if (!offer || offer.post.isComplete) {
      return res.status(400).json({ error: 'Trade offer unavailable or already completed.' });
    }

    const isOwner = offer.post.userId === userId;
    const isOfferer = offer.offererId === userId;

    if (!isOwner && !isOfferer) {
      return res.status(403).json({ error: 'Unauthorized to approve this offer.' });
    }

    const newOwnerApproved = isOwner ? true : offer.ownerApproved;
    const newOffererApproved = isOfferer ? true : offer.offererApproved;
    const isBothApproved = newOwnerApproved && newOffererApproved;

    const updatedOffer = await prisma.tradeOffer.update({
      where: { id: offerId },
      data: {
        ownerApproved: newOwnerApproved,
        offererApproved: newOffererApproved,
        status: isBothApproved ? 'COMPLETED' : 'PENDING',
      },
    });

    if (isBothApproved) {
      await prisma.post.update({
        where: { id: offer.postId },
        data: { isComplete: true },
      });

      await prisma.tradeOffer.deleteMany({
        where: {
          postId: offer.postId,
          id: { not: offerId },
        },
      });
    }

    return res.json({
      success: true,
      tradeCompleted: isBothApproved,
      offerStatus: updatedOffer.status,
    });
  } catch (error) {
    console.error('Failed to approve trade offer:', error);
    return res.status(500).json({ error: 'Unable to approve trade offer.' });
  }
});

// PATCH: single-sided accept logic
artTradeOffers.patch('/:offerId/accept', requireAuth, async (req, res) => {
  try {
    const offerId = Number(req.params.offerId);
    const userId = getUserId(req);

    const offer = await prisma.tradeOffer.findUnique({
      where: { id: offerId },
      include: { post: true },
    });

    if (!offer || offer.post.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized. Only post owner can accept.' });
    }

    if (offer.post.isComplete) {
      return res.status(400).json({ error: 'Trade is already completed.' });
    }

    await prisma.post.update({
      where: { id: offer.postId },
      data: { isComplete: true },
    });

    await prisma.tradeOffer.update({
      where: { id: offerId },
      data: {
        status: 'COMPLETED',
        ownerApproved: true,
      },
    });

    await prisma.tradeOffer.deleteMany({
      where: {
        postId: offer.postId,
        id: { not: offerId },
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to accept digital trade:', error);
    return res.status(500).json({ error: 'Unable to accept the trade.' });
  }
});

export default artTradeOffers;
