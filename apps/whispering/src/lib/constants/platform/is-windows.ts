import { OsServiceLive } from '$lib/services/os';

export const IS_WINDOWS = OsServiceLive.type() === 'windows';
