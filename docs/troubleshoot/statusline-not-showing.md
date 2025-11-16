# StatusLine Not Showing - Troubleshooting Guide

**Last Updated:** 2025-11-16

This document provides comprehensive troubleshooting steps for when Claude Code's statusLine feature is not displaying, based on research of official documentation, GitHub issues, and community reports.

---

## Table of Contents

1. [CRITICAL: Web vs CLI Environment](#1-critical-web-vs-cli-environment)
2. [Version Requirements](#2-version-requirements)
3. [Common Configuration Issues](#3-common-configuration-issues)
4. [Known Bugs and Workarounds](#4-known-bugs-and-workarounds)
5. [Script Execution Requirements](#5-script-execution-requirements)
6. [Platform-Specific Issues](#6-platform-specific-issues)
7. [Advanced Diagnostics](#7-advanced-diagnostics)
8. [Debugging Checklist](#8-debugging-checklist)

---

## 1. CRITICAL: Web vs CLI Environment

### ⚠️ StatusLine is a CLI-ONLY Feature

**The #1 reason statusLine doesn't work: You're using Claude Code on the Web**

StatusLine is **NOT supported** in Claude Code's web version (claude.ai/code). It only works in the CLI version.

#### How to Check Your Environment

**You're using Claude Code Web if:**
- You're accessing Claude through a browser at `claude.ai/code`
- You see "Claude Code on the web" in the interface
- Your sessions run in cloud sandboxes
- You're working with GitHub repositories remotely

**You're using Claude Code CLI if:**
- You run `claude` command in your terminal
- You see the interactive CLI interface
- You're working with local files on your machine
- You installed Claude Code via npm, pip, or direct download

#### Why StatusLine Doesn't Work on Web

Claude Code on the web runs in **isolated cloud sandboxes** that:
- Cannot access your local filesystem (including `~/.claude/settings.json`)
- Cannot execute local scripts (like `statusline.sh`)
- Cannot read your local environment variables
- Run in containerized Ubuntu environments with limited access

**Reference:** [Anthropic Engineering - Claude Code Sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing)

#### Environment Detection in Hooks

If you're writing hooks that should work in both environments, check the `CLAUDE_CODE_REMOTE` variable:

```bash
#!/bin/bash
# Skip statusLine in remote (web) environments
if [ "$CLAUDE_CODE_REMOTE" = "true" ]; then
  echo "StatusLine not supported in web environment"
  exit 0
fi

# Your statusLine script here
```

**GitHub Issues:**
- [#6526](https://github.com/anthropics/claude-code/issues/6526) - StatusLine not displaying on Windows (closed as duplicate)
- [#5863](https://github.com/anthropics/claude-code/issues/5863) - StatusLine not appearing with command-line flags

---

## 2. Version Requirements

### Minimum Version

StatusLine feature was introduced on **August 8, 2025** in Claude Code version **1.0.80+**

#### Check Your Version

```bash
claude --version
```

#### Upgrade Claude Code

If you're on an older version, upgrade:

```bash
# npm installation
npm update -g @anthropic/claude-code

# pip installation
pip install --upgrade claude-code

# Or check the official installation docs
```

**GitHub Issue:** [#6107](https://github.com/anthropics/claude-code/issues/6107) - User had an older version where statusLine wasn't implemented yet

---

## 3. Common Configuration Issues

### A. Permissions in settings.json

**CRITICAL BUG:** Invalid permissions configuration can silently break statusLine!

❌ **This will break statusLine:**
```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh"
  },
  "permissions": {
    "allow": [
      "git log $(git merge-base HEAD dev)..HEAD --oneline"
    ]
  }
}
```

The problematic `permissions` object causes statusLine to disappear with **no error messages**.

✅ **Fix:** Remove or correct the permissions configuration:
```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 0
  }
}
```

**GitHub Issue:** [#8193](https://github.com/anthropics/claude-code/issues/8193) - User's statusLine disappeared due to malformed permissions

### B. Correct JSON Format

Your `~/.claude/settings.json` must be valid JSON:

```json
{
  "statusLine": {
    "type": "command",
    "command": "/Users/yourusername/.claude/statusline.sh",
    "padding": 0
  }
}
```

**Key points:**
- No trailing commas
- Use double quotes, not single quotes
- Properly escaped paths (especially on Windows)
- `type` must be `"command"`
- `command` path must be absolute or use `~` for home directory

### C. Path Issues

❌ **Common path mistakes:**
```json
"command": "statusline.sh"                    // Won't find script
"command": "./.claude/statusline.sh"          // Relative paths don't work reliably
"command": "C:\Users\Name\.claude\status.sh"  // Unescaped backslashes on Windows
```

✅ **Correct paths:**
```json
// macOS/Linux - Using tilde
"command": "~/.claude/statusline.sh"

// macOS/Linux - Absolute path
"command": "/Users/yourusername/.claude/statusline.sh"

// Windows - Double backslashes
"command": "C:\\Users\\YourUsername\\.claude\\statusline.sh"

// Windows - Forward slashes (also works)
"command": "C:/Users/YourUsername/.claude/statusline.sh"
```

### D. Script Permissions

Your script MUST be executable:

```bash
chmod +x ~/.claude/statusline.sh
```

Verify permissions:
```bash
ls -la ~/.claude/statusline.sh
```

Should show: `-rwxr-xr-x` (the `x` means executable)

---

## 4. Known Bugs and Workarounds

### Bug #1: StatusLine Not Appearing with Command-Line Flags

**Symptoms:** StatusLine works when you run `claude` but disappears when using flags like:
- `claude --add-dir /path/to/project`
- `claude --continue session-id`
- `claude /path/to/project`

**Status:** Known bug ([#5863](https://github.com/anthropics/claude-code/issues/5863))

**Workaround:** Start Claude without flags first, then navigate to your project:
```bash
# Instead of: claude --add-dir ~/myproject
# Do this:
cd ~/myproject
claude
```

### Bug #2: StatusLine Shows "undefined"

**Symptoms:** Instead of your custom status, you see the literal text "undefined"

**Cause:** Claude Code's CLI initialization bug where `void 0` (JavaScript undefined) gets stringified

**Status:** Duplicate of [#6622](https://github.com/anthropics/claude-code/issues/6622), closed

**Workaround:** Ensure your script always outputs something:
```bash
#!/bin/bash
# Always output something, even on error
output=$(generate_status 2>/dev/null) || output="Status unavailable"
echo "$output"
```

### Bug #3: StatusLine Disappeared After Working Previously

**Symptoms:** StatusLine worked before but suddenly stopped showing

**Common Causes:**
1. Updated Claude Code to a version with a regression
2. Changed `settings.json` and introduced a syntax error
3. Added a `permissions` block (see Section 3.A)
4. Started using command-line flags (see Bug #1)

**Troubleshooting Steps:**
1. Validate your JSON: Use `jq` or an online JSON validator
   ```bash
   jq . ~/.claude/settings.json
   ```
2. Check Claude Code version: `claude --version`
3. Test script manually:
   ```bash
   echo '{"model":{"id":"claude-3-5-sonnet-20241022","display_name":"Claude 3.5 Sonnet"},"workspace":{"current_dir":"/tmp"}}' | ~/.claude/statusline.sh
   ```
4. Remove all other settings temporarily, keep only statusLine

---

## 5. Script Execution Requirements

### A. Shebang Line

Your script MUST start with a proper shebang:

```bash
#!/bin/bash
```

Or for other interpreters:
```bash
#!/usr/bin/env node    # For Node.js
#!/usr/bin/env python3 # For Python
#!/bin/zsh             # For Zsh
```

### B. Reading JSON from stdin

Claude Code passes JSON data via stdin. Your script must read it:

**Bash:**
```bash
#!/bin/bash
input=$(cat)
# Parse with jq
model=$(echo "$input" | jq -r '.model.display_name')
dir=$(echo "$input" | jq -r '.workspace.current_dir')
echo "Model: $model | Dir: $dir"
```

**Node.js:**
```javascript
#!/usr/bin/env node
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const data = JSON.parse(input);
  console.log(`Model: ${data.model.display_name} | Dir: ${data.workspace.current_dir}`);
});
```

**Python:**
```python
#!/usr/bin/env python3
import sys
import json

data = json.loads(sys.stdin.read())
print(f"Model: {data['model']['display_name']} | Dir: {data['workspace']['current_dir']}")
```

### C. JSON Input Format

Claude Code provides this JSON structure:

```json
{
  "session_id": "session-abc123",
  "transcript_path": "/path/to/transcript.json",
  "model": {
    "id": "claude-3-5-sonnet-20241022",
    "display_name": "Claude 3.5 Sonnet"
  },
  "workspace": {
    "current_dir": "/Users/name/project",
    "project_dir": "/Users/name/project"
  }
}
```

### D. Output Format

**The first line of stdout becomes your statusLine text**

```bash
#!/bin/bash
# Only the first echo will be shown
echo "This appears in statusLine"
echo "This is ignored"
```

**ANSI color codes are supported:**
```bash
echo -e "\033[1;32mGreen\033[0m \033[1;34mBlue\033[0m"
```

### E. Testing Your Script

Always test manually before expecting it to work in Claude:

```bash
# Simulate Claude Code's JSON input
echo '{
  "session_id": "test",
  "model": {"id": "test-model", "display_name": "Test Model"},
  "workspace": {"current_dir": "/tmp", "project_dir": "/tmp"}
}' | ~/.claude/statusline.sh
```

Expected: Your script should output a single line immediately and exit.

**Common issues:**
- Script hangs waiting for input (forgot to read from stdin)
- Script outputs multiple lines (only first line is used)
- Script exits with error (check stderr)
- Script takes too long (timeout after 300ms)

---

## 6. Platform-Specific Issues

### A. Windows (PowerShell)

**Known Issue:** StatusLine not displaying on Windows 11 + PowerShell ([#6526](https://github.com/anthropics/claude-code/issues/6526))

**Symptoms:**
- Script executes successfully when tested manually
- Claude Code logs show script is being called
- But statusLine never appears in the interface

**Workarounds:**

1. **Use PowerShell script instead of bash:**
   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "powershell -ExecutionPolicy Bypass -File C:\\Users\\YourName\\.claude\\statusline.ps1"
     }
   }
   ```

2. **Try WSL (Windows Subsystem for Linux):**
   - Install WSL2 with Ubuntu
   - Install Claude Code in WSL
   - Use bash scripts instead of PowerShell

3. **Use full paths (not ~):**
   ```json
   "command": "C:\\Users\\YourUsername\\.claude\\statusline.sh"
   ```

### B. macOS

**zsh Profile:** Ensure your script can access commands:

```bash
#!/bin/bash
# If using zsh-specific tools, source the profile
if [ -f ~/.zshrc ]; then
  source ~/.zshrc
fi

# Your statusLine code here
```

**Path issues:** macOS may use different paths:
- User home: `/Users/username`
- Not `/home/username` (that's Linux)

### C. Linux

**Minimal environment:** Claude Code may not load your full shell environment

```bash
#!/bin/bash
# Explicitly set PATH if needed
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Your statusLine code here
```

---

## 7. Advanced Diagnostics

### A. Enable Debug Logging

Check Claude Code's logs for statusLine errors:

**macOS/Linux:**
```bash
# Claude Code typically logs to:
~/Library/Logs/Claude/
# or
~/.claude/logs/
```

**Windows:**
```
%APPDATA%\Claude\logs\
```

Look for errors like:
- "statusLine script timed out"
- "statusLine script exited with code 1"
- "Failed to execute statusLine command"

### B. Timing Issues

StatusLine scripts timeout after **300ms** (0.3 seconds)

If your script is slow:
```bash
#!/bin/bash
# Cache expensive operations
CACHE_FILE="/tmp/claude-statusline-cache"
CACHE_AGE=5  # seconds

if [ -f "$CACHE_FILE" ]; then
  age=$(($(date +%s) - $(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE")))
  if [ "$age" -lt "$CACHE_AGE" ]; then
    cat "$CACHE_FILE"
    exit 0
  fi
fi

# Generate status (slow operation)
status=$(expensive_operation)
echo "$status" | tee "$CACHE_FILE"
```

### C. Dependency Issues

**jq not found:**
```bash
#!/bin/bash
if ! command -v jq &> /dev/null; then
  echo "Error: jq not installed"
  exit 1
fi

input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name')
echo "$model"
```

**Install jq:**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (via chocolatey)
choco install jq
```

### D. Restart Claude Code

After any changes:
1. Exit Claude Code completely (not just the session)
2. Kill any lingering processes:
   ```bash
   # macOS/Linux
   pkill -f claude
   ```
3. Restart your terminal (to reload shell environment)
4. Start Claude Code fresh:
   ```bash
   claude
   ```

---

## 8. Debugging Checklist

Use this checklist to systematically debug your statusLine issue:

### Environment Check
- [ ] Are you using **Claude Code CLI** (not Web)?
- [ ] Check: `claude --version` shows **1.0.80 or higher**?
- [ ] Check: `echo $CLAUDE_CODE_REMOTE` is empty/not set?

### Configuration Check
- [ ] File exists: `~/.claude/settings.json`
- [ ] JSON is valid: `jq . ~/.claude/settings.json` (no errors)
- [ ] No `permissions` block with command substitution syntax
- [ ] `type` is set to `"command"`
- [ ] `command` path is absolute or uses `~`

### Script Check
- [ ] Script exists at the path specified in settings.json
- [ ] Script is executable: `ls -la ~/.claude/statusline.sh` shows `-rwxr-xr-x`
- [ ] Script has shebang line: `#!/bin/bash` or equivalent
- [ ] Script reads from stdin (not command-line args)
- [ ] Script outputs to stdout (not stderr)
- [ ] Manual test works:
  ```bash
  echo '{"model":{"display_name":"Test"},"workspace":{"current_dir":"/tmp"}}' | ~/.claude/statusline.sh
  ```
- [ ] Script completes in < 300ms
- [ ] Script always outputs at least one line (no silent failures)

### Launch Method Check
- [ ] Started Claude Code without command-line flags?
- [ ] If using flags, does it work without them?
- [ ] Tried from home directory: `cd ~ && claude`?

### System Check
- [ ] Dependencies installed (jq, git, etc.)?
- [ ] Path issues on Windows (backslashes escaped)?
- [ ] Restarted terminal after changes?
- [ ] Restarted Claude Code after changes?

### Last Resort
- [ ] Removed all settings except statusLine
- [ ] Created minimal test script that just outputs "TEST"
- [ ] Tried in a fresh terminal window
- [ ] Checked GitHub issues for similar problems
- [ ] Checked Claude Code version for known regressions

---

## References

### Official Documentation
- [Status line configuration](https://code.claude.com/docs/en/statusline) (Note: May be inaccessible due to 403 errors)
- [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Anthropic Engineering: Claude Code Sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing)

### GitHub Issues (Open/Closed)
- [#8193](https://github.com/anthropics/claude-code/issues/8193) - Status line disappeared (permissions bug)
- [#6526](https://github.com/anthropics/claude-code/issues/6526) - Windows PowerShell display issue
- [#6107](https://github.com/anthropics/claude-code/issues/6107) - Old version compatibility
- [#5863](https://github.com/anthropics/claude-code/issues/5863) - Command-line flags bug
- [#10486](https://github.com/anthropics/claude-code/issues/10486) - "undefined" text bug
- [#6622](https://github.com/anthropics/claude-code/issues/6622) - Related to undefined display
- [#5622](https://github.com/anthropics/claude-code/issues/5622) - Model switching updates

### Community Resources
- [Creating The Perfect Claude Code Status Line](https://www.aihero.dev/creating-the-perfect-claude-code-status-line)
- [Claude Code Custom Status Line Setup Guide for Windows](https://harishgarg.com/claude-code-custom-status-line-setup-guide-for-windows)
- [ccstatusline](https://github.com/sirmalloc/ccstatusline) - Community statusline tool
- [claude-code-statusline](https://github.com/rz1989s/claude-code-statusline) - Advanced statusline with themes

---

## Quick Fix Summary

**Most common issues and fixes:**

1. **Using Claude Code Web?** → StatusLine only works in CLI version
2. **Old version?** → Upgrade to 1.0.80+
3. **Using `--add-dir` or flags?** → Start without flags
4. **Have `permissions` block?** → Remove it
5. **Script not executable?** → `chmod +x ~/.claude/statusline.sh`
6. **Script doesn't read stdin?** → Add `input=$(cat)` or equivalent
7. **Windows paths?** → Use `C:\\` or `C:/` format
8. **Slow script?** → Add caching, must complete < 300ms
9. **Made changes?** → Restart terminal AND Claude Code

**Minimal working example:**

`~/.claude/settings.json`:
```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh"
  }
}
```

`~/.claude/statusline.sh`:
```bash
#!/bin/bash
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
dir=$(echo "$input" | jq -r '.workspace.current_dir | split("/") | .[-1] // "~"')
echo "$model | $dir"
```

```bash
chmod +x ~/.claude/statusline.sh
```

Test:
```bash
echo '{"model":{"display_name":"Test"},"workspace":{"current_dir":"/tmp"}}' | ~/.claude/statusline.sh
```

Restart Claude Code and it should work!

---

**If none of these solutions work, file a bug report at:**
https://github.com/anthropics/claude-code/issues

Include:
- Claude Code version (`claude --version`)
- OS and shell (macOS + zsh, Windows + PowerShell, etc.)
- Your `settings.json` (redact sensitive info)
- Your statusline script (or minimal reproduction)
- Output of manual test with sample JSON
- Screenshots if possible
