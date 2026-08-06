import { prisma } from '../db/index.js';

async function main() {
  await prisma.user.upsert({
    where: { email: 'system@internal.local' },
    update: {},
    create: { name: 'Automated Review', email: 'system@internal.local', isSystem: true },
  });
  // eslint-disable-next-line no-console
  console.log('System user ready.');
}

main();
