import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Disable query logging in production for better performance
const logOptions = process.env.NODE_ENV === 'production' 
  ? [] 
  : ['error', 'warn'] as Array<'error' | 'warn'>

// Create Prisma Client
// In development, we use a cached instance to avoid creating too many connections
// If you see errors about missing models after schema changes, restart the dev server
function createPrismaClient() {
  return new PrismaClient({ log: logOptions })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
