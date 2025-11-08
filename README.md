# Claude Owl 🦉

> A beautiful, open-source desktop UI for managing Claude Code configurations, settings, and features.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Beta](https://img.shields.io/badge/status-Beta-blue.svg)](#status)

**Status:** 🚀 Beta - Actively developed and tested on macOS

---

## What is Claude Owl?

Claude Owl is a comprehensive desktop application that makes [Claude Code](https://code.claude.com) more accessible and powerful through an intuitive visual interface. Instead of manually editing JSON and YAML configuration files, Claude Owl provides:

- **Visual Configuration Management** - Edit settings, agents, skills, and more through beautiful UIs
- **Plugin Marketplace Integration** - Discover and install plugins with one click
- **Real-time Session Monitoring** - Watch Claude Code sessions with live logs and metrics
- **Headless Test Runner** - Execute and manage automated tests with CI/CD integration
- **Debugging Tools** - Analyze errors, view logs, and optimize configurations
- **Local-First** - All data stays on your machine, privacy-focused design

## Current Features (Beta)

Claude Owl is actively being developed. Currently available features include:

- **Dashboard** - Overview of your Claude Code installation
- **Subagents Manager** - Create, edit, and manage custom subagents
- **Skills Manager** - Browse and manage your agent skills
- **Sessions Monitor** - View and analyze Claude Code sessions
- **Debug Logs** - View detailed debug logs from Claude Code operations
- **Settings & Configuration** - Visual interface for managing Claude Code settings

See [SCREENSHOTS.md](SCREENSHOTS.md) for feature screenshots and [docs/features.md](docs/features.md) for the complete planned feature list.

## Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Claude Code CLI** ([installation guide](https://code.claude.com/docs/en/quickstart))
- **macOS** (currently tested and supported; Windows/Linux support in development)

### Install from Source

Claude Owl is currently in Beta and available for development/testing:

```bash
# Clone the repository
git clone https://github.com/yourusername/claude-owl.git
cd claude-owl

# Install dependencies
npm install

# Run in development mode
npm run dev:electron
```

### Build for Production

```bash
npm run build
npm run package
```

Pre-built binaries for macOS are coming soon.

## Quick Start

1. Clone and install Claude Owl following the instructions above
2. Run `npm run dev:electron` to start the development server
3. Claude Owl will automatically detect your Claude Code installation
4. Start managing your configuration visually!

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
- **Styling**: Tailwind CSS + shadcn/ui
- **Code Editor**: Monaco Editor
- **Terminal**: xterm.js
- **Testing**: Vitest + Playwright + React Testing Library

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

Currently in **Beta** with focus on core feature stability. See the [complete roadmap](docs/roadmap.md) for detailed planning.

**Recent releases:**
- ✅ Phase 0: Foundation & Project Setup
- ✅ Claude Code detection and integration
- ✅ Subagents manager
- ✅ Skills manager
- ✅ Debug logs viewer
- ✅ Sessions monitor

**In progress:**
- Settings editor and validation
- Enhanced configuration management
- Windows/Linux support

**Planned:**
- Plugins marketplace integration
- Commands manager
- Hooks manager with security
- MCP servers management

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

See [SCREENSHOTS.md](SCREENSHOTS.md) for feature screenshots and UI walkthroughs.

## FAQ

### Does Claude Owl replace Claude Code?

No, Claude Owl is a UI companion for Claude Code. It manages configurations visually but still uses the Claude Code CLI under the hood.

### Is my data safe?

Yes! Claude Owl is completely local-first. All configurations and data stay on your machine. No data is sent to external servers, and no telemetry is collected.

### Can I use Claude Owl with my team?

Yes! Project-level configurations (`.claude/`) can be committed to git and shared with your team. Team features are planned for future releases.

### What platforms are currently supported?

- **macOS** (Intel & Apple Silicon) - ✅ Fully tested
- **Windows** - In development
- **Linux** - In development

### How can I contribute?

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

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
