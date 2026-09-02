import { prisma } from '../db/index.js';
import { getDownloadUrl } from './s3.js';
import { UserMediaSlot } from '../db/generated/enums.js';

export async function getAvatarUrlMap(
  userIds: number[],
): Promise<Map<number, string | null>> {
  const map = new Map<number, string | null>();
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return map;

  const avatarMedia = await prisma.userMedia.findMany({
    where: { userId: { in: uniqueIds }, slot: UserMediaSlot.AVATAR },
    include: { media: { select: { s3Key: true } } },
  });

  await Promise.all(avatarMedia.map(async (item) => {
    try {
      map.set(item.userId, await getDownloadUrl(item.media.s3Key));
    } catch (err) {
      console.error(`S3 error for avatar of user ${item.userId}:`, err);
      map.set(item.userId, null);
    }
  }));

  return map;
}

export async function withAvatarUrl<T extends { id: number }>(
  user: T,
): Promise<T & { avatarUrl: string | null }>;
export async function withAvatarUrl<T extends { id: number }>(
  users: T[],
): Promise<(T & { avatarUrl: string | null })[]>;
export async function withAvatarUrl<T extends { id: number }>(
  input: T | T[],
): Promise<(T & { avatarUrl: string | null }) | (T & { avatarUrl: string | null })[]> {
  const list = Array.isArray(input) ? input : [input];
  const avatarMap = await getAvatarUrlMap(list.map((u) => u.id));
  const decorated = list.map((u) => ({ ...u, avatarUrl: avatarMap.get(u.id) ?? null }));
  return Array.isArray(input) ? decorated : decorated[0];
}
