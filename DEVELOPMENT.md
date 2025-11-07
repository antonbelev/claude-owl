# Development Guide

## What We've Built So Far

### ✅ Phase 0: Foundation (COMPLETED)

We've successfully completed the initial setup phase and implemented our first end-to-end feature!

#### Infrastructure Setup (TASK-001 to TASK-006)

1. **Repository Structure** - Complete monorepo with src/main, src/renderer, src/preload, src/shared
2. **TypeScript Configuration** - Strict type checking with separate configs for main/renderer/preload
3. **Electron + React + Vite** - Modern development stack fully configured
4. **Build Tooling** - electron-builder configured for macOS, Windows, and Linux
5. **Linting & Formatting** - ESLint and Prettier configured with pre-commit hooks ready
6. **Testing Framework** - Vitest for unit tests, Playwright for E2E tests

#### First Feature: Claude Code Detection (COMPLETED)

We implemented a complete end-to-end feature with the full stack:

**Backend (Electron Main Process):**
- `ClaudeService` - Service to detect Claude Code installation
- `systemHandlers` - IPC handlers for system-related operations
- Proper error handling and response types

**IPC Layer:**
- Type-safe IPC channels defined in `src/shared/types/ipc.types.ts`
- Preload script exposing secure API to renderer

**Frontend (React):**
- `useClaudeInstallation` hook - React hook for checking Claude installation
- `ClaudeStatusCard` component - UI component displaying installation status
- Proper loading, success, error, and warning states

**Tests:**
- 11 unit tests passing
- Tests for React hook (`useClaudeInstallation`)
- Tests for React component (`ClaudeStatusCard`)
- Test coverage for all user flows

## Current State

### ✅ What Works

- **Build System**: `npm run build` successfully compiles all code
- **Type Safety**: All TypeScript compiles without errors
- **Tests**: `npm run test:unit` passes 11 tests
- **Linting**: `npm run lint` passes
- **Feature Complete**: Claude Code detection feature fully implemented end-to-end

### 🎯 Next Steps

Continue with Phase 1 from the roadmap:

1. **TASK-101**: FileSystemService implementation
2. **TASK-102**: ConfigurationService implementation
3. **TASK-103**: ValidationEngine implementation
4. **TASK-104**: ClaudeCLIService implementation
5. **TASK-105**: IPC communication layer expansion

Or add more Dashboard features:
- Configuration status card
- Recent activity feed
- Quick stats widget

## Running the Application

### Development Mode

Currently, the infrastructure is ready but we need to add a development script:

```bash
# This will be available soon
npm run dev:electron
```

### Build

```bash
# Build all parts
npm run build

# Build individually
npm run build:renderer
npm run build:main
npm run build:preload
```

### Testing

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test
```

### Linting & Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run typecheck
```

## Project Structure

```
claude-owl/
├── src/
│   ├── main/                    # Electron main process (Node.js)
│   │   ├── index.ts            # Entry point
│   │   ├── services/           # Backend services
│   │   │   └── ClaudeService.ts
│   │   └── ipc/                # IPC handlers
│   │       └── systemHandlers.ts
│   ├── renderer/                # React frontend
│   │   ├── main.tsx            # React entry point
│   │   ├── App.tsx             # Root component
│   │   ├── components/         # React components
│   │   │   └── Dashboard/
│   │   │       └── ClaudeStatusCard.tsx
│   │   └── hooks/              # React hooks
│   │       └── useClaudeInstallation.ts
│   ├── preload/                # Preload scripts
│   │   └── index.ts            # IPC bridge
│   └── shared/                 # Shared code
│       ├── types/              # TypeScript types
│       │   ├── config.types.ts
│       │   ├── agent.types.ts
│       │   └── ipc.types.ts
│       └── utils/              # Utility functions
│           ├── path.utils.ts
│           └── validation.utils.ts
├── tests/
│   ├── unit/                   # Unit tests
│   │   ├── useClaudeInstallation.test.ts
│   │   └── ClaudeStatusCard.test.tsx
│   ├── integration/            # Integration tests (future)
│   └── e2e/                    # E2E tests (future)
├── docs/                       # Documentation
│   ├── architecture.md         # System architecture
│   ├── roadmap.md              # Development roadmap
│   └── features.md             # Feature specifications
└── [config files]              # Various configuration files
```

## Key Design Decisions

### Type Safety
- Strict TypeScript everywhere
- Shared types between main and renderer
- No `any` types without justification

### Testing Strategy
- Unit tests for all hooks and components
- Integration tests for IPC communication (future)
- E2E tests for critical user flows (future)

### Code Organization
- Services in `src/main/services/`
- IPC handlers in `src/main/ipc/`
- React components in `src/renderer/components/`
- Shared types in `src/shared/types/`

### IPC Communication
- All channels defined as constants in `IPC_CHANNELS`
- Request/Response types for type safety
- Error handling at every layer

## Common Tasks

### Adding a New Feature

1. **Define types** in `src/shared/types/`
2. **Create backend service** in `src/main/services/`
3. **Add IPC handlers** in `src/main/ipc/`
4. **Update preload** script if needed
5. **Create React hook** in `src/renderer/hooks/`
6. **Build React component** in `src/renderer/components/`
7. **Write tests** for each layer

### Adding a New IPC Channel

1. Add channel constant to `IPC_CHANNELS` in `ipc.types.ts`
2. Define request/response types in `ipc.types.ts`
3. Add handler in appropriate file in `src/main/ipc/`
4. Expose in preload script if needed
5. Use in React components via `window.electronAPI`

## Troubleshooting

### Build Issues

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Test Issues

```bash
# Clear test cache
npm test -- --clearCache
```

### Type Errors

```bash
# Check all TypeScript
npm run typecheck
```

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Vitest Documentation](https://vitest.dev)
- [Claude Code Documentation](https://code.claude.com/docs)

---

**Status**: Phase 0 Complete, Ready for Phase 1 Development
**Last Updated**: 2025-11-07
