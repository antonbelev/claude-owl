# Quick Start: Test MCP in Claude Owl (5 Minutes)

**Time Required:** 5 minutes
**Prerequisites:** Node.js installed (`node --version` should work)
**Difficulty:** Easy ⭐

---

## Step 1: Start the Test Server (Terminal)

Open a terminal and run:

```bash
npx -y @modelcontextprotocol/server-sequential-thinking
```

You should see output like:
```
[INFO] Sequential Thinking MCP Server initialized
[INFO] Listening on stdio
[INFO] Server ready
```

**⚠️ Keep this terminal open!** The server must stay running while you test in Claude Owl.

---

## Step 2: Open Claude Owl

Launch Claude Owl from Applications. You should see the Dashboard.

---

## Step 3: Add the Server

### Click "+ Add Server" button

<img alt="Add Server Button" src="./images/add-server-button.png" width="300">

### Fill in the Form

```
Server Name:        sequential-thinking
Transport Type:     Stdio (local process) ← Select this
Command:            npx
Arguments:          (one per line)
  -y
  @modelcontextprotocol/server-sequential-thinking
```

**Your form should look like:**

```
┌─ Add MCP Server ──────────────────────────────┐
│                                               │
│ Server Name *                                 │
│ ┌──────────────────────────────────────────┐ │
│ │ sequential-thinking                      │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ Transport Type *                              │
│ ○ Stdio (local process) ← SELECT THIS        │
│ ○ HTTP (remote server)                       │
│ ○ SSE (deprecated)                           │
│                                               │
│ Command *                                     │
│ ┌──────────────────────────────────────────┐ │
│ │ npx                                      │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ Arguments                                     │
│ ┌──────────────────────────────────────────┐ │
│ │ -y                                       │ │
│ │ @modelcontextprotocol/server-sequentia..│ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ ℹ️ MCP servers are managed globally at       │
│    ~/.claude/mcp-servers.json                │
│                                               │
│        [Cancel]  [Test Connection]  [Add]   │
└─────────────────────────────────────────────┘
```

---

## Step 4: Test the Connection

Click **"Test Connection"** button.

### Watch the Progress Modal

You should see each step complete with ✓:

```
┌─ Testing: sequential-thinking ────────────┐
│                                           │
│ Step 1: Spawning Process           ✓     │
│ ├─ Command: npx -y @modelcontext...       │
│ └─ PID: 12345                             │
│                                           │
│ Step 2: Waiting for MCP Init       ✓     │
│ ├─ Protocol version: 1.0                  │
│ └─ Server capabilities: tools             │
│                                           │
│ Step 3: Fetching Available Tools   ✓     │
│ ├─ Found 3 tools:                         │
│ │   • think_sequentially                  │
│ │   • break_down_problem                  │
│ │   • analyze_step                        │
│ └─ Latency: 245ms                         │
│                                           │
│ Step 4: Health Check               ✓     │
│ └─ Server responding normally             │
│                                           │
│ 🎉 Connection Successful                  │
│                                           │
│   [View Server Logs]  [Close]            │
└───────────────────────────────────────────┘
```

**All steps pass?** Great! Continue to next step.

**Getting an error?** See **Troubleshooting** section below.

---

## Step 5: Add the Server

Click **"Add Server"** button.

The modal will close and you'll see:

```
┌─────────────────────────────────────────────┐
│ MCP Servers                                 │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🧠 sequential-thinking    ✓ Connected   │ │
│ │                                         │ │
│ │ Stdio • npx • 3 tools                   │ │
│ │                                         │ │
│ │ [Test] [Delete]                        │ │
│ └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Success!** 🎉 Your first MCP server is now configured in Claude Owl.

---

## Step 6: Verify in Terminal

Back in your terminal (where the server is running), you should see activity:

```
[INFO] Connection established
[INFO] Tools queried: 3 tools returned
[INFO] Health check passed
```

---

## What Just Happened

1. **You started a local MCP server** that provides 3 tools:
   - `think_sequentially` - Generate step-by-step reasoning
   - `break_down_problem` - Decompose complex tasks
   - `analyze_step` - Evaluate individual reasoning steps

2. **You told Claude Owl about it** via the Add Server form

3. **Claude Owl tested the connection** by:
   - Starting the server process
   - Waiting for it to initialize
   - Asking it "What tools do you provide?"
   - Getting back: 3 tools available
   - Verifying it's healthy

4. **Claude Owl saved the config** to `~/.claude/mcp-servers.json`

---

## Next: Use in Claude Code

Now that the server is configured:

1. Open **Claude Code**
2. Mention the MCP server in your conversation
3. Claude will have access to the tools from this server

**Example:**
> "Using the sequential-thinking server, break down how to write a binary search algorithm"

Claude will now have access to:
- ✓ `think_sequentially` tool
- ✓ `break_down_problem` tool
- ✓ `analyze_step` tool

---

## Cleanup (Optional)

To remove the server later:

1. In Claude Owl, find the server card
2. Click **"Delete"** button
3. Confirm deletion

Or delete from terminal:
```bash
claude mcp remove sequential-thinking
```

---

## Troubleshooting

### ❌ "Command not found: npx"

**Problem:** Node.js not installed

**Fix:**
```bash
node --version
npm --version
npx --version
```

If any fail, install Node.js: https://nodejs.org/

### ❌ "Connection timeout after 10 seconds"

**Problem:** Server took too long to start

**Fixes:**
- First run is slow (downloading ~50MB). Wait 30+ seconds, retry.
- Close first server: `Ctrl+C` in terminal
- Try again: `npx -y @modelcontextprotocol/server-sequential-thinking`

### ❌ "Server initialization timeout"

**Problem:** Server crashed or didn't send ready signal

**Fix:**
1. Look at terminal running the server
2. You should see error output there
3. Common issues:
   - Disk space (if download failed)
   - Firewall blocking (unlikely for stdio)
   - npm registry down (unlikely, but possible)

Try again in a minute.

### ❌ "Test Connection" button greyed out

**Problem:** Still testing from previous attempt

**Fix:** Wait for the test modal to close or click "Close"

### ❌ Server card shows "❌ Error"

**Problem:** Server crashed after initial connection

**Fixes:**
1. Delete the server in Claude Owl
2. Restart your terminal
3. Run the server again
4. Add it again in Claude Owl

---

## What's Next?

Now that you have MCP working, you can:

### Try Other Servers
- **Filesystem:** Read/write files in your directories
- **GitHub:** Query GitHub repos and issues
- **Brave Search:** Web search capability

See `TESTING-LOCAL-MCP-SERVERS.md` for more options.

### Learn the Details
- `MCP-DESIGN-CONSTRAINT.md` - Why Claude Owl manages global servers only
- `CONSTRAINT-ALIGNMENT-SUMMARY.md` - Implementation details
- `adr-mcp-manager.md` - Full architecture design

### Contribute to Claude Owl
- Test other MCP servers
- Report any issues
- Suggest improvements to error messages

---

## Quick Reference

### Terminal (Keep Open)
```bash
npx -y @modelcontextprotocol/server-sequential-thinking
```

### Claude Owl Form
| Field | Value |
|-------|-------|
| Server Name | `sequential-thinking` |
| Transport | Stdio |
| Command | `npx` |
| Arguments | `-y` + `@modelcontextprotocol/server-sequential-thinking` |

### Expected Result
✓ Connected • 3 tools available

---

## Questions?

If you get stuck:
1. Check the error message in Claude Owl (details view)
2. Run `node --version` to verify Node.js is installed
3. Check terminal where server is running for error logs
4. See full troubleshooting guide in `TESTING-LOCAL-MCP-SERVERS.md`

