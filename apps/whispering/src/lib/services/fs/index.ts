import { createFsServiceDesktop } from './desktop';
import { createFsServiceWeb } from './web';

export type { FsService, FsServiceError } from './types';

export const FsServiceLive = window.__TAURI_INTERNALS__
	? createFsServiceDesktop()
	: createFsServiceWeb();
