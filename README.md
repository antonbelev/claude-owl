# Claude Owl 🦉

> A beautiful, open-source desktop UI for managing Claude Code configurations, settings, and features.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Beta](https://img.shields.io/badge/status-Beta-blue.svg)](#status)

**Status:** 🚀 Beta - Actively developed and tested on macOS (Windows support coming soon)

---

## What is Claude Owl?

Claude Owl is a desktop application for managing [Claude Code](https://code.claude.com) configurations through an intuitive visual interface. Instead of manually editing JSON and YAML configuration files in your text editor or through the Claude Code CLI.

## Current Features (Beta)

For a complete list of features, see [SCREENSHOTS.md](SCREENSHOTS.md) and [CHANGELOG.md](CHANGELOG.md).

![Claude Owl Dashboard](screenshots/claude-owl-dashboard.png)

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
git clone https://github.com/antonbelev/claude-owl.git
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

## Documentation

- [Architecture Overview](docs/architecture.md) - System design and technical details
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines
- [Development Notes](CLAUDE.md) - Development commands and project structure
- [CHANGELOG.md](CHANGELOG.md) - List of changes and updates

## Tech Stack

- **Desktop Framework**: Electron
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest + React Testing Library

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

To get started:

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/claude-owl.git
cd claude-owl

# Install dependencies
npm install

# Start development server
npm run dev:electron
```

## FAQ

### Does Claude Owl replace Claude Code?

No, Claude Owl is a UI companion for Claude Code. It manages configurations visually but still uses the Claude Code CLI under the hood.

### Is my data safe?

Yes! Claude Owl is completely local-first. All configurations and data stay on your machine. No data is sent to external servers, and no telemetry is collected.

### What platforms are currently supported?

- **macOS** (Intel & Apple Silicon) - ✅ 
- **Windows** - In development
- **Linux** - In development

### How can I contribute?

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

Claude Owl is open-source software licensed under the [MIT License](LICENSE).

## Support

- 📖 [Documentation](docs/)
- 💬 [Discussions](https://github.com/yourusername/claude-owl/discussions)
- 🐛 [Issue Tracker](https://github.com/yourusername/claude-owl/issues)

---
