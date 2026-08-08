import { prisma } from '../db/index.js';
import { getIo } from '../middleware/socket.js';
import type { NotificationType } from '../db/generated/enums.js';

interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  entityType?: string;
  entityId?: number;
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    },
  });

  getIo().to(`user:${input.userId}`).emit('notification:new', notification);

  return notification;
}
