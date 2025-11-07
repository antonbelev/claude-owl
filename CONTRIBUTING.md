# Contributing to Claude Owl

Thank you for your interest in contributing to Claude Owl! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/claude-owl.git
   cd claude-owl
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original/claude-owl.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Claude Code CLI (for testing integration features)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## Project Structure

```
claude-owl/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React frontend
│   ├── preload/        # Preload scripts
│   └── shared/         # Shared code (types, utils)
├── tests/              # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/               # Documentation
├── public/             # Static assets
├── assets/             # Application assets
└── scripts/            # Build and utility scripts
```

## Development Workflow

### Creating a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `chore/` - Maintenance tasks

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types; use `unknown` when type is truly unknown
- Use interfaces for object shapes
- Use type aliases for unions/intersections

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Maximum line length: 100 characters
- Use meaningful variable and function names

### React Components

- Use functional components with hooks
- One component per file
- Use TypeScript for prop types
- Prefer composition over inheritance
- Keep components small and focused

Example:
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

### File Naming

- React components: `PascalCase.tsx` (e.g., `SettingsEditor.tsx`)
- Utilities: `camelCase.ts` (e.g., `fileUtils.ts`)
- Types: `camelCase.types.ts` (e.g., `config.types.ts`)
- Tests: `*.test.ts` or `*.test.tsx`

## Testing Guidelines

### Unit Tests

- Write unit tests for utilities and services
- Aim for >80% code coverage
- Use descriptive test names

```typescript
describe('fileUtils', () => {
  describe('parseAgentFile', () => {
    it('should parse valid agent frontmatter', () => {
      // Test implementation
    });

    it('should throw error for invalid YAML', () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

- Test IPC communication between main and renderer
- Test service interactions
- Mock file system and external dependencies

### E2E Tests

- Test critical user flows
- Use Playwright for E2E tests
- Keep tests stable and maintainable

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Maintenance tasks

### Examples

```
feat(settings): add environment variables editor

Implement a visual editor for managing environment variables
in the settings page with validation and import/export.

Closes #123
```

```
fix(agents): correct YAML parsing for frontmatter

Fixed an issue where multi-line descriptions in agent
frontmatter were incorrectly parsed.

Fixes #456
```

## Pull Request Process

1. **Ensure your code passes all checks**:
   ```bash
   npm run lint
   npm run format
   npm test
   npm run build
   ```

2. **Update documentation** if needed

3. **Create a pull request** with:
   - Clear title following commit conventions
   - Detailed description of changes
   - Link to related issues
   - Screenshots for UI changes

4. **PR Template** (auto-populated):
   ```markdown
   ## Description
   [Describe your changes]

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] E2E tests pass (if applicable)
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   [Add screenshots]

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tests added/updated
   ```

5. **Address review feedback** promptly

6. **Squash commits** if requested before merge

## Reporting Bugs

### Before Submitting

- Check existing issues to avoid duplicates
- Verify the bug exists in the latest version
- Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of the bug.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g., macOS 14.0]
 - Claude Owl Version: [e.g., 0.1.0]
 - Claude Code Version: [e.g., 1.0.0]
 - Node Version: [e.g., 18.0.0]

**Additional context**
Any other relevant information.
```

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Any other context, mockups, or examples.
```

## Questions?

- Open a [Discussion](https://github.com/yourusername/claude-owl/discussions)
- Join our community chat (if available)
- Check the [documentation](docs/)

## License

By contributing to Claude Owl, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Claude Owl! Your efforts help make Claude Code more accessible to everyone.
