export const metadata = {
	reddit_posts: {
		id: 'Reddit post id (base36)',
		permalink: 'Full permalink URL to the post',
		date: 'Original timestamp string from export (e.g. 2025-05-18 04:35:32 UTC)',
		created_utc: 'Unix epoch seconds derived from date',
		ip: 'Recorded IP address associated with the post event, if present',
		subreddit: 'Subreddit name where the post was made (e.g. sveltejs)',
		gildings: 'Number of gildings on the post (integer)',
		title: 'Post title text',
		url: 'Post URL target if link post',
		body: 'Self-post body text if present',
	},
	reddit_comments: {
		id: 'Reddit comment id (base36)',
		permalink: 'Full permalink URL to the comment',
		date: 'Original timestamp string from export (e.g. 2025-05-18 04:35:32 UTC)',
		created_utc: 'Unix epoch seconds derived from date',
		ip: 'Recorded IP address associated with the comment event, if present',
		subreddit: 'Subreddit name where the comment was made',
		gildings: 'Number of gildings on the comment (integer)',
		link: 'Permalink URL to the parent post of this comment (CSV “link” field)',
		post_id:
			'Derived base36 id of the parent post when extractable from link/permalink; NULL otherwise',
		parent:
			'CSV “parent” field; thing id of parent post or comment when present',
		body: 'Comment body text',
		media: 'Media info field from CSV when present',
	},
} as const;
