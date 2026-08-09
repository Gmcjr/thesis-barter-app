import { prisma } from '../db/index.js';
import { getIo } from '../middleware/socket.js';
import type { NotificationType } from '../db/generated/enums.js';

export interface SendNotificationPayload {
  userId: number;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  entityType?: string;
  entityId?: number;
}

// Called by the job worker, not by routes directly
// Errors here propagate up to the worker's retry/backoff
export async function processSendNotification(
  payload: SendNotificationPayload,
): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      link: payload.link ?? null,
      entityType: payload.entityType ?? null,
      entityId: payload.entityId ?? null,
    },
  });

  getIo().to(`user:${payload.userId}`).emit('notification:new', notification);
}
