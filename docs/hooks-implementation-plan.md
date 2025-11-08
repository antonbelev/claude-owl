# Hooks Manager - Implementation Plan

## Overview

The Hooks Manager enables users to configure Claude Code hooks through a visual UI while maintaining security and usability. This document outlines a phased approach, starting with low-hanging fruit (safe, easy features) and deferring complex/risky features to later phases.

## Security-First Approach

**Critical Security Warning (Display Prominently in UI):**

> ⚠️ **Security Warning**
>
> Hooks run automatically during the agent loop with your current environment's credentials. Malicious hooks can exfiltrate your data or damage your system.
>
> **Always review hooks implementation before registering them.**
>
> For full security best practices, see [Security Considerations](https://code.claude.com/docs/en/hooks).

## Hook System Architecture

### Hook Events (8 Total)

1. **PreToolUse** - Before tool execution (can block/allow/modify)
2. **PostToolUse** - After tool completes (can provide feedback)
3. **UserPromptSubmit** - When user submits prompt (can block)
4. **Notification** - When Claude requests permission or goes idle
5. **Stop** - When main agent finishes responding (can prevent stop)
6. **SubagentStop** - When subagent completes (can prevent stop)
7. **SessionStart** - At session initialization/resumption
8. **SessionEnd** - When session terminates

### Hook Types

1. **Command Hooks** - Execute bash scripts locally
   - Faster, deterministic
   - Requires scripting knowledge
   - Best for: file validation, formatting, logging

2. **Prompt Hooks** - Query LLM (Haiku) for decisions
   - Context-aware, natural language evaluation
   - Slower (API call)
   - Only for: Stop, SubagentStop, UserPromptSubmit, PreToolUse
   - Best for: complex context-dependent decisions

### Configuration Structure

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash script-path.sh",
            "timeout": 60
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Evaluate if $ARGUMENTS indicates completion",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

---

## Phase 1: Low-Hanging Fruit (MVP - Current Phase)

**Goal:** Enable safe, basic hooks management with strong guardrails

### 1.1 Hooks Overview Page (P0 - Week 1)

**TASK-H01: Create Hooks Overview UI**
- Display all 8 hook events in a list
- Show event name, description, and "when it triggers"
- Display active hooks count per event (e.g., "PreToolUse: 3 hooks")
- Add "Configure Hooks" button per event
- Show prominent security warning at top of page
- **Estimate:** 2 days

**Implementation Notes:**
- Read-only view of existing hooks from settings.json
- No editing in Phase 1 - just viewing
- Show event status: "Not Configured" vs "3 Active Hooks"

### 1.2 View Existing Hooks (P0 - Week 1)

**TASK-H02: Hooks Detail Viewer**
- Click on event → show all hooks for that event
- Display hook configuration in formatted JSON (read-only)
- Show matcher patterns (if applicable)
- Display hook type (command vs prompt)
- Show command/prompt content with syntax highlighting
- Add "Edit in settings.json" button (opens file in system editor)
- **Estimate:** 2 days

**Why Read-Only?**
- Safer for MVP - no risk of breaking configs
- Users can still view and understand hooks
- Editing happens in trusted external editor
- Reduces implementation complexity significantly

### 1.3 Hook Templates Library (P1 - Week 2)

**TASK-H03: Common Hook Templates**
- Pre-built, security-reviewed hook templates:
  1. **Protect .env files** (PreToolUse command hook)
  2. **Auto-format code** (PostToolUse command hook)
  3. **Log all bash commands** (PreToolUse command hook)
  4. **Block sensitive file edits** (PreToolUse command hook)
  5. **Session logging** (SessionStart/SessionEnd command hooks)
- Display template gallery with descriptions
- Show "Copy to Clipboard" button for each template
- User pastes into settings.json manually
- **Estimate:** 2 days

**Why Templates Only?**
- Security-reviewed by us before shipping
- Users can inspect before using
- No risk of UI generating malicious hooks
- Easy to implement and maintain

### 1.4 Hook Validation (P0 - Week 2)

**TASK-H04: Validate Existing Hooks**
- Parse settings.json and validate hook structure
- Check for common security issues:
  - Unquoted variables in bash commands
  - Path traversal patterns (`../`)
  - Dangerous commands (`rm -rf`, `chmod 777`, etc.)
  - Missing timeout values
- Display validation warnings/errors in UI
- Show "Security Score" per hook (Green/Yellow/Red)
- **Estimate:** 3 days

**Validation Rules:**
- ✅ Green: Template hooks, proper quoting, timeouts set
- ⚠️ Yellow: Custom hooks, missing timeouts, complex patterns
- 🚫 Red: Unquoted vars, path traversal, dangerous commands

### 1.5 Documentation Links (P0 - Week 2)

**TASK-H05: Contextual Help**
- Add "Learn More" links to Claude Code docs for each event
- Show available context variables per event type
- Display matcher syntax examples
- Link to security best practices
- Add inline tooltips explaining technical terms
- **Estimate:** 1 day

**Phase 1 Deliverables:**
- ✅ View all hooks across events
- ✅ Security warnings prominently displayed
- ✅ Template library for common use cases
- ✅ Validation and security scoring
- ✅ Comprehensive documentation links
- ❌ No editing capability (intentionally deferred)

**Total Estimate:** 10 days

---

## Phase 2: Safe Editing (Post-MVP - Weeks 3-4)

**Goal:** Enable controlled editing of hooks with strong validation

### 2.1 Template-Based Hook Creation (P0)

**TASK-H06: Create Hooks from Templates**
- Select hook event
- Choose template from library
- Fill in template variables (e.g., file paths, matchers)
- Preview generated JSON
- Validate before saving
- Write to settings.json (user or project)
- **Estimate:** 3 days

**Why Template-Based First?**
- Limits user to known-safe patterns
- Reduces attack surface
- Simpler validation logic
- Better UX for non-technical users

### 2.2 Matcher Configuration Builder (P0)

**TASK-H07: Visual Matcher Builder**
- Tool selector dropdown (Write, Edit, Bash, Read, etc.)
- Support multi-select for `"Tool1|Tool2"` syntax
- Add wildcard `*` option for "All Tools"
- Show regex pattern preview
- Validate matcher syntax
- Test matcher against tool list
- **Estimate:** 2.5 days

**Implementation:**
- Pre-populated list of all Claude Code tools
- Visual chips for selected tools
- Preview: `"Write|Edit|Bash"`
- Warning if using wildcard: "This will trigger for ALL tools"

### 2.3 Command Hook Editor (P1)

**TASK-H08: Bash Script Editor (with guardrails)**
- Monaco editor for bash scripts
- Syntax highlighting for shell
- Variable helper buttons (`$CLAUDE_PROJECT_DIR`, etc.)
- Real-time security validation:
  - Detect unquoted variables
  - Flag path traversal attempts
  - Warn on dangerous commands
- Show validation errors inline
- Require timeout value (default: 60s)
- **Estimate:** 3 days

**Security Features:**
- Block saving if Red security issues found
- Require acknowledgment for Yellow warnings
- Show "Best Practice" suggestions
- Template snippets for common patterns (quoting, path checks)

### 2.4 Hook Testing Simulator (P1)

**TASK-H09: Test Hooks Before Saving**
- Mock tool execution with sample data
- Show hook input JSON (what hook receives)
- Execute hook in safe sandbox (if possible)
- Display hook output
- Show exit code and decision
- Test without actually modifying files
- **Estimate:** 2.5 days

**Challenges:**
- Sandboxing bash execution is complex
- May need to defer to Phase 3+
- Alternative: Show input/output preview without execution

### 2.5 Enable/Disable Hooks (P1)

**TASK-H10: Toggle Hooks On/Off**
- Add enable/disable toggle per hook
- Temporarily comment out hooks in JSON (add `_disabled` prefix)
- Show disabled hooks in grayed-out state
- Quick enable/disable without deleting
- **Estimate:** 1.5 days

**Phase 2 Deliverables:**
- ✅ Create hooks from templates
- ✅ Visual matcher builder
- ✅ Command hook editor with validation
- ✅ Hook testing (limited)
- ✅ Enable/disable toggles
- ❌ Prompt hooks (deferred to Phase 3)

**Total Estimate:** 12.5 days

---

## Phase 3: Advanced Features (Future - Weeks 5-7)

**Goal:** Full-featured hooks management with advanced capabilities

### 3.1 Prompt Hook Editor (P0)

**TASK-H11: Prompt-Based Hook Configuration**
- Text editor for LLM prompts
- Show available context via `$ARGUMENTS`
- Preview decision flow (allow/deny/block)
- Configure output format (JSON structure)
- Test prompt with sample inputs
- Show estimated cost per hook invocation
- **Estimate:** 3 days

**Supported Events:**
- Stop, SubagentStop, UserPromptSubmit, PreToolUse

### 3.2 Advanced Security Scanner (P1)

**TASK-H12: Deep Security Analysis**
- Static analysis of bash scripts
- Detect command injection vulnerabilities
- Check for sensitive file access patterns
- Analyze environment variable usage
- Generate security report with recommendations
- **Estimate:** 4 days

### 3.3 Hook Execution Logs (P1)

**TASK-H13: Monitor Hook Activity**
- Show hook execution history
- Display input/output for each invocation
- Track success/failure rates
- Show execution times
- Filter by event type, hook, or date
- Export logs for debugging
- **Estimate:** 3 days

### 3.4 Custom Hook Creation (P2)

**TASK-H14: Free-Form Hook Editor**
- Create hooks from scratch (not just templates)
- Advanced matcher editor (regex support)
- Multi-hook configuration per event
- Reorder hooks execution priority
- Import/export hooks as JSON
- **Estimate:** 3.5 days

**Why Deferred?**
- Higher security risk (no template guardrails)
- Requires mature validation engine
- Most users satisfied with templates
- Power users can edit JSON directly

### 3.5 Hook Testing Framework (P2)

**TASK-H15: Comprehensive Testing**
- Create test scenarios for hooks
- Mock different tool inputs
- Test all decision paths (allow/deny/block)
- Automated regression testing
- Test suite management
- **Estimate:** 4 days

**Phase 3 Deliverables:**
- ✅ Full prompt hook support
- ✅ Advanced security scanning
- ✅ Hook execution monitoring
- ✅ Custom hook creation
- ✅ Testing framework

**Total Estimate:** 17.5 days

---

## Phase 4: Enterprise & Collaboration (Future - v1.3+)

### 4.1 Hook Library & Sharing

- Community hook templates marketplace
- Import hooks from GitHub gists
- Share custom hooks with team
- Rate and review hooks

### 4.2 Team Policies

- Organization-level hook policies
- Mandatory hooks for all projects
- Block certain hook types
- Audit hook usage across team

### 4.3 AI-Powered Hook Generation (v2.0)

- Describe desired behavior in plain English
- AI generates hook code
- AI reviews hooks for security issues
- Suggest optimizations

---

## Updated Roadmap Integration

### Changes to Main Roadmap

**Phase 5 (Current Plan: Hooks & MCP - Weeks 17-19):**
- **Reduce scope to Phase 1 only** (read-only + templates + validation)
- Defer editing to later phase
- Focus on safety and education

**New Phase (Insert After Phase 5): Phase 5.5 - Hooks Editing (Weeks 20-21)**
- Implement Phase 2 features (safe editing)
- Template-based hook creation
- Matcher builder
- Command hook editor with validation

**Phase 6+ (Monitoring & Debugging):**
- Add Phase 3 hooks features incrementally
- Hook execution logs (TASK-H13)
- Advanced security scanner (TASK-H12)

**Post-v1.0:**
- Phase 4 features (v1.3+)
- AI-powered hooks (v2.0)

---

## Risk Assessment

### High-Risk Features (Defer to Phase 3+)

❌ **Free-form bash editor** - High injection risk
❌ **Sandboxed execution** - Complex, may not be reliable
❌ **Automatic hook generation** - AI could generate malicious code
❌ **Hook marketplace** - Untrusted code distribution

### Low-Risk Features (Phase 1-2)

✅ **Read-only viewing** - Zero security risk
✅ **Curated templates** - Pre-reviewed by developers
✅ **Static validation** - Detects issues without execution
✅ **External editor integration** - User controls editing environment
✅ **Template-based creation** - Limited to safe patterns

---

## User Experience Flow

### Phase 1 UX (Read-Only + Templates)

1. User opens "Hooks Manager"
2. Sees prominent security warning
3. Views list of 8 hook events
4. Clicks "PreToolUse" → sees 2 existing hooks (read-only)
5. Clicks "Add Hook Template" → browses template gallery
6. Selects "Protect .env files" template
7. Clicks "Copy to Clipboard"
8. Opens settings.json in VS Code (via "Edit Hooks" button)
9. Pastes template, saves file
10. Returns to Claude Owl → sees new hook in list
11. Validation runs → shows "Green" security score

### Phase 2 UX (Safe Editing)

1. User clicks "Create Hook from Template"
2. Selects event: "PreToolUse"
3. Chooses template: "Block file edits"
4. Fills in matcher: Selects "Write" and "Edit" tools
5. Configures file pattern: `*.env`
6. Previews generated JSON
7. Validates: Shows "Green" score
8. Saves to user settings
9. Hook appears in list immediately
10. User can toggle on/off without deleting

---

## Technical Implementation Notes

### Data Model

```typescript
// src/shared/types/hook.types.ts

export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'UserPromptSubmit'
  | 'Notification'
  | 'Stop'
  | 'SubagentStop'
  | 'SessionStart'
  | 'SessionEnd';

export type HookType = 'command' | 'prompt';

export type Decision = 'allow' | 'deny' | 'ask' | 'block';

export interface Hook {
  type: HookType;
  command?: string;
  prompt?: string;
  timeout?: number;
}

export interface HookConfiguration {
  matcher?: string; // Regex or tool pattern (optional for some events)
  hooks: Hook[];
}

export interface HooksSettings {
  hooks: {
    [K in HookEvent]?: HookConfiguration[];
  };
}

export interface HookTemplate {
  id: string;
  name: string;
  description: string;
  event: HookEvent;
  category: 'security' | 'automation' | 'logging' | 'notification';
  securityLevel: 'safe' | 'caution' | 'review-required';
  configuration: HookConfiguration;
  variables?: string[]; // User-customizable fields
}

export interface HookValidationResult {
  valid: boolean;
  score: 'green' | 'yellow' | 'red';
  issues: HookIssue[];
}

export interface HookIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  suggestion?: string;
}
```

### Services

**HooksService** (`src/main/services/HooksService.ts`):
- `getHooks(location: 'user' | 'project'): Promise<HooksSettings>`
- `validateHook(hook: Hook): HookValidationResult`
- `getTemplates(): HookTemplate[]`
- `saveHook(event, config, location)` (Phase 2+)

**HooksValidator** (`src/main/services/HooksValidator.ts`):
- `validateBashCommand(command: string): HookIssue[]`
- `validateMatcher(matcher: string): boolean`
- `scanSecurityIssues(hook: Hook): HookIssue[]`
- `scoreHook(hook: Hook): 'green' | 'yellow' | 'red'`

### Components

- `HooksPage.tsx` - Main hooks manager page
- `HookEventList.tsx` - List of 8 events with status
- `HookDetailsViewer.tsx` - Read-only hook display
- `HookTemplateGallery.tsx` - Template browser
- `HookValidationPanel.tsx` - Show validation results
- `SecurityWarningBanner.tsx` - Prominent security notice

---

## Success Metrics

### Phase 1 Goals
- Users can view all configured hooks ✅
- 100% of hooks are validated for security ✅
- Template library has 5+ common patterns ✅
- Zero hooks created via UI without validation ✅

### Phase 2 Goals
- 80% of hooks created via templates (not freeform) ✅
- Average security score > 80% (mostly Green) ✅
- <5% of hooks fail validation ✅
- User can test hooks before deployment ✅

### Phase 3+ Goals
- Support all 8 hook events fully
- Prompt hooks for context-aware decisions
- Hook execution logs for debugging
- Community template library (50+ templates)

---

## Recommendation

**Start with Phase 1 (Read-Only + Templates) for current roadmap Phase 5.**

This provides immediate value while minimizing security risks:
- Users can understand existing hooks
- Pre-built templates cover 80% of use cases
- Validation educates users on security
- External editor gives full control to power users

**Add Phase 2 (Safe Editing) as Phase 5.5 after monitoring/debugging work.**

This allows time to:
- Gather user feedback on Phase 1
- Refine validation engine
- Build confidence in security model
- Test with real-world hook configurations

**Defer Phase 3+ to v1.1-v1.3 based on user demand.**

Power users can edit JSON directly. Focus Phase 3 work only if:
- Users request advanced features
- Phase 1-2 validation proves robust
- Security scanner is mature
