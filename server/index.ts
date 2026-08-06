import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import http from 'http';
import router from './routes/router.js';
import { initSocket } from './middleware/socket.js';

dotenv.config({ path: path.join('config', '.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
});

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(process.cwd(), 'client', 'dist')));

app.use('/oauth2', router.auth);
app.use('/health', router.health);
app.use('/user', router.user);
app.use('/posts', router.posts);
app.use('/reports', router.reports);
app.use('/appeals', router.appeals);
app.use('/media', router.media);
app.use('/artTradeOffers', router.artTradeOffers);
app.use('/blocks', router.blocks);
app.use('/trades', router.trades);
app.use('/trade-requests', router.tradeRequests);
app.use('/dms', router.dms);
app.use('/reviews', router.reviews);

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client', 'dist', 'index.html'));
});

const httpServer = http.createServer(app);
initSocket(httpServer, sessionMiddleware);

httpServer.listen(port, () => console.info(`Listening on ${process.env.CLIENT_URL}`));
