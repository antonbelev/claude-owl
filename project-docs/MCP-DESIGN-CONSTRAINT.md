# MCP Servers Manager - Design Constraint Update

**Date:** January 13, 2025 (Updated: November 15, 2025)

**⚠️ IMPORTANT:** See `docs/adr-001-settings-management-redesign.md` for complete architecture decision on configuration file management.

## ⚠️ CRITICAL DESIGN CHANGE

The MCP Servers Manager has been updated to align with Claude Owl's **standalone desktop application design constraint**.

### What This Means

Claude Owl is **NOT** a project-aware tool. Users launch it from Applications folder with no knowledge of:
- Current working directory
- Project structure
- Project-specific configurations
- Project dependencies

### What Changed in Phase 1 Implementation

#### ❌ Removed (Violates Design Constraint)
- **Project-level scope**: Removed ability to add servers with `scope: 'project'`
- **Local scope**: Removed ability to add servers with `scope: 'local'`
- **Scope selector in UI**: Removed project/local options from form
- **Scope filtering**: Removed "All Scopes" / "User Level" / "Project Level" filter
- **Project config loading**: Removed logic to read `.mcp.json` from `process.cwd()`

#### ✅ Supported (Aligns with Design Constraint)
- **User-level servers**: Add/edit/delete servers via Claude CLI (`claude mcp add --scope user`)
- **Storage**: Servers stored in `~/.claude.json` under `mcpServers` key (CLI-managed)
- **Global availability**: User-level servers available to all projects
- **Simple interface**: No scope confusion - servers are inherently global
- **Read-only display**: Can display project-level servers from `~/.claude.json` projects list

### Implementation Details

**ClaudeService:**
- Reads from `~/.claude.json` to list all MCP servers (user + project)
- Parses `mcpServers` for user-level servers
- Parses `projects[path].mcpServers` for project-level servers
- Uses CLI commands for add/remove operations (never writes `.claude.json` directly)
- Removed `process.cwd()` usage
- All user-added servers use `scope: 'user'`

**UI Form now:**
- Removed scope selector radio buttons
- Added info note explaining user-level configuration
- Explains how to add project-specific servers (edit `.mcp.json` directly)

**IPC Types updated:**
- `AddMCPServerRequest` no longer has `scope` parameter
- `RemoveMCPServerRequest` no longer has `scope` parameter
- `MCPServerConfig.scope` is now literal `'user'` only

### How Users Add Project-Specific Servers

For MCP servers that should only be available in a specific project, users have three options:

**Option 1: Use Claude Code CLI (Recommended)**
```bash
cd /path/to/project
claude mcp add --scope project my-server
```
This adds the server to `~/.claude.json` under `projects["/path/to/project"].mcpServers`.

**Option 2: Manually edit `.mcp.json` in project root**
```json
{
  "mcpServers": {
    "project-local-server": {
      "command": "npx",
      "args": ["-y", "@example/project-specific-server"]
    }
  }
}
```

**Option 3: Future Claude Owl Phase 2**
- Select project from projects list
- Add server via UI (calls `claude mcp add --scope project` under the hood)

This approach keeps Claude Owl simple and maintains its design principle: **a standalone visual configuration tool for global Claude Code settings**.

### Testing

All tests updated to reflect user-level only management:
- ✅ `npm run build` - All TypeScript compilation passes
- ✅ Build artifacts generated successfully
- ✅ No `process.cwd()` in runtime code

### Files Changed

**Backend:**
- `src/main/services/MCPService.ts` - Removed project path handling
- `src/main/ipc/mcpHandlers.ts` - Removed scope parameter passing

**Frontend:**
- `src/renderer/components/MCPServersManager/AddServerForm.tsx` - Removed scope selector
- `src/renderer/components/MCPServersManager/MCPServersManager.tsx` - Removed scope filter
- `src/renderer/components/MCPServersManager/ServerCard.tsx` - Removed scope display

**Types:**
- `src/shared/types/mcp.types.ts` - Scope narrowed to `'user'`
- `src/shared/types/ipc.mcp.types.ts` - Removed scope from requests

---

## Why This Matters

This change ensures Claude Owl remains true to its design principle:
> Claude Owl is a standalone desktop application that manages global Claude Code settings, launched from Applications folder with no project context.

**Current Phase (Phase 1):**
- Claude Owl manages **user-level** MCP servers (available globally)
- Users add servers via Claude Owl UI → Calls `claude mcp add --scope user`
- Servers stored in `~/.claude.json` under `mcpServers` key

**Future Phase (Phase 2):**
- User selects a project from `~/.claude.json` projects list
- Claude Owl displays project-specific MCP servers (read-only or via CLI)
- Users can add project servers via CLI wrapper in Claude Owl UI

Claude Owl handles the common case: **global MCP server configuration**, with project-specific management coming in Phase 2.

