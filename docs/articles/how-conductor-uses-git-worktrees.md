# How Conductor Uses Git Worktrees for Parallel AI Agents

I was exploring Conductor, a Mac app for running multiple coding agents in parallel, when I discovered something fascinating in my repository: a `.conductor/worktrees` directory. At first glance, it looked like a regular project folder. But the `.git` file (not directory) gave it away. This was a Git worktree.

Here's what blew my mind: Conductor stacks each Git worktree right inside the same folder as my code, so they all live together in one organized place. Instead of scattered workspaces cluttering up my file system, every agent's workspace is neatly contained within my project directory.

## The Problem Conductor Solves

Running multiple AI coding agents on the same codebase is tricky. If they're all editing the same files in the same directory, chaos ensues. You could clone the repository multiple times, but that's slow and wastes disk space. A 200MB repository with 10 agents means 2GB of redundant data.

Conductor's solution is elegant: use Git's built-in worktree feature to create lightweight, isolated workspaces that share the same Git object database.

## What I Found in My Repository

When I looked in my Whispering project, I found this structure:

```
/Users/braden/Code/whispering/          # Main repository
└── .conductor/                         # Conductor's directory
    ├── worktrees/                      # Current workspace
    └── app-nap/                        # Another workspace
```

Each subdirectory in `.conductor/` is a Git worktree. Running `git worktree list` revealed the full picture:

```bash
$ git worktree list
/Users/braden/Code/whispering                     671d3820e [feat/vault]
/Users/braden/Code/whispering/.conductor/app-nap  0b2b27316 [app-nap]
/Users/braden/Code/whispering/.conductor/worktrees 0b2b27316 [worktrees]
# ... plus 20+ PR-specific worktrees
```

Each worktree is a complete working directory, but here's the kicker: creating one takes 0.25 seconds and uses only 10MB of disk space. A full clone would take 30+ seconds and 200MB+.

## The Key Innovation: Worktrees Inside the Repository

Here's what makes Conductor's approach brilliant: it puts worktrees INSIDE the main repository. Most developers create worktrees as siblings to their main repo:

```bash
# Traditional approach (clutters your code folder)
/Users/braden/Code/
├── whispering/                    # Main repo
├── whispering-feature-branch/     # Worktree
├── whispering-hotfix/             # Another worktree
└── whispering-experiment/         # Yet another worktree
```

Conductor does this instead:

```bash
# Conductor's approach (organized)
/Users/braden/Code/whispering/     # Main repo
└── .conductor/                    # All worktrees contained here
    ├── worktrees/                 # Current workspace
    └── app-nap/                   # Another workspace
```

Git doesn't care where you put worktrees. They can live anywhere, including inside the repository itself. This simple insight solves the organization problem that plagues most worktree usage.

## Why This Organization Matters

Before discovering this pattern, I used to create worktrees like this:

```bash
git worktree add ../whispering-feature-branch feature-branch
git worktree add ../whispering-hotfix hotfix
```

My code folder became a mess. Every repository spawned multiple sibling directories. Finding the main repo among all the worktrees was annoying.

The `.conductor/` approach changes everything:
- **Contained**: All worktrees live inside the repository they belong to
- **Hidden**: The dot-prefix keeps them out of your way
- **Organized**: Each tool/purpose gets its own subdirectory (`.conductor/`, `.devcontainer/`, etc.)
- **Clean deletion**: Remove `.conductor/` and all worktrees disappear

## Creating a Worktree is Instant

I timed creating a new worktree:

```bash
$ time git worktree add .conductor/test-workspace main
Preparing worktree (checking out 'main')
HEAD is now at f1d4ee29f feat(logos): add new logo variations

real    0m0.256s
user    0m0.040s
sys     0m0.140s
```

Quarter of a second. No network access. No copying 200MB of Git objects. Just checking out the files for that specific branch.

Compare that to cloning:
- Clone: Download everything from scratch (30+ seconds, full bandwidth)
- Worktree: Reference existing objects (0.25 seconds, no network)

## Why This Architecture is Brilliant for AI Agents

Each Conductor agent gets its own worktree, which means:

1. **True isolation**: Agent A can edit `main.py` while Agent B edits the same file on a different branch. No conflicts until you explicitly merge.

2. **Instant workspaces**: Starting a new agent doesn't require waiting for a clone. It's basically free.

3. **Shared history**: All agents see the same commits, branches, and tags. They're working on the same repository, just in different spaces.

4. **Efficient disk usage**: My repository is 207MB. With 10 traditional clones, that's 2GB. With 10 worktrees, it's 207MB + (10 × 10MB) = 307MB.

5. **Clean experiment branches**: Each agent can create experimental branches without polluting your main working directory.

## How Conductor's Organization Actually Works

Here's what blew my mind about Conductor: each of the worktrees is stored very neatly inside the same current project. Instead of scattering worktrees around my file system, everything stays organized within the repository itself. When I looked at my repository structure, I found this:

```
whispering/                    # Main repository  
├── src/                      # My actual code
├── apps/                     
├── packages/                 
├── README.md
└── .conductor/               # Conductor's dedicated namespace
    ├── worktrees/           # Current workspace (what I'm working in now)
    └── app-nap/             # Another workspace for a different task
```

This organizational pattern is genius for several reasons:

**Namespace isolation**: Conductor doesn't just throw worktrees anywhere. It creates its own `.conductor/` directory and keeps ALL its workspaces there. This means:
- Conductor's workspaces never interfere with my main project structure
- I can have multiple Conductor sessions without confusion
- Other tools could use the same pattern (`.devcontainer/workspaces/`, `.docker/environments/`, etc.)

**Descriptive naming**: Each workspace has a meaningful name (`worktrees`, `app-nap`) that tells me what task it's for. Much better than generic names like `workspace-1`.

**Clean separation**: My main repository stays clean. All the temporary AI agent work happens in its own contained area.

## The Implementation Details  

When I start a new Conductor session, here's what actually happens:

```bash  
# Conductor creates a worktree in its dedicated directory
git worktree add .conductor/new-task-name target-branch

# The agent works exclusively in that directory  
cd .conductor/new-task-name
# Agent system prompt restricts it to this directory only
# ... agent makes changes, commits, pushes ...

# When done, Conductor cleans up
git worktree remove .conductor/new-task-name
```

Each agent is sandboxed to its specific worktree. They can't accidentally modify my main working directory or interfere with each other. Multiple agents can run simultaneously, each in their own `.conductor/` subdirectory.

What makes this brilliant is the organizational hierarchy: tool name → task name → isolated workspace. It scales perfectly as I use Conductor for different projects and tasks.

## What This Means for Development

Conductor has essentially turned Git into a lightweight containerization system for code. No Docker overhead. No VM complexity. Just Git doing what Git does best: managing multiple versions of your code simultaneously.

This pattern could work for more than just AI agents. Imagine:
- Running different versions of your app simultaneously for comparison
- Testing multiple PRs in parallel without switching branches
- Having separate workspaces for different features you're developing
- Creating isolated environments for code review

The lesson here: sometimes the best solution isn't a new tool or framework. Sometimes it's creatively using what's already there. Git worktrees have been around since Git 2.5 (2015), but Conductor found a novel way to use them that solves a very modern problem.

Next time you need isolated workspaces for any reason, remember: you might not need containers or VMs. You might just need `git worktree add`.

## Try It Yourself

Want to experiment with worktrees? Here's a quick start:

```bash
# Create a worktree for a new feature
git worktree add ../my-feature-workspace feature-branch

# Work in it
cd ../my-feature-workspace
# Make changes, commit, push

# See all your worktrees
git worktree list

# Remove when done
cd ..
git worktree remove my-feature-workspace
```

Once you understand worktrees, Conductor's architecture becomes obvious. It's not magic. It's just Git, used cleverly.