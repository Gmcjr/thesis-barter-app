import { Router } from 'express';

const contact = Router();

const getContactEmails = () => (
  String(process.env.CONTACT_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
);

// handles all of the logic for contacting the Barta devs about feedback and business
contact.post('/', async (req, res) => {
  try {
    const type = String(req.body?.type ?? '').trim().toUpperCase();
    const email = String(req.body?.email ?? '').trim();
    const message = String(req.body?.message ?? '').trim();

    if (type !== 'FEEDBACK' && type !== 'BUSINESS') {
      return res.status(400).json({ error: 'Invalid contact type.' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL;
    const to = getContactEmails();

    if (!apiKey || !from || to.length === 0) {
      console.error('Contact email environment variables are not configured.');
      return res.status(500).json({ error: 'Contact email is not configured.' });
    }

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
        subject: type === 'BUSINESS'
          ? 'Barta Business Contact'
          : 'Barta Feedback',
        text: [
          `Type: ${type}`,
          `Reply Email: ${email}`,
          '',
          message,
        ].join('\n'),
      }),
    });

    if (!response.ok) {
      console.error('Resend contact request failed:', await response.text());
      return res.status(502).json({ error: 'Could not send your message.' });
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Failed to send contact message:', error);
    return res.status(500).json({ error: 'Could not send your message.' });
  }
});

export default contact;
