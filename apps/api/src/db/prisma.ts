import { PrismaClient } from '@prisma/client'

// Single PrismaClient across the process. Cached on globalThis so `tsx watch`
// reloads (and test re-imports) don't open a new connection pool each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
