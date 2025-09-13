import type { FsService } from './types';
import { FsServiceErr } from './types';

export function createFsServiceWeb(): FsService {
	return {
		pathToBlob: async () =>
			FsServiceErr({
				message: 'File system access not available in browser',
				cause: undefined,
			}),

		pathToFile: async () =>
			FsServiceErr({
				message: 'File system access not available in browser',
				cause: undefined,
			}),

		pathsToFiles: async () =>
			FsServiceErr({
				message: 'File system access not available in browser',
				cause: undefined,
			}),
	};
}
