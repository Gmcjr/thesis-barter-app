import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config({ path: './config/.env' });

export default defineConfig({
  schema: './server/db/prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx server/scripts/createSystemUser.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
