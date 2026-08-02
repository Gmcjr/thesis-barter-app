/* eslint-disable object-curly-newline */
/* eslint-disable max-len */
import { Router, type Request } from 'express';
import { prisma } from '../db/index.js';
import { screenOrReject } from '../services/moderation.js';
import requireAuth from '../middleware/requireAuth.js';
import { getDownloadUrl } from '../services/s3.js';

const posts = Router();

// type definitions
interface MediaItem {
  media?: {
    variant?: string | null;
    s3Key: string;
  } | null;
}

interface TradeOfferItem {
  tradeOfferMedia?: MediaItem[];
  [key: string]: unknown;
}

// helper functions:

const getUserId = (req: Request): number => req.user!.id;

// generate the repeated where-clause for updating/deleting posts
const getOwnedIncompletePostWhere = (req: Request) => ({
  id: Number(req.params.id),
  userId: getUserId(req),
  isComplete: false,
});

// fetch S3 URLs for preview and full media variants
const getMediaUrls = async (mediaArray?: MediaItem[]) => {
  if (!mediaArray) return { previewUrl: null, fullUrl: null };

  const fetchUrl = async (variant: string) => {
    const item = mediaArray.find((m) => m.media?.variant === variant);
    if (!item || !item.media?.s3Key) return null;
    return getDownloadUrl(item.media.s3Key).catch((err) => {
      console.error(`Error getting ${variant} URL:`, err);
      return null;
    });
  };

  return {
    previewUrl: await fetchUrl('PREVIEW'),
    fullUrl: await fetchUrl('FULL'),
  };
};

// GET: public feed excludes removed posts: ?mine=true returns
// user's own posts including removed ones, for their Manage Posts view
posts.get('/', async (req, res) => {
  try {
    const search = String(req.query.q ?? '').trim();
    const mine = req.query.mine === 'true';

    if (mine && !req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = mine ? getUserId(req) : undefined;

    const rawPosts = await prisma.post.findMany({
      where: mine ? {
        OR: [
          { userId },
          { tradeOffers: { some: { offererId: userId, status: 'COMPLETED' } } },
        ],
      } : {
        isRemoved: false,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { message: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        products: true,
        services: true,
        comments: true,
        postMedia: { include: { media: true } },
        ...(mine && {
          tradeOffers: { include: { offerer: true, tradeOfferMedia: { include: { media: true } } } },
          reports: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { resolver: { select: { id: true, name: true } }, appeal: true },
          },
        }),
      },
    });

    const postsWithUrls = await Promise.all(rawPosts.map(async (post) => {
      const postUrls = await getMediaUrls(post.postMedia);
      const tradeOffers = await Promise.all(
        (post.tradeOffers || []).map(async (offer: TradeOfferItem) => ({
          ...offer,
          ...(await getMediaUrls(offer.tradeOfferMedia)),
        })),
      );

      return { ...post, ...postUrls, tradeOffers };
    }));

    return res.json(postsWithUrls);
  } catch (error) {
    console.error('Failed to GET posts:', error);
    return res.status(500).json({ error: 'Unable to retrieve posts.' });
  }
});

// POST: Allows user to create a new post
// Screens post before creating it, rejecting clear violations outright
posts.post('/', requireAuth, async (req, res) => {
  try {
    const { title, message, isLocal = false, zipCode, radiusMiles, previewMediaId, fullMediaId } = req.body;

    const rejection = await screenOrReject(`${title}\n\n${message}`);
    if (rejection) {
      return res.status(400).json({
        error: 'This post violates community guidelines and cannot be published.',
        rationale: rejection,
      });
    }

    const newPost = await prisma.post.create({
      data: {
        userId: getUserId(req),
        title,
        message,
        isLocal,
        zipCode: isLocal ? zipCode : null,
        radiusMiles: isLocal ? radiusMiles : null,
        ...(previewMediaId && fullMediaId && {
          postMedia: {
            create: [
              { mediaId: Number(previewMediaId), sortOrder: 0 },
              { mediaId: Number(fullMediaId), sortOrder: 1 },
            ],
          },
        }),
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
    const { title, message, isLocal = false, zipCode, radiusMiles } = req.body;

    // This screens post edits when they're submitted
    if (title || message) {
      const rejection = await screenOrReject(`${title}\n\n${message}`);
      if (rejection) {
        return res.status(400).json({
          error: 'This update violates community guidelines and cannot be saved.',
          rationale: rejection,
        });
      }
    }

    const { count } = await prisma.post.updateMany({
      where: getOwnedIncompletePostWhere(req),
      data: {
        title,
        message,
        isLocal,
        zipCode: isLocal ? String(zipCode) : null,
        radiusMiles: isLocal ? Number(radiusMiles) : null,
      },
    });

    if (!count) return res.status(404).json({ error: 'Post not found to PATCH as update.' });
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
      where: getOwnedIncompletePostWhere(req),
    });

    if (!count) return res.status(404).json({ error: 'Post not found to DELETE.' });
    return res.sendStatus(200);
  } catch (error) {
    console.error('Failed to DELETE post:', error);
    return res.status(500).json({ error: 'Unable to delete post.' });
  }
});

// PATCH: allows a user to mark a trade as complete
posts.patch('/:id/complete', requireAuth, async (req, res) => {
  try {
    const { count } = await prisma.post.updateMany({
      where: getOwnedIncompletePostWhere(req),
      data: { isComplete: true },
    });

    if (!count) return res.status(404).json({ error: 'Post not found to PATCH as complete.' });
    return res.json({ success: true, id: Number(req.params.id), isComplete: true });
  } catch (error) {
    console.error('Failed to complete trade:', error);
    return res.status(500).json({ error: 'Unable to complete trade.' });
  }
});

export default posts;
