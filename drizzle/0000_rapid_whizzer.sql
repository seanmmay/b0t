CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text
);
--> statement-breakpoint
CREATE INDEX `accounts_user_id_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `accounts_provider_idx` ON `accounts` (`provider`);--> statement-breakpoint
CREATE INDEX `accounts_user_provider_idx` ON `accounts` (`user_id`,`provider`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_account_idx` ON `accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE TABLE `ai_responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`prompt` text NOT NULL,
	`response` text NOT NULL,
	`model` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_settings_key_unique` ON `app_settings` (`key`);--> statement-breakpoint
CREATE TABLE `oauth_state` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state` text NOT NULL,
	`code_verifier` text NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_state_state_unique` ON `oauth_state` (`state`);--> statement-breakpoint
CREATE INDEX `oauth_state_user_id_idx` ON `oauth_state` (`user_id`);--> statement-breakpoint
CREATE INDEX `oauth_state_created_at_idx` ON `oauth_state` (`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires`);--> statement-breakpoint
CREATE TABLE `tweet_replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`original_tweet_id` text NOT NULL,
	`original_tweet_text` text NOT NULL,
	`original_tweet_author` text NOT NULL,
	`original_tweet_author_name` text,
	`original_tweet_likes` integer DEFAULT 0,
	`original_tweet_retweets` integer DEFAULT 0,
	`original_tweet_replies` integer DEFAULT 0,
	`original_tweet_views` integer DEFAULT 0,
	`our_reply_text` text NOT NULL,
	`our_reply_tweet_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`replied_at` integer
);
--> statement-breakpoint
CREATE INDEX `tweet_replies_original_tweet_id_idx` ON `tweet_replies` (`original_tweet_id`);--> statement-breakpoint
CREATE INDEX `tweet_replies_status_idx` ON `tweet_replies` (`status`);--> statement-breakpoint
CREATE INDEX `tweet_replies_created_at_idx` ON `tweet_replies` (`created_at`);--> statement-breakpoint
CREATE INDEX `tweet_replies_replied_at_idx` ON `tweet_replies` (`replied_at`);--> statement-breakpoint
CREATE TABLE `tweets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`tweet_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`posted_at` integer
);
--> statement-breakpoint
CREATE INDEX `tweets_status_idx` ON `tweets` (`status`);--> statement-breakpoint
CREATE INDEX `tweets_created_at_idx` ON `tweets` (`created_at`);--> statement-breakpoint
CREATE INDEX `tweets_status_created_at_idx` ON `tweets` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`email_verified` integer,
	`image` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `youtube_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`comment_id` text NOT NULL,
	`video_id` text NOT NULL,
	`parent_id` text,
	`text` text NOT NULL,
	`author_display_name` text,
	`author_channel_id` text,
	`reply_text` text,
	`replied_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_comments_comment_id_unique` ON `youtube_comments` (`comment_id`);--> statement-breakpoint
CREATE INDEX `youtube_comments_video_id_idx` ON `youtube_comments` (`video_id`);--> statement-breakpoint
CREATE INDEX `youtube_comments_status_idx` ON `youtube_comments` (`status`);--> statement-breakpoint
CREATE INDEX `youtube_comments_video_status_idx` ON `youtube_comments` (`video_id`,`status`);--> statement-breakpoint
CREATE TABLE `youtube_videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`video_id` text NOT NULL,
	`title` text,
	`channel_id` text,
	`channel_title` text,
	`description` text,
	`published_at` integer,
	`last_checked` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_videos_video_id_unique` ON `youtube_videos` (`video_id`);--> statement-breakpoint
CREATE INDEX `youtube_videos_channel_id_idx` ON `youtube_videos` (`channel_id`);--> statement-breakpoint
CREATE INDEX `youtube_videos_last_checked_idx` ON `youtube_videos` (`last_checked`);