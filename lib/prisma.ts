import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

// Cache the client in ALL environments (including production) so the
// connection pool is reused across requests instead of reconnecting each time.
globalForPrisma.prisma = prisma

// Eagerly warm up the DB connection so the first request doesn't pay the
// ~500ms cold-connect penalty (especially important for remote DBs like Supabase).
prisma.$connect().catch(() => {});