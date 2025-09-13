import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db as createDb } from '@repo/db';
import { APPS, APP_URLS, type CloudflareEnv } from '@repo/constants/cloudflare';
import { anonymous } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
import { assistantConfig } from '@repo/db/schema';
import { Err, tryAsync } from 'wellcrafted/result';
import { extractErrorMessage } from 'wellcrafted/error';

export const auth = (env: CloudflareEnv) => {
	const db = createDb(env);
	return betterAuth({
		plugins: [
			anonymous({
				emailDomainName: 'epicenter.so',
				onLinkAccount: async ({ anonymousUser, newUser }) => {
					console.log(
						'Migrating assistant configs from anonymous user to new user',
					);
					const { error } = await tryAsync({
						try: async () => {
							await db
								.update(assistantConfig)
								.set({
									userId: newUser.user.id,
								})
								.where(eq(assistantConfig.userId, anonymousUser.user.id));
						},
						catch: (error) =>
							Err(
								`Failed to migrate assistant configs: ${extractErrorMessage(error)}`,
							),
					});
					if (error) {
						console.error('Error migrating assistant configs:', error);
						return;
					}
					console.log('Assistant configs migrated successfully');
				},
			}),
		],
		basePath: '/auth',
		database: drizzleAdapter(db, { provider: 'pg' }),
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			},
		},
		trustedOrigins: APP_URLS(env),
		baseURL: APPS(env).API.URL,
		advanced: {
			crossSubDomainCookies: {
				enabled: true,
			},
		},
	});
};

export type User = ReturnType<typeof auth>['$Infer']['Session']['user'];
export type Session = ReturnType<typeof auth>['$Infer']['Session']['session'];
