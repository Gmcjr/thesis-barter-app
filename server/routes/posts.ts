/* eslint-disable object-curly-newline */
/* eslint-disable max-len */
import { Router, type Request } from 'express';
import { prisma } from '../db/index.js';
import { screenContent, decideAutoAction } from '../services/moderation.js';
import requireAuth from '../middleware/requireAuth.js';
import { ReportStatus } from '../db/generated/enums.js';
import { getDownloadUrl } from '../services/s3.js';
import { getBlockedRelationshipIds } from '../services/blocks.js';

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
    const profileUserId = req.query.userId ? Number(req.query.userId) : undefined;

    if (mine && !req.user) return res.status(401).json({ error: 'Unauthorized' });

    const blockedRelationshipIds = (!mine && !profileUserId && req.user)
      ? await getBlockedRelationshipIds(getUserId(req))
      : [];

    let userFilter = {};
    if (profileUserId) {
      userFilter = { userId: profileUserId };
    } else if (blockedRelationshipIds.length) {
      userFilter = { userId: { notIn: blockedRelationshipIds } };
    }

    const rawPosts = await prisma.post.findMany({
      where: mine ? {
        OR: [
          { userId: getUserId(req) },
          { tradeOffers: { some: { offererId: getUserId(req), status: 'COMPLETED' } } },
        ],
      } : {
        isRemoved: false,
        ...userFilter,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { message: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      take: mine || profileUserId ? undefined : 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        products: true,
        services: true,
        comments: true,
        trade: {
          select: {
            id: true,
            status: true,
            ownerId: true,
            requesterId: true,
            ownerCompl: true,
            reqCompl: true,
          },
        },
        ...(mine && {
          postMedia: { include: { media: true } },
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
    const {
      title, message, isLocal = false, zipCode, radiusMiles, previewMediaId, fullMediaId,
      name, offerType, category, condition,
    } = req.body;

    const screening = await screenContent(`${title}\n\n${message}`);
    if (screening && decideAutoAction(screening)?.status === ReportStatus.REMOVED) {
      return res.status(400).json({
        error: 'This post violates community guidelines and cannot be published.',
        rationale: screening.rationale,
      });
    }

    const userId = getUserId(req);
    const trimmedCategory = typeof category === 'string' ? category.trim() : '';

    const newPost = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          userId,
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

      // DIGITAL offers have no Product/Service catalog entry — the post + attached media is the offering
      if ((offerType === 'PRODUCT' || offerType === 'SERVICE') && trimmedCategory && name) {
        const cat = await tx.cat.upsert({
          where: { name_type: { name: trimmedCategory, type: offerType } },
          create: { name: trimmedCategory, type: offerType },
          update: {},
        });

        if (offerType === 'PRODUCT') {
          await tx.product.create({
            data: {
              postId: post.id, userId, catId: cat.id, name, condition: condition || 'GOOD',
            },
          });
        } else {
          await tx.service.create({
            data: {
              postId: post.id, userId, catId: cat.id, name,
            },
          });
        }
      }

      return post;
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

    if (isLocal && (zipCode === undefined || zipCode === null || zipCode === '')) {
      return res.status(400).json({ error: 'zipCode is required when isLocal is true.' });
    }

    const parsedRadius = isLocal ? Number(radiusMiles) : null;

    if (isLocal && !Number.isFinite(parsedRadius)) {
      return res.status(400).json({ error: 'radiusMiles must be a number when isLocal is true.' });
    }

    const { count } = await prisma.post.updateMany({
      where: getOwnedOpenPostWhere(req),
      data: {
        title,
        message,
        isLocal,
        zipCode: isLocal ? String(zipCode) : null,
        radiusMiles: parsedRadius,
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
      where: getOwnedOpenPostWhere(req),
    });

    if (!count) return res.status(404).json({ error: 'Post not found to DELETE.' });
    return res.sendStatus(200);
  } catch (error) {
    console.error('Failed to DELETE post:', error);
    return res.status(500).json({ error: 'Unable to delete post.' });
  }
});

export default posts;
