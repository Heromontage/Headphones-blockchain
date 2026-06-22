import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes('johndoe:randompassword')) {
    // No real DB configured — return a dummy client that throws gracefully
    console.warn('[Prisma] No real DATABASE_URL configured. DB features will be disabled.');
    return null;
  }

  try {
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
  } catch (e) {
    console.error('[Prisma] Failed to initialize client:', e);
    return null;
  }
}

export const prisma = globalForPrisma.prisma ?? (createPrismaClient() as unknown as PrismaClient);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma ?? undefined;
