import { randomUUID } from 'crypto';
import { Router } from 'express';
import { getDownloadUrl, getUploadUrl } from '../services/s3.js';

const bugReports = Router();

const MAX_SCREENSHOTS = 5;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const getContactEmails = () => (
  String(process.env.CONTACT_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
);

// for images in bug reports- I made this because previous image logic reqs a login
// with the logic in this file anyone can report a bug- logged in or not
bugReports.post('/presign', async (req, res) => {
  try {
    const filename = String(req.body?.filename ?? '').trim();
    const contentType = String(req.body?.contentType ?? '').trim();

    if (!filename || !contentType) {
      return res.status(400).json({
        error: 'filename and contentType are required.',
      });
    }

    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return res.status(400).json({
        error: 'Only supported screenshot image types are allowed.',
      });
    }

    const safeFilename = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-120);

    const key = `bug-reports/${randomUUID()}-${safeFilename}`;
    const uploadUrl = await getUploadUrl(key, contentType);

    return res.json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error('Failed to presign bug screenshot:', error);
    return res.status(500).json({
      error: 'Unable to generate screenshot upload URL.',
    });
  }
});

bugReports.post('/', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim();
    const details = String(req.body?.details ?? '').trim();
    const screenshotKeys = req.body?.screenshotKeys;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }

    if (!details) {
      return res.status(400).json({ error: 'Bug details are required.' });
    }

    if (details.length > 5000) {
      return res.status(400).json({ error: 'Bug report is too long.' });
    }

    if (
      screenshotKeys !== undefined
      && !Array.isArray(screenshotKeys)
    ) {
      return res.status(400).json({
        error: 'screenshotKeys must be an array.',
      });
    }

    const keys = Array.isArray(screenshotKeys)
      ? screenshotKeys.map(String)
      : [];

    if (keys.length > MAX_SCREENSHOTS) {
      return res.status(400).json({
        error: `A maximum of ${MAX_SCREENSHOTS} screenshots is allowed.`,
      });
    }

    if (keys.some((key) => !key.startsWith('bug-reports/'))) {
      return res.status(400).json({
        error: 'Invalid bug screenshot key.',
      });
    }

    const screenshotUrls = await Promise.all(
      keys.map((key) => getDownloadUrl(key)),
    );

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL;
    const to = getContactEmails();

    if (!apiKey || !from || to.length === 0) {
      console.error('Bug report email environment variables are not configured.');
      return res.status(500).json({
        error: 'Bug reporting email is not configured.',
      });
    }

    const screenshotText = screenshotUrls.length > 0
      ? [
        '',
        'Screenshots:',
        ...screenshotUrls.map((url, index) => `${index + 1}. ${url}`),
      ]
      : [];

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: 'Barta Bug Report',
        text: [
          `Reply Email: ${email}`,
          '',
          details,
          ...screenshotText,
        ].join('\n'),
      }),
    });

    if (!response.ok) {
      console.error('Resend bug report request failed:', await response.text());
      return res.status(502).json({
        error: 'Could not send your bug report.',
      });
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Failed to send bug report:', error);
    return res.status(500).json({
      error: 'Could not send your bug report.',
    });
  }
});

export default bugReports;
