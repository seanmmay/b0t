import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, index as sqliteIndex, uniqueIndex as sqliteUniqueIndex } from 'drizzle-orm/sqlite-core';
import { pgTable, serial, text as pgText, timestamp, varchar, integer as pgInteger, index as pgIndex, uniqueIndex as pgUniqueIndex } from 'drizzle-orm/pg-core';

// For SQLite (development)
export const tweetsTableSQLite = sqliteTable('tweets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  tweetId: text('tweet_id'),
  status: text('status').notNull().default('draft'), // draft, posted, failed
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  postedAt: integer('posted_at', { mode: 'timestamp' }),
}, (table) => ({
  statusIdx: sqliteIndex('tweets_status_idx').on(table.status),
  createdAtIdx: sqliteIndex('tweets_created_at_idx').on(table.createdAt),
  statusCreatedAtIdx: sqliteIndex('tweets_status_created_at_idx').on(table.status, table.createdAt),
}));

export const aiResponsesTableSQLite = sqliteTable('ai_responses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  model: text('model').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// User authentication tables for SQLite
export const usersTableSQLite = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'timestamp' }),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accountsTableSQLite = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  userIdIdx: sqliteIndex('accounts_user_id_idx').on(table.userId),
  providerIdx: sqliteIndex('accounts_provider_idx').on(table.provider),
  userProviderIdx: sqliteIndex('accounts_user_provider_idx').on(table.userId, table.provider),
  providerAccountIdx: sqliteUniqueIndex('accounts_provider_account_idx').on(table.provider, table.providerAccountId),
}));

export const sessionsTableSQLite = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: sqliteIndex('sessions_user_id_idx').on(table.userId),
  expiresIdx: sqliteIndex('sessions_expires_idx').on(table.expires),
}));

export const verificationTokensTableSQLite = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

// YouTube tables for SQLite
export const youtubeVideosTableSQLite = sqliteTable('youtube_videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  videoId: text('video_id').notNull().unique(),
  title: text('title'),
  channelId: text('channel_id'),
  channelTitle: text('channel_title'),
  description: text('description'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  lastChecked: integer('last_checked', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  channelIdIdx: sqliteIndex('youtube_videos_channel_id_idx').on(table.channelId),
  lastCheckedIdx: sqliteIndex('youtube_videos_last_checked_idx').on(table.lastChecked),
}));

export const youtubeCommentsTableSQLite = sqliteTable('youtube_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  commentId: text('comment_id').notNull().unique(),
  videoId: text('video_id').notNull(),
  parentId: text('parent_id'), // For replies
  text: text('text').notNull(),
  authorDisplayName: text('author_display_name'),
  authorChannelId: text('author_channel_id'),
  replyText: text('reply_text'), // Our reply to this comment
  repliedAt: integer('replied_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('pending'), // pending, replied, ignored
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  videoIdIdx: sqliteIndex('youtube_comments_video_id_idx').on(table.videoId),
  statusIdx: sqliteIndex('youtube_comments_status_idx').on(table.status),
  videoStatusIdx: sqliteIndex('youtube_comments_video_status_idx').on(table.videoId, table.status),
}));

// OAuth state table for SQLite (temporary storage during OAuth flow)
export const oauthStateTableSQLite = sqliteTable('oauth_state', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  state: text('state').notNull().unique(),
  codeVerifier: text('code_verifier').notNull(),
  userId: text('user_id').notNull(),
  provider: text('provider').notNull(), // twitter, youtube, instagram
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  userIdIdx: sqliteIndex('oauth_state_user_id_idx').on(table.userId),
  createdAtIdx: sqliteIndex('oauth_state_created_at_idx').on(table.createdAt),
}));

// Tweet replies table for SQLite (tracks our replies to tweets)
export const tweetRepliesTableSQLite = sqliteTable('tweet_replies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  originalTweetId: text('original_tweet_id').notNull(),
  originalTweetText: text('original_tweet_text').notNull(),
  originalTweetAuthor: text('original_tweet_author').notNull(), // username
  originalTweetAuthorName: text('original_tweet_author_name'), // display name
  originalTweetLikes: integer('original_tweet_likes').default(0),
  originalTweetRetweets: integer('original_tweet_retweets').default(0),
  originalTweetReplies: integer('original_tweet_replies').default(0),
  originalTweetViews: integer('original_tweet_views').default(0),
  ourReplyText: text('our_reply_text').notNull(),
  ourReplyTweetId: text('our_reply_tweet_id'), // null if dry-run or failed
  status: text('status').notNull().default('pending'), // pending, posted, failed
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  repliedAt: integer('replied_at', { mode: 'timestamp' }),
}, (table) => ({
  originalTweetIdIdx: sqliteIndex('tweet_replies_original_tweet_id_idx').on(table.originalTweetId),
  statusIdx: sqliteIndex('tweet_replies_status_idx').on(table.status),
  createdAtIdx: sqliteIndex('tweet_replies_created_at_idx').on(table.createdAt),
  repliedAtIdx: sqliteIndex('tweet_replies_replied_at_idx').on(table.repliedAt),
}));

// App settings table for SQLite (stores user preferences and configurations)
export const appSettingsTableSQLite = sqliteTable('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// For PostgreSQL (production)
export const tweetsTablePostgres = pgTable('tweets', {
  id: serial('id').primaryKey(),
  content: pgText('content').notNull(),
  tweetId: varchar('tweet_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  postedAt: timestamp('posted_at'),
}, (table) => ({
  statusIdx: pgIndex('tweets_status_idx').on(table.status),
  createdAtIdx: pgIndex('tweets_created_at_idx').on(table.createdAt),
  statusCreatedAtIdx: pgIndex('tweets_status_created_at_idx').on(table.status, table.createdAt),
}));

export const aiResponsesTablePostgres = pgTable('ai_responses', {
  id: serial('id').primaryKey(),
  prompt: pgText('prompt').notNull(),
  response: pgText('response').notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User authentication tables for PostgreSQL
export const usersTablePostgres = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: pgText('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const accountsTablePostgres = pgTable('accounts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: pgText('refresh_token'),
  access_token: pgText('access_token'),
  expires_at: pgInteger('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: pgText('scope'),
  id_token: pgText('id_token'),
  session_state: pgText('session_state'),
}, (table) => ({
  userIdIdx: pgIndex('accounts_user_id_idx').on(table.userId),
  providerIdx: pgIndex('accounts_provider_idx').on(table.provider),
  userProviderIdx: pgIndex('accounts_user_provider_idx').on(table.userId, table.provider),
  providerAccountIdx: pgUniqueIndex('accounts_provider_account_idx').on(table.provider, table.providerAccountId),
}));

export const sessionsTablePostgres = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  userIdIdx: pgIndex('sessions_user_id_idx').on(table.userId),
  expiresIdx: pgIndex('sessions_expires_idx').on(table.expires),
}));

export const verificationTokensTablePostgres = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// YouTube tables for PostgreSQL
export const youtubeVideosTablePostgres = pgTable('youtube_videos', {
  id: serial('id').primaryKey(),
  videoId: varchar('video_id', { length: 255 }).notNull().unique(),
  title: pgText('title'),
  channelId: varchar('channel_id', { length: 255 }),
  channelTitle: varchar('channel_title', { length: 255 }),
  description: pgText('description'),
  publishedAt: timestamp('published_at'),
  lastChecked: timestamp('last_checked').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  channelIdIdx: pgIndex('youtube_videos_channel_id_idx').on(table.channelId),
  lastCheckedIdx: pgIndex('youtube_videos_last_checked_idx').on(table.lastChecked),
}));

export const youtubeCommentsTablePostgres = pgTable('youtube_comments', {
  id: serial('id').primaryKey(),
  commentId: varchar('comment_id', { length: 255 }).notNull().unique(),
  videoId: varchar('video_id', { length: 255 }).notNull(),
  parentId: varchar('parent_id', { length: 255 }),
  text: pgText('text').notNull(),
  authorDisplayName: varchar('author_display_name', { length: 255 }),
  authorChannelId: varchar('author_channel_id', { length: 255 }),
  replyText: pgText('reply_text'),
  repliedAt: timestamp('replied_at'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  videoIdIdx: pgIndex('youtube_comments_video_id_idx').on(table.videoId),
  statusIdx: pgIndex('youtube_comments_status_idx').on(table.status),
  videoStatusIdx: pgIndex('youtube_comments_video_status_idx').on(table.videoId, table.status),
}));

// OAuth state table for PostgreSQL (temporary storage during OAuth flow)
export const oauthStateTablePostgres = pgTable('oauth_state', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 255 }).notNull().unique(),
  codeVerifier: pgText('code_verifier').notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: pgIndex('oauth_state_user_id_idx').on(table.userId),
  createdAtIdx: pgIndex('oauth_state_created_at_idx').on(table.createdAt),
}));

// Tweet replies table for PostgreSQL (tracks our replies to tweets)
export const tweetRepliesTablePostgres = pgTable('tweet_replies', {
  id: serial('id').primaryKey(),
  originalTweetId: varchar('original_tweet_id', { length: 255 }).notNull(),
  originalTweetText: pgText('original_tweet_text').notNull(),
  originalTweetAuthor: varchar('original_tweet_author', { length: 255 }).notNull(), // username
  originalTweetAuthorName: varchar('original_tweet_author_name', { length: 255 }), // display name
  originalTweetLikes: pgInteger('original_tweet_likes').default(0),
  originalTweetRetweets: pgInteger('original_tweet_retweets').default(0),
  originalTweetReplies: pgInteger('original_tweet_replies').default(0),
  originalTweetViews: pgInteger('original_tweet_views').default(0),
  ourReplyText: pgText('our_reply_text').notNull(),
  ourReplyTweetId: varchar('our_reply_tweet_id', { length: 255 }), // null if dry-run or failed
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, posted, failed
  createdAt: timestamp('created_at').notNull().defaultNow(),
  repliedAt: timestamp('replied_at'),
}, (table) => ({
  originalTweetIdIdx: pgIndex('tweet_replies_original_tweet_id_idx').on(table.originalTweetId),
  statusIdx: pgIndex('tweet_replies_status_idx').on(table.status),
  createdAtIdx: pgIndex('tweet_replies_created_at_idx').on(table.createdAt),
  repliedAtIdx: pgIndex('tweet_replies_replied_at_idx').on(table.repliedAt),
}));

// App settings table for PostgreSQL (stores user preferences and configurations)
export const appSettingsTablePostgres = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: pgText('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Determine which database to use based on environment
const useSQLite = !process.env.DATABASE_URL;

// Export the appropriate tables based on environment
// This will be imported and used throughout the app
export const tweetsTable = useSQLite ? tweetsTableSQLite : tweetsTablePostgres;
export const aiResponsesTable = useSQLite ? aiResponsesTableSQLite : aiResponsesTablePostgres;
export const usersTable = useSQLite ? usersTableSQLite : usersTablePostgres;
export const accountsTable = useSQLite ? accountsTableSQLite : accountsTablePostgres;
export const sessionsTable = useSQLite ? sessionsTableSQLite : sessionsTablePostgres;
export const verificationTokensTable = useSQLite ? verificationTokensTableSQLite : verificationTokensTablePostgres;
export const youtubeVideosTable = useSQLite ? youtubeVideosTableSQLite : youtubeVideosTablePostgres;
export const youtubeCommentsTable = useSQLite ? youtubeCommentsTableSQLite : youtubeCommentsTablePostgres;
export const oauthStateTable = useSQLite ? oauthStateTableSQLite : oauthStateTablePostgres;
export const tweetRepliesTable = useSQLite ? tweetRepliesTableSQLite : tweetRepliesTablePostgres;
export const appSettingsTable = useSQLite ? appSettingsTableSQLite : appSettingsTablePostgres;

export type Tweet = typeof tweetsTableSQLite.$inferSelect;
export type NewTweet = typeof tweetsTableSQLite.$inferInsert;
export type AIResponse = typeof aiResponsesTableSQLite.$inferSelect;
export type NewAIResponse = typeof aiResponsesTableSQLite.$inferInsert;
export type User = typeof usersTableSQLite.$inferSelect;
export type NewUser = typeof usersTableSQLite.$inferInsert;
export type Account = typeof accountsTableSQLite.$inferSelect;
export type NewAccount = typeof accountsTableSQLite.$inferInsert;
export type Session = typeof sessionsTableSQLite.$inferSelect;
export type NewSession = typeof sessionsTableSQLite.$inferInsert;
export type YouTubeVideo = typeof youtubeVideosTableSQLite.$inferSelect;
export type NewYouTubeVideo = typeof youtubeVideosTableSQLite.$inferInsert;
export type YouTubeComment = typeof youtubeCommentsTableSQLite.$inferSelect;
export type NewYouTubeComment = typeof youtubeCommentsTableSQLite.$inferInsert;
export type OAuthState = typeof oauthStateTableSQLite.$inferSelect;
export type NewOAuthState = typeof oauthStateTableSQLite.$inferInsert;
export type TweetReply = typeof tweetRepliesTableSQLite.$inferSelect;
export type NewTweetReply = typeof tweetRepliesTableSQLite.$inferInsert;
export type AppSetting = typeof appSettingsTableSQLite.$inferSelect;
export type NewAppSetting = typeof appSettingsTableSQLite.$inferInsert;
