import { google, youtube_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from './logger';
import { createCircuitBreaker } from './resilience';
import { createRateLimiter } from './rate-limiter';

/**
 * YouTube Data API v3 Client
 *
 * This module provides functions to interact with YouTube API
 * for commenting, replying, and managing video content.
 *
 * Features:
 * - Circuit breaker for API failures
 * - Rate limiting (10,000 quota units/day)
 * - Automatic retries and error handling
 */

// Check if YouTube credentials are set
const hasYouTubeCredentials =
  process.env.YOUTUBE_CLIENT_ID &&
  process.env.YOUTUBE_CLIENT_SECRET &&
  process.env.YOUTUBE_REFRESH_TOKEN;

if (!hasYouTubeCredentials) {
  logger.warn('YouTube API credentials are not fully set. YouTube features will not work.');
}

// Initialize OAuth2 client
let oauth2Client: OAuth2Client | null = null;
let youtubeClient: youtube_v3.Youtube | null = null;

if (hasYouTubeCredentials) {
  oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3003/api/youtube/callback'
  );

  // Set credentials with refresh token
  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });

  // Initialize YouTube API client
  youtubeClient = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });
}

// YouTube API Rate Limiter: 10,000 quota units per day
// Conservative: ~400 requests/day = ~16 requests/hour = 1 request/225 seconds
const youtubeRateLimiter = createRateLimiter({
  maxConcurrent: 1,
  minTime: 3600, // 3.6 seconds between calls = ~1000 calls/hour (very conservative for quota)
  reservoir: 400,
  reservoirRefreshAmount: 400,
  reservoirRefreshInterval: 24 * 60 * 60 * 1000, // 24 hours
  id: 'youtube-api',
});

export { oauth2Client, youtubeClient };

/**
 * Wrapper for YouTube API calls with circuit breaker and rate limiting
 */
function withYouTubeProtection<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  name: string
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  const breaker = createCircuitBreaker(
    async (...args: Parameters<T>) => {
      return await youtubeRateLimiter.schedule(() => fn(...args));
    },
    {
      timeout: 10000, // 10 seconds
      errorThresholdPercentage: 50,
      resetTimeout: 120000, // 2 minutes
      name: `youtube-${name}`,
    }
  );

  return breaker.fire as (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>;
}

/**
 * Get comments for a video (Internal)
 */
async function _getVideoComments(videoId: string, maxResults = 100) {
  if (!youtubeClient) {
    throw new Error('YouTube client is not initialized. Please set YouTube API credentials.');
  }

  const response = await youtubeClient.commentThreads.list({
    part: ['snippet', 'replies'],
    videoId,
    maxResults,
    order: 'time', // Most recent first
  });

  return response.data.items || [];
}

/**
 * Get comments for a video (Protected)
 */
export const getVideoComments = withYouTubeProtection(_getVideoComments, 'get-comments');

/**
 * Reply to a comment
 */
export async function replyToComment(commentId: string, text: string) {
  if (!youtubeClient) {
    throw new Error('YouTube client is not initialized. Please set YouTube API credentials.');
  }

  try {
    const response = await youtubeClient.comments.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          parentId: commentId,
          textOriginal: text,
        },
      },
    });

    return response.data;
  } catch (error) {
    logger.error({ error, commentId, textLength: text.length }, 'Error replying to comment');
    throw error;
  }
}

/**
 * Post a top-level comment on a video
 */
export async function postComment(videoId: string, text: string, channelId: string) {
  if (!youtubeClient) {
    throw new Error('YouTube client is not initialized. Please set YouTube API credentials.');
  }

  try {
    const response = await youtubeClient.commentThreads.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          videoId,
          channelId,
          topLevelComment: {
            snippet: {
              textOriginal: text,
            },
          },
        },
      },
    });

    return response.data;
  } catch (error) {
    logger.error({ error, videoId, channelId, textLength: text.length }, 'Error posting comment');
    throw error;
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string) {
  if (!youtubeClient) {
    throw new Error('YouTube client is not initialized. Please set YouTube API credentials.');
  }

  try {
    await youtubeClient.comments.delete({
      id: commentId,
    });

    return { success: true };
  } catch (error) {
    logger.error({ error, commentId }, 'Error deleting comment');
    throw error;
  }
}

/**
 * Get video details
 */
export async function getVideoDetails(videoId: string) {
  if (!youtubeClient) {
    throw new Error('YouTube client is not initialized. Please set YouTube API credentials.');
  }

  try {
    const response = await youtubeClient.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: [videoId],
    });

    return response.data.items?.[0] || null;
  } catch (error) {
    logger.error({ error, videoId }, 'Error fetching video details');
    throw error;
  }
}

/**
 * Search for videos
 */
export async function searchVideos(query: string, maxResults = 10) {
  if (!youtubeClient) {
    throw new Error('YouTube client is not initialized. Please set YouTube API credentials.');
  }

  try {
    const response = await youtubeClient.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults,
      order: 'relevance',
    });

    return response.data.items || [];
  } catch (error) {
    logger.error({ error, query, maxResults }, 'Error searching videos');
    throw error;
  }
}

/**
 * Get channel details
 */
export async function getChannelDetails(channelId?: string) {
  if (!youtubeClient) {
    throw new Error('YouTube client is not initialized. Please set YouTube API credentials.');
  }

  try {
    const params: youtube_v3.Params$Resource$Channels$List = {
      part: ['snippet', 'statistics', 'contentDetails'],
      ...(channelId ? { id: [channelId] } : { mine: true }),
    };

    const response = await youtubeClient.channels.list(params);

    return response.data.items?.[0] || null;
  } catch (error) {
    logger.error({ error, channelId }, 'Error fetching channel details');
    throw error;
  }
}

/**
 * Mark comment as spam
 */
export async function markCommentAsSpam(commentId: string) {
  if (!youtubeClient) {
    throw new Error('YouTube client is not initialized. Please set YouTube API credentials.');
  }

  try {
    await youtubeClient.comments.markAsSpam({
      id: [commentId],
    });

    return { success: true };
  } catch (error) {
    logger.error({ error, commentId }, 'Error marking comment as spam');
    throw error;
  }
}

/**
 * Set comment moderation status
 */
export async function setCommentModerationStatus(
  commentId: string,
  status: 'heldForReview' | 'published' | 'rejected'
) {
  if (!youtubeClient) {
    throw new Error('YouTube client is not initialized. Please set YouTube API credentials.');
  }

  try {
    await youtubeClient.comments.setModerationStatus({
      id: [commentId],
      moderationStatus: status,
    });

    return { success: true };
  } catch (error) {
    logger.error({ error, commentId, status }, 'Error setting comment moderation status');
    throw error;
  }
}

/**
 * Get comment by ID
 */
export async function getComment(commentId: string) {
  if (!youtubeClient) {
    throw new Error('YouTube client is not initialized. Please set YouTube API credentials.');
  }

  try {
    const response = await youtubeClient.comments.list({
      part: ['snippet'],
      id: [commentId],
    });

    return response.data.items?.[0] || null;
  } catch (error) {
    logger.error({ error, commentId }, 'Error fetching comment');
    throw error;
  }
}

/**
 * Helper to generate OAuth URL for initial setup
 */
export function getYouTubeAuthUrl() {
  if (!oauth2Client) {
    throw new Error('OAuth2 client is not initialized.');
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/youtube',
    ],
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  if (!oauth2Client) {
    throw new Error('OAuth2 client is not initialized.');
  }

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}
