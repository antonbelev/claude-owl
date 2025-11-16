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

**IMPORTANT:** See `docs/adr-001-settings-management-redesign.md` for complete architecture decision.

Claude Owl interacts with these Claude Code files:

**User-Level Files:**
- `~/.claude.json` - **READ ONLY** - CLI-managed, contains project tracking (used for project discovery)
- `~/.claude/settings.json` - **READ/WRITE** - User-level settings (permissions, hooks, env vars)
- `~/.claude/skills/` - **READ/WRITE** - User-level skills
- `~/.claude/commands/` - **READ/WRITE** - User-level slash commands

**Project-Level Files (after user selects a project):**
- `{PROJECT}/.claude/settings.json` - **READ/WRITE** - Project-specific settings
- `{PROJECT}/.claude/settings.local.json` - **READ/WRITE** - Local overrides (gitignored)
- `{PROJECT}/.claude/skills/` - **READ/WRITE** - Project-specific skills
- `{PROJECT}/.claude/hooks/` - **READ/WRITE** - Hook scripts
- `{PROJECT}/.claude/commands/` - **READ/WRITE** - Project-specific slash commands
- `{PROJECT}/.mcp.json` - **READ ONLY** - CLI-managed, project MCP servers

**Access Policy:**
- ✅ **User Settings**: Full read/write access to `~/.claude/settings.json`
- ✅ **Project Discovery**: Read `~/.claude.json` to get list of projects
- ✅ **Project Settings**: Read/write after user explicitly selects a project
- ❌ **Never write** to `.claude.json` (CLI-managed, risk of corruption)
- ❌ **Never assume** project context (we're a standalone app)

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

**Before Every Commit - Run Full CI Checks Locally:**

Follow the same checks that run in `.github/workflows/ci.yml` to catch issues before pushing:

```bash
# 1. Format code
npm run format

# 2. Run linter
npm run lint

# 3. Type checking
npm run typecheck

# 4. Unit tests
npm run test:unit

# 5. Build all targets
npm run build
npm run build:renderer
npm run build:main
npm run build:preload
```

**Or run everything at once:**
```bash
npm run format && npm run lint && npm run typecheck && npm run test:unit && npm run build
```

**General Guidelines:**
- Write tests for new features
- Follow the established patterns (see ClaudeStatusCard example)
- **Add comprehensive logging** to all new features (DEBUG for entry points, ERROR for failures)
- **Do NOT commit if:**
  - `npm run lint` has errors (warnings OK)
  - `npm run typecheck` has errors
  - `npm run test:unit` fails
  - `npm run build` fails

**CI Pipeline Gates:**
The automated CI pipeline (`.github/workflows/ci.yml`) runs these jobs and **ALL must pass**:
- ✅ **Lint** - Code quality checks
- ✅ **Type Check** - TypeScript compilation
- ✅ **Unit Tests** - All tests must pass
- ✅ **Build** - All build targets (main, renderer, preload)
- ⚠️ **Security Scan** - Trivy vulnerability scanner (informational)
- ⚠️ **Integration Tests** - Optional, runs if above pass

**Quick Reference:**
```bash
# Check everything matches CI requirements
npm run format && npm run lint && npm run typecheck && npm run test:unit && npm run build

# Or check individual items:
npm run lint              # Code style
npm run typecheck         # Type errors
npm run test:unit         # Unit tests
npm run build             # Build all
npm run test:coverage     # Coverage report
```

## Working with Scoped Features

**⚠️ IMPORTANT:** When adding features that support both user-level and project-level configurations (e.g., MCP servers, slash commands, subagents, skills, hooks), you MUST use the unified project selection pattern defined in **[ADR-005: Project Selection UX](./docs/adr/adr-005-project-selection-ux.md)**.

### Quick Reference

```typescript
import { ScopeSelector } from '@/renderer/components/common/ScopeSelector';
import type { ProjectInfo } from '@/shared/types';

// In your form component:
const [scope, setScope] = useState<'user' | 'project'>('user');
const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

// Add to form:
<ScopeSelector
  scope={scope}
  selectedProject={selectedProject}
  onScopeChange={setScope}
  onProjectChange={setSelectedProject}
  compact={true}
/>

// Validate before submission:
if (scope === 'project' && !selectedProject) {
  setError('Please select a project');
  return;
}

// Include in IPC request:
const request = {
  // ... other fields
  scope,
  projectPath: scope === 'project' ? selectedProject?.path : undefined,
};
```

### Backend Service Pattern

```typescript
import { validateScopedRequest } from '@/shared/utils/validation.utils';

async addFeature(options: FeatureOptions): Promise<Result> {
  console.log('[Service] Adding feature:', {
    name: options.name,
    scope: options.scope,
    projectPath: options.projectPath,
  });

  // Validate project path when scope is 'project'
  if (options.scope === 'project' && !options.projectPath) {
    return {
      success: false,
      error: 'projectPath is required when scope is "project"',
    };
  }

  // Execute CLI command with proper working directory
  const cwd = options.scope === 'project' && options.projectPath
    ? options.projectPath
    : undefined;

  const { stdout, stderr } = await execAsync(command, { cwd });
  // ... handle result
}
```

### Complete Implementation Checklist

When adding a new scoped feature:

1. **Update IPC Types** (`src/shared/types/ipc.*.types.ts`):
   - Add `projectPath?: string` to request types

2. **Frontend Component**:
   - Import `ScopeSelector` component
   - Add state: `scope` and `selectedProject`
   - Add `<ScopeSelector>` to form
   - Validate project selection before submit
   - Include `projectPath` in IPC request

3. **Backend Service**:
   - Add validation for `projectPath` when scope is 'project'
   - Use `projectPath` as `cwd` when executing CLI commands
   - Add logging for debugging

4. **IPC Handler**:
   - Log `projectPath` in request
   - Pass full request to service method

5. **Tests**:
   - Test both user and project scopes
   - Test validation (error when project not selected)
   - Test correct file path resolution

### See Also
- [ADR-005: Unified Project Selection UX](./docs/adr/adr-005-project-selection-ux.md) - Complete architecture
- [Project Selection Implementation Guide](./docs/PROJECT_SELECTION_IMPLEMENTATION.md) - Detailed checklist

## Critical Design Constraint

**⚠️ IMPORTANT: Claude Owl is a standalone desktop application, NOT a project-aware tool**

- Users launch Claude Owl from the Applications folder (or via DMG installer)
- Claude Owl does NOT have access to the user's current working directory or project structure
- Do NOT build features that assume Claude Owl knows about the user's project setup
- Do NOT use `process.cwd()` or detect project files/frameworks during runtime
- **Development vs Production Reality:**
  - ✗ During `npm run dev:electron`: We run from claude-owl project directory (misleading!)
  - ✓ When installed: Users launch from Applications, no project context available

### What Claude Owl CAN Know
- Global Claude Code settings (`~/.claude/settings.json`)
- Project-level settings (if user opens a project's `.claude/settings.json`)
- User's home directory
- **Project list** (discovered from `~/.claude.json` - see ADR-001)

### What Claude Owl CANNOT Know
- Which project the user is currently working on
- What tools/frameworks are installed in user's projects
- Project structure or dependencies
- Current working directory

### Working with Scoped Features

**⚠️ IMPORTANT:** When adding features that support both user-level and project-level configurations (e.g., MCP servers, slash commands, subagents), you MUST use the unified project selection pattern defined in **[ADR-005: Project Selection UX](./docs/adr/adr-005-project-selection-ux.md)**.

**Quick Reference:**
```typescript
import { ScopeSelector } from '@/renderer/components/common/ScopeSelector';
import type { ProjectInfo } from '@/shared/types';

// In your form component:
const [scope, setScope] = useState<'user' | 'project'>('user');
const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

// Add to form:
<ScopeSelector
  scope={scope}
  selectedProject={selectedProject}
  onScopeChange={setScope}
  onProjectChange={setSelectedProject}
  compact={true}
/>

// Validate before submission:
if (scope === 'project' && !selectedProject) {
  setError('Please select a project');
  return;
}

// Include in IPC request:
const request = {
  // ... other fields
  scope,
  projectPath: scope === 'project' ? selectedProject?.path : undefined,
};
```

**See also:**
- [ADR-005: Unified Project Selection UX](./docs/adr/adr-005-project-selection-ux.md) - Complete architecture
- [Project Selection Implementation Guide](./docs/PROJECT_SELECTION_IMPLEMENTATION.md) - Detailed checklist

## Current State

**Phase 0** - Complete ✅
- ✅ Claude Code detection on Dashboard
- ✅ Full stack: Service → IPC → Hook → Component
- ✅ 11 unit tests passing
- ✅ Build system working

**Phase 1 (v0.2)** - Editable Settings & Permission Rules - **COMPLETE** ✅
- ✅ Full-featured permission rules builder with visual editor
- ✅ 6 pre-built security templates for common use cases
- ✅ Live rule validation with examples
- ✅ Interactive rule tester
- ✅ Backup/restore settings functionality
- ✅ ESC key support for modal windows
- ✅ Compact, optimized UI (4x more rules visible without scrolling)
- ✅ 2000+ lines of production-ready code
- ✅ Full TypeScript strict mode compliance
- ⚠️ Removed auto-detection feature (violated design constraint - Claude Owl is standalone app)

**Phase 2** - Next Focus
- Core services (FileSystemService, ConfigurationService, ValidationService)
- Additional settings editor sections
- UI components for other Claude Code configurations
