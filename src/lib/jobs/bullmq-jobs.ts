import { createQueue, createWorker, addJob, startAllWorkers } from '../queue';
import { logger } from '../logger';
import { generateAndPostTweet, analyzeTrends, generateScheduledContent } from './twitter-ai';
import { replyToTweetsJob } from './twitter-reply';
import { checkAndReplyToYouTubeComments, fetchYouTubeCommentsForAnalysis } from './youtube';

/**
 * BullMQ Job Setup (Optional - only runs if Redis is configured)
 *
 * This provides persistent job queues that survive Railway restarts.
 * Falls back to node-cron if REDIS_URL is not set.
 *
 * To enable:
 * 1. In Railway: Click "New" → "Database" → "Add Redis"
 * 2. Copy REDIS_URL from Redis service variables
 * 3. Add to your app's environment variables
 */

export const JOBS_QUEUE = 'scheduled-jobs';

/**
 * Initialize BullMQ workers for all scheduled jobs
 */
export async function initializeBullMQJobs() {
  if (!process.env.REDIS_URL) {
    logger.info('REDIS_URL not set - BullMQ jobs disabled, using node-cron instead');
    return false;
  }

  try {
    logger.info('Initializing BullMQ job queue');

    // Create the main jobs queue
    createQueue(JOBS_QUEUE, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000, // 10 seconds initial delay
        },
      },
    });

    // Create worker to process jobs
    createWorker(JOBS_QUEUE, async (job) => {
      logger.info({ jobName: job.name }, 'Processing scheduled job');

      switch (job.name) {
        case 'generate-scheduled-content':
          await generateScheduledContent();
          break;
        case 'analyze-trends':
          await analyzeTrends();
          break;
        case 'ai-tweet-generation':
          await generateAndPostTweet();
          break;
        case 'reply-to-tweets':
          await replyToTweetsJob();
          break;
        case 'check-youtube-comments':
          await checkAndReplyToYouTubeComments();
          break;
        case 'fetch-youtube-comments-analysis':
          await fetchYouTubeCommentsForAnalysis();
          break;
        default:
          logger.warn({ jobName: job.name }, 'Unknown job name');
      }
    });

    // Schedule repeating jobs (these replace the cron schedules)
    // Only add jobs that are commonly enabled

    // Example: Generate content every 4 hours
    await addJob(JOBS_QUEUE, 'generate-scheduled-content', {}, {
      repeat: { pattern: '0 */4 * * *' }, // Every 4 hours
      priority: 2,
    });

    // Example: Reply to tweets every 2 hours
    await addJob(JOBS_QUEUE, 'reply-to-tweets', {}, {
      repeat: { pattern: '0 */2 * * *' }, // Every 2 hours
      priority: 1,
    });

    // Example: Check YouTube comments every 30 minutes
    await addJob(JOBS_QUEUE, 'check-youtube-comments', {}, {
      repeat: { pattern: '*/30 * * * *' }, // Every 30 minutes
      priority: 3,
    });

    // Start all workers
    await startAllWorkers();

    logger.info('BullMQ jobs initialized successfully');
    return true;
  } catch (error) {
    logger.error({ error }, 'Failed to initialize BullMQ jobs - falling back to node-cron');
    return false;
  }
}

/**
 * Check if BullMQ is available
 */
export function isBullMQAvailable(): boolean {
  return !!process.env.REDIS_URL;
}
