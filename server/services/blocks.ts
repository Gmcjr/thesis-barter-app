import { prisma } from '../db/index.js';

// For future DM route to gate contact between two users
export async function isBlocked(userA: number, userB: number): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
  });
  return block !== null;
}

// Union of both directions - users blocked + users blocked by
export async function getBlockedRelationshipIds(userId: number): Promise<number[]> {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<number>();
  blocks.forEach((b) => ids.add(b.blockerId === userId ? b.blockedId : b.blockerId));
  return [...ids];
}
