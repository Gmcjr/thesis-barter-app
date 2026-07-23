import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../db/index';

dotenv.config({ path: './config/.env' });

const auth = express.Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await prisma.user.upsert({
          where: { googleId: profile.id },
          update: {
            name: profile.displayName,
            email: profile.emails![0].value,
          },
          create: {
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails![0].value,
          },
        });
        done(null, user);
      } catch (err) {
        console.error('Could not deserialize user: ', err);
        return done(err);
      }
    },
  ),
);

passport.serializeUser(async (user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (err) {
    console.error('Could not deserialize user: ', err);
    return done(err, null);
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

auth.get('/check', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ user: null });
  res.json({ user: req.user });
});

export default auth;
