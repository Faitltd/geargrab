/**
 * Prisma Client Configuration
 * 
 * This file sets up the Prisma client with proper connection pooling,
 * error handling, and development/production optimizations.
 */

import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Create a new Prisma client instance with optimized configuration
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: dev 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
}

/**
 * Get or create the Prisma client instance
 * In development, we use a global variable to prevent multiple instances
 * In production, we create a new instance each time
 */
export const prisma = globalThis.__prisma ?? createPrismaClient();

// In development, store the client globally to prevent hot reload issues
if (dev) {
  globalThis.__prisma = prisma;
}

/**
 * Gracefully disconnect from the database
 * Call this when shutting down the application
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute a database transaction safely
 */
export async function executeTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback, {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
    isolationLevel: 'ReadCommitted'
  });
}

// Export types for use in other files
export type { PrismaClient } from '@prisma/client';
export type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
