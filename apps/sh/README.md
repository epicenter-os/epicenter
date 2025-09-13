# Epicenter Assistant

A web interface for self-hosted AI coding assistants. Connect to OpenCode servers running locally or tunneled through ngrok. Your code stays on your machine, even with cloud deployment.

## Features

- **Flexible Deployment**: Run fully local or deploy to cloud with tunneled connections
- **Privacy-First**: Your code never leaves your machine, regardless of deployment choice
- **Assistant Management**: Connect to multiple OpenCode servers with custom configurations
- **Session Management**: Create, manage, and navigate between chat sessions
- **Secure Tunneling**: Built-in support for ngrok tunnels with authentication
- **Real-time Status**: Live connection status and assistant information
- **Open Source**: Transparent, auditable code with no tracking

## Getting Started

### Prerequisites

- Node.js 18+ and bun
- Access to one or more OpenCode servers

### Development

1. Install dependencies:

```bash
bun install
```

2. Start the development server:

```bash
bun dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
bun build
```

Preview the production build:

```bash
bun preview
```

## Deployment Options

### Local Development

Run both Epicenter Assistant and OpenCode locally:

```bash
bun dev
```

### Cloud Deployment

Deploy Epicenter Assistant to Cloudflare Pages while keeping OpenCode local:

```bash
bun deploy
```

Use ngrok to tunnel your local OpenCode servers for cloud access. See the [Assistant Setup Guide](docs/assistant-setup-guide.md) for detailed configuration instructions.

## Usage

1. **Add an Assistant**: Navigate to the Assistants page and click "Add Assistant" to configure a connection
2. **Connect**: Use the "Connect" button to establish a connection and view assistant details
3. **Create Sessions**: Navigate to an assistant to create new chat sessions
4. **Start Chatting**: Select a model and mode, then start conversations with your codebase
5. **Manage Settings**: Configure default credentials and connection settings

For detailed setup instructions including ngrok tunneling, see the [Assistant Setup Guide](docs/assistant-setup-guide.md).

<!-- TODO: Update screenshots to reflect new page titles and navigation -->

## Data Storage

All data is stored locally on your machine:

- **Assistant Configurations**: Stored in your browser's localStorage (key: `opencode-assistant-configs`)
- **Session Data**: Managed by OpenCode on your local machine
- **Chat History**: Persisted by OpenCode in your project directory
- **No Cloud Database**: Epicenter Assistant uses no remote storage; all data stays local

This means:

- Your configurations are browser-specific
- Clearing browser data will remove assistant configs (but not your code/chats)
- You can export/import localStorage data for backup
- Complete privacy: no data ever leaves your control

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom component library with shadcn-svelte patterns
- **State Management**: TanStack Query for server state, Svelte stores for client state
- **Deployment**: Cloudflare Pages
- **Type Safety**: TypeScript with OpenAPI code generation

## Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── query/         # API client and query definitions
│   ├── stores/        # Client-side state management
│   └── utils/         # Utility functions
├── routes/            # SvelteKit routes
│   ├── assistants/    # Assistant and session management
│   └── +layout.svelte # App shell and navigation
└── app.html          # HTML template
```
