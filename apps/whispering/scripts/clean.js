#!/usr/bin/env bun
/**
 * Cross-platform clean script for removing build artifacts
 * Works on Windows, macOS, and Linux
 */

import { rmSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { $ } from 'bun';

// ANSI color codes
const colors = {
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	blue: '\x1b[34m',
	reset: '\x1b[0m',
};

// Parse command line arguments
const args = process.argv.slice(2);
const cleanLevel = args[0] || 'basic';

async function cleanBasic() {
	console.log(`${colors.blue}🧹 Cleaning build cache...${colors.reset}\n`);

	// Run cargo clean in src-tauri directory
	try {
		await $`cd src-tauri && cargo clean`.quiet(false);
		console.log(`${colors.green}✓${colors.reset} Cargo clean completed`);
	} catch (error) {
		console.log(
			`${colors.yellow}⚠${colors.reset} Cargo clean failed (may not be a problem)`,
		);
	}

	// Remove target directory
	const targetPath = join('src-tauri', 'target');
	if (existsSync(targetPath)) {
		rmSync(targetPath, { recursive: true, force: true });
		console.log(`${colors.green}✓${colors.reset} Removed target directory`);
	} else {
		console.log(`${colors.yellow}○${colors.reset} Target directory not found`);
	}

	console.log(`\n${colors.green}🧹 Build cache cleared!${colors.reset}`);
}

async function cleanDeep() {
	// First run basic clean
	await cleanBasic();

	console.log(
		`\n${colors.blue}🧹 Deep cleaning cargo cache...${colors.reset}\n`,
	);

	const home = homedir();
	const cargoCachePaths = [
		join(home, '.cargo', 'registry', 'cache'),
		join(home, '.cargo', '.package-cache'),
	];

	for (const cachePath of cargoCachePaths) {
		if (existsSync(cachePath)) {
			try {
				rmSync(cachePath, { recursive: true, force: true });
				console.log(`${colors.green}✓${colors.reset} Removed ${cachePath}`);
			} catch (error) {
				console.log(
					`${colors.red}✗${colors.reset} Failed to remove ${cachePath}: ${error.message}`,
				);
			}
		} else {
			console.log(`${colors.yellow}○${colors.reset} Not found: ${cachePath}`);
		}
	}

	console.log(
		`\n${colors.green}🧹 Deep clean: Global cargo cache cleared!${colors.reset}`,
	);
}

async function cleanFull() {
	// First run deep clean
	await cleanDeep();

	console.log(
		`\n${colors.blue}🧹 Full cleaning cargo sources...${colors.reset}\n`,
	);

	const home = homedir();
	const cargoSrcPath = join(home, '.cargo', 'registry', 'src');

	if (existsSync(cargoSrcPath)) {
		try {
			rmSync(cargoSrcPath, { recursive: true, force: true });
			console.log(`${colors.green}✓${colors.reset} Removed ${cargoSrcPath}`);
		} catch (error) {
			console.log(
				`${colors.red}✗${colors.reset} Failed to remove ${cargoSrcPath}: ${error.message}`,
			);
		}
	} else {
		console.log(`${colors.yellow}○${colors.reset} Cargo sources not found`);
	}

	console.log(
		`\n${colors.green}🧹 Full clean: All cargo sources cleared!${colors.reset}`,
	);
	console.log(
		`${colors.yellow}⚠  Next build will re-download everything.${colors.reset}`,
	);
}

// Main execution
async function main() {
	try {
		switch (cleanLevel) {
			case 'deep':
				await cleanDeep();
				break;
			case 'full':
				await cleanFull();
				break;
			case 'basic':
			default:
				await cleanBasic();
				break;
		}
	} catch (error) {
		console.error(
			`${colors.red}Error during cleaning:${colors.reset}`,
			error.message,
		);
		process.exit(1);
	}
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
	console.log(`\n${colors.yellow}Cleaning interrupted.${colors.reset}`);
	process.exit(0);
});

// Run the script
main();
