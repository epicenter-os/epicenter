#!/usr/bin/env bun
/**
 * Cross-platform development script with build conflict detection
 * Works on Windows, macOS, and Linux
 */

import { $ } from 'bun';
import { platform } from 'os';

// Platform detection
const isWindows = platform() === 'win32';
const isMacOS = platform() === 'darwin';

// ANSI color codes for better output
const colors = {
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	blue: '\x1b[34m',
	reset: '\x1b[0m',
};

// Parse GPU feature from arguments
const args = process.argv.slice(2);
const featuresIndex = args.indexOf('--features');
const gpuFeature = featuresIndex !== -1 ? args[featuresIndex + 1] : null;

// GPU feature mapping
const gpuConfig = {
	metal: {
		name: 'Metal GPU',
		platform: 'macOS',
		config: '-c src-tauri/tauri.metal.conf.json',
	},
	cuda: { name: 'CUDA GPU', platform: 'Windows/Linux', config: '' },
	vulkan: { name: 'Vulkan GPU', platform: 'All platforms', config: '' },
	hipblas: { name: 'ROCm GPU', platform: 'Linux', config: '' },
};

const gpu = gpuFeature ? gpuConfig[gpuFeature] : null;
const modeText = gpu ? `${gpu.name} (${gpu.platform})` : 'CPU-only';

console.log(
	`${colors.blue}🚀 Starting Whispering development (${modeText})...${colors.reset}`,
);

// Step 1: Check for conflicting build processes
async function checkBuildConflicts() {
	console.log('\n📋 Checking for conflicting build processes...');

	try {
		let processOutput;

		if (isWindows) {
			// Windows: Use tasklist to find processes
			processOutput =
				await $`tasklist /FI "IMAGENAME eq cargo.exe" /FI "IMAGENAME eq rustc.exe" 2>nul`.text();

			// Check if we found any processes (Windows tasklist shows "No tasks" when empty)
			if (
				!processOutput.includes('No tasks') &&
				(processOutput.includes('cargo.exe') ||
					processOutput.includes('rustc.exe'))
			) {
				return true;
			}
		} else {
			// Unix: Use ps to find processes
			processOutput =
				await $`ps aux 2>/dev/null | grep -E "cargo|rustc" | grep -v grep`.text();

			if (processOutput.trim()) {
				return true;
			}
		}

		return false;
	} catch (error) {
		// If checking fails, continue anyway
		console.log('  ℹ️  Could not check for build processes, continuing...');
		return false;
	}
}

// Step 2: Check for GPU configuration issues
async function checkGpuConfig() {
	if (!gpu) return true; // No GPU features, skip checks

	// Platform compatibility checks
	if (gpu.name === 'Metal GPU' && !isMacOS) {
		console.log(
			`\n${colors.yellow}⚠️  Metal is only available on macOS${colors.reset}`,
		);
		console.log(
			`${colors.yellow}💡 Use bun dev:cuda or bun dev:vulkan instead${colors.reset}\n`,
		);
		return false;
	}

	if (gpu.name === 'ROCm GPU' && (isWindows || isMacOS)) {
		console.log(
			`\n${colors.yellow}⚠️  ROCm is only available on Linux${colors.reset}`,
		);
		console.log(
			`${colors.yellow}💡 Use bun dev:cuda or bun dev:vulkan instead${colors.reset}\n`,
		);
		return false;
	}

	// GPU-specific warnings and requirements
	console.log(`\n🎮 GPU Mode: ${gpu.name}`);

	if (gpu.name === 'Metal GPU') {
		console.log(
			`${colors.yellow}💡 Requires macOS 15.5+ and Command Line Tools${colors.reset}`,
		);

		// Metal requires --release flag for proper linking on macOS
		const hasRelease = args.includes('--release');
		if (!hasRelease) {
			console.log(
				`\n${colors.red}❌ Metal builds require --release flag for macOS linking${colors.reset}`,
			);
			console.log(
				`${colors.yellow}💡 Use: bun dev:metal --release${colors.reset}`,
			);
			console.log(
				`${colors.yellow}💡 Debug builds cause linking errors with Metal on macOS${colors.reset}\n`,
			);
			return false;
		}
	} else if (gpu.name === 'CUDA GPU') {
		console.log(
			`${colors.yellow}💡 Requires NVIDIA GPU and CUDA Toolkit${colors.reset}`,
		);
	} else if (gpu.name === 'Vulkan GPU') {
		console.log(
			`${colors.yellow}💡 Requires Vulkan SDK and compatible GPU${colors.reset}`,
		);
	} else if (gpu.name === 'ROCm GPU') {
		console.log(
			`${colors.yellow}💡 Requires AMD GPU and ROCm installation${colors.reset}`,
		);
	}

	return true;
}

// Main execution
async function main() {
	// Check for build conflicts
	const hasConflicts = await checkBuildConflicts();

	if (hasConflicts) {
		console.log(
			`\n${colors.red}❌ Found conflicting build processes!${colors.reset}`,
		);
		console.log(
			`${colors.yellow}   Another cargo/rustc build is already running.${colors.reset}`,
		);
		console.log(
			`${colors.yellow}   This can cause 'Blocking waiting for file lock' errors.${colors.reset}`,
		);
		console.log(`\n${colors.blue}💡 Solutions:${colors.reset}`);
		console.log('   1. Wait for the other build to complete');
		console.log("   2. Run 'bun kill:builds' to stop all build processes");
		console.log('   3. Set FORCE_BUILD=true to ignore this check\n');

		// Check for FORCE_BUILD env var
		if (process.env.FORCE_BUILD === 'true') {
			console.log(
				`${colors.yellow}⚠️  FORCE_BUILD=true - continuing despite conflicts...${colors.reset}\n`,
			);
		} else {
			process.exit(1);
		}
	} else {
		console.log(
			`  ${colors.green}✓${colors.reset} No conflicting builds found`,
		);
	}

	// Check GPU configuration
	const gpuConfigOk = await checkGpuConfig();
	if (!gpuConfigOk) {
		process.exit(1);
	}

	// Run tauri dev with all passed arguments
	console.log(
		`\n${colors.blue}🔧 Starting Tauri dev server...${colors.reset}\n`,
	);

	try {
		// Build tauri dev command with GPU-specific arguments
		let tauriArgs = [];

		// Add GPU-specific config (Metal uses special config file)
		if (gpu?.config) {
			tauriArgs.push(...gpu.config.split(' ').filter(Boolean));
		}

		// All GPU types now use debug by default for consistency
		// Users must explicitly add --release when needed

		// Add feature flag
		if (gpuFeature) {
			tauriArgs.push('--features', gpuFeature);
		}

		// Add any additional arguments passed to the script (excluding --features which we handled)
		const filteredArgs = args.filter((arg, index) => {
			if (arg === '--features') return false;
			if (args[index - 1] === '--features') return false;
			return true;
		});
		tauriArgs.push(...filteredArgs);

		console.log(
			`${colors.blue}Running: bun tauri dev ${tauriArgs.join(' ')}${colors.reset}\n`,
		);

		// Use spawn to get real-time output streaming
		const proc = Bun.spawn(['bun', 'tauri', 'dev', ...tauriArgs], {
			stdout: 'inherit',
			stderr: 'inherit',
			stdin: 'inherit',
		});

		// Wait for the process to complete
		await proc.exited;

		process.exit(proc.exitCode || 0);
	} catch (error) {
		// Tauri dev was interrupted (Ctrl+C) or failed
		console.error(`${colors.red}Error:${colors.reset}`, error.message);
		process.exit(1);
	}
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
	console.log(
		`\n${colors.yellow}Shutting down development server...${colors.reset}`,
	);
	process.exit(0);
});

// Run the script
main().catch((error) => {
	console.error(`${colors.red}Error:${colors.reset}`, error);
	process.exit(1);
});
