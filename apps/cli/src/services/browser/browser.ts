import { $ } from 'bun';
import { Err, Ok, tryAsync } from 'wellcrafted/result';
import type { BrowserService } from './types';
import { BrowserServiceErr } from './types';

export function createBrowserService(): BrowserService {
	return {
		async openUrl(url: string) {
			const { data: openCommand, error: platformError } = getOpenCommand();
			if (platformError) return Err(platformError);

			const { error } = await tryAsync({
				try: async () => {
					if (process.platform === 'win32') {
						await $`cmd /c start "" ${url}`;
					} else {
						await $`${openCommand} ${url}`;
					}
				},
				catch: (error) =>
					BrowserServiceErr({
						message: `Failed to open URL: ${url}`,
						cause: error,
					}),
			});

			if (error) return Err(error);
			return Ok(undefined);
		},
	};
}

/**
 * Get the platform-specific command to open URLs
 */
function getOpenCommand() {
	switch (process.platform) {
		case 'darwin':
			return Ok('open' as const);
		case 'linux':
			return Ok('xdg-open' as const);
		case 'win32':
			return Ok('cmd' as const); // We handle the full command in openUrl
		default:
			return BrowserServiceErr({
				message: `Unsupported platform: ${process.platform}`,
				cause: new Error(`Unsupported platform: ${process.platform}`),
			});
	}
}
