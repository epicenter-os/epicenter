import type { CommandService, ShellCommand } from './types';
import { CommandServiceErr } from './types';

export function createCommandServiceWeb(): CommandService {
	return {
		execute: async (_command: ShellCommand) =>
			CommandServiceErr({
				message: 'Command execution is not supported in web environment',
				cause: undefined,
			}),
		spawn: async (_command: ShellCommand) =>
			CommandServiceErr({
				message: 'Command execution is not supported in web environment',
				cause: undefined,
			}),
	};
}
