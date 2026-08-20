import { Router, type Request } from 'express';
import { prisma } from '../db/index.js';
import { enqueueJob } from '../services/jobQueue.js';
import requireAuth from '../middleware/requireAuth.js';
import { getDownloadUrl } from '../services/s3.js';
import { getBlockedRelationshipIds } from '../services/blocks.js';
import { getIo } from '../middleware/socket.js';

const posts = Router();

// type definitions
interface MediaItem {
  media?: {
    variant?: string | null;
    s3Key: string;
  } | null;
}

interface TradeOfferItem {
  offererId: number;
  status: string;
  tradeOfferMedia?: MediaItem[];
  [key: string]: unknown;
}

// helper functions:

const getUserId = (req: Request): number => req.user!.id;

// Signals 'no owned-open post matched' out of a $transaction callback, since you
// can't `return res.status(...)` from inside one
class PostNotFoundForUpdate extends Error {}

// Generate the repeated where-clause for updating/deleting posts
const getOwnedOpenPostWhere = (req: Request) => ({
  id: Number(req.params.id),
  userId: getUserId(req),
  status: 'OPEN' as const,
});

// fetch S3 URLs for preview and full media variants
const getMediaUrls = async (
  mediaArray?: MediaItem[],
  allowFull: boolean = false,
) => {
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
    fullUrl: allowFull ? await fetchUrl('FULL') : null,
  };
};

// GET: public feed excludes removed posts: ?mine=true returns
// user's own posts including removed ones, for their Manage Posts view
posts.get('/', async (req, res) => {
  try {
    const search = String(req.query.q ?? '').trim();
    const mine = req.query.mine === 'true';
    const profileUserId = req.query.userId
      ? Number(req.query.userId)
      : undefined;

    if (mine && !req.user) return res.status(401).json({ error: 'Unauthorized' });

    const blockedRelationshipIds = !mine && !profileUserId && req.user
      ? await getBlockedRelationshipIds(getUserId(req))
      : [];

    // A user's 'trading history' includes posts they authored, posts where they
    // completed an art trade offer, and posts where they completed a generic
    // trade as the requester - not just posts they own
    const ownedOrCompletedFilter = (userId: number) => ({
      OR: [
        { userId },
        {
          isRemoved: false,
          isPendingScreening: false,
          tradeOffers: {
            some: { offererId: userId, status: 'COMPLETED' as const },
          },
        },
        {
          isRemoved: false,
          isPendingScreening: false,
          trades: {
            some: { requesterId: userId, status: 'COMPLETED' as const },
          },
        },
      ],
    });

    const searchFilter = search
      ? [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { message: { contains: search, mode: 'insensitive' as const } },
          ],
        },
      ]
      : [];

    const buildWhere = () => {
      if (mine) return ownedOrCompletedFilter(getUserId(req));
      if (profileUserId) {
        return {
          AND: [
            { isRemoved: false, isPendingScreening: false },
            ownedOrCompletedFilter(profileUserId),
            ...searchFilter,
          ],
        };
      }
      return {
        AND: [
          { isRemoved: false, isPendingScreening: false },
          { status: { not: 'COMPLETED' as const } },
          ...(blockedRelationshipIds.length
            ? [{ userId: { notIn: blockedRelationshipIds } }]
            : []),
          ...searchFilter,
        ],
      };
    };

    const rawPosts = await prisma.post.findMany({
      where: buildWhere(),
      take: mine || profileUserId ? undefined : 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        products: true,
        services: true,
        comments: true,
        trades: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            ownerId: true,
            requesterId: true,
            ownerCompl: true,
            reqCompl: true,
          },
        },
        postMedia: { include: { media: true } },
        tradeOffers: {
          where: mine ? undefined : { status: 'COMPLETED' },
          include: {
            offerer: true,
            tradeOfferMedia: { include: { media: true } },
          },
        },
        ...(mine && {
          reports: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              resolver: { select: { id: true, name: true } },
              appeal: true,
            },
          },
        }),
      },
    });

    const viewerId = req.user?.id;

    const postsWithUrls = await Promise.all(
      rawPosts.map(async (post) => {
        const { trades, ...postRest } = post;
        const isOwner = viewerId !== undefined && post.userId === viewerId;
        const viewerCompletedOffer = (post.tradeOffers || []).find(
          (o: TradeOfferItem) => o.offererId === viewerId && o.status === 'COMPLETED',
        );

        const postUrls = await getMediaUrls(
          post.postMedia,
          isOwner || Boolean(viewerCompletedOffer),
        );

        const tradeOffers = await Promise.all(
          (post.tradeOffers || []).map(async (offer: TradeOfferItem) => {
            const isOfferer = viewerId !== undefined && offer.offererId === viewerId;
            const offerAllowFull = isOfferer || (isOwner && offer.status === 'COMPLETED');
            return {
              ...offer,
              ...(await getMediaUrls(offer.tradeOfferMedia, offerAllowFull)),
            };
          }),
        );

        return {
          ...postRest,
          trade: trades[0] ?? null,
          ...postUrls,
          tradeOffers,
        };
      }),
    );

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
      title,
      message,
      isLocal = false,
      zipCode,
      radiusMiles,
      previewMediaId,
      fullMediaId,
      name,
      offerType,
      category,
      condition,
    } = req.body;

    const userId = getUserId(req);
    const trimmedCategory = typeof category === 'string' ? category.trim() : '';

    // Doesn't depend on the post existing yet - resolve before opening the transaction
    const mediaKeys = previewMediaId && fullMediaId
      ? (
        await prisma.media.findMany({
          where: {
            id: { in: [Number(previewMediaId), Number(fullMediaId)] },
          },
          select: { s3Key: true },
        })
      ).map((m) => m.s3Key)
      : [];

    const newPost = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          userId,
          title,
          message,
          isLocal,
          zipCode: isLocal ? zipCode : null,
          radiusMiles: isLocal ? radiusMiles : null,
          isPendingScreening: true,
          ...(previewMediaId
            && fullMediaId && {
            postMedia: {
              create: [
                { mediaId: Number(previewMediaId), sortOrder: 0 },
                { mediaId: Number(fullMediaId), sortOrder: 1 },
              ],
            },
          }),
        },
      });

      // DIGITAL offers have no Product/Service catalog entry
      // the post + attached media is the offering
      if (
        (offerType === 'PRODUCT' || offerType === 'SERVICE')
        && trimmedCategory
        && name
      ) {
        const cat = await tx.cat.upsert({
          where: { name_type: { name: trimmedCategory, type: offerType } },
          create: { name: trimmedCategory, type: offerType },
          update: {},
        });

        if (offerType === 'PRODUCT') {
          await tx.product.create({
            data: {
              postId: post.id,
              userId,
              catId: cat.id,
              name,
              condition: condition || 'GOOD',
            },
          });
        } else {
          await tx.service.create({
            data: {
              postId: post.id,
              userId,
              catId: cat.id,
              name,
            },
          });
        }
      }

      // Same transaction as the create - a crash between the two would otherwise
      // leave the post stuck isPendingScreening forever with no Job to reclaim it
      await enqueueJob(tx, 'SCREEN_CONTENT', {
        targetType: 'POST',
        targetId: post.id,
        authorId: userId,
        text: `${title}\n\n${message}`,
        imageKeys: mediaKeys,
      });

      return post;
    });

    // Optimistic refresh signal - the processor emits its own post-commit posts:changed later
    getIo().emit('posts:changed');
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

    // This screens post edits when they're submitted
    if (
      isLocal
      && (zipCode === undefined || zipCode === null || zipCode === '')
    ) {
      return res
        .status(400)
        .json({ error: 'zipCode is required when isLocal is true.' });
    }

    const parsedRadius = isLocal ? Number(radiusMiles) : null;

    if (isLocal && !Number.isFinite(parsedRadius)) {
      return res
        .status(400)
        .json({ error: 'radiusMiles must be a number when isLocal is true.' });
    }

    try {
      await prisma.$transaction(async (tx) => {
        const { count } = await tx.post.updateMany({
          where: getOwnedOpenPostWhere(req),
          data: {
            title,
            message,
            isLocal,
            zipCode: isLocal ? String(zipCode) : null,
            radiusMiles: parsedRadius,
            ...(title || message ? { isPendingScreening: true } : {}),
          },
        });

        // Can't `return res.status(...)` from inside a transaction - signal via throw
        if (!count) throw new PostNotFoundForUpdate();

        if (title || message) {
          await enqueueJob(tx, 'SCREEN_CONTENT', {
            targetType: 'POST',
            targetId: Number(req.params.id),
            authorId: getUserId(req),
            text: `${title}\n\n${message}`,
          });
        }
      });
    } catch (err) {
      if (err instanceof PostNotFoundForUpdate) {
        return res
          .status(404)
          .json({ error: 'Post not found to PATCH as update.' });
      }
      throw err; // Falls through to the route's own outer catch
    }

    getIo().emit('posts:changed');
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

    if (!count) {
      return res.status(404).json({ error: 'Post not found to DELETE.' });
    }
    getIo().emit('posts:changed');
    return res.sendStatus(200);
  } catch (error) {
    console.error('Failed to DELETE post:', error);
    return res.status(500).json({ error: 'Unable to delete post.' });
  }
});

export default posts;
