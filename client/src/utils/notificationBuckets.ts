import type { Notification } from '../context/NotificationContext';

type Bucket = 'Today' | 'This week' | 'Earlier';

const BUCKET_ORDER: Bucket[] = ['Today', 'This week', 'Earlier'];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function bucketFor(createdAt: string): Bucket {
  const created = startOfDay(new Date(createdAt));
  const today = startOfDay(new Date());
  const diffDays = Math.round((today.getTime() - created.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays < 7) return 'This week';
  return 'Earlier';
}

export function groupByBucket(list: Notification[]): { bucket: Bucket; items: Notification[] }[] {
  const map = new Map<Bucket, Notification[]>();
  list.forEach((n) => {
    const bucket = bucketFor(n.createdAt);
    const existing = map.get(bucket) ?? [];
    existing.push(n);
    map.set(bucket, existing);
  });
  return BUCKET_ORDER.filter((bucket) => map.has(bucket))
    .map((bucket) => ({ bucket, items: map.get(bucket) as Notification[] }));
}
