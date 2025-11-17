# Configuration Architecture Findings & Corrections

**Date:** November 15, 2025
**Issue:** Conflicting configuration models and incorrect file path assumptions

---

## Executive Summary

After deep investigation of Claude Code's actual configuration model (including analyzing GitHub Issue #10839 and file system inspection), I've created a comprehensive Architecture Decision Record (ADR) and corrected all incorrect assumptions in the documentation and code.

**Key Finding:** Despite documentation stating `.claude.json` is deprecated, it is **actively managed by Claude Code CLI** and serves as the single source of truth for project tracking and MCP server configuration.

---

## What I Discovered

### 1. The Reality of .claude.json

**Claim (in docs):** `.claude.json` is deprecated since v2.0.8+
**Reality:** `.claude.json` is actively used, auto-created, and cannot be prevented

**Evidence:**
- [GitHub Issue #10839](https://github.com/anthropics/claude-code/issues/10839) - Users report file is auto-recreated within seconds if deleted
- File system inspection shows active usage in production
- Contains critical project tracking under `projects` key
- Stores both user-level and project-level MCP servers

**Structure:**
```json
{
  "installMethod": "unknown",
  "autoUpdates": true,
  "userID": "...",
  "projects": {
    "/home/user/my-project": {
      "mcpServers": { ... },
      "allowedTools": [],
      "ignorePatterns": [],
      "lastSessionId": "...",
      "hasTrustDialogAccepted": false
    }
  },
  "mcpServers": { ... }  // User-level servers
}
```

### 2. Actual Configuration Hierarchy

| File | Managed By | Purpose | Claude Owl Access |
|------|-----------|---------|-------------------|
| `~/.claude.json` | Claude CLI | Project tracking, MCP servers | **Read Only** |
| `~/.claude/settings.json` | User/Claude Owl | User-level settings | **Read/Write** ✅ |
| `{PROJECT}/.claude/settings.json` | User/Claude Owl | Project-specific settings | **Read/Write** (after selection) |
| `{PROJECT}/.claude/settings.local.json` | User/Claude Owl | Local overrides | **Read/Write** (after selection) |
| `{PROJECT}/.mcp.json` | Claude CLI | Project MCP servers (alternative) | **Read Only** |

### 3. MCP Server Storage

**User-Level MCP Servers:**
- Stored in: `~/.claude.json` → `{ mcpServers: {...} }`
- Added via: `claude mcp add --scope user`
- Available to: All projects globally

**Project-Level MCP Servers:**
- Stored in: `~/.claude.json` → `{ projects: { "/path": { mcpServers: {...} } } }`
- OR: `{PROJECT}/.mcp.json` → `{ mcpServers: {...} }`
- Added via: `claude mcp add --scope project` (from project directory)
- Available to: Specific project only

**❌ NOT stored in:** `~/.claude/mcp-servers.json` (this file does not exist!)

---

## What I Fixed

### 1. Created ADR-001: Settings Management Architecture

**Location:** `docs/adr-001-settings-management-redesign.md`

**Key Decisions:**
- ✅ **Read** `~/.claude.json` for project discovery
- ❌ **Never write** to `.claude.json` (risk of corruption, CLI-managed)
- ✅ **Manage** `~/.claude/settings.json` for user-level settings
- ✅ **Two-phase workflow**: User settings (Phase 1) → Project selection (Phase 2)

**Rationale:**
- Claude Owl is a standalone app (no `process.cwd()` in production)
- Prevents file locking conflicts with CLI
- Single source of truth for projects
- Safe, future-proof architecture

### 2. Updated CLAUDE.md

**Changes:**
- Added clear file hierarchy with READ/WRITE access policy
- Referenced ADR-001 for complete architecture
- Clarified user-level vs project-level configurations
- Emphasized "never assume project context" constraint

**Key Addition:**
```
**Access Policy:**
- ✅ User Settings: Full read/write access to ~/.claude/settings.json
- ✅ Project Discovery: Read ~/.claude.json to get list of projects
- ✅ Project Settings: Read/write after user explicitly selects a project
- ❌ Never write to .claude.json (CLI-managed, risk of corruption)
- ❌ Never assume project context (we're a standalone app)
```

### 3. Updated MCP-DESIGN-CONSTRAINT.md

**Corrections:**
- ❌ Old: "Servers stored in `~/.claude/mcp-servers.json`"
- ✅ New: "Servers stored in `~/.claude.json` under `mcpServers` key"

**Clarifications:**
- Added reference to ADR-001
- Explained Claude CLI integration (`claude mcp add/remove`)
- Documented Phase 2 plan for project-specific server management

### 4. Deprecated MCPService.ts

**Changes:**
- Added `@deprecated` JSDoc tag
- Added warning comments about incorrect file path
- Directed developers to use `ClaudeService.ts` instead
- Explained actual storage location (`.claude.json`)

**Why:** This service referenced the non-existent `~/.claude/mcp-servers.json` file and is not used in production code. `ClaudeService.ts` is the correct, actively-used implementation.

### 5. Fixed AddServerForm.tsx UI Text

**Old:**
```
ℹ️ MCP servers are managed globally at the user level
(~/.claude/mcp-servers.json) and available to all your projects.
```

**New:**
```
ℹ️ MCP servers are managed globally at the user level
(~/.claude.json) and available to all your projects.
To manage project-specific servers, use the Claude CLI
or select a project in a future update.
```

---

## Architecture Decision Summary

### Current Phase (Phase 1) - User Settings ✅

**Implemented:**
- User-level settings editor (`~/.claude/settings.json`)
- Permission rules builder
- Environment variables editor
- Hooks configuration
- Settings validation and backup
- User-level MCP server management (via Claude CLI)

**File Access:**
- Read/Write: `~/.claude/settings.json`
- Read: `~/.claude.json` (for display purposes)

### Future Phase (Phase 2) - Project Selection

**Planned Workflow:**
1. Read `~/.claude.json` to extract `projects` object
2. Display list of Claude-initialized projects to user
3. User selects a project
4. Claude Owl can now safely access project-specific files:
   - Read/Write: `{PROJECT}/.claude/settings.json`
   - Read/Write: `{PROJECT}/.claude/settings.local.json`
   - Read: `{PROJECT}/.mcp.json` (display project MCP servers)

**Benefits:**
- No guessing of project paths (users type in paths)
- No auto-detection via `process.cwd()` (violates design constraint)
- Clear separation: "User Settings" vs "Project: /path/to/project"
- Safe: Can't corrupt project settings if we don't know which project

---

## Testing & Validation

### What I Verified

1. **File System Inspection:**
   - ✅ Confirmed `~/.claude.json` exists and contains `projects` object
   - ✅ Confirmed `~/.claude/settings.json` exists
   - ❌ Confirmed `~/.claude/mcp-servers.json` does NOT exist
   - ✅ Confirmed no `.claude/` directory in project (no auto-creation)

2. **Code Analysis:**
   - ✅ `ClaudeService.ts` correctly reads from `.claude.json`
   - ✅ `SettingsService.ts` correctly manages `settings.json` files
   - ✅ `PathService.ts` has correct path resolution methods
   - ⚠️ `MCPService.ts` is deprecated, references wrong file (marked as such)

3. **GitHub Issue Analysis:**
   - ✅ Confirmed `.claude.json` is actively managed by CLI
   - ✅ Confirmed `projects` object structure
   - ✅ Confirmed file auto-recreation behavior

### What Still Needs Testing

- [ ] Full integration test: Read projects from `.claude.json`
- [ ] Test project selection workflow (Phase 2)
- [ ] Test concurrent access (Claude CLI + Claude Owl)
- [ ] Cross-platform path resolution (Windows, macOS, Linux)

---

## Migration Path

### No Breaking Changes Required

**Current users:** Continue using Phase 1 (user-level settings)
**Phase 2 rollout:** Additive feature, no migration needed

### Deprecated Code

- `MCPService.ts` - Marked as deprecated, will be removed in future version
- Use `ClaudeService.ts` for all MCP operations

---

## Key Takeaways

### For Developers

1. **Never write to `.claude.json`** - CLI-managed, risk of corruption
2. **Use project selection workflow** - Don't assume `process.cwd()` is valid
3. **Read ADR-001** - Complete architecture decision with rationale
4. **Use ClaudeService** - Correct implementation for MCP operations
5. **Reference CLAUDE.md** - File access policy clearly documented

### For Future Features

1. **Project Discovery UI** - Read from `~/.claude.json` projects list
2. **Project Selection** - User picks from list, Claude Owl knows path
3. **Project Settings Editor** - Edit `.claude/settings.json` in project
4. **MCP Server Display** - Show project MCP servers (read-only or via CLI)

### For Users

1. **Phase 1 (Current):** Manage user-level settings globally
2. **Phase 2 (Future):** Select project → Manage project-specific settings
3. **No manual config needed:** Claude Owl discovers projects automatically
4. **Safe operations:** Backup before every save, validation prevents corruption

---

## Files Changed

### Documentation
- ✅ `docs/adr-001-settings-management-redesign.md` - **NEW** - Complete ADR
- ✅ `CLAUDE.md` - Updated configuration section
- ✅ `docs/MCP-DESIGN-CONSTRAINT.md` - Corrected file paths
- ✅ `docs/CONFIGURATION-FINDINGS-2025-11-15.md` - **NEW** - This document

### Code
- ✅ `src/main/services/MCPService.ts` - Marked as deprecated
- ✅ `src/renderer/components/MCPServersManager/AddServerForm.tsx` - Fixed UI text

### No Changes Needed (Already Correct)
- ✅ `src/main/services/ClaudeService.ts` - Correctly reads `.claude.json`
- ✅ `src/main/services/SettingsService.ts` - Correctly manages settings hierarchy
- ✅ `src/main/services/core/PathService.ts` - Correct path resolution

---

## References

- **ADR-001:** `docs/adr-001-settings-management-redesign.md`
- **CLAUDE.md:** Project instructions, configuration section
- **GitHub Issue:** https://github.com/anthropics/claude-code/issues/10839
- **Design Constraint:** Claude Owl is standalone app (no project context)

---

## Questions Answered

### Q: Should we use .claude.json for user-level settings?
**A:** No. Use `~/.claude/settings.json` for user-level settings. `.claude.json` is CLI-managed.

### Q: Can we write to .claude.json to add projects?
**A:** No. Claude CLI manages this file. Read it for project discovery only.

### Q: Where are MCP servers stored?
**A:** User-level: `~/.claude.json` → `mcpServers`
      Project-level: `~/.claude.json` → `projects[path].mcpServers` OR `{PROJECT}/.mcp.json`

### Q: How do we manage project-specific settings?
**A:** Phase 1 (current): User-level only
      Phase 2 (future): User selects project → Edit `{PROJECT}/.claude/settings.json`

### Q: Can we use process.cwd() to find project files?
**A:** No. Claude Owl is a standalone app. Users launch from Applications folder, not project directory.

---

## Next Steps

1. ✅ **Completed:** ADR-001 created and documented
2. ✅ **Completed:** All documentation updated with correct file paths
3. ✅ **Completed:** Deprecated code marked and documented
4. ⏭️ **Next:** Implement Phase 2 - Project Discovery UI
5. ⏭️ **Next:** Implement Phase 2 - Project Selection workflow
6. ⏭️ **Next:** Implement Phase 2 - Project Settings Editor

---

**Author:** Claude (based on research and file system analysis)
**Reviewed By:** [To be filled]
**Status:** Ready for review and commit
