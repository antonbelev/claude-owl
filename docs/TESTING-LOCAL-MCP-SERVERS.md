# Testing MCP Servers Locally - Developer Guide

**Purpose:** Test Claude Owl's MCP Servers Manager with local MCP servers
**Target Audience:** Developers contributing to Claude Owl
**Last Updated:** January 13, 2025

---

## Quick Start

To test the MCP feature in Claude Owl, you need a local MCP server running. This guide shows you how to set up and test with simple example servers.

---

## Option 1: Use the Official Sequential Thinking Server (Easiest)

The Sequential Thinking server is lightweight and requires no API keys.

### Step 1: Start the Server

```bash
# This server runs locally via npx
# It doesn't require any API keys or environment variables
npx -y @modelcontextprotocol/server-sequential-thinking
```

The server will start and listen on stdio. You'll see output like:
```
[INFO] Sequential Thinking MCP Server initialized
[INFO] Ready for connections
```

**Leave this terminal open** while testing Claude Owl.

### Step 2: Add Server in Claude Owl

1. Open Claude Owl
2. Click **"+ Add Server"**
3. Fill in the form:
   - **Server Name:** `sequential-thinking`
   - **Transport Type:** Stdio (local process)
   - **Command:** `npx`
   - **Arguments:** (one per line)
     ```
     -y
     @modelcontextprotocol/server-sequential-thinking
     ```
4. Click **"Test Connection"**
5. Verify ✓ Connection Successful
6. Click **"Add Server"**

### Step 3: Test the Connection

Back in Claude Owl:
1. Find the "sequential-thinking" card
2. Click the **"Test"** button
3. You should see:
   - ✓ Step 1: Spawning Process
   - ✓ Step 2: Waiting for MCP Initialization
   - ✓ Step 3: Fetching Available Tools
   - ✓ Step 4: Health Check
   - 🎉 Connection Successful
   - Available tools: `think_sequentially`, `break_down_problem`, `analyze_step`

---

## Option 2: Create a Simple Test MCP Server

For more control and understanding, create your own minimal MCP server.

### Step 1: Create Test Server Directory

```bash
mkdir -p ~/mcp-test-server
cd ~/mcp-test-server
npm init -y
npm install @modelcontextprotocol/sdk
```

### Step 2: Create Server Script

Create `server.js`:

```javascript
#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

// Create server instance
const server = new Server({
  name: 'test-server',
  version: '1.0.0',
});

// Define a simple tool
server.setRequestHandler(
  { method: 'tools/list' },
  async () => ({
    tools: [
      {
        name: 'echo',
        description: 'Echo the input text',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The message to echo',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'add',
        description: 'Add two numbers',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: 'First number' },
            b: { type: 'number', description: 'Second number' },
          },
          required: ['a', 'b'],
        },
      },
    ],
  })
);

// Handle tool calls
server.setRequestHandler(
  { method: 'tools/call' },
  async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'echo':
        return { content: [{ type: 'text', text: args.message }] };
      case 'add':
        return {
          content: [
            {
              type: 'text',
              text: `${args.a} + ${args.b} = ${args.a + args.b}`,
            },
          ],
        };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
);

// Start server
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
```

### Step 3: Make it Executable

```bash
chmod +x server.js
```

### Step 4: Test the Server

```bash
# Test that it starts
node server.js <<< '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0"}}}'
```

You should see a response (press Ctrl+C to exit).

### Step 5: Add to Claude Owl

1. Open Claude Owl
2. Click **"+ Add Server"**
3. Fill in:
   - **Server Name:** `test-server`
   - **Transport Type:** Stdio
   - **Command:** `node`
   - **Arguments:** (absolute path to your server)
     ```
     /Users/YOUR_USERNAME/mcp-test-server/server.js
     ```
4. Click **"Test Connection"**
5. Verify ✓ Connection Successful
6. Click **"Add Server"**

---

## Option 3: Test with Popular MCP Servers

### Filesystem Server (No Auth Required)

Allows Claude to read/write files in specified directories.

```bash
# In Claude Owl:
Server Name:   filesystem
Transport:     Stdio
Command:       npx
Arguments:
  -y
  @modelcontextprotocol/server-filesystem
  /Users/YOUR_USERNAME/Documents
  /Users/YOUR_USERNAME/Desktop
```

### GitHub Server (Requires API Token)

1. Generate a GitHub personal access token:
   - Go to https://github.com/settings/tokens
   - Create token with `repo`, `gist` scopes
   - Copy the token

2. In Claude Owl:
   ```
   Server Name:   github
   Transport:     Stdio
   Command:       npx
   Arguments:
     -y
     @modelcontextprotocol/server-github
   Environment Variables:
     GITHUB_TOKEN: YOUR_TOKEN_HERE
   ```

3. Click **"Test Connection"** to verify

---

## Understanding the Test Flow

When you click **"Test Connection"** in Claude Owl, here's what happens:

### Step 1: Spawning Process ✓
- Claude Owl starts the MCP server process
- Command: `npx -y @modelcontextprotocol/server-sequential-thinking`
- Platform: Automatically handles Windows (`cmd /c`) wrapping

### Step 2: Waiting for MCP Initialization ✓
- Server starts and initializes
- Claude Owl waits for ready signal
- Timeout: 10 seconds

### Step 3: Fetching Available Tools ✓
- Claude Owl queries: "What tools do you provide?"
- Server responds with tool list
- Example: `think_sequentially`, `break_down_problem`, `analyze_step`

### Step 4: Health Check ✓
- Verifies server is responding normally
- Calculates latency (round-trip time)
- Example: 245ms

### Success 🎉
- Server is connected
- Tools are available
- Server is ready to use

---

## Troubleshooting

### Error: "Command not found: npx"

**Problem:** Node.js or npm not installed

**Solution:**
```bash
# Check if Node.js is installed
node --version

# If not, install from https://nodejs.org/
# Then verify npx works
npx --version
```

### Error: "Connection timeout after 10s"

**Problem:** Server is taking too long to initialize

**Solutions:**
1. First run often takes longer (downloading dependencies)
   - Wait 30+ seconds, then test again
2. Try with a simpler server (Sequential Thinking)
3. Check server logs for errors

### Error: "Server exited with code 1"

**Problem:** Server crashed during startup

**Solutions:**
1. Check the error message in Claude Owl
2. Run the command manually to see the actual error:
   ```bash
   npx -y @modelcontextprotocol/server-sequential-thinking
   ```
3. Fix the issue (missing dependencies, wrong path, etc.)

### Error: "Process killed: timeout"

**Problem:** Server didn't respond to tool query

**Solutions:**
1. Check if server is still running
2. Try a simpler server
3. Increase timeout: Edit server config and test again

---

## Common Test Scenarios

### Scenario 1: Basic Connection Test

**Goal:** Verify Claude Owl can start and connect to a server

**Steps:**
1. Add `sequential-thinking` server (no auth needed)
2. Click "Test Connection"
3. Verify all steps pass green
4. Check tools list appears

**Expected Result:** ✓ Connected, 3 tools available

### Scenario 2: Testing with Environment Variables

**Goal:** Verify env var passing works

**Steps:**
1. Add `github` server with `GITHUB_TOKEN` env var
2. Click "Test Connection"
3. Verify server initializes correctly

**Expected Result:** ✓ Connected, server has access to token

### Scenario 3: Multiple Servers

**Goal:** Verify Claude Owl handles multiple servers

**Steps:**
1. Add `sequential-thinking`
2. Add `filesystem` (with ~/Documents path)
3. Click "Test All Connections"
4. Both should connect successfully

**Expected Result:** Both ✓ Connected

### Scenario 4: Server Removal

**Goal:** Verify server deletion works

**Steps:**
1. Add a test server
2. Click delete button
3. Confirm deletion
4. Verify server is gone from list

**Expected Result:** Server removed from ~/.claude/mcp-servers.json

---

## Development Testing Checklist

Use this checklist when testing MCP features:

### Core Functionality
- [ ] Add stdio server successfully
- [ ] Add HTTP server successfully
- [ ] Remove server successfully
- [ ] List all servers shows correct count

### Connection Testing
- [ ] Test button spawns process
- [ ] Server initialization detected
- [ ] Tools list retrieved
- [ ] Health check completes
- [ ] Latency calculated correctly

### Error Handling
- [ ] Timeout error shows helpful message
- [ ] Command not found error shows helpful message
- [ ] Server crash error shows helpful message
- [ ] Permission denied error blocks dangerous paths

### UI/UX
- [ ] Server cards display correctly
- [ ] Status indicators show correct status
- [ ] Test button disabled while testing
- [ ] Delete confirmation works
- [ ] Search filters servers by name

### Platform Compatibility
- [ ] Windows: `cmd /c` wrapper applied for npx
- [ ] macOS: Standard stdio works
- [ ] Linux: Standard stdio works

### Edge Cases
- [ ] Server with no tools handles gracefully
- [ ] Server with 100+ tools displays correctly
- [ ] Very long command line arguments work
- [ ] Special characters in paths handled correctly
- [ ] Server that closes immediately shows error

---

## Next Steps for Testing

### After Basic Testing Works
1. **Test with Claude Code:**
   - Add same servers in Claude Code using `/mcp`
   - Verify servers work in both Claude Code and Claude Owl

2. **Test Marketplace Feature (Phase 2):**
   - Pre-populate marketplace with 12+ servers
   - Test one-click installation
   - Verify installed servers appear in Claude Owl

3. **Test Advanced Features (Phase 3):**
   - OAuth flow for HTTP servers
   - Background process management
   - Environment variable encryption

---

## Resources

### Official MCP Documentation
- https://code.claude.com/docs/en/mcp
- https://modelcontextprotocol.io/

### Example Servers
- Sequential Thinking: https://github.com/anthropics/mcp-servers/tree/main/src/sequential-thinking
- Filesystem: https://github.com/anthropics/mcp-servers/tree/main/src/filesystem
- GitHub: https://github.com/anthropics/mcp-servers/tree/main/src/github

### Testing Your MCP Server
- MCP Server Inspector: `npx @modelcontextprotocol/inspector [command]`
- Helps debug server issues interactively

---

## Questions or Issues?

If you encounter issues testing MCP servers:

1. Check the error message in Claude Owl (details view)
2. Run the server command manually to see actual errors
3. Check server logs (usually printed to console)
4. Verify environment variables are set correctly
5. Ensure command/path are absolute (not relative)

