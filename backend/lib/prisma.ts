import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Handle connection errors
prisma.$on('error', (e: Prisma.LogEvent) => {
  console.error('Prisma Client error:', e);
});

// Handle connection issues
prisma.$on('query', (e: Prisma.QueryEvent) => {
  console.log('Query:', e.query);
  console.log('Params:', e.params);
  console.log('Duration:', `${e.duration}ms`);
});

export default prisma; 