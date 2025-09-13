import type { OsType } from '@tauri-apps/plugin-os';
import { createTaggedError } from 'wellcrafted/error';

export const { OsServiceError, OsServiceErr } =
	createTaggedError('OsServiceError');

export type OsService = {
	type: () => Exclude<OsType, 'android' | 'ios'>;
};
