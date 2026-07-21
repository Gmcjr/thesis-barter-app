import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config({ path: './config/.env' });

export default defineConfig({
  schema: './server/db/prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
