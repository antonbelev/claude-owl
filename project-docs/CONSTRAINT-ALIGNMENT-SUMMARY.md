# MCP Implementation - Design Constraint Alignment Summary

**Status:** ✅ Complete and tested
**Date:** January 13, 2025
**Commit:** ce2ab47

## Problem

The initial MCP Servers Manager implementation violated Claude Owl's critical design constraint:

> **Claude Owl is a standalone desktop application, NOT project-aware.**

The implementation included:
- ❌ Project-level MCP server scope
- ❌ Local-only scope for servers
- ❌ `process.cwd()` to detect project directories
- ❌ Loading from `.mcp.json` in current directory
- ❌ Scope selector in UI allowing multiple scope options

## Solution

Completely removed project context awareness from MCP management:

### Backend Changes

**MCPService (`src/main/services/MCPService.ts`):**
- Removed `projectMcpPath` - only `userMcpPath` (~/.claude/mcp-servers.json) remains
- Removed `process.cwd()` usage - no project detection
- Removed `scope` parameter options - always `'user'`
- Updated `listServers()` to only load from user config
- Updated `removeServer()` to only target user config
- Updated `loadServersFromFile()` to accept only `'user'` scope

**IPC Handlers (`src/main/ipc/mcpHandlers.ts`):**
- `AddMCPServerRequest` no longer accepts `scope` parameter
- `RemoveMCPServerRequest` no longer accepts `scope` parameter
- Hardcoded `scope: 'user'` when creating configs

### Type Changes

**MCPServerConfig (`src/shared/types/mcp.types.ts`):**
```typescript
// Before: scope: 'user' | 'project' | 'local'
// After:
scope: 'user';  // Literal type only
```

**IPC Types (`src/shared/types/ipc.mcp.types.ts`):**
- `AddMCPServerRequest` no longer has `scope` field
- `RemoveMCPServerRequest` no longer has `scope` field

### UI Changes

**AddServerForm (`src/renderer/components/MCPServersManager/AddServerForm.tsx`):**
- ❌ Removed `scope` state variable
- ❌ Removed scope selector radio buttons
- ✅ Added informational note explaining user-level configuration
- ✅ Added guidance: "For project-specific MCP servers, edit .mcp.json directly"

**MCPServersManager (`src/renderer/components/MCPServersManager/MCPServersManager.tsx`):**
- ❌ Removed `scopeFilter` state
- ❌ Removed scope dropdown filter
- ✅ Simplified filter logic to only search by name

**ServerCard (`src/renderer/components/MCPServersManager/ServerCard.tsx`):**
- ❌ Removed scope display from card details

## Files Modified

```
Backend:
  src/main/services/MCPService.ts          (68 lines changed)
  src/main/ipc/mcpHandlers.ts              (12 lines changed)

Frontend:
  src/renderer/components/MCPServersManager/AddServerForm.tsx       (22 lines changed)
  src/renderer/components/MCPServersManager/MCPServersManager.tsx    (18 lines changed)
  src/renderer/components/MCPServersManager/ServerCard.tsx          (10 lines changed)

Types:
  src/shared/types/mcp.types.ts            (6 lines changed)
  src/shared/types/ipc.mcp.types.ts        (6 lines changed)

Documentation:
  docs/adr-mcp-manager.md                  (14 lines added)
  docs/MCP-DESIGN-CONSTRAINT.md            (NEW - detailed explanation)
```

## Design Trade-offs

### What We're Giving Up
- Project-level scope selection in UI
- Ability to configure project-specific servers in Claude Owl

### What We're Gaining
- **Simplicity**: No project context confusion
- **Correctness**: Matches actual app behavior (launched from Applications)
- **Clarity**: Users understand servers are global
- **Maintainability**: No `process.cwd()` hacks

## User Experience Impact

### Adding User-Level Servers (✅ Supported)
Users can use Claude Owl's UI to add global servers available to all projects:
```
Claude Owl → Add MCP Server → Configure → Done
All projects can now use this server
```

### Adding Project-Specific Servers (✅ Still Possible, Different Flow)
Users manually edit `.mcp.json` in their project:
```
Editor → Open .mcp.json → Add config manually → Save
Only this project can use this server
```

This is actually simpler than having two scopes in UI.

## Build Status

✅ **All targets build successfully:**
- `npm run build:renderer` - Vite build complete
- `npm run build:main` - TypeScript compilation passes
- `npm run build:preload` - Preload scripts compile
- `npm run typecheck` - Strict mode compliance

## Testing

✅ **Verified:**
- No `process.cwd()` in runtime code
- No project path detection logic
- All scope references changed to `'user'`
- UI forms don't expose scope options
- Type system enforces single scope

## Future Work

Phase 2+ MCP improvements can safely focus on:
- Marketplace integration
- Better error messages
- Connection diagnostics
- Environment variable management

All without worrying about project scope complexity.

## References

See `/docs/MCP-DESIGN-CONSTRAINT.md` for detailed design rationale.
See `/CLAUDE.md` **Critical Design Constraint** section for why this matters.

