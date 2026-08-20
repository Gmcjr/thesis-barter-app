import { prisma } from '../db/index.js';
import type { Prisma } from '../db/generated/client.js';
import type { JobType } from '../db/generated/enums.js';
import type { SendNotificationPayload } from './notifications.js';
import type { ScreenContentPayload } from './screening.js';

export type Db = typeof prisma | Prisma.TransactionClient;

// Maps each JobType to the exact payload shape its processor expects
// enqueueJob is now checked against this instead of accepting any object
interface JobPayloadMap {
  SEND_NOTIFICATION: SendNotificationPayload;
  SCREEN_CONTENT: ScreenContentPayload;
}

// Callers pass their own transaction client when the enqueue must be atomic with a primary write
// Or the top-level prisma client when there's no meaningful primary write to be atomic with
export async function enqueueJob<T extends JobType>(
  db: Db,
  type: T,
  payload: JobPayloadMap[T],
): Promise<void> {
  await db.job.create({
    data: {
      type,
      payload: payload as unknown as Prisma.InputJsonValue,
    },
  });
}
