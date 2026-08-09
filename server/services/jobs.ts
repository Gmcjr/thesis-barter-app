import { prisma } from '../db/index.js';
import type { Prisma } from '../db/generated/client.js';
import type { JobType } from '../db/generated/enums.js';
import { processSendNotification } from './notifications.js';

type Db = typeof prisma | Prisma.TransactionClient;

interface JobRecord {
  id: number;
  type: JobType;
  payload: unknown;
  status: string;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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

// Atomically claims one PENDING, due job
// FOR UPDATE SKIP LOCKED means no double-processing even with concurrent pollers
async function claimNextJob(): Promise<JobRecord | null> {
  const claimed = await prisma.$queryRaw<JobRecord[]>`
  UPDATE "Job" SET status = 'PROCESSING'::"JobStatus", "updatedAt" = now()
  WHERE id = (
    SELECT id FROM "Job"
    WHERE status = 'PENDING'::"JobStatus" AND "nextAttemptAt" <= now()
    ORDER BY "createdAt" ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING id, type, payload, status, attempts, "maxAttempts", "nextAttemptAt", "lastError", "createdAt", "updatedAt"
  `;
  return claimed[0] ?? null;
}

async function completeJob(id: number): Promise<void> {
  await prisma.job.update({ where: { id }, data: { status: 'COMPLETED' } });
}

const BACKOFF_BASE_MS = 2000;

// Retries with linear backoff (2s, 4s, ...) up to maxAttempts, then dead-letters as FAILED
async function failJob(job: JobRecord, error: string): Promise<void> {
  const attempts = job.attempts + 1;
  if (attempts >= job.maxAttempts) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'FAILED', attempts, lastError: error },
    });
    return;
  }
  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: 'PENDING',
      attempts,
      lastError: error,
      nextAttemptAt: new Date(Date.now() + BACKOFF_BASE_MS * attempts),
    },
  });
}

type JobProcessor = (payload: never) => Promise<void>;

const PROCESSORS: Record<JobType, JobProcessor> = {
  SEND_NOTIFICATION: processSendNotification as JobProcessor,
};

const POLL_INTERVAL_MS = 2000;

async function drainQueue(): Promise<void> {
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const job = await claimNextJob();
    if (!job) return;
    try {
      // eslint-disable-next-line no-await-in-loop
      await PROCESSORS[job.type](job.payload as never);
      // eslint-disable-next-line no-await-in-loop
      await completeJob(job.id);
    } catch (err) {
      // eslint-disable-next-line no-await-in-loop
      await failJob(job, err instanceof Error ? err.message : String(err));
    }
  }
}

export function startJobWorker(): void {
  setInterval(() => {
    drainQueue().catch((err) => console.error('Job worker poll failed:', err));
  }, POLL_INTERVAL_MS);
}
