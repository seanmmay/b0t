import { getVideoComments, getVideoDetails } from '../youtube';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { replyToComment } from '../youtube';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { generateTweet } from '../openai';
import { db, useSQLite } from '../db';
import { youtubeVideosTableSQLite, youtubeCommentsTableSQLite, youtubeVideosTablePostgres, youtubeCommentsTablePostgres } from '../schema';
import { eq, inArray } from 'drizzle-orm';
import { logger } from '../logger';

/**
 * Check for new comments on tracked videos and reply with AI
 */
export async function checkAndReplyToYouTubeComments() {
  logger.info('Starting YouTube comment checking job');

  try {
    // Get all tracked videos from database
    const videos = useSQLite
      ? await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>).select().from(youtubeVideosTableSQLite)
      : await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>).select().from(youtubeVideosTablePostgres);

    if (videos.length === 0) {
      logger.info('No videos being tracked yet');
      return;
    }

    logger.info({ videoCount: videos.length }, 'Checking videos for new comments');

    for (const video of videos) {
      logger.info({ videoId: video.videoId, title: video.title }, 'Checking video for comments');

      // Get comments from YouTube
      const commentThreads = await getVideoComments(video.videoId, 50);

      // Extract all comment IDs for batch query
      const allCommentIds: string[] = [];
      const commentMap = new Map<string, typeof commentThreads[0]>();

      for (const thread of commentThreads) {
        const commentId = thread.snippet?.topLevelComment?.id;
        if (commentId) {
          allCommentIds.push(commentId);
          commentMap.set(commentId, thread);
        }
      }

      // Batch query to check existing comments (fixes N+1 query issue)
      const existingComments = allCommentIds.length > 0
        ? useSQLite
          ? await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>)
              .select({ commentId: youtubeCommentsTableSQLite.commentId })
              .from(youtubeCommentsTableSQLite)
              .where(inArray(youtubeCommentsTableSQLite.commentId, allCommentIds))
          : await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
              .select({ commentId: youtubeCommentsTablePostgres.commentId })
              .from(youtubeCommentsTablePostgres)
              .where(inArray(youtubeCommentsTablePostgres.commentId, allCommentIds))
        : [];

      // Create a Set for O(1) lookup
      const existingCommentIds = new Set(existingComments.map(c => c.commentId));

      // Process only new comments
      for (const thread of commentThreads) {
        const comment = thread.snippet?.topLevelComment?.snippet;
        if (!comment) continue;

        const commentId = thread.snippet?.topLevelComment?.id;
        if (!commentId) continue;

        // Check if we've already seen this comment
        if (existingCommentIds.has(commentId)) {
          // Already processed this comment
          continue;
        }

        logger.info({
          commentId,
          author: comment.authorDisplayName,
          textPreview: comment.textDisplay?.substring(0, 50)
        }, 'New comment found');

        // Save comment to database
        if (useSQLite) {
          await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>).insert(youtubeCommentsTableSQLite).values({
            commentId,
            videoId: video.videoId,
            text: comment.textDisplay || '',
            authorDisplayName: comment.authorDisplayName,
            authorChannelId: comment.authorChannelId?.value,
            status: 'pending',
          });
        } else {
          await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>).insert(youtubeCommentsTablePostgres).values({
            commentId,
            videoId: video.videoId,
            text: comment.textDisplay || '',
            authorDisplayName: comment.authorDisplayName,
            authorChannelId: comment.authorChannelId?.value,
            status: 'pending',
          });
        }

        // Generate AI reply (optional - only enable when ready)
        // Uncomment the following lines to enable automatic replies:
        /*
        const replyText = await generateTweet(
          `Generate a friendly reply to this YouTube comment: "${comment.textDisplay}"`
        );

        // Post the reply
        await replyToComment(commentId, replyText);

        // Update database with reply
        if (useSQLite) {
          await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>).update(youtubeCommentsTableSQLite)
            .set({
              replyText,
              repliedAt: new Date(),
              status: 'replied',
            })
            .where(eq(youtubeCommentsTableSQLite.commentId, commentId));
        } else {
          await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>).update(youtubeCommentsTablePostgres)
            .set({
              replyText,
              repliedAt: new Date(),
              status: 'replied',
            })
            .where(eq(youtubeCommentsTablePostgres.commentId, commentId));
        }

        logger.info({ commentId, replyText }, 'Replied to comment');
        */

        logger.info({ commentId }, 'Saved comment to database (reply disabled by default)');
      }

      // Update last checked timestamp
      if (useSQLite) {
        await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>)
          .update(youtubeVideosTableSQLite)
          .set({ lastChecked: new Date() })
          .where(eq(youtubeVideosTableSQLite.videoId, video.videoId));
      } else {
        await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
          .update(youtubeVideosTablePostgres)
          .set({ lastChecked: new Date() })
          .where(eq(youtubeVideosTablePostgres.videoId, video.videoId));
      }
    }

    logger.info('YouTube comment checking job completed');
  } catch (error) {
    logger.error({ error }, 'Error in YouTube comment checking job');
    throw error;
  }
}

/**
 * Track a new video for comment monitoring
 */
export async function trackYouTubeVideo(videoId: string) {
  logger.info({ videoId }, 'Starting to track video');

  try {
    // Check if already tracking
    const existing = useSQLite
      ? await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>)
          .select()
          .from(youtubeVideosTableSQLite)
          .where(eq(youtubeVideosTableSQLite.videoId, videoId))
      : await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
          .select()
          .from(youtubeVideosTablePostgres)
          .where(eq(youtubeVideosTablePostgres.videoId, videoId));

    if (existing.length > 0) {
      logger.info({ videoId }, 'Already tracking this video');
      return existing[0];
    }

    // Get video details from YouTube
    const videoDetails = await getVideoDetails(videoId);

    if (!videoDetails) {
      throw new Error('Video not found');
    }

    const snippet = videoDetails.snippet;

    // Save to database
    const newVideo = useSQLite
      ? await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>).insert(youtubeVideosTableSQLite).values({
          videoId,
          title: snippet?.title,
          channelId: snippet?.channelId,
          channelTitle: snippet?.channelTitle,
          description: snippet?.description,
          publishedAt: snippet?.publishedAt ? new Date(snippet.publishedAt) : null,
        })
      : await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>).insert(youtubeVideosTablePostgres).values({
          videoId,
          title: snippet?.title,
          channelId: snippet?.channelId,
          channelTitle: snippet?.channelTitle,
          description: snippet?.description,
          publishedAt: snippet?.publishedAt ? new Date(snippet.publishedAt) : null,
        });

    logger.info({ videoId, title: snippet?.title }, 'Now tracking video');
    return newVideo;
  } catch (error) {
    logger.error({ error, videoId }, 'Error tracking video');
    throw error;
  }
}

/**
 * Fetch and save recent comments for analysis (no replies)
 */
export async function fetchYouTubeCommentsForAnalysis() {
  logger.info('Fetching YouTube comments for analysis');

  try {
    const videos = useSQLite
      ? await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>).select().from(youtubeVideosTableSQLite)
      : await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>).select().from(youtubeVideosTablePostgres);

    if (videos.length === 0) {
      logger.info('No videos being tracked');
      return;
    }

    for (const video of videos) {
      const commentThreads = await getVideoComments(video.videoId, 100);

      // Extract all comment IDs for batch query (fixes N+1 query issue)
      const allCommentIds: string[] = [];
      for (const thread of commentThreads) {
        const commentId = thread.snippet?.topLevelComment?.id;
        if (commentId) {
          allCommentIds.push(commentId);
        }
      }

      // Batch query to check existing comments
      const existingComments = allCommentIds.length > 0
        ? useSQLite
          ? await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>)
              .select({ commentId: youtubeCommentsTableSQLite.commentId })
              .from(youtubeCommentsTableSQLite)
              .where(inArray(youtubeCommentsTableSQLite.commentId, allCommentIds))
          : await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
              .select({ commentId: youtubeCommentsTablePostgres.commentId })
              .from(youtubeCommentsTablePostgres)
              .where(inArray(youtubeCommentsTablePostgres.commentId, allCommentIds))
        : [];

      // Create a Set for O(1) lookup
      const existingCommentIds = new Set(existingComments.map(c => c.commentId));

      let newCount = 0;

      for (const thread of commentThreads) {
        const comment = thread.snippet?.topLevelComment?.snippet;
        if (!comment) continue;

        const commentId = thread.snippet?.topLevelComment?.id;
        if (!commentId) continue;

        if (!existingCommentIds.has(commentId)) {
          if (useSQLite) {
            await (db as ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>).insert(youtubeCommentsTableSQLite).values({
              commentId,
              videoId: video.videoId,
              text: comment.textDisplay || '',
              authorDisplayName: comment.authorDisplayName,
              authorChannelId: comment.authorChannelId?.value,
              status: 'pending',
            });
          } else {
            await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>).insert(youtubeCommentsTablePostgres).values({
              commentId,
              videoId: video.videoId,
              text: comment.textDisplay || '',
              authorDisplayName: comment.authorDisplayName,
              authorChannelId: comment.authorChannelId?.value,
              status: 'pending',
            });
          }
          newCount++;
        }
      }

      logger.info({ videoId: video.videoId, title: video.title, newCount }, 'Saved new comments');
    }

    logger.info('Comment analysis fetch completed');
  } catch (error) {
    logger.error({ error }, 'Error fetching comments');
    throw error;
  }
}
