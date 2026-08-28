import { prisma } from '../db/index.js';
import { JobType, ReportStatus } from '../db/generated/enums.js';
import { processSendNotification } from './notifications.js';
import { processScreenContent } from './screening.js';
import type { ScreenContentPayload } from './screening.js';
import { fileSystemReport, getSystemUserId } from './moderation.js';

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

// Atomically claims one PENDING, due job of the given type
// FOR UPDATE SKIP LOCKED means no double-processing even with concurrent pollers
async function claimNextJob(type: JobType): Promise<JobRecord | null> {
  const claimed = await prisma.$queryRaw<JobRecord[]>`
  UPDATE "Job" SET status = 'PROCESSING'::"JobStatus", "updatedAt" = now()
  WHERE id = (
    SELECT id FROM "Job"
    WHERE type = ${type}::"JobType" AND status = 'PENDING'::"JobStatus" AND (attempts = 0 OR "nextAttemptAt" <= now())
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
// SCREEN_CONTENT's final failure means infra trouble (DB down, etc), not Gemini
// Route to human review
async function failJob(job: JobRecord, error: string): Promise<void> {
  const attempts = job.attempts + 1;
  if (attempts >= job.maxAttempts) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'FAILED', attempts, lastError: error },
    });
    if (job.type === JobType.SCREEN_CONTENT) {
      const payload = job.payload as ScreenContentPayload;
      const reporterId = await getSystemUserId();
      // Target row stays isPendingScreening: true until a moderator resolves this
      await fileSystemReport({
        db: prisma,
        targetType: payload.targetType,
        targetId: payload.targetId,
        reporterId,
        status: ReportStatus.PENDING,
        resolution: 'Screening pipeline failed after retries - needs manual review',
      });
    }
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
  SCREEN_CONTENT: processScreenContent as JobProcessor,
};

const POLL_INTERVAL_MS = 2000;

async function drainQueue(type: JobType): Promise<void> {
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const job = await claimNextJob(type);
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
  // Reset orphaned PROCESSING rows before polling starts
  prisma.job.updateMany({ where: { status: 'PROCESSING' }, data: { status: 'PENDING' } })
    .catch((err) => console.error('Stuck-job reaper failed', err))
    .finally(() => {
    // Two independent poll loops so a SCREEN_CONTENT burst can't delay SEND_NOTIFICATION
      Object.values(JobType).forEach((type) => {
        setInterval(() => {
          drainQueue(type).catch((err) => console.error(`Job worker poll failed (${type}):`, err));
        }, POLL_INTERVAL_MS);
      });
    });
}
