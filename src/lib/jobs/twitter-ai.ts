import { generateTweet } from '../openai';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { postTweet } from '../twitter';
import { db, useSQLite } from '../db';
import { tweetsTableSQLite, tweetsTablePostgres } from '../schema';
import { logger } from '../logger';

/**
 * Generate and optionally post an AI-generated tweet
 */
export async function generateAndPostTweet() {
  logger.info('Starting AI tweet generation job');

  try {
    // Generate tweet content using OpenAI
    const prompt = 'Write an engaging tweet about technology and AI';
    const tweetContent = await generateTweet(prompt);

    logger.info({ contentLength: tweetContent.length, preview: tweetContent.substring(0, 50) }, 'Generated tweet');

    // Save to database
    if (useSQLite) {
      await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>)
        .insert(tweetsTableSQLite)
        .values({
          content: tweetContent,
          status: 'draft',
        });
    } else {
      await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
        .insert(tweetsTablePostgres)
        .values({
          content: tweetContent,
          status: 'draft',
        });
    }

    logger.info('Saved tweet to database as draft');

    // Uncomment the following lines to actually post to Twitter
    // WARNING: This will post to your Twitter account!
    /*
    if (twitterClient) {
      const result = await postTweet(tweetContent);
      logger.info({ tweetId: result.id }, 'Posted tweet');

      // Update database with posted status
      await db.update(tweetsTable)
        .set({
          tweetId: result.id,
          status: 'posted',
          postedAt: new Date(),
        })
        .where(eq(tweetsTable.content, tweetContent));
    }
    */

    logger.info('AI tweet generation job completed');
  } catch (error) {
    logger.error({ error }, 'Error in AI tweet generation job');
    throw error;
  }
}

/**
 * Fetch and analyze recent tweets
 */
export async function analyzeTrends() {
  logger.info('Starting trend analysis job');

  try {
    // This is a placeholder - implement your actual logic
    logger.info('Analyzing Twitter trends');
    logger.info('This would fetch trending topics and analyze them');

    // Example: You could:
    // 1. Search for trending hashtags
    // 2. Analyze sentiment
    // 3. Generate insights with OpenAI
    // 4. Store results in database

    logger.info('Trend analysis job completed');
  } catch (error) {
    logger.error({ error }, 'Error in trend analysis job');
    throw error;
  }
}

/**
 * Scheduled content generation without posting
 */
export async function generateScheduledContent() {
  logger.info('Generating scheduled content');

  try {
    const prompts = [
      'Write a motivational tweet about productivity',
      'Share an interesting fact about AI',
      'Write a thought-provoking question about technology',
    ];

    // Pick a random prompt
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    const content = await generateTweet(randomPrompt);

    logger.info({ contentLength: content.length, preview: content.substring(0, 50) }, 'Generated content');

    // Save to database
    if (useSQLite) {
      await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>)
        .insert(tweetsTableSQLite)
        .values({
          content,
          status: 'draft',
        });
    } else {
      await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
        .insert(tweetsTablePostgres)
        .values({
          content,
          status: 'draft',
        });
    }

    logger.info('Content saved to database for later review');
    logger.info('Content generation job completed');
  } catch (error) {
    logger.error({ error }, 'Error in content generation job');
    throw error;
  }
}
