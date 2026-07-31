import { Router } from 'express';
import { prisma } from '../db/index';
import requireAuth from '../middleware/requireAuth';
import { buildKey, getUploadUrl } from '../services/s3';

const media = Router();

// POST: ask S3 for upload permission
media.post('/presign', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required.' });
    }

    const key = buildKey(userId, filename);
    const uploadUrl = await getUploadUrl(key, contentType);

    return res.json({ uploadUrl, key });
  } catch (error) {
    console.error('Failed to presign upload:', error);
    return res.status(500).json({ error: 'Unable to generate upload URL.' });
  }
});

// POST: register media key in database after S3 direct upload
media.post('/', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as { id: number }).id;
    // variant will decide if it is the preview or full image
    const { key, variant } = req.body;

    if (!key) return res.status(400).json({ error: 'key is required.' });

    const mediaRow = await prisma.media.create({
      data: {
        s3Key: key,
        uploaderId: userId,
        variant: variant || null,
      },
    });

    return res.status(201).json(mediaRow);
  } catch (error) {
    console.error('Failed to register media:', error);
    return res.status(500).json({ error: 'Unable to register media.' });
  }
});

export default media;
