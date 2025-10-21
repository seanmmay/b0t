import { logger, logJobStart, logJobComplete } from '../logger';

/**
 * Example scheduled jobs
 *
 * These are examples to demonstrate how to create scheduled tasks.
 * You can modify or remove these based on your needs.
 */

export async function exampleEvery5Minutes() {
  logJobStart('example-every-5-minutes');

  // Add your logic here
  // Examples:
  // - Generate a tweet with AI
  // - Check for mentions on Twitter
  // - Update database
  // - Send notifications

  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });
  logger.info({ timestamp }, 'Example 5-minute job executed');

  logJobComplete('example-every-5-minutes');
}

export async function exampleHourly() {
  logJobStart('example-hourly');

  // Add your logic here
  // Examples:
  // - Post a scheduled tweet
  // - Generate analytics
  // - Clean up old data

  logger.info('Hourly job executed');

  logJobComplete('example-hourly');
}

export async function exampleDaily() {
  logJobStart('example-daily');

  // Add your logic here
  // Examples:
  // - Generate daily summary
  // - Post morning tweet
  // - Backup data

  logger.info('Daily job executed');

  logJobComplete('example-daily');
}
