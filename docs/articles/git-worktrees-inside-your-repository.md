# Stop Scattering Git Worktrees: Keep Them All Inside Your Repository

Here's what most Git tutorials don't tell you: you don't have to create worktrees as siblings to your main repository. Git doesn't care where you put them, which means you can organize multiple worktrees however you want.

Most people create worktrees like this, scattering them everywhere:

```bash
git worktree add ../myproject-feature-branch feature-branch
git worktree add ../myproject-hotfix hotfix  
git worktree add ../myproject-experiment experiment
```

This creates a messy code directory:

```
/Users/braden/Code/
├── myproject/                 # The actual repo
├── myproject-feature-branch/  # Worktree #1
├── myproject-hotfix/         # Worktree #2  
├── myproject-experiment/     # Worktree #3
├── myproject-pr-review/      # Worktree #4
└── myproject-emergency-fix/  # Worktree #5
```

Which one is the real repository? Good luck remembering. This pattern scaled terribly with multiple projects.

But since Git doesn't care where worktrees live, you can keep them ALL organized inside your repository instead:
```
/Users/you/Code/
└── myproject/                # Main repository
    ├── src/                 # Your actual code
    ├── package.json
    ├── README.md
    └── .worktrees/          # All worktrees contained here
        ├── feature-a/       # Feature branch worktree
        ├── feature-b/       # Another feature worktree  
        ├── hotfix/         # Hotfix worktree
        ├── experiment/     # Experimental worktree
        └── pr-review/      # PR review worktree
```

One clean directory in your code folder instead of six scattered ones. The main repository is obvious, and all the temporary workspaces are neatly contained.

I learned this pattern from Conductor, a Mac app that runs multiple AI coding agents in parallel. Each agent needs its own isolated workspace, so Conductor creates multiple worktrees inside a `.conductor/` directory within your repository. Instead of scattered worktrees cluttering up my code folder, I could keep them all organized in one place. This completely changed how I use worktrees.

## How to Create Organized Worktrees

Now that you know Git doesn't care where worktrees live, here's how to create them inside your repository:

```bash
# Instead of scattering them as siblings
git worktree add ../myproject-feature feature-branch

# Keep them organized inside your repository
git worktree add .worktrees/feature feature-branch
```

Your directory structure becomes:

```
myproject/                    # Main repository
├── src/                     # Your actual code
├── package.json            
├── README.md
└── .worktrees/             # All worktrees contained here
    ├── feature/            # Feature branch worktree
    ├── hotfix/            # Hotfix worktree  
    └── experiment/        # Experimental worktree
```

The dot-prefix (`.worktrees`) hides the directory from most tools, just like `.git`, `.vscode`, and `.github`.

## Why This Pattern Works

**Containment**: Everything related to your project stays inside your project directory. No more scattered worktrees across your file system.

**Clarity**: The main repository is obvious - it's the parent directory. Worktrees are clearly secondary workspaces.

**Tool compatibility**: Most editors, linters, and build tools ignore dot-directories by default. Your worktrees won't interfere with your main development environment.

**Easy cleanup**: Delete `.worktrees/` and all temporary workspaces disappear. No hunting down scattered directories.

**Backup friendly**: When you backup or clone your repository, you can choose to include or exclude the worktrees directory.

## Practical Examples

### Feature Development
```bash
# Start working on a new feature
git worktree add .worktrees/user-auth feature/user-auth
cd .worktrees/user-auth

# Work normally
git add .
git commit -m "feat: add user authentication"
git push origin feature/user-auth

# When done, clean up
cd ../..
git worktree remove .worktrees/user-auth
```

### PR Review
```bash
# Check out a PR for review
git fetch origin pull/123/head:pr-123
git worktree add .worktrees/pr-review pr-123

# Review in isolation
cd .worktrees/pr-review
npm install
npm test

# Clean up when done
cd ../..
git worktree remove .worktrees/pr-review
```

### Parallel Development
```bash
# Work on multiple features simultaneously
git worktree add .worktrees/feature-a feature-a
git worktree add .worktrees/feature-b feature-b  
git worktree add .worktrees/bugfix bugfix-123

# Each terminal can work in a different worktree
# Terminal 1: cd .worktrees/feature-a
# Terminal 2: cd .worktrees/feature-b
# Terminal 3: cd .worktrees/bugfix
```

## Advanced Organization Patterns

### Tool-Specific Directories
Different tools can use their own worktree directories:

```
myproject/
├── .conductor/          # Conductor AI agents
│   ├── agent-1/
│   └── agent-2/
├── .devcontainers/     # Development containers  
│   ├── node-18/
│   └── node-20/
└── .worktrees/         # Manual worktrees
    ├── feature-x/
    └── hotfix-y/
```

### Nested Organization
For complex projects, you can organize worktrees by type:

```bash
# Organize by purpose
git worktree add .worktrees/features/user-auth feature/user-auth
git worktree add .worktrees/features/payments feature/payments
git worktree add .worktrees/hotfixes/security-fix hotfix/security
git worktree add .worktrees/experiments/new-ui experiment/ui-redesign
```

## The Gitignore Consideration

Add your worktrees directory to `.gitignore`:

```gitignore
# Temporary worktrees
.worktrees/
.conductor/
```

This prevents accidentally committing worktree directories to your repository. Worktrees should be local workspace tools, not part of your project history.

## Common Pitfalls and Solutions

**Pitfall**: Creating worktrees for branches that are already checked out elsewhere.
```bash
# This fails if 'main' is checked out in your main repo
git worktree add .worktrees/main-copy main
```

**Solution**: Use specific commits or create new branches:
```bash
# Use a commit hash instead
git worktree add .worktrees/main-copy HEAD~1

# Or create a new branch
git worktree add .worktrees/main-copy -b main-copy main
```

**Pitfall**: Forgetting to clean up worktrees.
```bash
# List all worktrees to see what you have
git worktree list

# Remove unused ones
git worktree remove .worktrees/old-feature
```

**Solution**: Use a naming convention that includes dates or ticket numbers to remember what each worktree is for.

## When to Use This Pattern

This pattern shines when you:
- Work on multiple features simultaneously  
- Frequently switch between branches for different contexts
- Review PRs while keeping your main work intact
- Need isolated environments for testing different configurations
- Want to compare different versions of your code side-by-side
- Use tools that benefit from parallel workspaces (like Conductor)

## The Mental Shift

Once you start thinking of worktrees as "workspace directories that happen to live inside your repository" instead of "sibling repositories," everything changes. Your project becomes self-contained. Your file system stays organized. Your development workflow becomes cleaner.

The next time you need to work on multiple branches, don't scatter worktrees across your file system. Contain them. Organize them. Keep your code directory clean.

Your future self will thank you.

## Quick Reference

```bash
# Create organized worktree
git worktree add .worktrees/feature-name branch-name

# List all worktrees  
git worktree list

# Remove when done
git worktree remove .worktrees/feature-name

# Clean up abandoned worktrees
git worktree prune
```

Remember: Git doesn't care where your worktrees live. You should care about keeping your workspace organized.