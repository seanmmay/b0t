import { replyToTweetsWorkflow } from '@/lib/workflows/twitter/reply-to-tweets';
import { logger } from '@/lib/logger';

/**
 * Job: Reply to Tweets
 *
 * Searches for tweets based on a configured search term,
 * selects the hottest + newest tweet from today,
 * generates an AI reply, and posts it.
 *
 * Configuration:
 * - Set TWITTER_REPLY_SEARCH_QUERY in your environment
 * - Optionally set TWITTER_REPLY_SYSTEM_PROMPT for custom AI behavior
 * - Or pass params directly when calling from API
 */

interface ReplyJobParams {
  minimumLikesCount?: number;
  minimumRetweetsCount?: number;
  searchFromToday?: boolean;
  removePostsWithLinks?: boolean;
  removePostsWithMedia?: boolean;
}

export async function replyToTweetsJob(params?: ReplyJobParams) {
  const searchQuery = process.env.TWITTER_REPLY_SEARCH_QUERY;

  if (!searchQuery) {
    logger.warn('⚠️  TWITTER_REPLY_SEARCH_QUERY not set - skipping reply to tweets job');
    return;
  }

  try {
    logger.info('🚀 Starting Reply to Tweets workflow...');
    logger.info({ searchQuery }, `Searching for: "${searchQuery}"`);

    const result = await replyToTweetsWorkflow({
      searchQuery,
      systemPrompt: process.env.TWITTER_REPLY_SYSTEM_PROMPT,
      searchParams: params ? {
        minimumLikesCount: params.minimumLikesCount,
        minimumRetweetsCount: params.minimumRetweetsCount,
        searchFromToday: params.searchFromToday,
        removePostsWithLinks: params.removePostsWithLinks,
        removePostsWithMedia: params.removePostsWithMedia,
      } : undefined,
    });

    logger.info('✅ Reply to Tweets workflow completed successfully');
    logger.info({
      tweetId: result.selectedTweet?.tweet_id,
      replyId: (result.replyResult as { id?: string })?.id,
    });
  } catch (error) {
    logger.error({ error }, '❌ Failed to execute Reply to Tweets workflow');
    throw error;
  }
}
