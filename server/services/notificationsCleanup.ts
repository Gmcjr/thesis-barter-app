import { prisma } from '../db/index.js';

const SWEEP_INTERVAL_MS = 60 * 60 * 1000; // Hourly
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days after read

// Deletes read notifications past the retention window
export async function sweepReadNotifications(
  cutoff: Date = new Date(Date.now() - RETENTION_MS),
): Promise<void> {
  await prisma.notification.deleteMany({
    where: { readAt: { lt: cutoff } },
  });
}

export function startNotificationCleanup(): void {
  setInterval(() => {
    sweepReadNotifications().catch((err) => console.error('Notification cleanup sweep failed:', err));
  }, SWEEP_INTERVAL_MS);
}
