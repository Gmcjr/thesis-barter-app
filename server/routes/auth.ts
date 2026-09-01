import { Router } from 'express';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import passport from 'passport';
import { prisma } from '../db/index.js';
import { withAvatarUrl } from '../services/userMedia.js';

const auth = Router();

async function findOrCreateGoogleUser(profile: Profile) {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    throw new Error('Google account has no email');
  }

  const name = profile.displayName;
  if (!name || !name.trim()) {
    throw new Error('Google account has no display name');
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.id }, { email }] },
  });

  if (existing) {
    if (existing.googleId === profile.id) return existing;
    return prisma.user.update({
      where: { id: existing.id },
      data: { googleId: profile.id, name: existing.name ?? name },
    });
  }

  return prisma.user.create({
    data: { googleId: profile.id, email, name },
  });
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser(profile);
        done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user ?? false);
  } catch (err) {
    done(err as Error);
  }
});

auth.get('/login', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account',
}));

auth.get('/redirect/google', passport.authenticate('google', {
  failureRedirect: '/login',
  successRedirect: '/',
}));

auth.get('/check', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({ user: await withAvatarUrl(req.user) });
});

auth.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      next(err);
      return;
    }
    req.session.destroy(() => res.sendStatus(200));
  });
});

export default auth;
