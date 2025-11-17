# ADR-001: Settings Management Architecture

**Status:** Accepted
**Date:** 2025-11-15
**Deciders:** Engineering Team
**Context:** Configuration file management for Claude Owl desktop application

---

## Context and Problem Statement

Claude Owl needs to manage Claude Code configuration files across multiple scopes (user-level and project-level). The configuration landscape has evolved, and despite official documentation stating `.claude.json` is deprecated, it remains actively used by Claude Code CLI.

**Key Challenge:** Claude Owl is a **standalone desktop application** (not project-aware) but needs to enable users to manage both user-level and project-specific settings safely.

---

## Current State: How Claude Code Actually Works

### Evidence from Real-World Usage

Based on [GitHub Issue #10839](https://github.com/anthropics/claude-code/issues/10839) and actual file system inspection:

1. **`.claude.json` is ACTIVELY managed by Claude CLI** despite documentation claiming it's deprecated since v2.0.8
2. The file is **auto-created** and **auto-recreated** by Claude Code
3. Users **cannot prevent** its creation or modification
4. It contains critical project tracking information
5. The "modern" hierarchy (`settings.json`, `.claude/settings.json`) exists alongside `.claude.json`

### Actual File Structure on User Systems

```
~/.claude.json                    # ⚠️ CLI-managed, project tracking
~/.claude/
  ├── settings.json              # ✅ User-level settings (Claude Owl can edit)
  ├── skills/                    # ✅ User-level skills
  ├── projects/                  # CLI-managed session data
  │   └── -home-user-myproject/
  │       └── *.jsonl           # Session transcripts
  └── session-env/              # CLI-managed

{PROJECT_ROOT}/.claude/
  ├── settings.json              # ✅ Project-level settings (Claude Owl can edit)
  ├── settings.local.json        # ✅ Local overrides (gitignored)
  ├── skills/                    # ✅ Project-level skills
  ├── hooks/                     # ✅ Hook scripts
  └── commands/                  # ✅ Slash commands

{PROJECT_ROOT}/.mcp.json         # ⚠️ CLI-managed, project MCP servers
```

---

## ~/.claude.json Structure

### What It Contains

```json
{
  "installMethod": "unknown",
  "autoUpdates": true,
  "cachedStatsigGates": { ... },
  "firstStartTime": "2025-11-15T11:51:02.807Z",
  "userID": "925ecf5f99f4...",
  "sonnet45MigrationComplete": true,

  "projects": {
    "/home/user/my-project": {
      "allowedTools": [],
      "mcpContextUris": [],
      "mcpServers": {
        "my-server": {
          "type": "stdio",
          "command": "node",
          "args": ["server.js"]
        }
      },
      "enabledMcpjsonServers": [],
      "disabledMcpjsonServers": [],
      "hasTrustDialogAccepted": false,
      "ignorePatterns": [],
      "projectOnboardingSeenCount": 0,
      "hasClaudeMdExternalIncludesApproved": false,
      "exampleFiles": [...],
      "lastSessionId": "abc123"
    }
  },

  "fallbackAvailableWarningThreshold": 0.5
}
```

### Critical Fields for Claude Owl

- `projects` - **Key-value map** of project paths to project configuration
  - Key: Absolute file system path (e.g., `/home/user/my-project`)
  - Value: Project configuration object with:
    - `mcpServers` - Project-specific MCP server definitions
    - `allowedTools` - Project-specific tool permissions (deprecated field)
    - `ignorePatterns` - Files to exclude from context
    - `lastSessionId` - Most recent session identifier

---

## Decision: Configuration Management Strategy

### 1. File Access Policy

| File | Managed By | Claude Owl Access | Purpose |
|------|-----------|-------------------|---------|
| `~/.claude.json` | **Claude CLI** | **Read Only** | Project discovery, MCP server display |
| `~/.claude/settings.json` | **User/Claude Owl** | **Read/Write** | User-level settings across all projects |
| `{PROJECT}/.claude/settings.json` | **User/Claude Owl** | **Read/Write*** | Project-specific settings |
| `{PROJECT}/.claude/settings.local.json` | **User/Claude Owl** | **Read/Write*** | Local overrides (gitignored) |
| `{PROJECT}/.mcp.json` | **Claude CLI** | **Read Only** | Project MCP servers (alternative storage) |

**\*After project selection** - Claude Owl only accesses project files after user explicitly selects a project.

### 2. User Workflow

#### Phase 1: User-Level Settings (Current State) ✅

```
Claude Owl → Read/Write → ~/.claude/settings.json
```

**Capabilities:**
- Edit permissions (allow/ask/deny)
- Configure hooks
- Set environment variables
- Configure global MCP settings
- All settings apply to every project

#### Phase 2: Project Selection (Future) 🔄

```
Step 1: Claude Owl → Read → ~/.claude.json
        Extract: projects = { "/path/a": {...}, "/path/b": {...} }

Step 2: Display project list to user
        [📁 /home/user/my-app]
        [📁 /home/user/another-project]
        [📁 /workspace/client-work]

Step 3: User selects project → Claude Owl knows project path

Step 4: Claude Owl → Read/Write → {PROJECT}/.claude/settings.json
```

**Capabilities:**
- User sees all Claude-initialized projects
- Explicit project selection
- Edit project-specific settings
- Settings only apply to selected project
- Safely manage `.claude/settings.json` in project directory

---

## Rationale

### Why NOT Write to ~/.claude.json?

1. **CLI Ownership**: Claude CLI actively manages this file (auto-creates, auto-updates)
2. **File Locking**: Risk of conflicts if both CLI and Claude Owl write simultaneously
3. **Unknown Fields**: Contains CLI-managed fields (`cachedStatsigGates`, `userID`, etc.) we don't understand
4. **Schema Evolution**: CLI may change structure without notice
5. **Corruption Risk**: One bad write could break Claude Code initialization

### Why Use ~/.claude.json for Project Discovery?

1. **Single Source of Truth**: CLI maintains accurate list of all initialized projects
2. **Reliable**: File always exists once Claude Code is initialized
3. **No Guessing**: We don't need to scan filesystem or ask user for project paths
4. **Consistent**: Projects added via CLI automatically appear in Claude Owl

### Why Two-Phase Approach (User → Project)?

1. **Design Constraint Compliance**: Claude Owl is a standalone app, not project-aware
2. **User Control**: Explicit project selection prevents accidental edits to wrong project
3. **Safety**: Can't corrupt project settings if we don't know which project
4. **Clarity**: UI clearly shows "User Settings" vs "Project: /path/to/project"

---

## Consequences

### Positive

✅ **Safe**: Never corrupts CLI-managed files
✅ **Reliable**: Uses single source of truth for project discovery
✅ **Clear Separation**: User vs project settings clearly delineated
✅ **Future-Proof**: Works even if CLI changes `.claude.json` schema
✅ **No Conflicts**: No file locking issues with concurrent CLI usage

### Negative

⚠️ **Two-Step Process**: Users must select project before editing project settings
⚠️ **No Auto-Detection**: Can't automatically edit settings for "current project" (we're standalone)
⚠️ **Read-Only MCP Data**: Can't directly edit MCP servers in `.claude.json` (must use CLI or UI wrapper)

### Mitigations

1. **Smooth UX**: Make project selection prominent and easy
2. **Recent Projects**: Cache last-selected project for quick access
3. **CLI Integration**: Provide "Add MCP Server" button that calls `claude mcp add` via CLI
4. **Clear Messaging**: Explain why project selection is necessary

---

## Implementation Details

### Service Architecture

```typescript
// PathService - Centralized path resolution
class PathService {
  getUserSettingsPath(): string {
    return path.join(homedir(), '.claude', 'settings.json');
  }

  getProjectSettingsPath(projectPath: string): string {
    return path.join(projectPath, '.claude', 'settings.json');
  }

  getClaudeConfigPath(): string {
    // READ ONLY - for project discovery
    return path.join(homedir(), '.claude.json');
  }
}

// ProjectDiscoveryService - Extract projects from .claude.json
class ProjectDiscoveryService {
  async getProjects(): Promise<ProjectInfo[]> {
    const configPath = pathService.getClaudeConfigPath();
    const config = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(config);

    return Object.entries(parsed.projects || {}).map(([path, data]) => ({
      path,
      lastSessionId: data.lastSessionId,
      hasTrustAccepted: data.hasTrustDialogAccepted,
      mcpServers: Object.keys(data.mcpServers || {}),
    }));
  }

  async getProjectMCPServers(projectPath: string): Promise<MCPServer[]> {
    const configPath = pathService.getClaudeConfigPath();
    const config = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(config);

    const projectData = parsed.projects?.[projectPath];
    if (!projectData?.mcpServers) return [];

    return Object.entries(projectData.mcpServers).map(([name, config]) => ({
      name,
      ...config,
      scope: 'project',
      projectPath,
    }));
  }
}

// SettingsService - Read/Write settings files
class SettingsService {
  async getUserSettings(): Promise<ClaudeSettings> {
    const settingsPath = pathService.getUserSettingsPath();
    // Read ~/.claude/settings.json
  }

  async saveUserSettings(settings: ClaudeSettings): Promise<void> {
    const settingsPath = pathService.getUserSettingsPath();
    // Write ~/.claude/settings.json (with backup)
  }

  async getProjectSettings(projectPath: string): Promise<ClaudeSettings> {
    const settingsPath = pathService.getProjectSettingsPath(projectPath);
    // Read {PROJECT}/.claude/settings.json
  }

  async saveProjectSettings(
    projectPath: string,
    settings: ClaudeSettings
  ): Promise<void> {
    const settingsPath = pathService.getProjectSettingsPath(projectPath);
    // Write {PROJECT}/.claude/settings.json (with backup)
  }
}
```

### UI Components

```typescript
// Phase 1: User Settings (Current)
<SettingsPage scope="user">
  <PermissionRulesSection />
  <HooksSection />
  <EnvironmentVariablesSection />
  <SaveButton onClick={() => settingsService.saveUserSettings()} />
</SettingsPage>

// Phase 2: Project Selection + Project Settings (Future)
<ProjectSelectorPage>
  <ProjectList projects={projectDiscoveryService.getProjects()}>
    {projects.map(project => (
      <ProjectCard
        key={project.path}
        path={project.path}
        mcpServerCount={project.mcpServers.length}
        onClick={() => selectProject(project.path)}
      />
    ))}
  </ProjectList>
</ProjectSelectorPage>

<SettingsPage scope="project" projectPath={selectedProjectPath}>
  <ProjectBreadcrumb path={selectedProjectPath} />
  <PermissionRulesSection />
  <HooksSection />
  <EnvironmentVariablesSection />
  <SaveButton onClick={() => settingsService.saveProjectSettings(selectedProjectPath)} />
</SettingsPage>
```

---

## Settings Hierarchy and Merging

### Merge Priority (Lowest → Highest)

1. **User Settings** (`~/.claude/settings.json`)
2. **Project Settings** (`{PROJECT}/.claude/settings.json`)
3. **Local Settings** (`{PROJECT}/.claude/settings.local.json`)
4. **Managed Settings** (platform-specific, enterprise)

### Merge Rules

- **Arrays**: Concatenate and deduplicate (e.g., `allow` rules)
- **Objects**: Deep merge (e.g., `env` variables)
- **Primitives**: Override (later value wins)

**Example:**
```json
// User settings
{
  "permissions": {
    "allow": ["Bash(npm run test)"]
  },
  "env": {
    "NODE_ENV": "development"
  }
}

// Project settings
{
  "permissions": {
    "allow": ["Read(./src/**)", "Edit(./src/**)"]
  },
  "env": {
    "API_URL": "https://api.example.com"
  }
}

// Effective (merged)
{
  "permissions": {
    "allow": [
      "Bash(npm run test)",
      "Read(./src/**)",
      "Edit(./src/**)"
    ]
  },
  "env": {
    "NODE_ENV": "development",
    "API_URL": "https://api.example.com"
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('ProjectDiscoveryService', () => {
  it('should parse projects from .claude.json', async () => {
    const projects = await service.getProjects();
    expect(projects).toHaveLength(3);
    expect(projects[0].path).toBe('/home/user/my-project');
  });

  it('should extract MCP servers for project', async () => {
    const servers = await service.getProjectMCPServers('/home/user/my-project');
    expect(servers).toHaveLength(2);
    expect(servers[0].scope).toBe('project');
  });
});

describe('SettingsService', () => {
  it('should never write to .claude.json', async () => {
    // Attempt to save should throw or be ignored
  });

  it('should create backup before writing settings', async () => {
    await service.saveUserSettings({});
    expect(fs.existsSync('~/.claude/.backups/settings.user.*.json')).toBe(true);
  });
});
```

### Integration Tests

- Read `.claude.json` → Display projects → Select project → Read project settings
- Edit user settings → Save → Verify `.claude/settings.json` updated
- Edit project settings → Save → Verify `{PROJECT}/.claude/settings.json` updated
- Ensure `.claude.json` never modified by Claude Owl

---

## Migration Path

### Phase 1 (v0.2 - Current) ✅

- User-level settings fully editable
- Permission rules builder
- Environment variables editor
- Hooks configuration
- Settings validation and backup

### Phase 2 (v0.3 - Next)

- Project discovery UI
- Project selection workflow
- Project-specific settings editor
- MCP server display (read-only from `.claude.json`)
- "Open in Claude Code" button for selected project

### Phase 3 (v0.4 - Future)

- MCP server management via CLI wrapper (`claude mcp add/remove`)
- Skills management (user + project level)
- Slash commands management
- Quick project switching (recent projects cache)

---

## Alternatives Considered

### Alternative 1: Write to .claude.json ❌

**Rejected because:**
- High risk of file corruption
- Conflicts with CLI file locking
- Unknown schema changes by CLI
- Contains fields we don't understand

### Alternative 2: Auto-detect current project via process.cwd() ❌

**Rejected because:**
- Violates design constraint (Claude Owl is standalone app)
- Only works during `npm run dev:electron` (misleading)
- Users launch Claude Owl from Applications folder
- No concept of "current working directory" for installed app

### Alternative 3: Ask user to manually enter project path ❌

**Rejected because:**
- Poor UX (typing file paths is error-prone)
- No validation that project is Claude-initialized
- Users may not know exact paths
- `.claude.json` already has this information

---

## References

- [GitHub Issue #10839](https://github.com/anthropics/claude-code/issues/10839) - Evidence of `.claude.json` active usage
- File system inspection on development machine (see Context section)
- Claude Code CLI behavior analysis
- `CLAUDE.md` - Design Constraint: Claude Owl is standalone app

---

## Decision Owners

- **Architecture**: Engineering Team
- **Implementation**: Phase 1 (User Settings) - Completed
- **Next Steps**: Phase 2 (Project Discovery) - To be scheduled

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-15 | 1.0 | Initial ADR based on real-world analysis |
