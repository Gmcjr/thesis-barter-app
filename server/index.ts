import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import router from './routes/router.js';
import passport from './auth/passport.js';
import oauth2Router from './routes/oauth2.js';

dotenv.config({ path: path.join('config', '.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.MODE === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/oauth2', oauth2Router);
app.use(express.static(path.join(process.cwd(), 'client', 'dist')));
app.use('/api', router);

app.listen(port, () => console.info(`Listening on http://localhost:${port}`));
