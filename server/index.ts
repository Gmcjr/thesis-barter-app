import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import router from './routes/router.js';

dotenv.config({ path: path.join('config', '.env') });

const app = express();
const port = process.env.PORT || 3000;
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
});

app.use(express.static(path.join(process.cwd(), 'client', 'dist')));
app.use(express.json());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use('/oauth2', router.auth);

app.listen(port, () => console.info(`Listening on http://localhost:${port}`));
