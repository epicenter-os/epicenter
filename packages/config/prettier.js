/**
 * @typedef {import('prettier').Config} Config
 */

/**
 * Shared Prettier configuration for Svelte applications in the Whispering monorepo.
 *
 * This config complements the root-level Biome formatting by providing
 * Svelte-specific formatting rules that Biome doesn't support.
 *
 * @remarks
 * While Biome handles general TypeScript/JavaScript formatting at the root level,
 * Svelte components require specialized formatting through the prettier-plugin-svelte.
 *
 * @type {Config}
 */
export const prettierConfig = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'all',
	printWidth: 80,
	plugins: ['prettier-plugin-svelte'],  // To avoid problems in VS Code, use string instead of imported object directly.
	overrides: [
		{
			files: '*.svelte',
			options: {
				parser: 'svelte',
			},
		},
	],
};
