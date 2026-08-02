import { Server } from 'socket.io';
import type { IncomingMessage, Server as HttpServer } from 'http';
import type { RequestHandler } from 'express';
import type { Session, SessionData } from 'express-session';

interface RequestWithSession extends IncomingMessage {
  session: Session & Partial<SessionData> & { passport?: { user?: number } };
}

let ioInstance: Server | undefined;

export function initSocket(httpServer: HttpServer, sessionMiddleware: RequestHandler) {
  ioInstance = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  ioInstance.engine.use(sessionMiddleware);

  ioInstance.on('connection', (socket) => {
    const userId = (socket.request as RequestWithSession).session?.passport?.user;
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });
  return ioInstance;
}

export function getIo(): Server {
  if (!ioInstance) throw new Error('Socket.io has not been initialized yet.');
  return ioInstance;
}
