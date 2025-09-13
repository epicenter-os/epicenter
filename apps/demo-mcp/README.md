# Demo MCP App

POC for Reddit Adapter. It imports Reddit data into a libSQL file and demonstrates MCP (Model Context Protocol) integration with Claude Code.

## Data Import

Import your Reddit data export:

```bash
bun run apps/demo-mcp/src/cli.ts import reddit --file ./export_username_date.zip
```

This creates a SQLite database at `.data/reddit.db` with your Reddit posts, comments, and other data.

## MCP Integration with Claude Code

Once you have imported your data, you can connect the database to Claude Code for natural language querying.

### Quick Setup

1. **Add the MCP server** to Claude Code:

   ```bash
   claude mcp add turso-reddit -- tursodb ./.data/reddit.db --mcp
   ```

2. **Restart Claude Code** to activate the connection

3. **Start querying** your Reddit data with natural language!

### What You Can Ask Claude Code

Once connected, try these example queries:

#### Database Structure

- "Show me all tables in the database"
- "What's the schema for the posts table?"
- "Describe the structure of the comments table"

#### Data Exploration

- "How many posts do I have in the database?"
- "Show me my most recent 10 posts"
- "Find my posts with the highest scores"
- "What subreddits do I post in most?"

#### Data Analysis

- "What's the average score of my posts?"
- "Which of my posts got the most comments?"
- "Show me my posting activity over time"
- "Find posts I made about specific topics"

### Command Breakdown

```bash
claude mcp add turso-reddit -- tursodb ./.data/reddit.db --mcp
#              ↑             ↑       ↑               ↑
#              |             |       |               |
#              Server name   |       Database path   MCP mode
#                           Separator
```

- **`turso-reddit`** - Name for this MCP server
- **`--`** - Required separator between Claude options and command
- **`tursodb`** - The Turso database CLI
- **`./.data/reddit.db`** - Path to your imported Reddit database
- **`--mcp`** - Enables MCP server mode

### Managing the MCP Server

```bash
# List all configured MCP servers
claude mcp list

# Get details about this server
claude mcp get turso-reddit

# Remove the server
claude mcp remove turso-reddit
```
