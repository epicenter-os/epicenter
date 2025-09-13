# Accessing Shell Commands in Tauri Apps

When building a Tauri desktop application, you often need to execute command-line tools like `ffmpeg`, `git`, or other system utilities. But here's the thing that took me way too long to realize: GUI applications on macOS and Linux don't inherit the same PATH environment that your terminal has. And on Windows, there's a completely different bug where child processes sometimes can't find executables even when they're in PATH.

This guide shows you how to properly access shell commands in a Tauri v2 app, covering both the security configuration and the PATH fixes needed for reliable command execution.

## The Two-Part Solution

You need to do two things to reliably execute shell commands in Tauri:

1. **Wrap commands with a shell interpreter** (`sh -c` on Unix, `cmd /c` on Windows)
2. **Fix the PATH environment** so GUI apps can find command-line tools

Let's dive into each.

## Part 1: Shell Wrapping and Security Configuration

### Why Shell Wrapping?

When you want to run a command like `ffmpeg -f avfoundation -list_devices true -i ""`, you can't just execute `ffmpeg` directly. You need a shell to:
- Resolve the command from PATH
- Handle command-line arguments properly
- Support shell features like pipes, redirects, and wildcards

### The Command Service Pattern

Instead of using Tauri's `Command` API directly everywhere, create a command service that handles platform differences:

```typescript
// src/lib/services/command/types.ts
export type CommandService = {
  /**
   * Execute a shell command and return the output.
   * 
   * The command is automatically wrapped with the appropriate shell for the platform:
   * - Windows: `cmd /c <command>`
   * - Unix/macOS: `sh -c <command>`
   * 
   * This allows commands to use shell features like pipes, redirects, and PATH resolution.
   */
  execute: (command: ShellCommand) => Promise<Result<ChildProcess<string>, CommandServiceError>>;

  /**
   * Spawn a shell command as a child process.
   * 
   * The command is automatically wrapped with the appropriate shell for the platform:
   * - Windows: `cmd /c <command>`
   * - Unix/macOS: `sh -c <command>`
   * 
   * This allows long-running processes to be spawned and controlled (e.g., FFmpeg recording).
   */
  spawn: (command: ShellCommand) => Promise<Result<Child, CommandServiceError>>;
};
```

```typescript
// src/lib/services/command/desktop.ts
import { IS_WINDOWS } from '$lib/constants/platform';
import { Command } from '@tauri-apps/plugin-shell';

export function createCommandServiceDesktop(): CommandService {
  function createPlatformCommand(command: ShellCommand) {
    return IS_WINDOWS
      ? Command.create('cmd', ['/c', command])
      : Command.create('sh', ['-c', command]);
  }

  return {
    async execute(command) {
      const cmd = createPlatformCommand(command);
      return await cmd.execute();
    },

    async spawn(command) {
      const cmd = createPlatformCommand(command);
      return await cmd.spawn();
    },
  };
}
```

### Tauri Capabilities Configuration

For this to work, you need to configure Tauri's security capabilities to allow shell execution. In `src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "cmd",
          "cmd": "cmd",
          "args": ["/c", { "validator": ".*" }]
        },
        {
          "name": "sh",
          "cmd": "sh",
          "args": ["-c", { "validator": ".*" }]
        }
      ]
    },
    {
      "identifier": "shell:allow-spawn",
      "allow": [
        {
          "name": "cmd",
          "cmd": "cmd",
          "args": ["/c", { "validator": ".*" }]
        },
        {
          "name": "sh",
          "cmd": "sh",
          "args": ["-c", { "validator": ".*" }]
        }
      ]
    }
  ]
}
```

Key points:
- **Both permissions needed**: `shell:allow-execute` for one-shot commands, `shell:allow-spawn` for long-running processes
- **Scoped commands**: Each permission needs its own command definitions
- **Specific args**: We only allow `-c` for sh and `/c` for cmd, followed by any command string

## Part 2: Fixing the PATH Environment

### The Problem

GUI applications launched from the dock/start menu don't inherit your shell's PATH. This means:
- On macOS: Homebrew-installed tools (`/opt/homebrew/bin`) aren't accessible
- On Linux: User-installed tools in `~/.local/bin` or `/usr/local/bin` might be missing
- On Windows: There's a bug where child processes sometimes can't access PATH at all

### The Solution: Path Fixing in lib.rs

In your `src-tauri/src/lib.rs`, fix the PATH before initializing Tauri:

```rust
#[tokio::main]
pub async fn run() {
    // Fix PATH environment for GUI applications on macOS and Linux
    // This ensures commands like ffmpeg installed via Homebrew are accessible
    let _ = fix_path_env::fix();
    
    // Fix Windows PATH inheritance bug
    // This ensures child processes can find ffmpeg on Windows
    fix_windows_path();
    
    // ... rest of Tauri initialization
}
```

### macOS and Linux: fix_path_env

Add to your `Cargo.toml`:
```toml
[dependencies]
fix-path-env = "0.0.0"  # Check for latest version
```

The `fix_path_env::fix()` function:
- Spawns a login shell to get the full PATH
- Updates the current process's PATH environment
- Ensures Homebrew paths (`/opt/homebrew/bin`, `/usr/local/bin`) are included

### Windows: Custom PATH Fix

Windows has a different issue where `Command::new()` sometimes ignores the parent's PATH. Here's the fix:

```rust
// src-tauri/src/windows_path.rs
#[cfg(target_os = "windows")]
pub fn fix_windows_path() {
    use std::env;
    
    // Get current PATH
    if let Ok(path) = env::var("PATH") {
        // Simply re-setting the PATH forces std::process::Command to use it
        env::set_var("PATH", path);
        println!("Windows PATH inheritance fixed");
    }
}

#[cfg(not(target_os = "windows"))]
pub fn fix_windows_path() {
    // No-op on non-Windows platforms
}
```

This weird workaround (getting PATH and immediately setting it back) forces Rust's `std::process::Command` to properly pass PATH to child processes.

## Usage Example: FFmpeg Recording

Here's how it all comes together for executing FFmpeg commands:

```typescript
import { asShellCommand } from '$lib/services/command';

// Enumerate recording devices
const command = asShellCommand(
  IS_MACOS 
    ? 'ffmpeg -f avfoundation -list_devices true -i ""'
    : IS_WINDOWS
    ? 'ffmpeg -list_devices true -f dshow -i dummy'
    : 'arecord -l'
);

const result = await services.command.execute(command);

// Start recording (long-running process)
const recordCommand = asShellCommand(
  `ffmpeg -f ${format} -i ${deviceInput} -acodec pcm_s16le -ar 16000 "${outputPath}"`
);

const child = await services.command.spawn(recordCommand);
// ... later
await child.kill();
```

## Common Pitfalls

1. **Forgetting spawn permissions**: If you only configure `shell:allow-execute`, spawn commands will fail with "Scoped command sh not found"

2. **Not fixing PATH**: Your app works in development (launched from terminal) but fails in production (launched from dock/installer)

3. **Wrong shell flags**: Using incorrect flags like `sh -C` instead of `sh -c` will cause command execution to fail

4. **Platform assumptions**: Always test on all target platforms; PATH and shell behavior varies significantly

## Testing Your Setup

1. **Development**: Launch your app from the terminal to test with full PATH
2. **Production simulation**: Launch your app from Finder/Explorer to test with limited PATH
3. **Command availability**: Test that commands like `ffmpeg --version` work from within your app
4. **Error handling**: Ensure your app gracefully handles missing commands

## Summary

Accessing shell commands in Tauri requires:
1. Wrapping commands with platform-appropriate shells (`sh -c` or `cmd /c`)
2. Configuring Tauri capabilities for both execute and spawn operations
3. Fixing PATH environment for GUI applications on all platforms
4. Creating a command service abstraction to handle platform differences

With this setup, your Tauri app can reliably execute command-line tools regardless of how it's launched or what platform it's running on.