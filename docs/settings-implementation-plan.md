# Settings & Permission Rules Implementation Plan

**Target:** v0.2 - Core Foundations (Week 1-2)
**Goal:** Transform Claude Owl from viewer to editor - make settings actually editable

---

## Feature Gap Analysis

### Current State
- ✅ Settings viewer (read-only)
- ✅ Display effective configuration
- ❌ Cannot edit settings
- ❌ Cannot save changes
- ❌ No permission rules builder
- ❌ No environment variables editor

### Required Settings Coverage

#### Basic Settings
| Setting | Type | UI Component | Priority |
|---------|------|--------------|----------|
| `model` | String | Dropdown (haiku/sonnet/opus) | High |
| `env` | Object | Key-value editor | High |
| `cleanupPeriodDays` | Number | Number input | Medium |
| `includeCoAuthoredBy` | Boolean | Toggle | Medium |
| `apiKeyHelper` | String | File path picker | Low |
| `outputStyle` | String | Text input | Low |
| `companyAnnouncements` | Array | Array editor | Low |
| `statusLine` | Object | JSON editor | Low |

#### Permission Settings (CRITICAL)
| Setting | Type | UI Component | Priority |
|---------|------|--------------|----------|
| `allow` | String[] | Visual rule builder | **Critical** |
| `ask` | String[] | Visual rule builder | **Critical** |
| `deny` | String[] | Visual rule builder | **Critical** |
| `additionalDirectories` | String[] | Path array editor | Medium |
| `defaultMode` | Enum | Radio buttons | Medium |
| `disableBypassPermissionsMode` | String | Toggle | Low |

#### MCP Settings
| Setting | Type | UI Component | Priority |
|---------|------|--------------|----------|
| `enableAllProjectMcpServers` | Boolean | Toggle | Medium |
| `enabledMcpjsonServers` | String[] | String array editor | Medium |
| `disabledMcpjsonServers` | String[] | String array editor | Medium |

#### Sandbox Settings (macOS/Linux)
| Setting | Type | UI Component | Priority |
|---------|------|--------------|----------|
| `sandbox.enabled` | Boolean | Toggle | Low |
| `sandbox.autoAllowBashIfSandboxed` | Boolean | Toggle | Low |
| `sandbox.excludedCommands` | String[] | Array editor | Low |
| `sandbox.network.*` | Various | Nested form | Low |

---

## Permission Rules Reference

### Rule Format
Permission rules follow: `ToolName(pattern)` or `ToolName` alone.

### Available Tools
1. **Bash** - Shell commands (prefix matching)
2. **Read** - File reading (glob patterns)
3. **Edit** - File editing (glob patterns)
4. **Write** - File creation (glob patterns)
5. **WebFetch** - URL fetching (domain patterns)
6. **WebSearch** - Web search
7. **NotebookEdit** - Jupyter editing
8. **SlashCommand** - Custom commands

### Pattern Examples

**Bash (prefix matching):**
```json
"Bash(npm run lint)"       // Matches: npm run lint, npm run lint:fix
"Bash(npm run test:*)"     // Explicit wildcard (still prefix)
"Bash(git diff:*)"         // Git diff commands
"Bash(curl:*)"             // All curl commands
```

**File Operations (glob patterns):**
```json
"Read(.env)"               // Single file
"Read(./.env.*)"           // All .env variants
"Read(./secrets/**)"       // Recursive directory
"Edit(./config/**/*.json)" // All JSON in config
```

**Network:**
```json
"WebFetch"                        // All web fetch
"WebFetch(domain:anthropic.com)"  // Specific domain
```

### Permission Levels
- **deny** - Highest priority, blocks access
- **ask** - Requires user confirmation
- **allow** - Auto-approved

---

## UX Design - Permission Rules Builder

### 1. Template Library
Pre-built security templates that generate multiple rules:

```
┌─────────────────────────────────────────────────────────┐
│ 🛡️ Security Templates                                    │
├─────────────────────────────────────────────────────────┤
│ ⚡ Block environment files (.env, .env.*)               │
│ ⚡ Allow npm commands (test, build, lint)               │
│ ⚡ Restrict git operations (allow read-only)            │
│ ⚡ Block secrets directory                              │
│ ⚡ Allow web fetch to specific domains                  │
└─────────────────────────────────────────────────────────┘
```

**Templates to implement:**
1. **Block Environment Files**
   - Deny: `Read(.env)`, `Read(.env.*)`
   - Deny: `Edit(.env)`, `Edit(.env.*)`

2. **Allow npm Scripts**
   - Allow: `Bash(npm run lint)`, `Bash(npm run test)`, `Bash(npm run build)`

3. **Git Read-Only**
   - Allow: `Bash(git status)`, `Bash(git diff)`, `Bash(git log)`
   - Ask: `Bash(git push)`, `Bash(git commit)`

4. **Block Secrets**
   - Deny: `Read(./secrets/**)`, `Edit(./secrets/**)`

5. **Allow Specific Domains**
   - Allow: `WebFetch(domain:anthropic.com)`, `WebFetch(domain:github.com)`

### 2. Visual Rule Editor

```
┌─────────────────────────────────────────────────────────┐
│ Edit Permission Rule                                     │
├─────────────────────────────────────────────────────────┤
│ Permission Level:  ○ Allow  ● Ask  ○ Deny              │
│                                                          │
│ Tool Type:  [Bash ▾]                                    │
│ ┌────────────────────────────────────────────────┐     │
│ │ ℹ️ Bash uses prefix matching                     │     │
│ │   "npm run test" matches "npm run test:unit"    │     │
│ └────────────────────────────────────────────────┘     │
│                                                          │
│ Pattern:  [npm run test___________________]            │
│                                                          │
│ ✅ Valid pattern                                         │
│ 📋 Example matches:                                      │
│   • npm run test                                         │
│   • npm run test:unit                                    │
│   • npm run test:e2e                                     │
│                                                          │
│ Description (optional):                                  │
│ [Allow running test scripts_____________]              │
│                                                          │
│ [Cancel]  [Save Rule]                                    │
└─────────────────────────────────────────────────────────┘
```

### 3. Rule List with Grouping

```
┌─────────────────────────────────────────────────────────┐
│ Current Permission Rules                                 │
├─────────────────────────────────────────────────────────┤
│ 🚫 DENY Rules (3)                                        │
│ ┌────────────────────────────────────────────────┐     │
│ │ Read(.env)                                 [Edit][×]│ │
│ │ Read(./secrets/**)                         [Edit][×]│ │
│ │ Bash(rm -rf*)                              [Edit][×]│ │
│ └────────────────────────────────────────────────┘     │
│                                                          │
│ ⚠️ ASK Rules (2)                                         │
│ ┌────────────────────────────────────────────────┐     │
│ │ Bash(git push)                             [Edit][×]│ │
│ │ WebFetch                                   [Edit][×]│ │
│ └────────────────────────────────────────────────┘     │
│                                                          │
│ ✅ ALLOW Rules (4)                                       │
│ ┌────────────────────────────────────────────────┐     │
│ │ Bash(npm run lint)                         [Edit][×]│ │
│ │ Bash(npm run test)                         [Edit][×]│ │
│ │ Bash(git status)                           [Edit][×]│ │
│ │ Read(./src/**)                             [Edit][×]│ │
│ └────────────────────────────────────────────────┘     │
│                                                          │
│ [+ Add Rule]  [+ Add from Template]                     │
└─────────────────────────────────────────────────────────┘
```

### 4. Rule Tester

```
┌─────────────────────────────────────────────────────────┐
│ 🧪 Test Your Rules                                       │
├─────────────────────────────────────────────────────────┤
│ Tool: [Bash ▾]                                          │
│ Input: [npm run test:unit________________]  [Test]     │
│                                                          │
│ Result: ✅ ALLOWED                                       │
│ ┌────────────────────────────────────────────────┐     │
│ │ Matched by: Bash(npm run test)                  │     │
│ │ Level: Allow                                    │     │
│ │ Priority: #2 in Allow rules                     │     │
│ └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Data Types

```typescript
// src/shared/types/settings.types.ts

export interface ClaudeSettings {
  // Basic settings
  model?: string;
  cleanupPeriodDays?: number;
  includeCoAuthoredBy?: boolean;
  apiKeyHelper?: string;
  outputStyle?: string;
  companyAnnouncements?: string[];
  statusLine?: StatusLineConfig;

  // Environment
  env?: Record<string, string>;

  // Permissions
  allow?: string[];
  ask?: string[];
  deny?: string[];
  additionalDirectories?: string[];
  defaultMode?: 'acceptEdits' | 'bypassPermissions';
  disableBypassPermissionsMode?: string;

  // MCP
  enableAllProjectMcpServers?: boolean;
  enabledMcpjsonServers?: string[];
  disabledMcpjsonServers?: string[];

  // Sandbox
  sandbox?: SandboxConfig;

  // Auth
  forceLoginMethod?: 'claudeai' | 'console';
  forceLoginOrgUUID?: string;
}

export interface PermissionRule {
  id: string; // UUID for React keys
  tool: ToolType;
  pattern?: string; // Optional (some tools don't need patterns)
  level: 'allow' | 'ask' | 'deny';
  description?: string;
  createdFrom?: 'template' | 'custom' | 'suggested';
}

export type ToolType =
  | 'Bash'
  | 'Read'
  | 'Edit'
  | 'Write'
  | 'WebFetch'
  | 'WebSearch'
  | 'NotebookEdit'
  | 'SlashCommand';

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  rules: Omit<PermissionRule, 'id'>[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  examples?: string[]; // Example matches
}
```

### Services

```typescript
// src/main/services/SettingsService.ts

export class SettingsService {
  // Read operations
  async getUserSettings(): Promise<ClaudeSettings>;
  async getProjectSettings(): Promise<ClaudeSettings>;
  async getEffectiveSettings(): Promise<ClaudeSettings>;

  // Write operations
  async saveUserSettings(settings: ClaudeSettings): Promise<void>;
  async saveProjectSettings(settings: ClaudeSettings): Promise<void>;

  // Validation
  validateSettings(settings: ClaudeSettings): ValidationResult;

  // Backup
  async createBackup(scope: 'user' | 'project'): Promise<string>;
  async restoreBackup(backupPath: string): Promise<void>;
}

// src/main/services/PermissionRulesService.ts

export class PermissionRulesService {
  // Validation
  validateRule(rule: PermissionRule): ValidationResult;
  validatePattern(tool: ToolType, pattern: string): ValidationResult;

  // Testing
  testRule(rule: PermissionRule, testInput: string): boolean;
  getMatchingExamples(tool: ToolType, pattern: string): string[];

  // Templates
  getTemplates(): RuleTemplate[];
  applyTemplate(templateId: string): PermissionRule[];

  // Parsing
  parseRuleString(ruleString: string): PermissionRule;
  formatRuleString(rule: PermissionRule): string;
}
```

### IPC Channels

```typescript
// src/shared/types/ipc.types.ts

export const SETTINGS_CHANNELS = {
  GET_USER_SETTINGS: 'settings:get-user',
  GET_PROJECT_SETTINGS: 'settings:get-project',
  GET_EFFECTIVE_SETTINGS: 'settings:get-effective',
  SAVE_USER_SETTINGS: 'settings:save-user',
  SAVE_PROJECT_SETTINGS: 'settings:save-project',
  VALIDATE_SETTINGS: 'settings:validate',
  CREATE_BACKUP: 'settings:create-backup',
  RESTORE_BACKUP: 'settings:restore-backup',

  // Permission rules
  VALIDATE_RULE: 'settings:validate-rule',
  TEST_RULE: 'settings:test-rule',
  GET_TEMPLATES: 'settings:get-templates',
  APPLY_TEMPLATE: 'settings:apply-template',
} as const;
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1) - Days 1-3

**Day 1: Services & IPC**
- [ ] Create `SettingsService` with read/write operations
- [ ] Create `PermissionRulesService` with validation
- [ ] Implement IPC handlers for settings operations
- [ ] Add backup/restore functionality
- [ ] Write unit tests for services

**Day 2: Basic Settings UI**
- [ ] Convert Settings page from viewer to editor
- [ ] Implement form inputs (text, number, boolean, dropdown)
- [ ] Add environment variables key-value editor
- [ ] Implement save/cancel actions
- [ ] Add unsaved changes detection & warning

**Day 3: Validation & Polish**
- [ ] Add settings validation before save
- [ ] Implement error handling and user feedback
- [ ] Add success/error toast notifications
- [ ] Create backup before every save
- [ ] Test on user and project settings files

### Phase 2: Permission Rules Builder (Week 1-2) - Days 4-8

**Day 4: Rule Data Structure**
- [ ] Implement rule parsing (string → PermissionRule)
- [ ] Implement rule formatting (PermissionRule → string)
- [ ] Create rule templates library (5+ templates)
- [ ] Add rule validation logic
- [ ] Write unit tests for rule operations

**Day 5: Rule List UI**
- [ ] Create PermissionRulesSection component
- [ ] Implement grouped rule list (deny/ask/allow)
- [ ] Add delete rule functionality
- [ ] Add edit rule modal trigger
- [ ] Style with color coding (red/yellow/green)

**Day 6: Rule Editor Modal**
- [ ] Create RuleEditorModal component
- [ ] Implement tool type selector
- [ ] Add pattern input with validation
- [ ] Show tool-specific help text
- [ ] Display live validation feedback
- [ ] Add example matches display

**Day 7: Templates & Helpers**
- [ ] Create RuleTemplatesModal component
- [ ] Display template library with descriptions
- [ ] Implement template application (multi-rule)
- [ ] Add tool-specific pattern helpers (Quick buttons)
- [ ] Create pattern builder for file operations

**Day 8: Testing & Polish**
- [ ] Implement rule tester component
- [ ] Add drag & drop reordering (optional)
- [ ] Test all rule operations end-to-end
- [ ] Polish UI/UX (spacing, colors, feedback)
- [ ] Write integration tests

### Phase 3: Advanced Features (Week 2) - Days 9-10

**Day 9: Smart Suggestions**
- [ ] Implement project detection (npm, git, .env)
- [ ] Create suggestion engine
- [ ] Display suggested rules UI
- [ ] One-click add from suggestions

**Day 10: Final Testing & Documentation**
- [ ] Cross-platform testing (macOS, Windows, Linux)
- [ ] Performance testing with large settings files
- [ ] Update user documentation
- [ ] Create demo video/screenshots
- [ ] Prepare for v0.2 release

---

## Success Metrics

**Must Have:**
- ✅ All basic settings editable via UI
- ✅ Permission rules (allow/ask/deny) fully manageable
- ✅ Environment variables editor working
- ✅ Save to user and project settings.json
- ✅ Validation prevents invalid settings
- ✅ Backup created before every save
- ✅ No data loss or corruption

**Nice to Have:**
- ✅ Rule templates library (5+ templates)
- ✅ Rule tester for validation
- ✅ Smart project-based suggestions
- ✅ Drag & drop rule reordering

**Quality Targets:**
- Settings save in < 500ms
- Validation feedback in < 100ms
- No UI freezing during operations
- Clear error messages for all failures

---

## Risk Mitigation

**Technical Risks:**
1. **Settings file corruption** → Always create backup before save
2. **Invalid JSON** → Validate before write, use safe JSON.stringify
3. **Permission denied** → Check file permissions, show clear error
4. **Merge conflicts** → Detect conflicts, ask user to resolve

**UX Risks:**
1. **Complexity overwhelm** → Use templates, smart defaults, progressive disclosure
2. **User mistakes** → Validate, preview, confirm destructive actions
3. **Lost changes** → Auto-save drafts, warn on navigation

---

## Testing Strategy

### Unit Tests
- `SettingsService` - read/write/validate
- `PermissionRulesService` - parse/format/validate/test
- Rule parsing and formatting
- Pattern matching logic

### Integration Tests
- Settings save flow (user & project)
- Rule CRUD operations
- Template application
- Backup/restore

### E2E Tests
- Open settings, edit, save, verify file
- Create permission rule, test it works
- Apply template, verify multiple rules
- Invalid input handling

---

## Future Enhancements (Post v0.2)

- Import/export rules as JSON/YAML
- Bulk rule operations (delete, edit)
- Rule conflict detection
- Advanced pattern builder with regex preview
- Rule usage analytics (which rules trigger most)
- Cloud sync for settings across machines
- Team-shared rule templates
