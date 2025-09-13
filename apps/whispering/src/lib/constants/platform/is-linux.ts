import { OsServiceLive } from '$lib/services/os';

export const IS_LINUX = OsServiceLive.type() === 'linux';
