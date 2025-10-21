import { NextRequest, NextResponse } from 'next/server';
import { db, useSQLite } from '@/lib/db';
import { tweetRepliesTableSQLite, tweetRepliesTablePostgres } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { checkStrictRateLimit } from '@/lib/ratelimit';
import { logger, logApiRequest, logApiError } from '@/lib/logger';

/**
 * Tweet Replies History API
 *
 * Fetches all tweet replies from the database
 *
 * GET /api/twitter/replies
 * Query params:
 *   limit?: number (default 100, max 500)
 *   offset?: number (default 0)
 */

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await checkStrictRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);
    const offset = Number(searchParams.get('offset')) || 0;

    logger.info({ limit, offset }, 'Fetching tweet replies history');

    let replies;

    if (useSQLite) {
      replies = await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>)
        .select()
        .from(tweetRepliesTableSQLite)
        .orderBy(desc(tweetRepliesTableSQLite.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      replies = await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
        .select()
        .from(tweetRepliesTablePostgres)
        .orderBy(desc(tweetRepliesTablePostgres.createdAt))
        .limit(limit)
        .offset(offset);
    }

    // Transform the data for the frontend
    const formattedReplies = replies.map(reply => ({
      id: reply.id,
      originalTweet: {
        id: reply.originalTweetId,
        text: reply.originalTweetText,
        author: reply.originalTweetAuthor,
        authorName: reply.originalTweetAuthorName,
        likes: reply.originalTweetLikes || 0,
        retweets: reply.originalTweetRetweets || 0,
        replies: reply.originalTweetReplies || 0,
        views: reply.originalTweetViews || 0,
      },
      ourReply: {
        text: reply.ourReplyText,
        tweetId: reply.ourReplyTweetId,
      },
      status: reply.status,
      createdAt: reply.createdAt,
      repliedAt: reply.repliedAt,
    }));

    logApiRequest('GET', '/api/twitter/replies', 200);

    return NextResponse.json({
      success: true,
      count: formattedReplies.length,
      replies: formattedReplies,
      pagination: {
        limit,
        offset,
        hasMore: formattedReplies.length === limit,
      },
    });
  } catch (error) {
    logApiError('GET', '/api/twitter/replies', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch reply history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
