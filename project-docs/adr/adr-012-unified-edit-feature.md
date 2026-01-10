# ADR-012: Unified Edit Feature for Markdown-Based Configurations

**Status:** Proposed
**Date:** 2026-01-10
**Decision Makers:** Product Team, Engineering Team
**Stakeholders:** Claude Owl Users
**Related:** ADR-005 (Project Selection UX), ADR-011 (Plugins Manager)

---

## Executive Summary

This ADR defines a unified editing experience across all Markdown-based configurations in Claude Owl: **Subagents**, **Skills**, **Slash Commands**, **Plugins** (plugin-provided components), and **Hooks**. Currently, these features have inconsistent edit capabilities, UI patterns, and implementation approaches. This ADR establishes:

1. **A consistent edit pattern** across all MD-based configurations
2. **Shared reusable components** for the edit experience
3. **Clear editing constraints** (what can/cannot be edited)
4. **Implementation tasks** to bring all features to parity

---

## Context and Problem Statement

Claude Owl manages several types of configurations that are ultimately stored as Markdown files with YAML frontmatter:

| Feature | File Format | Current Edit Support | Gaps |
|---------|-------------|---------------------|------|
| **Slash Commands** | `.md` with frontmatter | ✅ Full CRUD + 2-step wizard | Best implementation |
| **Subagents** | `.md` with frontmatter | ✅ Full CRUD via modal | Good, minor gaps |
| **Skills** | `.md` with frontmatter | ⚠️ Create only, no Edit UI | Missing edit button |
| **Hooks** | JSON in `settings.json` | ❌ Read-only, external editor | Major gap |
| **Plugins** | Plugin-managed MD files | ❌ Cannot edit plugin files | By design |

### Core Problems

1. **Inconsistent UX**: Users encounter different paradigms when editing different configuration types:
   - Commands: Two-step wizard with raw markdown editor option
   - Subagents: Single modal with form fields
   - Skills: Create-only modal (no edit capability exposed)
   - Hooks: "Edit in settings.json" button opens external editor

2. **Missing Edit Features**: Skills have backend support for updates but no UI to access it. Users must delete and recreate skills to make changes.

3. **Code Duplication**: Each feature implements its own modal, validation, and save logic with subtle differences.

4. **Inconsistent Validation Patterns**: Some features validate in real-time, others on submit. Error display varies.

5. **Hooks Are Not First-Class Citizens**: Unlike other features, hooks can only be edited via external JSON file editing, breaking the Claude Owl experience.

---

## Decision: Unified Edit Architecture

### 1. Feature Classification

We classify Claude Owl configurations into three editability tiers:

#### Tier 1: Fully Editable (User/Project owned)
- **Slash Commands** (user-level, project-level)
- **Subagents** (user-level, project-level)
- **Skills** (user-level, project-level)
- **Hooks** (user-level, project-level settings.json)

These can be created, read, updated, and deleted through Claude Owl.

#### Tier 2: Read-Only Display
- **Plugin-provided Commands** (from installed plugins)
- **Plugin-provided Subagents** (from installed plugins)
- **Plugin-provided Skills** (from installed plugins)
- **Plugin-provided Hooks** (from installed plugins)
- **MCP-provided Commands** (from MCP servers)

These are displayed with a "Plugin" or "MCP" badge but cannot be edited. Users can:
- View details
- Copy configuration to create editable user/project version
- Disable/enable the source plugin

#### Tier 3: CLI-Managed (No Edit)
- Plugin installation state (use `/plugin install/uninstall`)
- MCP server configurations (use `claude mcp add/remove`)

These are managed via CLI delegation per ADR-004 and ADR-011.

### 2. Unified Edit Modal Pattern

All Tier 1 configurations will use a consistent edit modal pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│  Edit [Type]: [Name]                                        [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Tab: Form] [Tab: Raw Markdown]                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Form View ────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  Name: [my-agent____________] (disabled if editing)        │ │
│  │                                                             │ │
│  │  Description: [________________________________]           │ │
│  │               [________________________________]           │ │
│  │                                                             │ │
│  │  [Scope Selector: User / Project]                          │ │
│  │                                                             │ │
│  │  [Type-specific fields...]                                 │ │
│  │    - Subagents: Model, Tools, System Prompt               │ │
│  │    - Skills: Allowed Tools, Instructions                  │ │
│  │    - Commands: Model, Allowed Tools, Argument Hint        │ │
│  │    - Hooks: Event Type, Matcher, Hook Config              │ │
│  │                                                             │ │
│  │  Content/Instructions/System Prompt:                       │ │
│  │  [________________________________________________________] │ │
│  │  [________________________________________________________] │ │
│  │  [________________________________________________________] │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Raw Markdown View (Toggle) ───────────────────────────────┐ │
│  │                                                             │ │
│  │  ---                                                        │ │
│  │  name: my-agent                                             │ │
│  │  description: An awesome agent                              │ │
│  │  model: sonnet                                              │ │
│  │  ---                                                        │ │
│  │                                                             │ │
│  │  # System Prompt                                            │ │
│  │                                                             │ │
│  │  You are a specialized agent...                             │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Unsaved changes indicator when dirty]                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Cancel]                     [Save Changes] or [Create]       │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Shared Components Architecture

Create a unified component library for editing:

```
src/renderer/components/common/
├── MarkdownEditor/
│   ├── MarkdownEditor.tsx          # Main tabbed editor (Form + Raw)
│   ├── MarkdownFormView.tsx        # Form-based editing view
│   ├── MarkdownRawView.tsx         # Raw markdown editing view
│   ├── MarkdownPreview.tsx         # Preview rendered markdown
│   └── index.ts
│
├── EditModal/
│   ├── EditModal.tsx               # Base modal wrapper with consistent styling
│   ├── EditModalHeader.tsx         # Title, badges, close button
│   ├── EditModalFooter.tsx         # Cancel, Save buttons with loading state
│   ├── UnsavedChangesAlert.tsx     # "You have unsaved changes" dialog
│   └── index.ts
│
├── FormFields/
│   ├── NameField.tsx               # Name input with kebab-case validation
│   ├── DescriptionField.tsx        # Description textarea with char limit
│   ├── ContentField.tsx            # Large markdown textarea
│   ├── ToolsField.tsx              # Comma-separated tools input
│   ├── ModelSelector.tsx           # Model dropdown (sonnet/opus/haiku/inherit)
│   └── index.ts
│
└── ScopeSelector/                  # Already exists (ADR-005)
    └── ScopeSelector.tsx
```

### 4. Feature-Specific Edit Configurations

Each feature extends the base components with specific fields:

#### 4.1 Subagents (`AgentEditConfig`)
```typescript
interface AgentEditFields {
  name: string;           // kebab-case, immutable on edit
  description: string;    // required, max 1024 chars
  model: AgentModelAlias; // sonnet | opus | haiku | inherit | default
  tools: string[];        // optional, comma-separated
  content: string;        // system prompt (required)
}
```

#### 4.2 Skills (`SkillEditConfig`)
```typescript
interface SkillEditFields {
  name: string;             // kebab-case, immutable on edit
  description: string;      // required, max 1024 chars
  allowedTools: string[];   // optional, comma-separated
  content: string;          // instructions (required)
}
```

#### 4.3 Slash Commands (`CommandEditConfig`)
```typescript
interface CommandEditFields {
  name: string;                   // kebab-case, can change (renames file)
  description: string;            // required
  argumentHint?: string;          // optional
  model?: 'sonnet' | 'opus' | 'haiku'; // optional
  allowedTools?: string[];        // optional
  disableModelInvocation?: boolean;
  namespace?: string;             // optional grouping
  content: string;                // command content (required)
}
```

#### 4.4 Hooks (`HookEditConfig`) - NEW
```typescript
interface HookEditFields {
  event: HookEventType;           // PreToolUse | PostToolUse | etc.
  matcher?: string;               // glob pattern or tool name
  type: 'command' | 'prompt';     // execution type
  command?: string;               // shell command (if type=command)
  prompt?: string;                // AI prompt (if type=prompt)
  timeout?: number;               // execution timeout in ms
}

type HookEventType =
  | 'PreToolUse'      // Before Claude uses a tool
  | 'PostToolUse'     // After Claude uses a tool
  | 'Notification'    // Notification events
  | 'Stop'            // Session stop event
  | 'SubagentStop';   // Subagent completion
```

### 5. Edit Constraints Matrix

| Field | Create | Edit | Rationale |
|-------|--------|------|-----------|
| **Name** | ✅ Editable | ❌ Disabled | Changing name = new file, keep original |
| **Description** | ✅ Editable | ✅ Editable | Can always update |
| **Scope/Location** | ✅ Editable | ❌ Disabled | Changing scope = move file |
| **Content/Prompt** | ✅ Editable | ✅ Editable | Primary reason for editing |
| **Type-specific fields** | ✅ Editable | ✅ Editable | Model, tools, etc. |

**Why disable Name and Scope on Edit?**
- Changing name would create a new file while leaving the old one orphaned
- Changing scope (user ↔ project) requires file move operations
- Users should explicitly use "Move" or "Copy" actions for these operations

### 6. Hooks Manager Redesign

Hooks are currently the most deficient feature. This ADR proposes a full redesign:

#### Current State (❌ Problems)
- Hooks displayed in read-only list
- "Edit in settings.json" opens external text editor
- No validation, no structured editing
- No create/delete within Claude Owl

#### Proposed State (✅ Full Edit Support)
```
┌─────────────────────────────────────────────────────────────────┐
│  Hooks                                                          │
├─────────────────────────────────────────────────────────────────┤
│  [+ Create Hook]                              [Filter: All ▼]   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ PreToolUse: Bash(*)                                  [User] ││
│  │ Validates bash commands before execution                    ││
│  │ Type: Command  •  Timeout: 10s                              ││
│  │                                    [View] [Edit] [Delete]   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ PostToolUse: Edit(src/**)                          [Project]││
│  │ Logs file edits to audit trail                              ││
│  │ Type: Command  •  Timeout: 5s                               ││
│  │                                    [View] [Edit] [Delete]   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Hook Edit Modal
```
┌─────────────────────────────────────────────────────────────────┐
│  Create Hook                                                [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Event Type: [PreToolUse ▼]                                     │
│    PreToolUse     - Before tool execution                       │
│    PostToolUse    - After tool execution                        │
│    Notification   - On notifications                            │
│    Stop           - Session end                                 │
│    SubagentStop   - Subagent completion                        │
│                                                                 │
│  Matcher (optional): [Bash(**)_________________________]        │
│    Pattern to match specific tools (e.g., Bash(npm *))         │
│                                                                 │
│  Hook Type: [● Command] [○ Prompt]                              │
│                                                                 │
│  ┌─ If Command ───────────────────────────────────────────────┐ │
│  │ Command: [/path/to/script.sh $TOOL_NAME________________]   │ │
│  │                                                             │ │
│  │ Environment Variables Available:                            │ │
│  │   $TOOL_NAME, $TOOL_INPUT, $HOOK_EVENT, $SESSION_ID        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ If Prompt ────────────────────────────────────────────────┐ │
│  │ Prompt: [Review this tool usage for security issues...]   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Timeout: [10000] ms  (max 60000)                               │
│                                                                 │
│  [Scope Selector: User / Project]                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Cancel]                                         [Create Hook] │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Plugin Component Handling

Plugin-provided configurations (commands, agents, skills, hooks) cannot be edited directly. The UI should:

1. **Display "Plugin" Badge**: Clear indication this is read-only
2. **Show Source Plugin**: "From: code-review plugin"
3. **Disable Edit Button**: Grayed out with tooltip "Plugin configurations cannot be edited"
4. **Offer "Copy to User/Project"**: Creates an editable copy

```
┌─────────────────────────────────────────────────────────────────┐
│  Agent: architecture-reviewer                     [Plugin] [⚙️] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⓘ This agent is provided by the "code-review" plugin.         │
│    Plugin configurations cannot be edited directly.             │
│                                                                 │
│  [View Details]  [Copy to User Location]  [Copy to Project]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Foundation (Shared Components)

**Task 1.1: Create `EditModal` Base Component**
- Location: `src/renderer/components/common/EditModal/`
- Standardized modal structure with header, body, footer
- Escape key handling
- Unsaved changes detection
- Loading states during save

**Task 1.2: Create `MarkdownEditor` Component**
- Location: `src/renderer/components/common/MarkdownEditor/`
- Tabbed interface (Form / Raw Markdown)
- Bidirectional sync between form and raw views
- Syntax highlighting for raw view
- Frontmatter + content parsing/serialization

**Task 1.3: Create Shared Form Field Components**
- Location: `src/renderer/components/common/FormFields/`
- `NameField` - kebab-case validation, immutable mode
- `DescriptionField` - character limit, multiline
- `ContentField` - large markdown textarea
- `ToolsField` - comma-separated with chips display
- `ModelSelector` - standardized model dropdown

**Task 1.4: Add "Copy to User/Project" Utility**
- Add copy functionality to detail modals
- Support for plugin → user/project copying
- Pre-fill create modal with copied data

### Phase 2: Skills Edit Feature

**Task 2.1: Add Edit Button to `SkillDetailModal`**
- File: `src/renderer/components/SkillsManager/SkillsManager.tsx`
- Add "Edit" button next to "Delete" in footer (for non-plugin skills)
- Wire to open `SkillEditModal`

**Task 2.2: Create `SkillEditModal` Component**
- Refactor `SkillCreateModal` to support edit mode
- Accept `skill?: Skill` prop (null = create, defined = edit)
- Pre-populate form with existing skill data
- Disable name field when editing

**Task 2.3: Add Update Skill Hook**
- File: `src/renderer/hooks/useSkills.ts`
- Add `updateSkill()` function (may already exist as `createSkill` overwrites)
- Verify backend `SkillsService.saveSkill()` handles updates correctly

**Task 2.4: Write Tests**
- Test editing existing skill
- Test field immutability (name disabled)
- Test unsaved changes warning

### Phase 3: Hooks Full CRUD Implementation

**Task 3.1: Create Hook IPC Types**
- File: `src/shared/types/ipc.hooks.types.ts`
- Add new channels: `CREATE_HOOK`, `UPDATE_HOOK`, `DELETE_HOOK`
- Define `CreateHookRequest`, `UpdateHookRequest`, `DeleteHookRequest`

**Task 3.2: Extend `HooksService` with Write Operations**
- File: `src/main/services/HooksService.ts`
- Add `createHook()` - adds hook to settings.json
- Add `updateHook()` - modifies existing hook
- Add `deleteHook()` - removes hook from settings.json
- Ensure proper JSON serialization with comments preserved

**Task 3.3: Add Hook IPC Handlers**
- File: `src/main/ipc/hooksHandlers.ts`
- Add handlers for new channels
- Include logging per CLAUDE.md guidelines

**Task 3.4: Create `HookEditModal` Component**
- File: `src/renderer/components/HooksManager/HookEditModal.tsx`
- Event type dropdown (PreToolUse, PostToolUse, etc.)
- Matcher pattern input with examples
- Hook type radio (command/prompt)
- Conditional command/prompt input
- Timeout configuration

**Task 3.5: Update `HooksManager` UI**
- File: `src/renderer/components/HooksManager/HooksManager.tsx`
- Add "Create Hook" button in header
- Add "Edit" and "Delete" buttons per hook
- Remove "Edit in settings.json" link
- Add confirmation dialog for delete

**Task 3.6: Create `useHooks` Hook Write Functions**
- File: `src/renderer/hooks/useHooks.ts`
- Add `createHook()`, `updateHook()`, `deleteHook()` functions
- Wire to IPC handlers

**Task 3.7: Write Hook Tests**
- Test hook creation with all event types
- Test hook editing
- Test hook deletion
- Test validation (timeout limits, required fields)

### Phase 4: Subagents Enhancements

**Task 4.1: Add Raw Markdown View Option**
- Update `AgentEditModal` with tabbed interface
- Allow switching between form and raw markdown editing
- Sync bidirectionally

**Task 4.2: Add Unsaved Changes Detection**
- Track form dirty state
- Show confirmation dialog on close with unsaved changes
- Match Skills pattern

**Task 4.3: Add "Copy to User/Project" for Plugin Agents**
- In `AgentDetailModal`, add copy actions for plugin-sourced agents
- Pre-fill edit modal with copied data

### Phase 5: Commands Consistency

**Task 5.1: Align with Unified Pattern**
- Commands already have the best implementation
- Ensure shared components from Phase 1 are integrated
- Update imports to use shared `EditModal`, `FormFields`

**Task 5.2: Add Plugin Command Handling**
- Display plugin commands as read-only
- Add "Copy to User/Project" action
- Show source plugin information

### Phase 6: Cross-Feature Polish

**Task 6.1: Unified Keyboard Shortcuts**
- `Escape` - Close modal (with unsaved changes check)
- `Cmd/Ctrl + S` - Save (when modal focused)
- Consistent across all edit modals

**Task 6.2: Unified Validation Messages**
- Standardize error message format
- Use same `Alert` component pattern everywhere
- Real-time validation where possible

**Task 6.3: Accessibility Audit**
- Ensure proper focus management in modals
- Add ARIA labels to form fields
- Keyboard navigation support

**Task 6.4: E2E Test Suite**
- Test full CRUD flow for each feature
- Test plugin read-only behavior
- Test cross-feature consistency

---

## Implementation Gaps Summary

| Feature | Gap | Priority | Effort |
|---------|-----|----------|--------|
| **Skills** | No Edit button in detail modal | High | Small |
| **Skills** | No Edit modal (only Create) | High | Medium |
| **Hooks** | No Create/Edit/Delete in UI | Critical | Large |
| **Hooks** | Uses external editor fallback | Critical | - |
| **Subagents** | No raw markdown view option | Medium | Small |
| **Subagents** | No unsaved changes detection | Medium | Small |
| **Commands** | Best implementation, use as reference | - | - |
| **All Features** | No shared edit components | High | Medium |
| **All Features** | Plugin copy-to-user feature | Medium | Medium |

---

## Technical Specifications

### Backend Changes

#### New IPC Channels
```typescript
// src/shared/types/ipc.hooks.types.ts
export const HOOKS_CHANNELS = {
  // Existing
  GET_ALL_HOOKS: 'hooks:get-all',
  GET_TEMPLATES: 'hooks:get-templates',
  GET_SETTINGS_PATH: 'hooks:get-settings-path',
  OPEN_SETTINGS_FILE: 'hooks:open-settings',

  // New
  CREATE_HOOK: 'hooks:create',
  UPDATE_HOOK: 'hooks:update',
  DELETE_HOOK: 'hooks:delete',
  VALIDATE_HOOK: 'hooks:validate',
} as const;
```

#### HooksService Extensions
```typescript
// src/main/services/HooksService.ts

interface HookDefinition {
  event: HookEventType;
  matcher?: string;
  type: 'command' | 'prompt';
  command?: string;
  prompt?: string;
  timeout?: number;
}

class HooksService {
  async createHook(
    hook: HookDefinition,
    scope: 'user' | 'project',
    projectPath?: string
  ): Promise<{ success: boolean; error?: string }>;

  async updateHook(
    hookId: string, // Generated identifier for the hook
    updates: Partial<HookDefinition>,
    scope: 'user' | 'project',
    projectPath?: string
  ): Promise<{ success: boolean; error?: string }>;

  async deleteHook(
    hookId: string,
    scope: 'user' | 'project',
    projectPath?: string
  ): Promise<{ success: boolean; error?: string }>;
}
```

### Frontend Changes

#### Shared Edit Modal Props
```typescript
// src/renderer/components/common/EditModal/types.ts

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: { text: string; variant: BadgeVariant };
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

interface EditModalFooterProps {
  onCancel: () => void;
  onSave: () => void;
  isLoading?: boolean;
  isSaveDisabled?: boolean;
  saveLabel?: string; // "Save Changes" | "Create" | "Update"
  cancelLabel?: string;
}
```

#### Feature Edit Configs
```typescript
// src/renderer/components/common/MarkdownEditor/configs/

export const agentEditConfig: EditConfig = {
  type: 'agent',
  fields: [
    { key: 'name', type: 'name', required: true, immutableOnEdit: true },
    { key: 'description', type: 'description', required: true },
    { key: 'model', type: 'model', required: false },
    { key: 'tools', type: 'tools', required: false },
    { key: 'content', type: 'content', required: true, label: 'System Prompt' },
  ],
  frontmatterKeys: ['name', 'description', 'model', 'tools'],
};

export const skillEditConfig: EditConfig = {
  type: 'skill',
  fields: [
    { key: 'name', type: 'name', required: true, immutableOnEdit: true },
    { key: 'description', type: 'description', required: true },
    { key: 'allowed-tools', type: 'tools', required: false },
    { key: 'content', type: 'content', required: true, label: 'Instructions' },
  ],
  frontmatterKeys: ['name', 'description', 'allowed-tools'],
};

export const commandEditConfig: EditConfig = {
  type: 'command',
  fields: [
    { key: 'name', type: 'name', required: true, immutableOnEdit: false },
    { key: 'description', type: 'description', required: true },
    { key: 'argument-hint', type: 'text', required: false },
    { key: 'model', type: 'model', required: false },
    { key: 'allowed-tools', type: 'tools', required: false },
    { key: 'disable-model-invocation', type: 'boolean', required: false },
    { key: 'content', type: 'content', required: true, label: 'Command Content' },
  ],
  frontmatterKeys: ['description', 'argument-hint', 'model', 'allowed-tools', 'disable-model-invocation'],
};

export const hookEditConfig: EditConfig = {
  type: 'hook',
  isJson: true, // Hooks are JSON, not Markdown
  fields: [
    { key: 'event', type: 'select', required: true, options: HOOK_EVENT_TYPES },
    { key: 'matcher', type: 'text', required: false },
    { key: 'type', type: 'radio', required: true, options: ['command', 'prompt'] },
    { key: 'command', type: 'text', required: false, showIf: { type: 'command' } },
    { key: 'prompt', type: 'content', required: false, showIf: { type: 'prompt' } },
    { key: 'timeout', type: 'number', required: false, default: 10000 },
  ],
};
```

---

## Consequences

### Positive

✅ **Consistent UX**: Users learn one edit pattern, apply everywhere
✅ **Reduced Code Duplication**: Shared components reduce maintenance
✅ **Skills Edit Support**: Previously missing feature now available
✅ **Hooks Full CRUD**: Major gap closed, no more external editor
✅ **Better Accessibility**: Unified keyboard shortcuts and ARIA labels
✅ **Plugin Safety**: Clear read-only indication for plugin configs
✅ **Copy Functionality**: Easy migration from plugin to custom configs

### Negative

⚠️ **Migration Effort**: Significant refactoring of existing components
⚠️ **Testing Overhead**: More shared components = more test permutations
⚠️ **Hooks Complexity**: JSON editing is different from Markdown patterns
⚠️ **Breaking UX Changes**: Users accustomed to current patterns need adjustment

### Mitigations

1. **Incremental Rollout**: Phase implementation to limit blast radius
2. **Feature Flags**: Consider flags for new hooks editing (v1 external, v2 in-app)
3. **Visual Consistency**: Use similar layouts so users feel familiar
4. **Documentation**: Update user guide with new editing workflows

---

## Alternatives Considered

### Alternative 1: Keep External Editor for Hooks ❌
**Approach:** Maintain "Edit in settings.json" pattern for hooks.
**Rejected:** Breaks Claude Owl's value proposition of visual configuration management. Users expect in-app editing.

### Alternative 2: Monaco Editor Integration ❌
**Approach:** Use Monaco (VS Code) editor for raw markdown/JSON editing.
**Rejected:** Adds significant bundle size (~2MB). Simple textarea + syntax highlighting sufficient for MVP.

### Alternative 3: Feature-Specific Edit Components ❌
**Approach:** Each feature maintains its own edit implementation.
**Rejected:** Current state. Leads to inconsistency and code duplication.

### Alternative 4: CLI-Only Editing ❌
**Approach:** Remove in-app editing, redirect all edits to CLI commands.
**Rejected:** Defeats purpose of Claude Owl as a visual configuration tool.

---

## Success Metrics

1. **Feature Parity**: All Tier 1 configurations have full CRUD support
2. **Code Reduction**: 30%+ reduction in edit-related component code via shared components
3. **User Feedback**: No "how do I edit X?" support questions
4. **Test Coverage**: >85% coverage for edit operations

---

## References

- **ADR-005**: Project Selection UX (ScopeSelector component)
- **ADR-011**: Plugins Manager Production (plugin handling patterns)
- **Claude Code Docs**: https://code.claude.com/docs/en/skills, /sub-agents, /slash-commands, /hooks
- **Current Implementations**:
  - Commands: `src/renderer/components/CommandEditor/`
  - Subagents: `src/renderer/components/AgentsManager/`
  - Skills: `src/renderer/components/SkillsManager/`
  - Hooks: `src/renderer/components/HooksManager/`

---

## Appendix A: File Locations Quick Reference

| Feature | User Location | Project Location |
|---------|---------------|------------------|
| Subagents | `~/.claude/agents/*.md` | `{PROJECT}/.claude/agents/*.md` |
| Skills | `~/.claude/skills/{name}/instructions.md` | `{PROJECT}/.claude/skills/{name}/instructions.md` |
| Commands | `~/.claude/commands/*.md` | `{PROJECT}/.claude/commands/*.md` |
| Hooks | `~/.claude/settings.json` → `hooks[]` | `{PROJECT}/.claude/settings.json` → `hooks[]` |

---

## Appendix B: Hook Event Types Reference

| Event | Description | Available Variables |
|-------|-------------|---------------------|
| `PreToolUse` | Before Claude executes a tool | `$TOOL_NAME`, `$TOOL_INPUT` |
| `PostToolUse` | After Claude executes a tool | `$TOOL_NAME`, `$TOOL_INPUT`, `$TOOL_OUTPUT` |
| `Notification` | On notification events | `$MESSAGE`, `$NOTIFICATION_TYPE` |
| `Stop` | When session ends | `$SESSION_ID`, `$STOP_REASON` |
| `SubagentStop` | When subagent completes | `$AGENT_NAME`, `$RESULT` |

---

## Appendix C: Validation Rules

### Name Field
- Pattern: `^[a-z0-9]+(-[a-z0-9]+)*$`
- Max length: 64 characters
- Must be unique within scope

### Description Field
- Max length: 1024 characters
- Required for all types

### Content/Prompt Field
- Required for all types
- No length limit (reasonable)

### Timeout Field (Hooks only)
- Type: positive integer
- Max: 60000 (60 seconds)
- Default: 10000 (10 seconds)

---

**Next Steps:** Review with team, prioritize phases, begin Phase 1 implementation.
