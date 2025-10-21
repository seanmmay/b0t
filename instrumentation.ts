/**
 * Next.js Instrumentation File
 *
 * This file is used to run code when the server starts.
 * Perfect for initializing scheduled jobs.
 *
 * Automatically chooses between:
 * - BullMQ (persistent jobs) if REDIS_URL is set
 * - node-cron (simple scheduler) if Redis is not available
 *
 * Note: This only runs in production or when NODE_ENV is set to 'production'
 * For development, you need to enable it in next.config.ts
 */

export async function register() {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeScheduler } = await import('./src/lib/jobs');
    const { logger } = await import('./src/lib/logger');

    logger.info('Initializing scheduler from instrumentation');
    await initializeScheduler();
  }
}
