import { scheduler, ScheduledJob } from '../scheduler';
import { exampleEvery5Minutes, exampleHourly, exampleDaily } from './example';
import { generateAndPostTweet, analyzeTrends, generateScheduledContent } from './twitter-ai';
import { replyToTweetsJob } from './twitter-reply';
import { checkAndReplyToYouTubeComments, trackYouTubeVideo, fetchYouTubeCommentsForAnalysis } from './youtube';
import { initializeBullMQJobs, isBullMQAvailable } from './bullmq-jobs';
import { logger } from '../logger';

/**
 * Define all your scheduled jobs here
 *
 * Cron expression examples:
 * - '* /5 * * * *' - Every 5 minutes
 * - '* /10 * * * *' - Every 10 minutes
 * - '* /30 * * * *' - Every 30 minutes
 * - '0 * * * *' - Every hour
 * - '0 0 * * *' - Every day at midnight
 * - '0 9 * * 1-5' - Every weekday at 9:00 AM
 * - '0 0 * * 0' - Every Sunday at midnight
 *
 * Set enabled: false to disable a job
 */
const jobs: ScheduledJob[] = [
  // Example jobs (disabled by default)
  {
    name: 'example-every-5-minutes',
    schedule: '*/5 * * * *', // Every 5 minutes
    task: exampleEvery5Minutes,
    enabled: false, // Set to true to enable this example job
  },
  {
    name: 'example-hourly',
    schedule: '0 * * * *', // Every hour at minute 0
    task: exampleHourly,
    enabled: false, // Set to true to enable this example job
  },
  {
    name: 'example-daily',
    schedule: '0 0 * * *', // Every day at midnight
    task: exampleDaily,
    enabled: false, // Set to true to enable this example job
  },

  // AI + Twitter jobs (disabled by default - enable when ready)
  {
    name: 'generate-scheduled-content',
    schedule: '0 */4 * * *', // Every 4 hours
    task: generateScheduledContent,
    enabled: false, // Enable this to generate tweet drafts every 4 hours
  },
  {
    name: 'analyze-trends',
    schedule: '0 8 * * *', // Every day at 8:00 AM
    task: analyzeTrends,
    enabled: false, // Enable this to analyze trends daily
  },
  {
    name: 'ai-tweet-generation',
    schedule: '0 10 * * *', // Every day at 10:00 AM
    task: generateAndPostTweet,
    enabled: false, // Enable this to generate and post tweets (WARNING: will post to Twitter!)
  },
  {
    name: 'reply-to-tweets',
    schedule: '0 */2 * * *', // Every 2 hours
    task: replyToTweetsJob,
    enabled: false, // Enable this to automatically reply to tweets (WARNING: will post replies to Twitter!)
  },

  // YouTube jobs (disabled by default - enable when ready)
  {
    name: 'check-youtube-comments',
    schedule: '*/30 * * * *', // Every 30 minutes
    task: checkAndReplyToYouTubeComments,
    enabled: false, // Enable this to check and reply to YouTube comments
  },
  {
    name: 'fetch-youtube-comments-analysis',
    schedule: '0 */6 * * *', // Every 6 hours
    task: fetchYouTubeCommentsForAnalysis,
    enabled: false, // Enable this to fetch comments for analysis (no replies)
  },
];

/**
 * Initialize and start all scheduled jobs
 *
 * Uses BullMQ (with Redis) if REDIS_URL is set, otherwise falls back to node-cron.
 * BullMQ provides job persistence across Railway restarts.
 */
export async function initializeScheduler() {
  logger.info('Initializing job scheduler');

  // Try BullMQ first (requires Redis)
  if (isBullMQAvailable()) {
    logger.info('Redis detected - attempting to initialize BullMQ for persistent jobs');
    const bullMQInitialized = await initializeBullMQJobs();

    if (bullMQInitialized) {
      logger.info('BullMQ initialized successfully - jobs will persist across restarts');
      return;
    }

    logger.warn('BullMQ initialization failed - falling back to node-cron');
  } else {
    logger.info('No Redis configured - using node-cron for job scheduling');
    logger.info('To enable persistent jobs: Add Redis in Railway (1 click) and set REDIS_URL');
  }

  // Fallback to node-cron
  jobs.forEach((job) => {
    scheduler.register(job);
  });

  scheduler.start();

  logger.info({ jobCount: scheduler.getJobs().length }, 'Node-cron scheduler started');
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduler() {
  scheduler.stop();
}

// Export individual job functions for manual testing
export {
  exampleEvery5Minutes,
  exampleHourly,
  exampleDaily,
  generateAndPostTweet,
  analyzeTrends,
  generateScheduledContent,
  replyToTweetsJob,
  checkAndReplyToYouTubeComments,
  trackYouTubeVideo,
  fetchYouTubeCommentsForAnalysis,
};
