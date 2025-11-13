# MCP Servers Manager - Design Constraint Update

**Date:** January 13, 2025

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
- **User-level servers**: Add/edit/delete servers in `~/.claude/mcp-servers.json`
- **Global availability**: User-level servers available to all projects
- **Simple interface**: No scope confusion - servers are inherently global

### Implementation Details

**MCPService now:**
- Only reads from `~/.claude/mcp-servers.json` (user-level)
- Removed `process.cwd()` usage
- Removed project path detection
- All servers use `scope: 'user'`

**UI Form now:**
- Removed scope selector radio buttons
- Added info note explaining user-level configuration
- Explains how to add project-specific servers (edit `.mcp.json` directly)

**IPC Types updated:**
- `AddMCPServerRequest` no longer has `scope` parameter
- `RemoveMCPServerRequest` no longer has `scope` parameter
- `MCPServerConfig.scope` is now literal `'user'` only

### How Users Add Project-Specific Servers

For MCP servers that should only be available in a specific project:

1. Open the project in your editor
2. Edit `.mcp.json` (or `.claude/mcp.json`) in the project root
3. Add the server configuration manually

**Example `.mcp.json`:**
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

Users who need project-specific MCP servers should:
- Use their code editor to edit `.mcp.json`
- Or use Claude Code's `/mcp` command to manage project servers

Claude Owl handles the common case: global MCP server configuration.

