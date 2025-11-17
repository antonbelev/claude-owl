# ADR-005: Unified Project Selection UX for Scoped Features

**Status:** Proposed
**Date:** 2025-11-16
**Deciders:** Product Owner, Engineering Team, UX Design
**Context:** Multi-scope feature management (user vs project level)

---

## Context and Problem Statement

Claude Owl allows users to create and manage various configurations at either **user-level** (global, `~/.claude/`) or **project-level** (project-specific, `{PROJECT}/.claude/`):

- **MCP Servers** - Add Server dialog has scope dropdown
- **Slash Commands** - Create Command has location selector (user/project)
- **Subagents** - Create/Edit has location selector (user/project)
- **Skills** - Create/Edit has location selector (user/project)
- **Hooks** - Create/Edit has location selector (user/project)

**Critical Issue:** When users select "project" scope, there is **NO mechanism to choose WHICH project**. This creates several problems:

1. **Broken User Experience**: User selects "project" but the app doesn't know which project to configure
2. **Design Constraint Violation**: Claude Owl is a standalone desktop app (not project-aware). It has no inherent concept of "current project" like an IDE would
3. **Inconsistent Implementation**: Settings page has project selection via `ProjectSelector` component, but other features don't use it
4. **Architectural Debt**: `ProjectContext`, `ProjectDiscoveryService`, and `ProjectSelector` exist but are isolated to Settings page

### Evidence of the Problem

**MCP Servers** (`src/renderer/components/MCPServersManager/AddServerForm.tsx:106`):
```typescript
scope: 'user', // Default to user scope - HARDCODED
```
Comment at line 306: "To manage project-specific servers... select a project **in a future update**"

**Slash Commands** (`src/renderer/components/CommandEditor/CommandConfigForm.tsx:158-177`):
```typescript
<RadioGroup value={location} onValueChange={(v: string) => onLocationChange(v as 'user' | 'project')}>
  <RadioGroupItem value="user" id="location-user" />
  <RadioGroupItem value="project" id="location-project" />
</RadioGroup>
```
❌ No project selection when user chooses "project"

**Subagents** (`src/renderer/components/AgentsManager/AgentsManager.tsx:332-334`):
```typescript
const [location, setLocation] = useState<'user' | 'project'>(
  (agent?.location as 'user' | 'project') || 'user'
);
```
❌ No project selection when user chooses "project"

---

## Decision: Unified Project Selection Architecture

We will implement a **consistent, app-wide pattern** for project-scoped features:

### 1. Centralized Project Context

**Existing Infrastructure** (already implemented, but underutilized):
- `ProjectContext` (`src/renderer/contexts/ProjectContext.tsx`) - React context for global project selection state
- `ProjectDiscoveryService` (`src/main/services/ProjectDiscoveryService.ts`) - Reads projects from `~/.claude.json`
- `ProjectSelector` (`src/renderer/components/ProjectSelector/ProjectSelector.tsx`) - UI for project selection

**Decision:** Elevate `ProjectContext` to **application-wide scope** and integrate it with all features that support project-level configurations.

### 2. Two-Phase Selection Pattern

When creating/editing a scoped configuration:

#### Phase 1: Scope Selection
User chooses between:
- **User-level**: Applies globally to all projects (`~/.claude/`)
- **Project-level**: Applies to a specific project (`{PROJECT}/.claude/`)

#### Phase 2: Project Selection (if Project-level chosen)
- **If user chooses "project"**: Display project picker using `ProjectSelector` component
- **If user chooses "user"**: Skip project selection, proceed directly

### 3. UX Pattern: Inline Project Picker

**Before (Broken):**
```
┌─────────────────────────────────────┐
│ Add MCP Server                      │
├─────────────────────────────────────┤
│ Scope: [User ▼] [Project]          │ ← User can select "Project"
│                                     │
│ Server Name: [................]     │
│ Command: [...................]      │
│                                     │
│              [Add Server]           │
└─────────────────────────────────────┘
                                        ❌ Which project?
```

**After (Fixed):**
```
┌─────────────────────────────────────┐
│ Add MCP Server                      │
├─────────────────────────────────────┤
│ Scope: [User] [●Project]            │ ← User selects "Project"
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📁 Select Project               │ │ ← Project picker appears
│ │                                 │ │
│ │ ○ ~/dev/my-app                  │ │
│ │ ● ~/work/client-project         │ │ ← User selects project
│ │ ○ ~/experiments/test            │ │
│ │                                 │ │
│ │ [Refresh Projects]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Server Name: [................]     │
│ Command: [...................]      │
│                                     │
│              [Add Server]           │
└─────────────────────────────────────┘
                                        ✅ Project: ~/work/client-project
```

### 4. New Reusable Component: `ScopeSelector`

Create a **unified component** that handles both scope selection and project picking:

```typescript
// src/renderer/components/common/ScopeSelector.tsx

export interface ScopeSelectorProps {
  scope: 'user' | 'project';
  selectedProject: ProjectInfo | null;
  onScopeChange: (scope: 'user' | 'project') => void;
  onProjectChange: (project: ProjectInfo | null) => void;
  compact?: boolean; // Optional compact mode for small dialogs
}

export const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  scope,
  selectedProject,
  onScopeChange,
  onProjectChange,
  compact = false
}) => {
  return (
    <div className="space-y-4">
      {/* Scope Toggle */}
      <RadioGroup value={scope} onValueChange={onScopeChange}>
        <RadioGroupItem value="user">
          User-level (Global)
        </RadioGroupItem>
        <RadioGroupItem value="project">
          Project-level (Specific)
        </RadioGroupItem>
      </RadioGroup>

      {/* Project Picker (conditional) */}
      {scope === 'project' && (
        <ProjectPicker
          selectedProject={selectedProject}
          onSelect={onProjectChange}
          compact={compact}
        />
      )}
    </div>
  );
};
```

### 5. New Reusable Component: `ProjectPicker`

Extract and generalize the project selection UI from `ProjectSelector`:

```typescript
// src/renderer/components/common/ProjectPicker.tsx

export interface ProjectPickerProps {
  selectedProject: ProjectInfo | null;
  onSelect: (project: ProjectInfo | null) => void;
  compact?: boolean; // Compact mode shows fewer details
  allowUserLevel?: boolean; // Allow selecting "None" for user-level
}

export const ProjectPicker: React.FC<ProjectPickerProps> = ({
  selectedProject,
  onSelect,
  compact = false,
  allowUserLevel = false
}) => {
  const { projects, loading, error, refetch } = useProjects();

  if (loading) return <ProjectPickerSkeleton />;
  if (error) return <ProjectPickerError error={error} onRetry={refetch} />;
  if (projects.length === 0) return <NoProjectsFound />;

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Select Project</h4>
        <Button variant="ghost" size="sm" onClick={refetch}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Search (if not compact) */}
      {!compact && <SearchBar />}

      {/* Project List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {allowUserLevel && (
          <ProjectPickerItem
            label="User-level (All Projects)"
            isSelected={!selectedProject}
            onClick={() => onSelect(null)}
          />
        )}

        {projects.map(project => (
          <ProjectPickerItem
            key={project.path}
            project={project}
            isSelected={selectedProject?.path === project.path}
            onClick={() => onSelect(project)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

**1.1 Create Reusable Components**

- [ ] `src/renderer/components/common/ScopeSelector.tsx`
  - Combines scope toggle + project picker
  - Manages internal state
  - Exposes callbacks for parent components

- [ ] `src/renderer/components/common/ProjectPicker.tsx`
  - Extracted from `ProjectSelector`
  - Compact mode for modal dialogs
  - Search functionality (optional for compact mode)
  - Loading/error states
  - "No projects" empty state with instructions

- [ ] `src/renderer/components/common/ProjectPickerItem.tsx`
  - Individual project card/row
  - Compact and full modes
  - Shows project name, path, MCP server count

**1.2 Update Type Definitions**

```typescript
// src/shared/types/ipc.types.ts

// Add projectPath to all scoped requests
export interface AddMCPServerRequest {
  name: string;
  transport: 'stdio' | 'http' | 'sse';
  scope: 'user' | 'project';
  projectPath?: string; // Required if scope === 'project'
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface SaveCommandRequest {
  name: string;
  description: string;
  content: string;
  location: 'user' | 'project';
  projectPath?: string; // Required if location === 'project'
  namespace?: string;
  model?: string;
  allowedTools?: string[];
  argumentHint?: string;
  disableModelInvocation?: boolean;
}

export interface SaveAgentRequest {
  name: string;
  description: string;
  content: string;
  location: 'user' | 'project';
  projectPath?: string; // Required if location === 'project'
  model?: string;
  tools?: string[];
}

export interface SaveSkillRequest {
  name: string;
  description: string;
  content: string;
  location: 'user' | 'project';
  projectPath?: string; // Required if location === 'project'
  // ... other fields
}
```

**1.3 Add Runtime Validation**

```typescript
// src/shared/utils/validation.utils.ts

export function validateScopedRequest(request: {
  scope?: 'user' | 'project';
  location?: 'user' | 'project';
  projectPath?: string;
}): { valid: boolean; error?: string } {
  const scope = request.scope || request.location;

  if (scope === 'project' && !request.projectPath) {
    return {
      valid: false,
      error: 'projectPath is required when scope/location is "project"'
    };
  }

  if (scope === 'project' && request.projectPath) {
    // Validate that projectPath is absolute
    if (!path.isAbsolute(request.projectPath)) {
      return {
        valid: false,
        error: 'projectPath must be an absolute path'
      };
    }
  }

  return { valid: true };
}
```

### Phase 2: Retrofit Existing Features (Week 2)

**2.1 MCP Servers**

File: `src/renderer/components/MCPServersManager/AddServerForm.tsx`

**Changes:**
```typescript
import { ScopeSelector } from '../common/ScopeSelector';
import { useProjectContext } from '@/renderer/contexts/ProjectContext';

export const AddServerForm: React.FC<AddServerFormProps> = ({ onSubmit, onCancel }) => {
  const [scope, setScope] = useState<'user' | 'project'>('user');
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate project selection
    if (scope === 'project' && !selectedProject) {
      setError('Please select a project');
      return;
    }

    const config: AddMCPServerRequest = {
      name: name.trim(),
      transport,
      scope,
      projectPath: scope === 'project' ? selectedProject?.path : undefined,
      // ... rest of config
    };

    await onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Scope Selection */}
      <ScopeSelector
        scope={scope}
        selectedProject={selectedProject}
        onScopeChange={setScope}
        onProjectChange={setSelectedProject}
        compact={true}
      />

      {/* Rest of form... */}
    </form>
  );
};
```

**Backend Changes:**
```typescript
// src/main/services/MCPService.ts

async addServer(request: AddMCPServerRequest): Promise<void> {
  console.log('[MCPService] Adding MCP server:', {
    name: request.name,
    scope: request.scope,
    projectPath: request.projectPath
  });

  // Validate request
  const validation = validateScopedRequest(request);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let configPath: string;

  if (request.scope === 'user') {
    // User-level: ~/.claude/settings.json
    configPath = pathService.getUserSettingsPath();
  } else {
    // Project-level: {PROJECT}/.claude/settings.json
    configPath = pathService.getProjectSettingsPath(request.projectPath!);
  }

  // Write MCP server configuration
  // ...
}
```

**2.2 Slash Commands**

File: `src/renderer/components/CommandEditor/CommandConfigForm.tsx`

Replace lines 155-177 with `ScopeSelector`:

```typescript
<ScopeSelector
  scope={location}
  selectedProject={selectedProject}
  onScopeChange={onLocationChange}
  onProjectChange={onProjectChange}
  compact={true}
/>
```

**2.3 Subagents**

File: `src/renderer/components/AgentsManager/AgentsManager.tsx`

Update `AgentEditModal` component:

```typescript
const AgentEditModal: React.FC<AgentEditModalProps> = ({ agent, onClose, onSave }) => {
  const [location, setLocation] = useState<'user' | 'project'>('user');
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

  const handleSave = async () => {
    // Validation
    if (location === 'project' && !selectedProject) {
      setValidationError('Please select a project');
      return;
    }

    const agentData: Omit<Agent, 'lastModified'> = {
      frontmatter,
      content: content.trim(),
      filePath: agent?.filePath || '',
      location,
      projectPath: location === 'project' ? selectedProject?.path : undefined,
    };

    const success = await onSave(agentData);
    if (success) onClose();
  };

  return (
    <Modal>
      {/* ... */}

      <ScopeSelector
        scope={location}
        selectedProject={selectedProject}
        onScopeChange={setLocation}
        onProjectChange={setSelectedProject}
      />

      {/* ... rest of form */}
    </Modal>
  );
};
```

**2.4 Skills**

File: `src/renderer/components/SkillsManager/*` (similar pattern)

**2.5 Hooks**

File: `src/renderer/components/HooksManager/*` (similar pattern)

### Phase 3: Enhanced UX (Week 3)

**3.1 Remember Last Selected Project**

```typescript
// Store in localStorage
const RECENT_PROJECT_KEY = 'claude-owl:recent-project';

export function useRecentProject() {
  const getRecentProject = (): string | null => {
    return localStorage.getItem(RECENT_PROJECT_KEY);
  };

  const setRecentProject = (projectPath: string) => {
    localStorage.setItem(RECENT_PROJECT_KEY, projectPath);
  };

  return { getRecentProject, setRecentProject };
}
```

Integrate into `ProjectPicker`:
- Auto-select last used project when scope changes to "project"
- Show "Recently Used" badge on last selected project

**3.2 Quick Project Switching**

Add to app header/navigation:
```
┌──────────────────────────────────────────────┐
│  Claude Owl    [📁 ~/work/client-project ▼] │
├──────────────────────────────────────────────┤
│                                              │
│  Project dropdown shows:                     │
│  ● ~/work/client-project (current)           │
│  ○ ~/dev/my-app                              │
│  ○ User-level (Global)                       │
└──────────────────────────────────────────────┘
```

**3.3 Contextual Warnings**

When editing project-scoped items, show warning if project directory doesn't exist:

```typescript
const ProjectValidationWarning: React.FC<{ projectPath: string }> = ({ projectPath }) => {
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    window.electronAPI.checkProjectExists(projectPath).then(result => {
      setExists(result.exists);
    });
  }, [projectPath]);

  if (exists === false) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Project directory does not exist: {projectPath}
          <br />
          The configuration will be saved, but won't take effect until the directory exists.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
```

**3.4 Bulk Operations**

Settings page enhancement:
```
┌─────────────────────────────────────────────┐
│ Settings                                    │
├─────────────────────────────────────────────┤
│ Apply to: [● User-level] [○ Project]        │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🔀 Copy Settings to Project             │ │
│ │                                         │ │
│ │ Select projects to copy user settings:  │ │
│ │ ☑ ~/work/client-project                 │ │
│ │ ☑ ~/dev/my-app                          │ │
│ │ ☐ ~/experiments/test                    │ │
│ │                                         │ │
│ │         [Copy to Selected Projects]     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Phase 4: Testing (Week 3-4)

**4.1 Unit Tests**

```typescript
// tests/unit/components/ScopeSelector.test.tsx
describe('ScopeSelector', () => {
  it('should show project picker when scope is project', () => {
    const { getByText, queryByText } = render(
      <ScopeSelector
        scope="user"
        selectedProject={null}
        onScopeChange={vi.fn()}
        onProjectChange={vi.fn()}
      />
    );

    expect(queryByText(/select project/i)).not.toBeInTheDocument();

    fireEvent.click(getByText(/project-level/i));
    expect(queryByText(/select project/i)).toBeInTheDocument();
  });

  it('should require project selection when scope is project', () => {
    const onSubmit = vi.fn();
    const { getByText } = render(<AddServerForm onSubmit={onSubmit} />);

    // Select project scope but don't choose project
    fireEvent.click(getByText(/project-level/i));
    fireEvent.click(getByText(/add server/i));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(getByText(/please select a project/i)).toBeInTheDocument();
  });
});

// tests/unit/services/MCPService.test.ts
describe('MCPService', () => {
  it('should save to project path when scope is project', async () => {
    const request: AddMCPServerRequest = {
      name: 'test-server',
      scope: 'project',
      projectPath: '/home/user/my-project',
      // ...
    };

    await mcpService.addServer(request);

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/home/user/my-project/.claude/settings.json',
      expect.any(String)
    );
  });

  it('should throw error if projectPath missing for project scope', async () => {
    const request: AddMCPServerRequest = {
      name: 'test-server',
      scope: 'project',
      // projectPath missing!
    };

    await expect(mcpService.addServer(request)).rejects.toThrow(
      /projectPath is required/i
    );
  });
});
```

**4.2 Integration Tests**

```typescript
// tests/integration/project-scoped-features.test.ts
describe('Project-scoped Features', () => {
  it('should allow creating MCP server for specific project', async () => {
    // 1. Discover projects
    const projects = await window.electronAPI.getProjects();
    expect(projects.data).toHaveLength(2);

    // 2. Select project scope
    const { getByText, getByLabelText } = render(<AddServerForm />);
    fireEvent.click(getByText(/project-level/i));

    // 3. Select project
    fireEvent.click(getByText(projects.data[0].name));

    // 4. Fill form and submit
    fireEvent.change(getByLabelText(/server name/i), {
      target: { value: 'test-server' }
    });
    fireEvent.click(getByText(/add server/i));

    // 5. Verify server saved to project
    const projectSettings = await fs.readFile(
      path.join(projects.data[0].path, '.claude/settings.json'),
      'utf-8'
    );
    expect(projectSettings).toContain('test-server');
  });
});
```

**4.3 E2E Tests (Playwright)**

```typescript
// tests/e2e/project-selection.spec.ts
test('full workflow: create project-scoped MCP server', async ({ page }) => {
  await page.goto('/');

  // Navigate to MCP page
  await page.click('text=MCP Servers');

  // Click Add Server
  await page.click('text=Add Server');

  // Select project scope
  await page.click('text=Project-level');

  // Wait for project picker
  await page.waitForSelector('text=Select Project');

  // Select first project
  await page.click('text=my-project');

  // Fill form
  await page.fill('input[name="name"]', 'test-server');
  await page.selectOption('select[name="transport"]', 'stdio');
  await page.fill('input[name="command"]', 'npx');

  // Submit
  await page.click('button:has-text("Add Server")');

  // Verify success
  await expect(page.locator('text=Server added successfully')).toBeVisible();
});
```

---

## Consequences

### Positive

✅ **Consistent UX**: All features use the same project selection pattern
✅ **Design Constraint Compliance**: Explicit project selection (Claude Owl is standalone app)
✅ **Type Safety**: `projectPath` required in IPC types when scope is 'project'
✅ **Reusability**: `ScopeSelector` and `ProjectPicker` components shared across features
✅ **Discoverability**: Users see all Claude-initialized projects from `.claude.json`
✅ **Validation**: Runtime checks prevent saving project-scoped configs without project selection
✅ **Better DX**: Developers follow established pattern when adding new scoped features

### Negative

⚠️ **Migration Effort**: Retrofit 5 existing features (MCP, Commands, Agents, Skills, Hooks)
⚠️ **Additional UI Complexity**: Forms become longer with project picker
⚠️ **Breaking Change**: IPC types change (requires version bump)
⚠️ **Testing Overhead**: More test cases for scope + project combinations

### Mitigations

1. **Compact Mode**: `ProjectPicker` has compact mode for small dialogs
2. **Smart Defaults**: Remember last selected project, auto-select if only one project exists
3. **Graceful Degradation**: If no projects exist, show helpful message with "Initialize Claude Code" instructions
4. **Backwards Compatibility**: Support loading old configs without `projectPath` (assume user-level)
5. **Incremental Rollout**: Ship features one at a time (MCP → Commands → Agents → Skills → Hooks)

---

## Alternatives Considered

### Alternative 1: Global Project Context Only ❌

**Approach:** Use `ProjectContext` globally, automatically apply selected project to all operations.

**Rejected because:**
- User might want to create user-level config even when project is selected
- Confusing mental model: "Why is MCP server going to this project?"
- Forces users to switch global context repeatedly
- Doesn't work for batch operations across projects

### Alternative 2: Manual Path Input ❌

**Approach:** Ask user to type project path instead of selecting from list.

**Rejected because:**
- Poor UX (typing paths is error-prone)
- No validation that project is Claude-initialized
- Users may not remember exact paths
- Doesn't leverage existing `.claude.json` project registry

### Alternative 3: Project Dropdown in App Header ❌

**Approach:** IDE-like global project selector in app header.

**Rejected because:**
- Doesn't align with standalone app nature
- Confusing when user wants to edit multiple projects
- Still needs scope selector in each form
- Creates ambiguity about "current" project

### Alternative 4: Separate Pages per Project ❌

**Approach:** Navigate to project first, then manage configs.

**Example:**
```
Projects → Select "my-app" → MCP Servers (for my-app)
                          → Commands (for my-app)
                          → Agents (for my-app)
```

**Rejected because:**
- Too many navigation levels
- Hard to compare user vs project configs side-by-side
- Doesn't work well for quick edits
- Overkill for most operations

---

## Migration Path

### v0.3.0 - Foundation

- ✅ Create `ScopeSelector` component
- ✅ Create `ProjectPicker` component
- ✅ Add validation utilities
- ✅ Update IPC type definitions
- ✅ Write unit tests for new components

### v0.4.0 - MCP Servers

- ✅ Retrofit MCP Add Server form
- ✅ Update `MCPService` to handle project path
- ✅ Update IPC handlers
- ✅ Integration tests
- ✅ Update documentation

### v0.5.0 - Slash Commands

- ✅ Retrofit Command Editor
- ✅ Update `CommandsService`
- ✅ Integration tests

### v0.6.0 - Subagents & Skills

- ✅ Retrofit Agents Manager
- ✅ Retrofit Skills Manager
- ✅ Update services
- ✅ Integration tests

### v0.7.0 - Hooks & Enhancements

- ✅ Retrofit Hooks Manager
- ✅ Recent project memory
- ✅ Quick project switcher
- ✅ Bulk operations UI
- ✅ E2E tests

---

## Security Considerations

### Path Traversal Protection

```typescript
// Validate projectPath is safe
function validateProjectPath(projectPath: string): boolean {
  // Must be absolute path
  if (!path.isAbsolute(projectPath)) {
    throw new Error('Project path must be absolute');
  }

  // Must be a real directory
  if (!fs.existsSync(projectPath)) {
    throw new Error('Project directory does not exist');
  }

  // Must be a directory (not file)
  const stat = fs.statSync(projectPath);
  if (!stat.isDirectory()) {
    throw new Error('Project path must be a directory');
  }

  // Must not traverse outside home directory (optional security layer)
  const homePath = homedir();
  const normalizedPath = path.normalize(projectPath);
  if (!normalizedPath.startsWith(homePath)) {
    throw new Error('Project must be within home directory');
  }

  return true;
}
```

### Read-Only `.claude.json`

**CRITICAL:** Never write to `.claude.json` even with this architecture. It remains CLI-managed.

```typescript
// CORRECT: Read projects from .claude.json
const projects = await projectDiscoveryService.getProjects();

// CORRECT: Write to project's settings
await settingsService.saveProjectSettings(projectPath, settings);

// ❌ WRONG: Never do this
await fs.writeFile('~/.claude.json', ...); // FORBIDDEN
```

---

## Documentation Updates

### User Documentation

**docs/user-guide/project-scoped-configs.md**
- Explain user vs project scope
- Show screenshots of project selection
- Explain when to use each scope
- FAQ: "Why do I need to select a project?"

**docs/user-guide/getting-started.md**
- Add section: "Initializing Projects with Claude Code"
- Explain how Claude Owl discovers projects from `.claude.json`

### Developer Documentation

**CLAUDE.md** (update)
```markdown
## Working with Scoped Features

When adding a feature that supports both user-level and project-level configurations:

1. Import `ScopeSelector` component
2. Add `scope` and `selectedProject` to component state
3. Validate project selection before submission
4. Pass `projectPath` in IPC request (if scope === 'project')
5. Add validation in backend service
6. Write tests for both scopes

See ADR-005 for complete architecture.
```

**docs/adr/adr-005-project-selection-ux.md** (this document)

---

## Success Metrics

### User Experience Metrics

- **Discoverability**: 90% of users discover project selection within first use
- **Error Rate**: <5% of project-scoped saves fail due to missing project selection
- **Task Completion Time**: Average time to create project-scoped config <2 minutes

### Technical Metrics

- **Code Reuse**: `ScopeSelector` used in 5+ features
- **Test Coverage**: >85% coverage for scope selection logic
- **Bug Reports**: <3 bugs related to project selection per release

---

## References

- **ADR-001**: Settings Management Architecture (foundation for this ADR)
- **CLAUDE.md**: Design Constraint - Claude Owl is standalone app
- **GitHub Issue**: *(Link to issue tracking this work)*
- **Figma**: *(Link to UX mockups if available)*

---

## Decision Owners

- **Product Owner**: Approval on UX pattern
- **Engineering Team**: Implementation plan
- **Security Review**: Path validation logic
- **QA**: Testing strategy

---

## Appendix: Component API Reference

### ScopeSelector

```typescript
interface ScopeSelectorProps {
  scope: 'user' | 'project';
  selectedProject: ProjectInfo | null;
  onScopeChange: (scope: 'user' | 'project') => void;
  onProjectChange: (project: ProjectInfo | null) => void;
  compact?: boolean;
  className?: string;
  disabled?: boolean;
}
```

### ProjectPicker

```typescript
interface ProjectPickerProps {
  selectedProject: ProjectInfo | null;
  onSelect: (project: ProjectInfo | null) => void;
  compact?: boolean;
  allowUserLevel?: boolean;
  maxHeight?: string;
  showSearch?: boolean;
  className?: string;
  disabled?: boolean;
}
```

### useProjects Hook

```typescript
interface UseProjectsReturn {
  projects: ProjectInfo[];
  loading: boolean;
  error: string | null;
  configExists: boolean;
  refetch: () => Promise<void>;
}

function useProjects(): UseProjectsReturn;
```

---

**Next Steps:** Review with team, get approval, begin implementation Phase 1.
