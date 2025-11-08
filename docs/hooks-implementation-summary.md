# Hooks Manager - Implementation Summary

## Overview

The Hooks Manager has been planned with a **security-first, phased approach** that prioritizes user safety while delivering value incrementally.

## Key Decisions

### ✅ What We're Building (v1.0)

**Phase 1: Read-Only + Validation (Weeks 17-19)**
- View all configured hooks with formatted JSON
- Security validation and scoring (Green/Yellow/Red)
- Pre-built template library (5+ security-reviewed patterns)
- Prominent security warnings
- Links to Claude Code documentation
- **NO editing capability** - users edit in external editor

**Phase 2: Safe Editing (Weeks 20-21)**
- Template-based hook creation only
- Visual matcher builder (no manual regex needed)
- Command hook editor with real-time validation
- Block saving if critical security issues found
- Enable/disable toggles
- **NO free-form editing** - limits attack surface

### ❌ What We're Deferring

**To v1.1-v1.2:**
- Prompt-based hooks (LLM-powered decisions)
- Hook execution logs and monitoring
- Advanced security scanner
- Free-form hook creation
- Sandboxed hook testing
- Hook marketplace/sharing

**To v2.0:**
- AI-generated hooks from plain English
- AI security review
- Intelligent optimization suggestions

## Why This Approach?

### Security Risks Mitigated

1. **No untrusted code execution** - All templates pre-reviewed
2. **No UI-generated malicious hooks** - Templates only, strong validation
3. **User education first** - See validation before creating hooks
4. **External editor fallback** - Power users maintain full control
5. **No sandboxed execution risk** - Preview only, no live testing in v1.0

### User Value Delivered

1. **Immediate visibility** - Understand existing hooks
2. **Security awareness** - Learn about dangerous patterns
3. **Common use cases** - Templates cover 80% of needs
4. **Quick setup** - Copy/paste templates
5. **Safe customization** - Templates with variables

## Implementation Plan

### Phase 1 (10 days - Weeks 17-19)

| Task | Description | Days |
|------|-------------|------|
| TASK-H01 | Hooks overview with security warning | 2 |
| TASK-H02 | Read-only hooks viewer | 2 |
| TASK-H03 | Template library (5+ templates) | 2 |
| TASK-H04 | Validation engine | 3 |
| TASK-H05 | Documentation & help | 1 |

**Deliverable:** Users can view, validate, and understand hooks. Templates available for common patterns.

### Phase 2 (12.5 days - Weeks 20-21)

| Task | Description | Days |
|------|-------------|------|
| TASK-H06 | Template-based hook creation | 3 |
| TASK-H07 | Visual matcher builder | 2.5 |
| TASK-H08 | Command hook editor with validation | 3 |
| TASK-H09 | Hook testing preview | 2.5 |
| TASK-H10 | Enable/disable toggles | 1.5 |

**Deliverable:** Users can safely create hooks from templates with guided UI and strong validation.

## Template Library (Phase 1)

Pre-built, security-reviewed templates for immediate use:

### 1. Protect .env Files (PreToolUse)
```json
{
  "matcher": "Write|Edit",
  "hooks": [{
    "type": "command",
    "command": "bash ~/.claude/hooks/protect-env.sh",
    "timeout": 30
  }]
}
```
**Purpose:** Block edits to sensitive files
**Security:** ✅ Green (safe, reviewed)

### 2. Auto-Format Code (PostToolUse)
```json
{
  "matcher": "Write|Edit",
  "hooks": [{
    "type": "command",
    "command": "bash ~/.claude/hooks/auto-format.sh",
    "timeout": 60
  }]
}
```
**Purpose:** Run Prettier/eslint after file edits
**Security:** ✅ Green (safe, reviewed)

### 3. Log Bash Commands (PreToolUse)
```json
{
  "matcher": "Bash",
  "hooks": [{
    "type": "command",
    "command": "bash ~/.claude/hooks/log-commands.sh",
    "timeout": 10
  }]
}
```
**Purpose:** Audit trail for executed commands
**Security:** ✅ Green (safe, reviewed)

### 4. Block Sensitive File Edits (PreToolUse)
```json
{
  "matcher": "Write|Edit",
  "hooks": [{
    "type": "command",
    "command": "bash ~/.claude/hooks/block-sensitive.sh",
    "timeout": 30
  }]
}
```
**Purpose:** Prevent edits to .git/, keys/, credentials/
**Security:** ✅ Green (safe, reviewed)

### 5. Session Logging (SessionStart/SessionEnd)
```json
{
  "hooks": [{
    "type": "command",
    "command": "bash ~/.claude/hooks/log-session.sh",
    "timeout": 10
  }]
}
```
**Purpose:** Track session start/end for analytics
**Security:** ✅ Green (safe, reviewed)

## Validation Rules (Phase 1)

### 🟢 Green (Safe)
- Template hooks (unmodified)
- Proper variable quoting (`"$VAR"`)
- Timeouts configured (< 300s)
- No dangerous commands
- Validated file paths

### 🟡 Yellow (Caution)
- Custom hooks (modified templates)
- Missing timeout (uses default)
- Complex regex matchers
- External script references
- High timeout values (> 120s)

### 🔴 Red (Danger - Block Save)
- Unquoted variables (`$VAR`)
- Path traversal (`../`, `../../`)
- Dangerous commands:
  - `rm -rf`
  - `chmod 777`
  - `curl | bash`
  - `eval`
  - `exec`
- Missing quotes on file paths
- Wildcard with write operations

## User Experience Flow

### Phase 1: View & Validate

1. User opens "Hooks Manager"
2. **Sees prominent warning:** "⚠️ Hooks run with your credentials. Review all hooks carefully."
3. Views 8 hook events with status
4. Clicks "PreToolUse" → sees 2 existing hooks
5. Validation shows: 🟢 Green (safe), 🟡 Yellow (review recommended)
6. Clicks "Learn More" → reads Claude Code docs
7. Browses template library
8. Copies "Protect .env files" template
9. Opens settings.json in VS Code (via button)
10. Pastes template, saves
11. Returns to Claude Owl → validation refreshes → 🟢 Green

### Phase 2: Template-Based Creation

1. User clicks "Create Hook from Template"
2. Selects event: "PreToolUse"
3. Chooses template: "Block file edits"
4. UI shows: "This template blocks edits to sensitive files"
5. Configures matcher: Checks "Write" and "Edit" tools
6. Fills variable: File pattern = `*.env`
7. Previews JSON: Shows complete configuration
8. Validation runs: 🟢 Green score
9. Clicks "Save to User Settings"
10. Success notification: "Hook created successfully ✓"
11. Hook appears in list with toggle to enable/disable

## Security Warning Text

Display prominently at top of Hooks Manager:

> **⚠️ Security Warning**
>
> Claude Code hooks execute arbitrary commands on your system automatically during agent operations. Hooks run with your current environment's credentials.
>
> **Malicious hooks can:**
> - Exfiltrate your data
> - Modify or delete files
> - Execute unauthorized commands
> - Compromise your system security
>
> **Before creating or enabling hooks:**
> - Always review hook code carefully
> - Only use hooks from trusted sources
> - Understand what each command does
> - Test hooks in safe environments first
>
> For detailed security best practices, see [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks).

## Success Metrics

### Phase 1 Goals
- ✅ 100% of hooks validated before display
- ✅ Security warning shown to 100% of users
- ✅ 5+ templates in library (all security-reviewed)
- ✅ Zero hooks created without validation
- ✅ Documentation links on every page

### Phase 2 Goals
- ✅ 80%+ of hooks created via templates (not freeform)
- ✅ Average security score > 85% (mostly Green)
- ✅ < 5% of hooks fail validation
- ✅ Zero Red-scored hooks saved
- ✅ User acknowledgment required for Yellow warnings

## Technical Architecture

### Services

**HooksService** (`src/main/services/HooksService.ts`)
```typescript
class HooksService {
  // Phase 1
  async getHooks(location: 'user' | 'project'): Promise<HooksSettings>
  getTemplates(): HookTemplate[]
  validateHook(hook: Hook): HookValidationResult

  // Phase 2
  async createHookFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    location: 'user' | 'project'
  ): Promise<void>
  async toggleHook(event: HookEvent, index: number): Promise<void>
}
```

**HooksValidator** (`src/main/services/HooksValidator.ts`)
```typescript
class HooksValidator {
  validateBashCommand(command: string): HookIssue[]
  validateMatcher(matcher: string): boolean
  scanSecurityIssues(hook: Hook): HookIssue[]
  scoreHook(hook: Hook): 'green' | 'yellow' | 'red'

  // Security checks
  private detectUnquotedVariables(command: string): HookIssue[]
  private detectPathTraversal(command: string): HookIssue[]
  private detectDangerousCommands(command: string): HookIssue[]
}
```

### Components

```
src/renderer/components/HooksManager/
├── HooksPage.tsx              # Main page with security warning
├── HookEventList.tsx          # List of 8 events
├── HookDetailsViewer.tsx      # Read-only hook display (Phase 1)
├── HookTemplateGallery.tsx    # Template browser (Phase 1)
├── HookValidationPanel.tsx    # Validation results display
├── SecurityWarningBanner.tsx  # Prominent warning
├── HookCreator.tsx            # Template-based creation (Phase 2)
├── MatcherBuilder.tsx         # Visual matcher config (Phase 2)
├── CommandHookEditor.tsx      # Monaco editor with validation (Phase 2)
└── HookTestPanel.tsx          # Preview panel (Phase 2)
```

## Migration Path to Phase 3+

When ready to add advanced features (v1.1+):

1. **Add prompt hooks** (TASK-H11)
   - LLM-powered decision making
   - Context-aware evaluation
   - Cost estimation per invocation

2. **Hook execution logs** (TASK-H13)
   - Track all hook invocations
   - Debug hook behavior
   - Performance monitoring

3. **Advanced security scanner** (TASK-H12)
   - Static analysis of bash scripts
   - Command injection detection
   - Comprehensive security reports

4. **Free-form creation** (TASK-H14)
   - For power users only
   - Requires mature validation engine
   - Multiple security acknowledgments

## Conclusion

This phased approach delivers immediate value (viewing, validation, templates) while **minimizing security risks**. By deferring editing to Phase 2 and advanced features to v1.1+, we can:

1. **Educate users first** on security implications
2. **Refine validation** based on real-world patterns
3. **Build confidence** in security model
4. **Gather feedback** before adding complex features

The result: A **safe, usable hooks manager** that respects the power and danger of hooks while making them accessible to all users.
