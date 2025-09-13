import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/**
 * Core content tables
 */
export const reddit_posts = sqliteTable('reddit_posts', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
	date: integer('date', { mode: 'timestamp' }).notNull(),
	created_utc: integer('created_utc', { mode: 'timestamp' }).notNull(),
	ip: text('ip'),
	subreddit: text('subreddit').notNull(),
	gildings: integer('gildings'),
	title: text('title'),
	url: text('url'),
	body: text('body'),
});

export const reddit_post_headers = sqliteTable('reddit_post_headers', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
	date: integer('date', { mode: 'timestamp' }).notNull(),
	ip: text('ip'),
	subreddit: text('subreddit').notNull(),
	gildings: integer('gildings'),
	url: text('url'),
});

export const reddit_comments = sqliteTable('reddit_comments', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
	date: integer('date', { mode: 'timestamp' }).notNull(),
	created_utc: integer('created_utc', { mode: 'timestamp' }).notNull(),
	ip: text('ip'),
	subreddit: text('subreddit').notNull(),
	gildings: integer('gildings'),
	link: text('link').notNull(),
	post_id: text('post_id'),
	parent: text('parent'),
	body: text('body'),
	media: text('media'),
});

export const reddit_comment_headers = sqliteTable('reddit_comment_headers', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
	date: integer('date', { mode: 'timestamp' }).notNull(),
	ip: text('ip'),
	subreddit: text('subreddit').notNull(),
	gildings: integer('gildings'),
	link: text('link').notNull(),
	parent: text('parent'),
});

/**
 * Votes, saves, visibility
 */
export const reddit_post_votes = sqliteTable('reddit_post_votes', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
	direction: text('direction').notNull(), // up/down/none
});

export const reddit_comment_votes = sqliteTable('reddit_comment_votes', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
	direction: text('direction').notNull(),
});

export const reddit_saved_posts = sqliteTable('reddit_saved_posts', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
});

export const reddit_saved_comments = sqliteTable('reddit_saved_comments', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
});

export const reddit_hidden_posts = sqliteTable('reddit_hidden_posts', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
});

/**
 * Messaging
 */
export const reddit_message_headers = sqliteTable('reddit_message_headers', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
	thread_id: text('thread_id'),
	date: integer('date', { mode: 'timestamp' }),
	ip: text('ip'),
	from: text('from'),
	to: text('to'),
});

export const reddit_messages = sqliteTable('reddit_messages', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
	thread_id: text('thread_id'),
	date: integer('date', { mode: 'timestamp' }),
	ip: text('ip'),
	from: text('from'),
	to: text('to'),
	subject: text('subject'),
	body: text('body'),
});

export const reddit_messages_archive_headers = sqliteTable(
	'reddit_messages_archive_headers',
	{
		id: text('id').primaryKey(),
		permalink: text('permalink').notNull(),
		thread_id: text('thread_id'),
		date: integer('date', { mode: 'timestamp' }),
		ip: text('ip'),
		from: text('from'),
		to: text('to'),
	},
);

export const reddit_messages_archive = sqliteTable('reddit_messages_archive', {
	id: text('id').primaryKey(),
	permalink: text('permalink').notNull(),
	thread_id: text('thread_id'),
	date: integer('date', { mode: 'timestamp' }),
	ip: text('ip'),
	from: text('from'),
	to: text('to'),
	subject: text('subject'),
	body: text('body'),
});

/**
 * Chat
 */
export const reddit_chat_history = sqliteTable('reddit_chat_history', {
	message_id: text('message_id').primaryKey(),
	created_at: integer('created_at', { mode: 'timestamp' }),
	updated_at: integer('updated_at', { mode: 'timestamp' }),
	username: text('username'),
	message: text('message'),
	thread_parent_message_id: text('thread_parent_message_id'),
	channel_url: text('channel_url'),
	subreddit: text('subreddit'),
	channel_name: text('channel_name'),
	conversation_type: text('conversation_type'),
});

/**
 * Account settings, prefs, and identity
 */
export const reddit_account_gender = sqliteTable('reddit_account_gender', {
	id: text('id').primaryKey().notNull().default('singleton'),
	account_gender: text('account_gender'),
});

export const reddit_sensitive_ads_preferences = sqliteTable(
	'reddit_sensitive_ads_preferences',
	{
		type: text('type').primaryKey().notNull(),
		preference: text('preference'),
	},
);

export const reddit_birthdate = sqliteTable('reddit_birthdate', {
	// Single-row sentinel key
	id: text('id').primaryKey().notNull().default('singleton'),
	birthdate: integer('birthdate', { mode: 'timestamp' }),
	verified_birthdate: integer('verified_birthdate', { mode: 'timestamp' }),
	verification_state: text('verification_state'),
	verification_method: text('verification_method'),
});

export const reddit_user_preferences = sqliteTable('reddit_user_preferences', {
	preference: text('preference').primaryKey(),
	value: text('value'),
});

export const reddit_linked_identities = sqliteTable(
	'reddit_linked_identities',
	{
		issuer_id: text('issuer_id'),
		subject_id: text('subject_id'),
	},
	(t) => ({
		uq_issuer_subject: uniqueIndex(
			'reddit_linked_identities_issuer_subject_uq',
		).on(t.issuer_id, t.subject_id),
	}),
);

export const reddit_linked_phone_number = sqliteTable(
	'reddit_linked_phone_number',
	{
		phone_number: text('phone_number').primaryKey(),
	},
);

export const reddit_twitter = sqliteTable('reddit_twitter', {
	username: text('username').primaryKey(),
});

/**
 * Moderation, subscriptions, subreddits
 */
export const reddit_approved_submitter_subreddits = sqliteTable(
	'reddit_approved_submitter_subreddits',
	{
		subreddit: text('subreddit').primaryKey(),
	},
);

export const reddit_moderated_subreddits = sqliteTable(
	'reddit_moderated_subreddits',
	{
		subreddit: text('subreddit').primaryKey(),
	},
);

export const reddit_subscribed_subreddits = sqliteTable(
	'reddit_subscribed_subreddits',
	{
		subreddit: text('subreddit').primaryKey(),
	},
);

export const reddit_multireddits = sqliteTable('reddit_multireddits', {
	id: text('id').primaryKey(),
	display_name: text('display_name'),
	date: integer('date', { mode: 'timestamp' }),
	description: text('description'),
	privacy: text('privacy'),
	subreddits: text('subreddits'),
	image_url: text('image_url'),
	is_owner: text('is_owner'),
	favorited: text('favorited'),
	followers: text('followers'),
});

/**
 * Commerce and payouts
 */
export const reddit_purchases = sqliteTable('reddit_purchases', {
	processor: text('processor'),
	transaction_id: text('transaction_id').primaryKey(),
	product: text('product'),
	date: integer('date', { mode: 'timestamp' }),
	cost: text('cost'),
	currency: text('currency'),
	status: text('status'),
});

export const reddit_subscriptions = sqliteTable('reddit_subscriptions', {
	processor: text('processor'),
	subscription_id: text('subscription_id').primaryKey(),
	product: text('product'),
	product_id: text('product_id'),
	product_name: text('product_name'),
	status: text('status'),
	start_date: integer('start_date', { mode: 'timestamp' }),
	end_date: integer('end_date', { mode: 'timestamp' }),
});

export const reddit_payouts = sqliteTable(
	'reddit_payouts',
	{
		payout_amount_usd: text('payout_amount_usd'),
		date: integer('date', { mode: 'timestamp' }),
		payout_id: text('payout_id'),
	},
	(t) => ({
		uq_payout_date: uniqueIndex('reddit_payouts_payout_date_uq').on(
			t.payout_id,
			t.date,
		),
	}),
);

export const reddit_stripe = sqliteTable('reddit_stripe', {
	stripe_account_id: text('stripe_account_id').primaryKey(),
});

/**
 * Misc content and utility
 */
export const reddit_announcements = sqliteTable('reddit_announcements', {
	announcement_id: text('announcement_id').primaryKey(),
	sent_at: integer('sent_at', { mode: 'timestamp' }),
	read_at: integer('read_at', { mode: 'timestamp' }),
	from_id: text('from_id'),
	from_username: text('from_username'),
	subject: text('subject'),
	body: text('body'),
	url: text('url'),
});

export const reddit_drafts = sqliteTable('reddit_drafts', {
	id: text('id').primaryKey(),
	title: text('title'),
	body: text('body'),
	kind: text('kind'),
	created: integer('created', { mode: 'timestamp' }),
	spoiler: text('spoiler'),
	nsfw: text('nsfw'),
	original_content: text('original_content'),
	content_category: text('content_category'),
	flair_id: text('flair_id'),
	flair_text: text('flair_text'),
	send_replies: text('send_replies'),
	subreddit: text('subreddit'),
	is_public_link: text('is_public_link'),
});

export const reddit_friends = sqliteTable('reddit_friends', {
	username: text('username').primaryKey(),
	note: text('note'),
});

export const reddit_gilded_content = sqliteTable(
	'reddit_gilded_content',
	{
		content_link: text('content_link'),
		award: text('award'),
		amount: text('amount'),
		date: integer('date', { mode: 'timestamp' }),
	},
	(t) => ({
		uq_content_award_date: uniqueIndex(
			'reddit_gilded_content_content_award_date_uq',
		).on(t.content_link, t.award, t.date),
	}),
);

export const reddit_gold_received = sqliteTable(
	'reddit_gold_received',
	{
		content_link: text('content_link'),
		gold_received: text('gold_received'),
		gilder_username: text('gilder_username'),
		date: integer('date', { mode: 'timestamp' }),
	},
	(t) => ({
		uq_content_date: uniqueIndex('reddit_gold_received_content_date_uq').on(
			t.content_link,
			t.date,
		),
	}),
);

export const reddit_ip_logs = sqliteTable(
	'reddit_ip_logs',
	{
		date: integer('date', { mode: 'timestamp' }),
		ip: text('ip'),
	},
	(t) => ({
		uq_date_ip: uniqueIndex('reddit_ip_logs_date_ip_uq').on(t.date, t.ip),
	}),
);

export const reddit_persona = sqliteTable('reddit_persona', {
	persona_inquiry_id: text('persona_inquiry_id').primaryKey(),
});

export const reddit_poll_votes = sqliteTable(
	'reddit_poll_votes',
	{
		post_id: text('post_id'),
		user_selection: text('user_selection'),
		text: text('text'),
		image_url: text('image_url'),
		is_prediction: text('is_prediction'),
		stake_amount: text('stake_amount'),
	},
	(t) => ({
		uq_post_user: uniqueIndex('reddit_poll_votes_post_user_uq').on(
			t.post_id,
			t.user_selection,
		),
	}),
);

export const reddit_scheduled_posts = sqliteTable('reddit_scheduled_posts', {
	scheduled_post_id: text('scheduled_post_id').primaryKey(),
	subreddit: text('subreddit'),
	title: text('title'),
	body: text('body'),
	url: text('url'),
	submission_time: integer('submission_time', { mode: 'timestamp' }),
	recurrence: text('recurrence'),
});

export const reddit_statistics = sqliteTable('reddit_statistics', {
	statistic: text('statistic').primaryKey(),
	value: text('value'),
});

export const reddit_checkfile = sqliteTable('reddit_checkfile', {
	filename: text('filename').primaryKey(),
	sha256: text('sha256'),
});
