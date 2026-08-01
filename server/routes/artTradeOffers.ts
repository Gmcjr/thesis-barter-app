/* eslint-disable max-len */
/* eslint-disable object-curly-newline */
import { Router } from 'express';
import { prisma } from '../db/index';
import requireAuth from '../middleware/requireAuth';
import { getDownloadUrl } from '../services/s3';

const artTradeOffers = Router();

// GET: the receiver of offers will be able to view them, others will not (including the user who offered trade)
artTradeOffers.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const { postId } = req.query;

    // the post must belong to the logged-in user
    const whereClause = {
      post: { userId },
      ...(postId ? { postId: Number(postId) } : {}),
    };

    const rawOffers = await prisma.tradeOffer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      include: {
        offerer: { select: { id: true, name: true, email: true } },
        post: {
          include: {
            postMedia: { include: { media: true } },
          },
        },
        tradeOfferMedia: { include: { media: true } },
      },
    });

    const offers = await Promise.all(
      rawOffers.map(async (offer) => {
        const offerMedia = offer.tradeOfferMedia.map((m) => m.media);
        const previewMedia = offerMedia.find((m) => m.variant === 'PREVIEW') || offerMedia[0];
        const fullMedia = offerMedia.find((m) => m.variant === 'FULL');

        let previewUrl: string | null = null;
        if (previewMedia?.s3Key) {
          try {
            previewUrl = await getDownloadUrl(previewMedia.s3Key);
          } catch (s3Error) {
            console.error(`S3 error for key ${previewMedia.s3Key}:`, s3Error);
          }
        }

        const isCompleted = offer.status === 'COMPLETED' || offer.post.isComplete;
        const fullUrl = (isCompleted && offer.status === 'COMPLETED' && fullMedia)
          ? await getDownloadUrl(fullMedia.s3Key)
          : null;

        return {
          id: offer.id,
          message: offer.message,
          createdAt: offer.createdAt,
          status: offer.status,
          ownerApproved: offer.ownerApproved,
          offererApproved: offer.offererApproved,
          offerer: offer.offerer,
          post: { id: offer.post.id, title: offer.post.title },
          previewUrl,
          fullUrl,
        };
      }),
    );

    if (postId && rawOffers.length > 0) {
      const parentPost = rawOffers[0].post;
      const postMediaList = parentPost.postMedia.map((pm) => pm.media);
      const postPreview = postMediaList.find((m) => m.variant === 'PREVIEW');
      const postFull = postMediaList.find((m) => m.variant === 'FULL');
      const isCompleted = parentPost.isComplete || rawOffers.some((o) => o.status === 'COMPLETED');

      return res.json({
        isOwner: true,
        isCompleted,
        postPreviewUrl: postPreview ? await getDownloadUrl(postPreview.s3Key) : null,
        postFullUrl: (isCompleted && postFull) ? await getDownloadUrl(postFull.s3Key) : null,
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
    const offererId = (req.user as { id: number }).id;
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
    const userId = (req.user as { id: number }).id;

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

export default artTradeOffers;
