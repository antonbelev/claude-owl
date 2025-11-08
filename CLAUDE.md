# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Owl is an Electron-based desktop application that provides a visual UI for managing Claude Code configurations. It enables users to configure subagents, skills, plugins, hooks, slash commands, and MCP servers through an intuitive interface, replacing manual JSON/YAML editing.

**Tech Stack:** Electron + React 18 + TypeScript + Vite + Zustand + Tailwind CSS

## Common Development Commands

### Development
```bash
npm run dev:electron    # Start Electron app in development mode
npm run dev            # Start Vite dev server only (for renderer testing)
```

### Building
```bash
npm run build          # Build all (renderer, main, preload)
npm run build:renderer # Build React frontend only
npm run build:main     # Build Electron main process only
npm run build:preload  # Build preload scripts only
```

### Testing
```bash
npm test               # Run tests in watch mode
npm run test:unit      # Run all unit tests once
npm run test:integration # Run integration tests
npm run test:e2e       # Run Playwright E2E tests
npm run test:coverage  # Run tests with coverage report
```

### Code Quality
```bash
npm run lint           # Lint all code
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
npm run typecheck      # Type-check all TypeScript
npm run clean          # Clean build artifacts
```

### Packaging
```bash
npm run package        # Package for current platform
npm run package:mac    # Build macOS .dmg
npm run package:win    # Build Windows installer
npm run package:linux  # Build Linux AppImage
```

## Architecture

### Three-Process Architecture

Claude Owl follows Electron's multi-process architecture:

1. **Main Process** (`src/main/`) - Node.js backend that manages:
   - File system operations (reading/writing Claude configs)
   - IPC handlers for communication with renderer
   - Backend services (ClaudeService, SkillsService, etc.)
   - Claude CLI execution

2. **Renderer Process** (`src/renderer/`) - React frontend:
   - UI components and pages
   - State management with Zustand
   - React hooks for data fetching
   - Communicates with main via `window.electronAPI`

3. **Preload Script** (`src/preload/`) - Secure IPC bridge:
   - Exposes limited `electronAPI` to renderer
   - Maintains context isolation for security
   - Type-safe IPC communication

### IPC Communication Pattern

All inter-process communication follows this pattern:

1. **Define channel and types** in `src/shared/types/ipc.types.ts`:
   ```typescript
   export const IPC_CHANNELS = {
     CHECK_CLAUDE_INSTALLED: 'system:check-claude',
   };

   export interface CheckClaudeInstalledResponse {
     success: boolean;
     installed: boolean;
     version?: string;
     path?: string;
   }
   ```

2. **Create IPC handler** in `src/main/ipc/`:
   ```typescript
   ipcMain.handle(IPC_CHANNELS.CHECK_CLAUDE_INSTALLED, async () => {
     const result = await claudeService.checkInstallation();
     return { success: true, ...result };
   });
   ```

3. **Expose in preload** (`src/preload/index.ts`):
   ```typescript
   contextBridge.exposeInMainWorld('electronAPI', {
     checkClaudeInstalled: () => ipcRenderer.invoke(IPC_CHANNELS.CHECK_CLAUDE_INSTALLED),
   });
   ```

4. **Use in renderer** via React hook:
   ```typescript
   const result = await window.electronAPI.checkClaudeInstalled();
   ```

### Key Directories

- `src/main/services/` - Backend business logic (ClaudeService, SkillsService)
- `src/main/ipc/` - IPC handlers grouped by domain (systemHandlers, skillsHandlers)
- `src/renderer/components/` - React components organized by feature
- `src/renderer/hooks/` - React hooks for data fetching and state
- `src/shared/types/` - TypeScript types shared between main and renderer
- `src/shared/utils/` - Utility functions (path manipulation, validation)

## Adding New Features

Follow this end-to-end flow (see completed example: Claude Code detection feature):

1. **Define types** in `src/shared/types/` (ipc.types.ts, agent.types.ts, etc.)
2. **Create backend service** in `src/main/services/` with business logic
3. **Add IPC handlers** in `src/main/ipc/` and register in `src/main/index.ts`
4. **Update preload** in `src/preload/index.ts` to expose IPC methods
5. **Create React hook** in `src/renderer/hooks/` for data fetching
6. **Build UI component** in `src/renderer/components/`
7. **Write tests** for service, hook, and component in `tests/unit/`

## Testing Patterns

### Unit Tests
- Located in `tests/unit/`
- Use Vitest + React Testing Library
- Mock `window.electronAPI` for renderer tests
- Test hooks with `renderHook` from `@testing-library/react`

### Component Test Example
```typescript
// Mock electron API
vi.stubGlobal('electronAPI', {
  checkClaudeInstalled: vi.fn().mockResolvedValue({
    success: true,
    installed: true,
    version: '1.0.0'
  })
});

// Test component
render(<ClaudeStatusCard />);
await waitFor(() => {
  expect(screen.getByText(/installed/i)).toBeInTheDocument();
});
```

### Running Single Test
```bash
npm test -- useClaudeInstallation.test.ts  # Run specific test file
npm test -- -t "should detect Claude"      # Run tests matching pattern
```

## Configuration Files

### Claude Code Integration

Claude Owl interacts with these Claude Code directories:
- `~/.claude/` - User-level configs (settings.json, agents/, skills/, commands/)
- `.claude/` - Project-level configs in any directory
- `.claude/settings.json` - Project settings
- `.claude/settings.local.json` - Local overrides (gitignored)

### File Operations

When working with Claude configs:
- Always use `src/shared/utils/path.utils.ts` for path resolution
- Parse YAML frontmatter using `gray-matter` library
- Validate configs before saving using JSON schemas
- Handle merge hierarchy: user → project → local

## Type Safety

- **Strict TypeScript** everywhere - no `any` without justification
- **Shared types** between main and renderer processes
- **IPC type safety** - all requests/responses are typed
- **Zod schemas** for runtime validation of configs

## Code Style

- Use **functional components** with hooks (no class components)
- Prefer **composition over inheritance**
- Keep components **small and focused** (single responsibility)
- Use **descriptive variable names** (`claudeInstallationStatus` not `status`)
- **Error handling** at every layer (try-catch in services, error states in UI)

## Important Notes

### Security
- Never expose full Node.js APIs to renderer
- Always validate user inputs before file operations
- Sanitize file paths to prevent traversal attacks
- Use `contextIsolation: true` (already configured)

### Performance
- Lazy load heavy components (Monaco Editor)
- Use React.memo for expensive renders
- Debounce search/filter operations
- Cache file system reads when appropriate

### Logging Best Practices

Desktop applications need comprehensive logging for debugging user issues. Follow these guidelines:

#### Logging Levels

Use appropriate log levels for different scenarios:

```typescript
// DEBUG - Detailed information for diagnosing problems
console.log('[PluginsService] Fetching marketplace manifest from:', url);

// INFO - General informational messages
console.log('[PluginsService] Successfully installed plugin:', pluginId);

// WARN - Warning messages for potentially harmful situations
console.warn('[PluginsService] Marketplace manifest missing optional field:', field);

// ERROR - Error events that might still allow the application to continue
console.error('[PluginsService] Failed to fetch marketplace:', error.message);
```

#### Logging Format

Use consistent formatting with prefixes to identify the source:

```typescript
// Format: [Component/Service] Action: details
console.log('[PluginsService] Loading plugins from marketplace:', marketplaceName);
console.log('[PluginsHandler] IPC request received:', channelName, request);
console.error('[PluginsService] Installation failed:', { pluginId, error: error.message });
```

#### When to Add Logging

**ALWAYS log:**
1. **Entry points** - When IPC handlers receive requests
2. **Service method calls** - Start of business logic operations
3. **External calls** - HTTP requests, file system operations, CLI executions
4. **State changes** - Configuration updates, plugin installations
5. **Errors** - All caught exceptions with context
6. **User actions** - Important user-triggered operations

**Example - IPC Handler with Logging:**
```typescript
ipcMain.handle(PLUGINS_CHANNELS.INSTALL_PLUGIN, async (_, request: InstallPluginRequest) => {
  console.log('[PluginsHandler] Install plugin request:', {
    pluginName: request.pluginName,
    marketplace: request.marketplaceName
  });

  try {
    const result = await pluginsService.installPlugin(
      request.pluginName,
      request.marketplaceName
    );

    console.log('[PluginsHandler] Plugin installation completed:', {
      success: result.success,
      pluginId: result.pluginId
    });

    return { success: result.success, data: result, error: result.error };
  } catch (error) {
    console.error('[PluginsHandler] Plugin installation failed:', {
      pluginName: request.pluginName,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to install plugin',
    };
  }
});
```

**Example - Service Method with Logging:**
```typescript
async installPlugin(pluginName: string, marketplaceName: string): Promise<PluginInstallResult> {
  console.log('[PluginsService] Starting plugin installation:', { pluginName, marketplaceName });

  try {
    const marketplace = await this.getMarketplace(marketplaceName);
    if (!marketplace) {
      console.error('[PluginsService] Marketplace not found:', marketplaceName);
      return { success: false, error: 'Marketplace not found' };
    }

    console.log('[PluginsService] Fetching plugin manifest:', pluginName);
    const plugin = await this.fetchPluginFromMarketplace(pluginName, marketplace);

    console.log('[PluginsService] Downloading plugin files...');
    await this.downloadPlugin(plugin);

    console.log('[PluginsService] Plugin installed successfully:', pluginName);
    return { success: true, pluginId: `${pluginName}@${marketplaceName}` };
  } catch (error) {
    console.error('[PluginsService] Installation failed:', {
      pluginName,
      marketplaceName,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
```

#### Debugging IPC Issues

When debugging "conversion failure from undefined" or similar IPC errors:

1. **Log the request object** at the handler entry point
2. **Verify parameter names** match between renderer and main
3. **Check for undefined values** in request payload
4. **Log the channel name** being invoked

```typescript
// In IPC handler
ipcMain.handle(CHANNEL_NAME, async (_, request) => {
  console.log('[Handler] Received request:', {
    channel: CHANNEL_NAME,
    request: JSON.stringify(request, null, 2)
  });
  // ... rest of handler
});

// In renderer/hook
console.log('[usePlugins] Calling installPlugin:', { pluginName, marketplaceName });
const response = await window.electronAPI.installPlugin({ pluginName, marketplaceName });
console.log('[usePlugins] Response received:', response);
```

#### Future: Disk Logging

We will implement disk-based logging for production debugging:
- Log files stored in user data directory
- Rotation policy (max file size, keep last N files)
- Sensitive data filtering (API keys, tokens)
- Option to export logs for GitHub issues

Until then, use console logging which appears in both DevTools (renderer) and terminal (main process).

### Development Workflow
- Run `npm run typecheck` before committing
- Format with Prettier (`npm run format`)
- Write tests for new features
- Follow the established patterns (see ClaudeStatusCard example)
- **Add comprehensive logging** to all new features (DEBUG for entry points, ERROR for failures)

## Current State

Phase 0 is complete with first end-to-end feature implemented:
- ✅ Claude Code detection on Dashboard
- ✅ Full stack: Service → IPC → Hook → Component
- ✅ 11 unit tests passing
- ✅ Build system working

Next phase focuses on core services (FileSystemService, ConfigurationService, ValidationService).
