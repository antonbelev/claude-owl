# ADR-001: Settings Management Redesign for Project-Level Configuration

**Status:** Proposed
**Date:** 2025-11-15
**Authors:** Product Owner, UX Designer, Technical Architect
**Reviewers:** Development Team

## Context

Claude Owl is experiencing critical UX and architectural issues with how it manages Claude Code settings, particularly for project-level configurations. The current implementation violates the fundamental design constraint that **Claude Owl is a standalone desktop application with no project context awareness**.

### The Problem

1. **Incorrect Assumption**: Current services (MCPService, SkillsService, AgentsService, CommandsService) use `process.cwd()` to determine project paths, which resolves to the Claude Owl application directory when launched from the Applications folder.

2. **Broken Project-Level Features**: Users cannot properly configure project-specific settings (MCP servers, skills, slash commands, agents) because Claude Owl has no mechanism to select or identify user projects.

3. **Conflicting Configuration Models**:
   - Claude Code uses `.claude.json` (single file at `~/.claude.json`) containing both user-level AND project-level settings
   - Services are trying to read/write to `.claude/settings.json` in non-existent project directories
   - No UI exists for users to select which project they're configuring

### Claude Code Settings Model

According to Claude Code documentation and the `.claude.json` file structure:

```json
{
  // User-level settings (top-level)
  "mcpServers": {
    "server-name": { ... }
  },

  // Project-level settings (nested under projects)
  "projects": {
    "/Users/user/Projects/my-project": {
      "mcpServers": { ... },
      "allowedTools": [],
      "context": {},
      "ignorePatterns": [],
      ...
    }
  }
}
```

**Settings File Hierarchy** (from Claude Code docs):
1. `~/.claude.json` - Primary config file with user and project settings
2. `~/.claude/settings.json` - User-level settings (permissions, hooks, etc.)
3. `<project>/.claude/settings.json` - Project-level settings (checked into git)
4. `<project>/.claude/settings.local.json` - Local project overrides (gitignored)
5. Managed settings - Enterprise-level (highest priority)

**Merge Hierarchy**: User → Project → Local → Managed (later overrides earlier)

## Current State Analysis

### Services Using `process.cwd()` ❌

| Service | Issue | Impact |
|---------|-------|--------|
| **SkillsService** | `process.cwd()` in constructor | Reads/writes skills to wrong directory |
| **AgentsService** | `process.cwd()` in constructor | Cannot manage project-level agents |
| **CommandsService** | `process.cwd()` in constructor | Slash commands don't load from projects |
| **MCPService** | Only supports user-level, ignores projects | Cannot configure project MCP servers |
| **HooksService** | Likely uses `process.cwd()` | Project hooks not accessible |

### What Works ✅

| Service | Status | Notes |
|---------|--------|-------|
| **SettingsService** | ✅ Correct | Supports user/project/local/managed hierarchy |
| **PathService** | ⚠️ Partial | Has methods but services misuse them |
| **ClaudeService** | ✅ Correct | Properly reads `.claude.json` with projects |

### Missing Components ❌

1. **ProjectSelector UI** - No way for users to choose a project
2. **Project Discovery** - No mechanism to list available projects from `.claude.json`
3. **Project Context Manager** - No service to maintain selected project state
4. **Scope Switcher UI** - No clear indication of user vs project configuration mode

## Decision

We will redesign the settings management architecture to:

1. **Add Project Selection UI** - Users explicitly select a project before configuring project-level settings
2. **Create ProjectsService** - Centralized service for managing project list and selection
3. **Update All Services** - Accept `projectPath` parameter instead of using `process.cwd()`
4. **Dual-Mode UI** - Every configuration page has User/Project scope selector
5. **Consistent .claude.json Usage** - Write project settings to `.claude.json` under `projects[path]`
6. **Settings.json Integration** - Support reading from `.claude/settings.json` when available

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Owl UI                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Navigation Bar                                        │  │
│  │  [ User Settings ▼ ]  [ Project: my-app ▼ ]         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Feature Page (MCP / Skills / Agents / Commands)      │  │
│  │  [ ○ User Level   ● Project Level ]                  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ Configuration Items for Selected Scope         │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │                           │
           ▼                           ▼
   ┌──────────────┐           ┌──────────────────┐
   │ ProjectsService│         │  SettingsService  │
   │ - getProjects() │         │ - read/write     │
   │ - selectProject()│        │ - merge hierarchy │
   └──────────────┘           └──────────────────┘
           │                           │
           └───────────┬───────────────┘
                       ▼
          ┌──────────────────────────┐
          │    ~/.claude.json        │
          │  {                       │
          │    "mcpServers": {...},  │
          │    "projects": {         │
          │      "/path/to/proj": {  │
          │        "mcpServers": {...}│
          │      }                   │
          │    }                     │
          │  }                       │
          └──────────────────────────┘
```

## Implementation Plan

### Phase 1: Foundation Services (Week 1)

#### Task 1.1: Create ProjectsService
**File**: `src/main/services/ProjectsService.ts`

```typescript
/**
 * Service for managing project discovery and selection
 * Projects are read from ~/.claude.json projects section
 */
export class ProjectsService {
  /**
   * Get list of all projects from .claude.json
   * Returns: Array<{ path: string; name: string; lastUsed?: Date }>
   */
  async getProjects(): Promise<Project[]>

  /**
   * Get project configuration from .claude.json
   */
  async getProjectConfig(projectPath: string): Promise<ProjectConfig>

  /**
   * Update project configuration in .claude.json
   */
  async updateProjectConfig(projectPath: string, config: Partial<ProjectConfig>): Promise<void>

  /**
   * Verify project directory exists and is valid
   */
  async validateProjectPath(projectPath: string): Promise<boolean>

  /**
   * Add a new project to .claude.json
   */
  async addProject(projectPath: string): Promise<void>
}
```

**Types**: Add to `src/shared/types/project.types.ts`
```typescript
export interface Project {
  path: string;
  name: string;
  lastUsed?: Date;
  hasTrustDialogAccepted?: boolean;
}

export interface ProjectConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  allowedTools?: string[];
  context?: Record<string, unknown>;
  ignorePatterns?: string[];
  // ... other project-specific settings
}
```

**IPC**: Add to `src/main/ipc/projectsHandlers.ts`
```typescript
- projects:list -> ProjectsService.getProjects()
- projects:get-config -> ProjectsService.getProjectConfig(path)
- projects:update-config -> ProjectsService.updateProjectConfig(path, config)
- projects:validate-path -> ProjectsService.validateProjectPath(path)
- projects:add -> ProjectsService.addProject(path)
```

**Tests**: `tests/unit/services/ProjectsService.test.ts`

---

#### Task 1.2: Create ProjectContext State Management
**File**: `src/renderer/store/projectStore.ts`

```typescript
interface ProjectStore {
  selectedProject: Project | null;
  availableProjects: Project[];
  isLoadingProjects: boolean;

  selectProject: (project: Project | null) => void;
  refreshProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>(/* ... */);
```

**Hook**: `src/renderer/hooks/useProjectSelection.ts`
```typescript
export function useProjectSelection() {
  const { selectedProject, selectProject, availableProjects } = useProjectStore();
  // ... load projects on mount, persist selection
}
```

---

#### Task 1.3: Update PathService
**File**: `src/main/services/core/PathService.ts`

**Changes**:
- Remove `getProjectClaudeDir(projectPath?: string)` fallback to `process.cwd()`
- Make `projectPath` required for project-level paths
- Add validation that throws error if projectPath is undefined

```typescript
// BEFORE (Wrong)
getProjectClaudeDir(projectPath?: string): string {
  const basePath = projectPath || process.cwd(); // ❌ BAD
  return path.join(basePath, '.claude');
}

// AFTER (Correct)
getProjectClaudeDir(projectPath: string): string {
  if (!projectPath) {
    throw new Error('projectPath is required for project-level paths');
  }
  return path.join(projectPath, '.claude');
}
```

---

### Phase 2: Update Services (Week 1-2)

#### Task 2.1: Update MCPService
**File**: `src/main/services/MCPService.ts`

**Current Issues**:
- Only supports user-level MCP servers
- Comments say "we only support user-level" (line 16)
- Needs to support project-level servers from `.claude.json`

**Changes**:
```typescript
export class MCPService {
  // Remove projectMcpPath assumptions

  /**
   * List MCP servers for a specific scope
   * @param scope - 'user' or 'project'
   * @param projectPath - Required if scope is 'project'
   */
  async listServers(scope: 'user' | 'project', projectPath?: string): Promise<MCPServer[]>

  /**
   * Add MCP server to .claude.json
   * - User scope: writes to top-level mcpServers
   * - Project scope: writes to projects[projectPath].mcpServers
   */
  async addServer(config: MCPServerConfig, scope: 'user' | 'project', projectPath?: string)

  /**
   * Read from .claude.json (not .mcp.json)
   */
  private async loadServersFromClaudeConfig(scope: 'user' | 'project', projectPath?: string)
}
```

**Integration with ClaudeService**:
- Use `ClaudeService.readClaudeConfigFile()` and `ClaudeService.parseServersFromConfig()`
- Don't duplicate logic

---

#### Task 2.2: Update SkillsService
**File**: `src/main/services/SkillsService.ts`

**Current Issues**:
- `constructor()` initializes `projectSkillsPath` with `process.cwd()` (line 18)
- No way to specify which project to work with

**Changes**:
```typescript
export class SkillsService {
  private userSkillsPath: string;

  constructor() {
    // Only initialize user path in constructor
    this.userSkillsPath = path.join(homedir(), '.claude', 'skills');
  }

  /**
   * Get skills path for a specific location
   * @param location - 'user' or 'project'
   * @param projectPath - REQUIRED if location is 'project'
   */
  private getSkillsPath(location: 'user' | 'project', projectPath?: string): string {
    if (location === 'project' && !projectPath) {
      throw new Error('projectPath is required for project-level skills');
    }
    return location === 'user'
      ? this.userSkillsPath
      : path.join(projectPath!, '.claude', 'skills');
  }

  // Update all methods to accept projectPath
  async listSkills(location: 'user' | 'project', projectPath?: string): Promise<Skill[]>
  async getSkill(name: string, location: 'user' | 'project', projectPath?: string): Promise<Skill>
  async createSkill(skill: Skill, location: 'user' | 'project', projectPath?: string): Promise<void>
  // ... etc
}
```

---

#### Task 2.3: Update AgentsService
**File**: `src/main/services/AgentsService.ts`

**Same pattern as SkillsService**:
- Remove `projectAgentsPath` from constructor
- Add `projectPath` parameter to all methods
- Throw error if projectPath missing when location='project'

---

#### Task 2.4: Update CommandsService
**File**: `src/main/services/CommandsService.ts`

**Same pattern as SkillsService**:
- Remove `projectCommandsPath` from constructor
- Add `projectPath` parameter to all methods
- Throw error if projectPath missing when location='project'

---

#### Task 2.5: Update HooksService
**File**: `src/main/services/HooksService.ts`

**Review and update** to follow same pattern.

---

### Phase 3: Update IPC Handlers (Week 2)

All IPC handlers need to accept optional `projectPath` parameter:

#### Task 3.1: Update MCP Handlers
**File**: `src/main/ipc/mcpHandlers.ts`

```typescript
// Request types
interface ListMCPServersRequest {
  scope: 'user' | 'project';
  projectPath?: string;
}

interface AddMCPServerRequest {
  config: MCPServerConfig;
  scope: 'user' | 'project';
  projectPath?: string;
}

// Handler
ipcMain.handle(MCP_CHANNELS.LIST_SERVERS, async (_, req: ListMCPServersRequest) => {
  const servers = await mcpService.listServers(req.scope, req.projectPath);
  return { success: true, data: servers };
});
```

#### Task 3.2: Update Skills Handlers
**File**: `src/main/ipc/skillsHandlers.ts`

Same pattern - add scope and projectPath to all requests.

#### Task 3.3: Update Agents Handlers
**File**: `src/main/ipc/agentsHandlers.ts`

Same pattern.

#### Task 3.4: Update Commands Handlers
**File**: `src/main/ipc/commandsHandlers.ts`

Same pattern.

#### Task 3.5: Update Hooks Handlers
**File**: `src/main/ipc/hooksHandlers.ts`

Same pattern.

---

### Phase 4: UI Components (Week 2-3)

#### Task 4.1: Create ProjectSelector Component
**File**: `src/renderer/components/ProjectSelector/ProjectSelector.tsx`

**Features**:
- Dropdown showing all projects from `.claude.json`
- "User Level" option (projectPath = null)
- Display project name + path
- Persist selection in localStorage
- Show validation indicator (✓ if project path exists)

**Props**:
```typescript
interface ProjectSelectorProps {
  value: Project | null;
  onChange: (project: Project | null) => void;
  showUserLevel?: boolean; // Default true
  placeholder?: string;
}
```

**UI Mock**:
```
┌─────────────────────────────────────────┐
│ Project: my-awesome-app          ▼      │
├─────────────────────────────────────────┤
│ ○ User Level (Global)                   │
│ ● /Users/me/Projects/my-awesome-app ✓   │
│   /Users/me/Projects/other-project ✓    │
│   /Users/me/old-project ⚠ (missing)     │
│ ─────────────────────────────────────   │
│ + Add New Project...                    │
└─────────────────────────────────────────┘
```

---

#### Task 4.2: Create ScopeSelector Component
**File**: `src/renderer/components/ScopeSelector/ScopeSelector.tsx`

**Features**:
- Radio toggle: User Level / Project Level
- Disabled if no project selected
- Clear visual indication

**Props**:
```typescript
interface ScopeSelectorProps {
  scope: 'user' | 'project';
  onScopeChange: (scope: 'user' | 'project') => void;
  disabled?: boolean;
}
```

**UI Mock**:
```
Configure for:  ( ) User Level    (•) Project Level
```

---

#### Task 4.3: Update MCPPage
**File**: `src/renderer/pages/MCPPage.tsx`

**Add**:
1. ProjectSelector at top
2. ScopeSelector below project selector
3. Pass scope + projectPath to all hooks
4. Show warning if project-level selected but no project chosen

**Layout**:
```tsx
<Page>
  <PageHeader>
    <ProjectSelector value={project} onChange={setProject} />
  </PageHeader>

  <ScopeSelector
    scope={scope}
    onScopeChange={setScope}
    disabled={scope === 'project' && !project}
  />

  {scope === 'project' && !project && (
    <Alert>Please select a project to configure project-level MCP servers</Alert>
  )}

  <MCPServersList scope={scope} projectPath={project?.path} />
</Page>
```

---

#### Task 4.4: Update Skills Page
**File**: `src/renderer/pages/SkillsPage.tsx`

Same pattern as MCPPage.

#### Task 4.5: Update Agents Page
**File**: `src/renderer/pages/AgentsPage.tsx`

Same pattern.

#### Task 4.6: Update Commands Page
**File**: `src/renderer/pages/CommandsPage.tsx` (if exists)

Same pattern.

#### Task 4.7: Update Hooks Page
**File**: `src/renderer/pages/HooksPage.tsx`

Same pattern.

---

### Phase 5: Update React Hooks (Week 3)

#### Task 5.1: Update useMCPServers Hook
**File**: `src/renderer/hooks/useMCPServers.ts`

**Before**:
```typescript
export function useMCPServers() {
  const servers = await window.electronAPI.listMCPServers();
  // ...
}
```

**After**:
```typescript
export function useMCPServers(scope: 'user' | 'project', projectPath?: string) {
  const servers = await window.electronAPI.listMCPServers({ scope, projectPath });
  // ...
}
```

#### Task 5.2: Update useSkills Hook
Same pattern.

#### Task 5.3: Update useAgents Hook
Same pattern.

#### Task 5.4: Update useCommands Hook
Same pattern.

#### Task 5.5: Update useHooks Hook
Same pattern.

---

### Phase 6: Settings Page Integration (Week 3)

#### Task 6.1: Update Settings Page Scope
**File**: `src/renderer/pages/SettingsPage.tsx`

**Current**: Only shows user-level settings
**New**: Add project selector + show project-level overrides

**Features**:
- Tab for User Settings vs Project Settings
- Show merged effective config
- Indicate which setting comes from which level (user/project/local/managed)
- Allow editing at appropriate level

**UI Enhancement**:
```
Settings
  [ User Level ▼ ]  [ Project: my-app ▼ ]

  ┌─────────────────────────────────────┐
  │ Permissions                         │
  │ ┌─────────────────────────────────┐ │
  │ │ allow: ["Read(*)", "Write(*)"]  │ │ <- User level
  │ │ deny: ["Bash(rm -rf)"]          │ │ <- Project level ⚠
  │ └─────────────────────────────────┘ │
  │ Effective: Merged from User + Project│
  └─────────────────────────────────────┘
```

---

### Phase 7: Documentation & Migration (Week 4)

#### Task 7.1: Update CLAUDE.md
Add section explaining:
- How project selection works
- Difference between user-level and project-level config
- How .claude.json is managed
- Migration guide for existing configurations

#### Task 7.2: Add In-App Help
**Component**: `src/renderer/components/Help/ScopeExplainer.tsx`

Tooltip/modal explaining:
- **User Level**: Settings apply to all projects globally
- **Project Level**: Settings only for the selected project
- How to choose the right scope

#### Task 7.3: Migration Script (Optional)
If needed, create a migration utility to help users:
- Detect incorrectly configured settings
- Move settings to correct locations
- Validate .claude.json structure

---

### Phase 8: Testing (Week 4)

#### Task 8.1: Unit Tests
- [ ] ProjectsService tests
- [ ] Updated service tests with projectPath
- [ ] Component tests for ProjectSelector
- [ ] Component tests for ScopeSelector

#### Task 8.2: Integration Tests
- [ ] End-to-end flow: Select project → Configure MCP → Verify .claude.json
- [ ] Scope switching behavior
- [ ] User vs project settings merge

#### Task 8.3: Manual QA Checklist
- [ ] Install fresh Claude Owl
- [ ] Add project via ProjectSelector
- [ ] Configure user-level MCP server
- [ ] Configure project-level MCP server
- [ ] Verify .claude.json structure
- [ ] Switch between projects
- [ ] Verify settings isolated per project

---

## Consequences

### Positive ✅

1. **Correct UX**: Users can now properly configure project-specific settings
2. **Aligns with Claude Code**: Matches official Claude Code settings model
3. **No More `process.cwd()` Bugs**: Explicit project selection eliminates path confusion
4. **Scalable**: Supports future features (plugins, output styles, etc.)
5. **Clear Mental Model**: Users understand User vs Project scope
6. **Preserves Standalone Nature**: No automatic project detection, explicit selection only

### Negative ⚠️

1. **Breaking Changes**: Existing users may have incorrect configurations
2. **Migration Effort**: Users need to reconfigure project-level settings
3. **Additional UI Complexity**: Every page needs project selector
4. **Development Effort**: ~4 weeks of work across services, IPC, and UI

### Risks 🚨

1. **Data Loss**: Incorrect migration could lose user configurations
   - **Mitigation**: Create backups before any writes to .claude.json

2. **Confusion**: Users might not understand User vs Project scope
   - **Mitigation**: Clear in-app help, tooltips, visual indicators

3. **Performance**: Loading all projects on every page
   - **Mitigation**: Cache projects list, lazy load project configs

---

## Alternatives Considered

### Alternative 1: Auto-Detect Project from Open Files (Rejected)

**Idea**: Use recently opened files to guess current project

**Rejected Because**:
- Violates "Claude Owl is standalone" constraint
- Unreliable and confusing
- No file system access to recent files on macOS sandboxing

### Alternative 2: Continue User-Level Only (Rejected)

**Idea**: Only support user-level configs, ignore project-level

**Rejected Because**:
- Doesn't match Claude Code behavior
- Users need project-specific MCP servers, skills, etc.
- Limits Claude Owl's usefulness for multi-project developers

### Alternative 3: Project Workspace Mode (Considered)

**Idea**: Add "Open Project" button, load entire project context

**Why Not Chosen**:
- Over-engineered for current needs
- Claude Owl should remain lightweight
- Can be added later if needed

**Why Keep as Future Option**:
- Could enable features like project file browser
- Would support "Open in Terminal at Project"
- Natural evolution if demand exists

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Task 1.1: Create ProjectsService
- [ ] Task 1.2: Create ProjectContext state management
- [ ] Task 1.3: Update PathService
- [ ] Task 2.1: Update MCPService
- [ ] Task 2.2: Update SkillsService

### Week 2: Services & IPC
- [ ] Task 2.3: Update AgentsService
- [ ] Task 2.4: Update CommandsService
- [ ] Task 2.5: Update HooksService
- [ ] Task 3.1-3.5: Update all IPC handlers

### Week 3: UI Components
- [ ] Task 4.1: Create ProjectSelector component
- [ ] Task 4.2: Create ScopeSelector component
- [ ] Task 4.3-4.7: Update all feature pages
- [ ] Task 5.1-5.5: Update all React hooks
- [ ] Task 6.1: Update Settings page

### Week 4: Polish & Testing
- [ ] Task 7.1-7.3: Documentation & migration
- [ ] Task 8.1-8.3: All tests
- [ ] Code review
- [ ] QA testing
- [ ] Release

---

## Success Metrics

1. **Functional**: Users can configure project-level MCP servers and verify in `.claude.json`
2. **UX**: New users understand User vs Project scope within 30 seconds
3. **Quality**: Zero `process.cwd()` usage in services
4. **Compatibility**: Existing user-level configs continue to work
5. **Performance**: Project selection UI loads in <100ms

---

## References

- [Claude Code Settings Documentation](https://code.claude.com/docs/en/settings)
- [CLAUDE.md Design Constraints](/home/user/claude-owl/CLAUDE.md)
- [User's .claude.json Example](#user-provided-claude-json)
- [Current SettingsService Implementation](src/main/services/SettingsService.ts)

---

## Appendix A: Complete Feature Matrix

| Feature | Current State | User Level Support | Project Level Support | Migration Required |
|---------|---------------|-------------------|----------------------|-------------------|
| **MCP Servers** | User only | ✅ Works | ❌ Broken | Yes - Add project selector |
| **Skills** | Both broken | ❌ Wrong path | ❌ Wrong path | Yes - Fix paths |
| **Agents** | Both broken | ❌ Wrong path | ❌ Wrong path | Yes - Fix paths |
| **Slash Commands** | Both broken | ❌ Wrong path | ❌ Wrong path | Yes - Fix paths |
| **Hooks** | Unknown | ❓ | ❓ | Review needed |
| **Permissions** | Works | ✅ Works | ⚠️ Untested | Test & verify |
| **Settings** | Works | ✅ Works | ⚠️ Partial | Enhance UI |

---

## Appendix B: .claude.json Schema

Based on user's example and Claude Code behavior:

```typescript
interface ClaudeConfigFile {
  // User-level configs (top-level)
  numStartups?: number;
  theme?: string;
  mcpServers?: Record<string, MCPServerConfig>;

  // Project-level configs (nested)
  projects?: Record<string, ProjectConfig>; // Key is absolute path

  // Other user preferences
  [key: string]: unknown;
}

interface ProjectConfig {
  // Project-specific MCP servers
  mcpServers?: Record<string, MCPServerConfig>;

  // Project-specific settings
  allowedTools?: string[];
  context?: Record<string, unknown>;
  dontCrawlDirectory?: boolean;
  enableArchitectTool?: boolean;
  mcpContextUris?: string[];
  approvedMcprcServers?: string[];
  rejectedMcprcServers?: string[];
  hasTrustDialogAccepted?: boolean;
  ignorePatterns?: string[];

  // Usage metrics
  lastCost?: number;
  lastAPIDuration?: number;
  lastTotalInputTokens?: number;

  [key: string]: unknown;
}
```

---

## Appendix C: User Flow Diagrams

### Flow 1: Configure User-Level MCP Server

```
User Opens Claude Owl
  ↓
Navigate to MCP Page
  ↓
Scope Selector shows "User Level" (default)
  ↓
Click "Add MCP Server"
  ↓
Fill form (name, command, args)
  ↓
Click Save
  ↓
Writes to ~/.claude.json top-level mcpServers
  ↓
Success ✓
```

### Flow 2: Configure Project-Level MCP Server

```
User Opens Claude Owl
  ↓
Navigate to MCP Page
  ↓
Click Project Selector → Select "my-awesome-app"
  ↓
Click Scope Selector → Select "Project Level"
  ↓
Click "Add MCP Server"
  ↓
Fill form (name, command, args)
  ↓
Click Save
  ↓
Writes to ~/.claude.json projects["/path/to/my-awesome-app"].mcpServers
  ↓
Success ✓
```

### Flow 3: Add New Project

```
User clicks Project Selector
  ↓
Click "+ Add New Project..."
  ↓
Modal opens with directory picker
  ↓
User selects /Users/me/Projects/new-project
  ↓
Validates directory exists
  ↓
Adds to ~/.claude.json projects section
  ↓
Project now appears in selector
  ↓
Success ✓
```

---

## Sign-off

- [ ] Product Owner: Approved
- [ ] UX Designer: Approved
- [ ] Tech Lead: Approved
- [ ] Development Team: Committed to timeline

---

**Last Updated:** 2025-11-15
**Next Review:** After Phase 1 completion (Week 1)
