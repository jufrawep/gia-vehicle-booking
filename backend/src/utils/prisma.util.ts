/**
 * @file  prisma.util.ts
 * @desc  Prisma client singleton with connection handling.
 *
 * Features:
 *   - Single Prisma instance exported for the entire application
 *   - Explicit connection test on startup
 *   - Graceful shutdown on process exit
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle connection errors
prisma.$connect()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;