require('dotenv').config({ path: './config/.env' });
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/client');

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
