# Project Selection UX Implementation Checklist

**ADR:** [ADR-005: Unified Project Selection UX](./adr/adr-005-project-selection-ux.md)
**Status:** Ready for Implementation
**Target:** v0.3.0 - v0.7.0

---

## Quick Summary

**Problem:** MCP Servers, Slash Commands, Subagents, Skills, and Hooks all allow "project" scope selection, but don't provide a way to choose WHICH project.

**Solution:** Create reusable `ScopeSelector` and `ProjectPicker` components that integrate with existing `ProjectContext` infrastructure.

---

## Phase 1: Foundation (v0.3.0) - Week 1

### 1.1 Create Reusable Components

- [ ] **ScopeSelector Component**
  - File: `src/renderer/components/common/ScopeSelector.tsx`
  - Props: `scope`, `selectedProject`, `onScopeChange`, `onProjectChange`, `compact`
  - Features:
    - [ ] Radio group for user/project selection
    - [ ] Conditional project picker display
    - [ ] Compact mode for small dialogs
    - [ ] Validation error display
  - Tests: `tests/unit/components/ScopeSelector.test.tsx`

- [ ] **ProjectPicker Component**
  - File: `src/renderer/components/common/ProjectPicker.tsx`
  - Props: `selectedProject`, `onSelect`, `compact`, `allowUserLevel`, `showSearch`
  - Features:
    - [ ] Project list from `useProjects` hook
    - [ ] Search/filter (optional, not in compact mode)
    - [ ] Loading state
    - [ ] Error state with retry
    - [ ] Empty state (no projects found)
    - [ ] Refresh button
    - [ ] Selected indicator (checkmark/radio)
    - [ ] MCP server count badge
  - Tests: `tests/unit/components/ProjectPicker.test.tsx`

- [ ] **ProjectPickerItem Component**
  - File: `src/renderer/components/common/ProjectPickerItem.tsx`
  - Modes: Compact vs Full
  - Features:
    - [ ] Project icon + name + path
    - [ ] Selection indicator
    - [ ] MCP server count (if >0)
    - [ ] Click handler
  - Tests: Covered in `ProjectPicker.test.tsx`

### 1.2 Update Type Definitions

- [ ] **IPC Types**
  - File: `src/shared/types/ipc.types.ts`
  - Changes:
    - [ ] Add `projectPath?: string` to `AddMCPServerRequest`
    - [ ] Add `projectPath?: string` to `SaveCommandRequest`
    - [ ] Add `projectPath?: string` to `SaveAgentRequest`
    - [ ] Add `projectPath?: string` to `SaveSkillRequest`
    - [ ] Add `projectPath?: string` to `SaveHookRequest`

- [ ] **Validation Types**
  - File: `src/shared/types/validation.types.ts`
  - New types:
    ```typescript
    export interface ScopedRequest {
      scope?: 'user' | 'project';
      location?: 'user' | 'project';
      projectPath?: string;
    }

    export interface ValidationResult {
      valid: boolean;
      error?: string;
    }
    ```

### 1.3 Create Validation Utilities

- [ ] **Validation Utils**
  - File: `src/shared/utils/validation.utils.ts`
  - Functions:
    - [ ] `validateScopedRequest(request: ScopedRequest): ValidationResult`
      - Check if `projectPath` provided when scope is 'project'
      - Check if `projectPath` is absolute path
      - Return validation result
    - [ ] `validateProjectPath(projectPath: string): ValidationResult`
      - Check if path is absolute
      - Check if directory exists
      - Check if path is within home directory (security)
  - Tests: `tests/unit/utils/validation.utils.test.ts`

### 1.4 Add Backend Validation

- [ ] **Path Validation Service**
  - File: `src/main/services/PathValidationService.ts`
  - Functions:
    - [ ] `validateProjectPath(projectPath: string): Promise<ValidationResult>`
    - [ ] `projectDirectoryExists(projectPath: string): Promise<boolean>`
    - [ ] `isWithinHomeDirectory(projectPath: string): boolean`
  - Tests: `tests/unit/services/PathValidationService.test.ts`

### 1.5 Documentation

- [ ] Update `CLAUDE.md`
  - Add section: "Adding Scoped Features" with code example
  - Reference ADR-005

- [ ] Create user guide
  - File: `docs/user-guide/project-scoped-configs.md`
  - Explain user vs project scope
  - Screenshots of project selection
  - FAQ section

---

## Phase 2: Retrofit Features (v0.4.0 - v0.6.0) - Week 2-3

### 2.1 MCP Servers (v0.4.0)

**Frontend Changes:**

- [ ] **AddServerForm.tsx**
  - File: `src/renderer/components/MCPServersManager/AddServerForm.tsx`
  - Changes:
    - [ ] Import `ScopeSelector`
    - [ ] Add state: `const [scope, setScope] = useState<'user' | 'project'>('user')`
    - [ ] Add state: `const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null)`
    - [ ] Add `<ScopeSelector>` component (line ~106, replacing hardcoded scope)
    - [ ] Add validation: Check project selected when scope is 'project'
    - [ ] Update submit handler: Include `projectPath` in request
    - [ ] Remove outdated comment at line 306
  - Tests: `tests/unit/components/AddServerForm.test.tsx`
    - [ ] Test scope selection
    - [ ] Test project selection
    - [ ] Test validation (project required when scope is 'project')

**Backend Changes:**

- [ ] **MCPService.ts**
  - File: `src/main/services/MCPService.ts`
  - Changes:
    - [ ] Update `addServer()` method
      - [ ] Add validation: Call `validateScopedRequest(request)`
      - [ ] Determine config path based on scope:
        - If 'user': `~/.claude/settings.json`
        - If 'project': `{projectPath}/.claude/settings.json`
      - [ ] Add logging for project path
    - [ ] Update `removeServer()` method (similar pattern)
    - [ ] Update `updateServer()` method (similar pattern)
  - Tests: `tests/unit/services/MCPService.test.ts`
    - [ ] Test saving to user path
    - [ ] Test saving to project path
    - [ ] Test error when projectPath missing for 'project' scope

- [ ] **mcpHandlers.ts**
  - File: `src/main/ipc/mcpHandlers.ts`
  - Changes:
    - [ ] Update handler logging to include `projectPath`
    - [ ] Add error handling for validation failures

**Integration Tests:**

- [ ] `tests/integration/mcp-project-scoped.test.ts`
  - [ ] Test adding MCP server to project
  - [ ] Test adding MCP server to user
  - [ ] Test validation errors

### 2.2 Slash Commands (v0.5.0)

**Frontend Changes:**

- [ ] **CommandConfigForm.tsx**
  - File: `src/renderer/components/CommandEditor/CommandConfigForm.tsx`
  - Changes:
    - [ ] Import `ScopeSelector`
    - [ ] Replace RadioGroup (lines 155-177) with `<ScopeSelector>`
    - [ ] Add props: `selectedProject`, `onProjectChange`
    - [ ] Update parent component to track selected project
  - Tests: `tests/unit/components/CommandConfigForm.test.tsx`

- [ ] **CommandEditor.tsx** (parent component)
  - Add state for `selectedProject`
  - Pass to `CommandConfigForm`

**Backend Changes:**

- [ ] **CommandsService.ts**
  - File: `src/main/services/CommandsService.ts`
  - Changes:
    - [ ] Update `saveCommand()` to handle project path
    - [ ] Determine file path based on location + projectPath
  - Tests: `tests/unit/services/CommandsService.test.ts`

- [ ] **commandsHandlers.ts**
  - Update IPC handlers

**Integration Tests:**

- [ ] `tests/integration/commands-project-scoped.test.ts`

### 2.3 Subagents (v0.6.0)

**Frontend Changes:**

- [ ] **AgentsManager.tsx**
  - File: `src/renderer/components/AgentsManager/AgentsManager.tsx`
  - Changes in `AgentEditModal`:
    - [ ] Import `ScopeSelector`
    - [ ] Add state: `selectedProject`
    - [ ] Add `<ScopeSelector>` component
    - [ ] Update validation
    - [ ] Update save handler
  - Tests: `tests/unit/components/AgentsManager.test.tsx`

**Backend Changes:**

- [ ] **AgentsService.ts**
  - File: `src/main/services/AgentsService.ts`
  - Changes:
    - [ ] Update `saveAgent()` to handle project path
  - Tests: `tests/unit/services/AgentsService.test.ts`

**Integration Tests:**

- [ ] `tests/integration/agents-project-scoped.test.ts`

### 2.4 Skills (v0.6.0)

**Frontend Changes:**

- [ ] **SkillsManager.tsx**
  - Similar pattern to Subagents
  - Tests: `tests/unit/components/SkillsManager.test.tsx`

**Backend Changes:**

- [ ] **SkillsService.ts**
  - Update `saveSkill()` to handle project path
  - Tests: `tests/unit/services/SkillsService.test.ts`

### 2.5 Hooks (v0.7.0)

**Frontend Changes:**

- [ ] **HooksManager.tsx** (if applicable)
  - Similar pattern

**Backend Changes:**

- [ ] **HooksService.ts**
  - Update save methods

---

## Phase 3: Enhanced UX (v0.7.0) - Week 3

### 3.1 Recent Project Memory

- [ ] **useRecentProject Hook**
  - File: `src/renderer/hooks/useRecentProject.ts`
  - Features:
    - [ ] Get recent project from localStorage
    - [ ] Set recent project to localStorage
    - [ ] Clear recent project
  - Key: `'claude-owl:recent-project'`

- [ ] **Integration with ScopeSelector**
  - Auto-select recent project when scope changes to 'project'
  - Update recent project when user selects different project

### 3.2 Quick Project Switcher (Optional)

- [ ] **App Header Enhancement**
  - Add global project dropdown in header
  - Shows current context (user-level or project)
  - Quick switch between projects

### 3.3 Contextual Warnings

- [ ] **ProjectValidationWarning Component**
  - File: `src/renderer/components/common/ProjectValidationWarning.tsx`
  - Features:
    - [ ] Check if project directory exists
    - [ ] Check if `.claude` directory exists
    - [ ] Show warning if directory missing
    - [ ] Show info about when settings will take effect

- [ ] **Integration**
  - Add to all forms using `ScopeSelector`
  - Display when project is selected but invalid

### 3.4 Bulk Operations (Optional)

- [ ] **Settings Copy Dialog**
  - Allow copying user settings to multiple projects
  - Multi-select project picker
  - Confirmation dialog

---

## Phase 4: Testing & Documentation (Week 3-4)

### 4.1 Unit Tests

**Component Tests:**
- [ ] `tests/unit/components/ScopeSelector.test.tsx`
  - Test scope switching
  - Test project picker visibility
  - Test compact mode
  - Test validation

- [ ] `tests/unit/components/ProjectPicker.test.tsx`
  - Test project list rendering
  - Test search functionality
  - Test selection
  - Test loading/error states
  - Test empty state

**Service Tests:**
- [ ] Update all service tests to include project path scenarios

**Utility Tests:**
- [ ] `tests/unit/utils/validation.utils.test.ts`
  - Test scope validation
  - Test project path validation

### 4.2 Integration Tests

- [ ] `tests/integration/project-scoped-features.test.ts`
  - Test MCP server creation (user + project)
  - Test command creation (user + project)
  - Test agent creation (user + project)
  - Test skill creation (user + project)
  - Test error cases (missing project selection)

### 4.3 E2E Tests (Playwright)

- [ ] `tests/e2e/project-selection.spec.ts`
  - Full workflow: Add MCP server to project
  - Full workflow: Create project command
  - Full workflow: Create project agent
  - Test project switcher
  - Test recent project memory

### 4.4 Documentation

**User Documentation:**
- [ ] `docs/user-guide/project-scoped-configs.md`
  - What is user vs project scope?
  - When to use each?
  - How to select a project?
  - FAQ
  - Screenshots

- [ ] `docs/user-guide/getting-started.md`
  - Add section: "Initializing Claude Code Projects"
  - Explain how Claude Owl discovers projects

**Developer Documentation:**
- [ ] Update `CLAUDE.md`
  - Add "Working with Scoped Features" section
  - Code example using `ScopeSelector`
  - Reference ADR-005

- [ ] `docs/developer-guide/adding-scoped-features.md`
  - Step-by-step guide for adding new scoped feature
  - Code templates
  - Testing checklist

---

## Success Criteria

### Must Have (Required for Release)

- [ ] All 5 features (MCP, Commands, Agents, Skills, Hooks) support project selection
- [ ] `ScopeSelector` component is reusable and used in all features
- [ ] User cannot save project-scoped config without selecting a project
- [ ] Backend validates `projectPath` when scope is 'project'
- [ ] Test coverage >85% for all new components and logic
- [ ] User documentation explains project selection
- [ ] Developer documentation includes code examples

### Nice to Have (Future Enhancements)

- [ ] Recent project memory
- [ ] Quick project switcher in header
- [ ] Bulk settings copy
- [ ] Project validation warnings
- [ ] Project directory auto-creation

---

## Pre-Release Checklist

Before merging to main:

- [ ] All unit tests passing (`npm run test:unit`)
- [ ] All integration tests passing (`npm run test:integration`)
- [ ] All E2E tests passing (`npm run test:e2e`)
- [ ] No linting errors (`npm run lint`)
- [ ] No type errors (`npm run typecheck`)
- [ ] All builds successful (`npm run build`)
- [ ] Manual testing on macOS
- [ ] Manual testing on Linux (if available)
- [ ] Documentation reviewed and approved
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately

---

## Rollout Plan

### v0.3.0 - Foundation
- Ship: `ScopeSelector`, `ProjectPicker`, validation utils
- No user-facing changes (infrastructure only)
- Internal testing

### v0.4.0 - MCP Servers
- First feature with project selection
- Beta testing with select users
- Gather feedback on UX

### v0.5.0 - Slash Commands
- Second feature
- Refine UX based on MCP feedback

### v0.6.0 - Subagents & Skills
- Two features at once (similar patterns)
- Performance testing with multiple projects

### v0.7.0 - Hooks & Enhancements
- Final feature
- Enhanced UX (recent projects, validation)
- Full E2E testing
- Public release announcement

---

## Risk Mitigation

### Risk: Breaking Changes

**Impact:** Existing users with project-scoped configs may break
**Mitigation:**
- Backwards compatibility: Support loading old configs without `projectPath`
- Assume user-level if `projectPath` missing
- Migration guide in CHANGELOG
- In-app migration warning

### Risk: User Confusion

**Impact:** Users don't understand when to use user vs project scope
**Mitigation:**
- Clear labels and descriptions
- Tooltips explaining each option
- Default to user-level (safer choice)
- User guide with screenshots

### Risk: Performance Issues

**Impact:** Loading many projects slows down UI
**Mitigation:**
- Lazy load project list (only when scope selector is shown)
- Virtual scrolling for project list (if >50 projects)
- Cache project list in memory
- Debounce search

### Risk: Path Traversal Attack

**Impact:** Malicious project path could access sensitive files
**Mitigation:**
- Validate project path is absolute
- Validate project path is directory
- Validate project path is within home directory
- Server-side validation (don't trust renderer)

---

## Next Steps

1. **Review ADR-005** with team
2. **Get approval** from product owner on UX
3. **Security review** of path validation logic
4. **Begin Phase 1** implementation
5. **Create GitHub issues** for each phase
6. **Set up project board** for tracking

---

## Questions for Team

1. **UX**: Should we default to "user" or remember last selected scope?
2. **UX**: Compact mode by default, or only for small dialogs?
3. **Security**: Is home directory restriction too strict? Allow other paths?
4. **Features**: Which features should ship first (priority order)?
5. **Testing**: What's acceptable test coverage threshold? (Currently 85%)
6. **Documentation**: Do we need video tutorials for project selection?

---

**Last Updated:** 2025-11-16
**Owner:** Engineering Team
**Status:** Ready for kickoff
