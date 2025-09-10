#!/usr/bin/env bun
/**
 * Cross-platform script to kill cargo/rustc build processes
 * Works on Windows, macOS, and Linux
 */

import { $ } from 'bun';
import { platform } from 'os';

const isWindows = platform() === 'win32';

// ANSI color codes
const colors = {
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	blue: '\x1b[34m',
	reset: '\x1b[0m',
};

console.log(
	`${colors.blue}🔍 Checking for build processes...${colors.reset}\n`,
);

async function findAndKillProcesses() {
	let killed = 0;

	try {
		if (isWindows) {
			// Windows: Use taskkill to terminate processes
			console.log('Platform: Windows\n');

			// Kill cargo.exe
			try {
				await $`taskkill /F /IM cargo.exe 2>nul`.quiet();
				console.log(
					`${colors.green}✓${colors.reset} Killed cargo.exe processes`,
				);
				killed++;
			} catch {
				console.log(
					`${colors.yellow}○${colors.reset} No cargo.exe processes found`,
				);
			}

			// Kill rustc.exe
			try {
				await $`taskkill /F /IM rustc.exe 2>nul`.quiet();
				console.log(
					`${colors.green}✓${colors.reset} Killed rustc.exe processes`,
				);
				killed++;
			} catch {
				console.log(
					`${colors.yellow}○${colors.reset} No rustc.exe processes found`,
				);
			}
		} else {
			// Unix: Use pkill to terminate processes
			console.log(`Platform: ${platform() === 'darwin' ? 'macOS' : 'Linux'}\n`);

			// Kill cargo
			try {
				await $`pkill -f cargo`.quiet();
				console.log(`${colors.green}✓${colors.reset} Killed cargo processes`);
				killed++;
			} catch {
				console.log(
					`${colors.yellow}○${colors.reset} No cargo processes found`,
				);
			}

			// Kill rustc
			try {
				await $`pkill -f rustc`.quiet();
				console.log(`${colors.green}✓${colors.reset} Killed rustc processes`);
				killed++;
			} catch {
				console.log(
					`${colors.yellow}○${colors.reset} No rustc processes found`,
				);
			}
		}

		// Summary
		console.log('\n' + '='.repeat(40));
		if (killed > 0) {
			console.log(
				`${colors.green}✅ Successfully killed ${killed} process type(s)${colors.reset}`,
			);
			console.log(
				`${colors.blue}💡 You can now run 'bun dev' without conflicts${colors.reset}`,
			);
		} else {
			console.log(
				`${colors.yellow}ℹ️  No build processes were running${colors.reset}`,
			);
			console.log(
				`${colors.green}✅ You're clear to run 'bun dev'${colors.reset}`,
			);
		}
	} catch (error) {
		console.error(
			`\n${colors.red}❌ Error while killing processes:${colors.reset}`,
			error.message,
		);
		console.log(
			`${colors.yellow}💡 You may need to run this command with elevated privileges${colors.reset}`,
		);
		process.exit(1);
	}
}

// Run the script
findAndKillProcesses();
