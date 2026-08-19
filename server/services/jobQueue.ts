import { prisma } from '../db/index.js';
import type { Prisma } from '../db/generated/client.js';
import type { JobType } from '../db/generated/enums.js';

export type Db = typeof prisma | Prisma.TransactionClient;

// Callers pass their own transaction client when the enqueue must be atomic with a primary write
// Or the top-level prisma client when there's no meaningful primary write to be atomic with
export async function enqueueJob(db: Db, type: JobType, payload: object): Promise<void> {
  await db.job.create({
    data: {
      type,
      payload: payload as Prisma.InputJsonValue,
    },
  });
}
