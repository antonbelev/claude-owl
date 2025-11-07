# Claude Owl 🦉

> A beautiful, open-source desktop UI for managing Claude Code configurations, settings, and features.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Status:** 🚧 Under active development

---

## What is Claude Owl?

Claude Owl is a comprehensive desktop application that makes [Claude Code](https://code.claude.com) more accessible and powerful through an intuitive visual interface. Instead of manually editing JSON and YAML configuration files, Claude Owl provides:

- **Visual Configuration Management** - Edit settings, agents, skills, and more through beautiful UIs
- **Plugin Marketplace Integration** - Discover and install plugins with one click
- **Real-time Session Monitoring** - Watch Claude Code sessions with live logs and metrics
- **Headless Test Runner** - Execute and manage automated tests with CI/CD integration
- **Debugging Tools** - Analyze errors, view logs, and optimize configurations
- **Local-First** - All data stays on your machine, privacy-focused design

## Features

### 🎯 Core Features (v1.0)

- **Dashboard** - Overview of your Claude Code setup with quick actions
- **Settings Editor** - Visual editor for all Claude Code settings with validation
- **Subagents Manager** - Create, edit, and test custom subagents
- **Skills Manager** - Manage agent skills with supporting files
- **Plugins Manager** - Browse, install, and manage plugins from marketplaces
- **Commands Manager** - Create custom slash commands with templates
- **Hooks Manager** - Configure event-driven hooks with security validation
- **MCP Servers** - Manage Model Context Protocol server integrations
- **Session Monitor** - Real-time and historical session viewing with analytics
- **Test Runner** - Execute headless tests and view results

### 🚀 Coming Soon

- **Git Integration** - Version control for configurations
- **Cloud Sync** - Sync settings across devices
- **Team Features** - Shared configurations and libraries
- **AI-Powered Suggestions** - Smart configuration recommendations
- **Mobile Companion** - Monitor sessions on mobile

See the [full feature list](docs/features.md) for details.

## Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Claude Code CLI** ([installation guide](https://code.claude.com/docs/en/quickstart))

### From Source (Development)

```bash
# Clone the repository
git clone https://github.com/yourusername/claude-owl.git
cd claude-owl

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

### Pre-built Binaries (Coming Soon)

Download the latest release for your platform:

- **macOS** - `.dmg` installer (Intel & Apple Silicon)
- **Windows** - `.exe` installer
- **Linux** - `.AppImage`

## Quick Start

1. **Launch Claude Owl** after installation
2. The app will **detect Claude Code** installation automatically
3. **Import existing configurations** from `~/.claude/` or create new ones
4. Start managing your Claude Code setup visually!

## Documentation

- [Architecture Overview](docs/architecture.md) - System design and technical details
- [Development Roadmap](docs/roadmap.md) - Feature timeline and tasks
- [Complete Feature List](docs/features.md) - All planned features
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines

## Development

### Project Structure

```
claude-owl/
├── src/
│   ├── main/           # Electron main process (Node.js)
│   ├── renderer/       # React frontend UI
│   ├── preload/        # Preload scripts (IPC bridge)
│   └── shared/         # Shared code (types, utils)
├── tests/              # Test files
├── docs/               # Documentation
└── public/             # Static assets
```

### Tech Stack

- **Desktop Framework**: Electron
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Components**: shadcn/ui + Tailwind CSS
- **Code Editor**: Monaco Editor
- **Terminal**: xterm.js
- **Testing**: Vitest + Playwright

### Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Lint code
npm run format       # Format code
npm test             # Run all tests
npm run test:unit    # Run unit tests
npm run test:e2e     # Run E2E tests
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute

- 🐛 **Report bugs** - Open an issue with details
- 💡 **Suggest features** - Share your ideas
- 📝 **Improve documentation** - Help others understand
- 🧑‍💻 **Submit code** - Fix bugs or add features
- 🎨 **Design** - Improve UI/UX
- 🧪 **Test** - Help with testing and QA

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/claude-owl.git
cd claude-owl

# Install dependencies
npm install

# Start development server
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Roadmap

### Phase 0: Foundation (Weeks 1-3) ✅ COMPLETED
- [x] Initialize repository structure (TASK-001)
- [x] Configure TypeScript (TASK-002)
- [x] Setup Electron + React + Vite (TASK-003)
- [x] Configure build tooling (TASK-004)
- [x] Setup linting and formatting (TASK-005)
- [x] Initialize testing framework (TASK-006)
- [x] **First Feature**: Claude Code detection on Dashboard (end-to-end)

### Phase 1: Core Infrastructure (Weeks 4-6)
- Backend services (FileSystem, Configuration, CLI)
- IPC communication layer
- Parser utilities

### Phase 2: MVP UI (Weeks 7-10)
- Application shell
- Dashboard
- Settings editor

See the [complete roadmap](docs/roadmap.md) for all phases.

## Architecture

Claude Owl uses a layered architecture:

```
┌─────────────────────────────────────────┐
│         React Frontend (Renderer)       │
│  Components • State • UI Logic          │
└─────────────────────────────────────────┘
                    ↕ IPC
┌─────────────────────────────────────────┐
│      Electron Main Process (Backend)    │
│  Services • File Operations • CLI       │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│         Claude Code CLI & Configs       │
│  ~/.claude/ • .claude/ • claude CLI     │
└─────────────────────────────────────────┘
```

See [architecture.md](docs/architecture.md) for detailed diagrams and design decisions.

## Screenshots

> Coming soon! Screenshots will be added as features are implemented.

## FAQ

### Does Claude Owl replace Claude Code?

No, Claude Owl is a UI companion for Claude Code. It manages configurations and settings but still uses the Claude Code CLI under the hood.

### Is my data safe?

Yes! Claude Owl is completely local-first. All configurations and data stay on your machine. No telemetry is collected unless you explicitly opt-in.

### Can I use Claude Owl with my team?

Yes! Project-level configurations (`.claude/`) can be committed to git and shared with your team. Team features are planned for future releases.

### What platforms are supported?

- macOS (Intel & Apple Silicon)
- Windows 10/11
- Linux (major distributions via AppImage)

### How does Claude Owl handle updates?

Auto-updates will be available for seamless upgrades. You can also disable auto-updates in settings.

## License

Claude Owl is open-source software licensed under the [MIT License](LICENSE).

## Acknowledgments

- Built for the [Claude Code](https://code.claude.com) community
- Inspired by the need for better developer tools
- Special thanks to all contributors

## Support

- 📖 [Documentation](docs/)
- 💬 [Discussions](https://github.com/yourusername/claude-owl/discussions)
- 🐛 [Issue Tracker](https://github.com/yourusername/claude-owl/issues)
- 📧 Email: support@example.com (update with actual email)

---

**Made with ❤️ by the Claude Owl community**

*Empowering developers to harness the full power of Claude Code*
