# Claude Owl Demo Guide

**Target Audience:** Video walkthrough demonstrating Claude Owl capabilities
**Duration:** ~10 minutes
**Platform:** macOS (Beta v0.1.0)

---

## Introduction Script

> "Claude Owl is a desktop application for macOS that provides a visual interface for managing Claude Code configurations. Instead of manually editing JSON files, you can configure subagents, skills, slash commands, hooks, permissions, and more through an intuitive UI."

---

## Demo Scenario: Setting Up a Secure Development Environment

This walkthrough demonstrates configuring Claude Code for a secure Python development workflow.

---

## 1. Dashboard - System Status

**Navigation:** Launch Claude Owl → Dashboard (default view)

**What to Show:**
- **Claude Code Status Card**
  - Shows Claude CLI installation status
  - Version: 1.x.x (if installed)
  - Installation path: `/usr/local/bin/claude`
  - Click "Refresh" to re-check

- **API Service Status Card**
  - Real-time status from status.claude.com
  - Shows operational status (green indicator)
  - Recent incidents (if any) with timeline
  - Click "View Full Status Page" to open external link

**Talking Points:**
- "Before configuring Claude Code, we verify the CLI is installed and the API service is operational"
- "This saves time debugging configuration issues that are actually installation or service problems"

---

## 2. Settings - Permission Rules & Security

**Navigation:** Sidebar → Settings

**What to Show:**

### Step 1: Select Settings Scope
- Click "User Settings" (applies to all projects)
- Show Project Selector dropdown (optional: demonstrate project-specific settings)

### Step 2: Navigate to Permissions Tab
- Click "Permissions" tab in Settings Editor
- Show empty permission rules list (or existing rules)

### Step 3: Apply Security Template
- Click "Add from Template" button
- Select **"Block Environment Files"** template
- Show the template preview:
  ```
  Tool: Read
  Permission: Ask
  Pattern: **/.env*
  Description: Protect environment files from accidental reads
  ```
- Click "Apply Template"
- Rule appears in the list with yellow "ASK" badge

### Step 4: Add Custom Rule (Manual)
- Click "+ Add Rule" button
- **Configure:**
  - Tool: `Bash`
  - Permission: `Deny`
  - Pattern: `sudo *, rm -rf *`
  - Description: `Block dangerous system commands`
- Click "Add Rule"
- Rule appears with red "DENY" badge

### Step 5: Test Rules (Optional)
- Click "Test Rules" button
- Enter test input: `Read .env.local`
- Shows: ⚠️ **ASK** - Matches "Block Environment Files" rule
- Enter test input: `sudo apt-get install`
- Shows: 🚫 **DENY** - Matches "Block dangerous commands" rule

### Step 6: Save Settings
- Click "Save Changes" button (top-right, blue)
- Success notification appears
- Settings written to `~/.claude/settings.json`

**Talking Points:**
- "The visual rule builder makes it easy to configure fine-grained permissions without editing JSON"
- "6 pre-built security templates cover common scenarios"
- "The rule tester lets you verify rules before saving"

---

## 3. Status Line - Custom CLI Prompts

**Navigation:** Sidebar → Status Line

**What to Show:**

### Step 1: Browse Templates
- View Template Gallery (grid view)
- Show templates by category:
  - **Beginner:** Basic Info, Simple Git
  - **Intermediate:** Git + Cost, Project Context
  - **Advanced:** Full Developer, Cost Tracker
  - **Specialized:** Git Guardian

### Step 2: Apply Template
- Click on **"Git + Cost Tracker"** template card
- Show Live Preview modal:
  - Preview output: `sonnet-4 | ~/my-project [main] | $0.05`
  - Bash script shown below preview
  - Dependencies listed: git, jq
- Click "Apply This Template"
- Success modal shows:
  - Script saved to: `~/.claude/status_line.sh`
  - Permissions set (chmod +x)
  - Settings updated

### Step 3: Verify Active
- Status Line Manager shows: ✅ **Active:** git-cost-tracker
- Click "Disable" to turn off (optional demo)

**Talking Points:**
- "Status lines add context to every Claude Code session"
- "Templates make it trivial to set up advanced features like cost tracking"
- "Scripts are automatically configured with correct permissions"

---

## 4. Subagents - Create Custom Agent

**Navigation:** Sidebar → Subagents

**What to Show:**

### Create a Python Testing Agent

- Click "+ New Agent" button
- Fill out form:

**Copy-Paste Data:**
```
Name: python-tester
Description: Specialized agent for writing and running Python unit tests with pytest
Model: Haiku (faster for test generation)
Tool Restrictions: Bash, Read, Write, Edit
```

**System Prompt (Copy-Paste):**
```markdown
You are a Python testing specialist. Your role is to:

1. Write comprehensive unit tests using pytest
2. Follow PEP 8 style guidelines
3. Use descriptive test names (test_should_...)
4. Include edge cases and error scenarios
5. Run tests and analyze failures

When writing tests:
- Use pytest fixtures for setup/teardown
- Parametrize tests for multiple scenarios
- Include docstrings explaining what's being tested
- Ensure tests are isolated and repeatable

After writing tests, always run them with:
pytest -v --tb=short
```

- **Location:** User (available across all projects)
- Click "Create Agent"
- Agent card appears in grid

**Talking Points:**
- "Custom agents let you create specialized workflows"
- "Tool restrictions limit what the agent can do for safety"
- "Model selection optimizes cost (Haiku) or capability (Sonnet/Opus)"

---

## 5. Skills - Upload Custom Skill

**Navigation:** Sidebar → Skills

**What to Show:**

### Option A: Create Manually

- Click "+ New Skill" → "Create Manually"
- Fill out form:

**Copy-Paste Data:**
```
Name: code-review-checklist
Description: Systematic code review process with security and performance checks
Allowed Tools: Read, Grep, Bash
Location: User
```

**Instructions (Markdown Content):**
```markdown
# Code Review Checklist Skill

When performing code reviews, follow this systematic checklist:

## Security
- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection in web outputs
- [ ] Authentication/authorization checks

## Code Quality
- [ ] Functions are small and single-purpose
- [ ] Descriptive variable/function names
- [ ] Comments explain "why", not "what"
- [ ] Error handling for edge cases
- [ ] No unused imports or dead code

## Testing
- [ ] Unit tests for new functionality
- [ ] Edge cases covered
- [ ] Test coverage > 80%

## Performance
- [ ] No N+1 queries
- [ ] Efficient algorithms (check Big O)
- [ ] Database indexes where needed
- [ ] Caching for expensive operations

Always provide specific file:line references in your feedback.
```

- Click "Create Skill"
- Skill card appears with file count, tool count

### Option B: Upload from File

- Click "+ New Skill" → "Upload .md File"
- Select a markdown file with frontmatter
- Form auto-populates from frontmatter
- Click "Upload"

**Talking Points:**
- "Skills embed reusable knowledge into Claude sessions"
- "Upload existing markdown files or create from scratch"
- "Tool restrictions ensure skills stay in their lane"

---

## 6. Slash Commands - Create Quick Command

**Navigation:** Sidebar → Slash Commands

**What to Show:**

### Create a /review-security Command

- Click "+ New Command" button
- **Step 1: Name & Namespace**
  - Name: `review-security`
  - Namespace: (leave empty)
  - Click "Next"

- **Step 2: Frontmatter**
  - Description: `Perform a security-focused code review`
  - Argument Hint: `[file or directory]`
  - Model: `Sonnet` (better reasoning)
  - Tools: Select `Read, Grep, Bash`
  - Click "Next"

- **Step 3: Content (Copy-Paste):**
```markdown
You are performing a security-focused code review. Analyze the provided code for:

1. **Injection Vulnerabilities**
   - SQL injection (check for string concatenation in queries)
   - Command injection (check shell execution with user input)
   - XSS (check HTML output sanitization)

2. **Authentication & Authorization**
   - Missing authentication checks
   - Broken access control
   - Insecure session management

3. **Sensitive Data Exposure**
   - Hardcoded secrets, API keys, passwords
   - Logging sensitive information
   - Unencrypted sensitive data

4. **Security Misconfiguration**
   - Debug mode in production
   - Default credentials
   - Unnecessary open ports/services

For each issue found:
- Provide file:line reference
- Explain the security risk
- Suggest a fix with code example

Use these tools:
- `Read` to examine files
- `Grep` to search for patterns (e.g., "password.*=", "eval(", "exec(")
- `Bash` to run security linters (if available)
```

- Click "Create Command"
- Command card appears: `/review-security`

**Talking Points:**
- "Slash commands are project-specific shortcuts for common tasks"
- "Import from GitHub or create custom commands"
- "Commands can have namespaces for organization (/git:status, /test:run)"

---

## 7. Hooks - View Configured Hooks (Read-Only)

**Navigation:** Sidebar → Hooks

**What to Show:**

### Browse Hook Events
- Show the 8 hook event cards:
  - **SessionStart** - Runs when starting a new session
  - **ToolBefore** - Runs before each tool execution
  - **ToolAfter** - Runs after each tool completes
  - (others visible below)

### View Hook Details
- Click on **SessionStart** card
- Show details modal:
  - Hook script path: `~/.claude/hooks/session-start.sh`
  - Script content preview
  - Validation status: ✅ Valid (or warnings if any)
  - Security score indicator

### Template Gallery (Optional)
- Scroll to "Template Gallery"
- Show example templates:
  - Git Branch Checker
  - Project Setup Validator
  - Time Tracker

**Talking Points:**
- "Hooks automate tasks at specific lifecycle events"
- "Phase 1 is view-only - editing requires manual file changes"
- "Security validation warns about potentially dangerous scripts"

---

## 8. MCP Servers - View Configured Servers

**Navigation:** Sidebar → MCP Servers

**What to Show:**

### Browse Servers
- Show grid of configured MCP server cards
- Example servers (if any):
  - **Filesystem MCP** (scope: User)
  - **SQLite MCP** (scope: Project)

### View Server Details
- Click on a server card
- Show details modal:
  - Server name
  - Command: `npx @modelcontextprotocol/server-filesystem`
  - Arguments: `--allowed-dirs /Users/...`
  - Environment variables
  - Scope badge

### Add Server (Optional Quick Demo)
- Click "+ Add Server"
- Show form fields:
  - Name, Scope, Command, Args, Env
- Cancel (don't actually add unless prepared)

**Talking Points:**
- "MCP servers extend Claude with external integrations"
- "View and manage servers across User/Project/Local scopes"
- "Servers are read from .mcp.json files"

---

## 9. Debug Logs - View Session Logs

**Navigation:** Sidebar → Debug Logs

**What to Show:**

### Log List
- Show sidebar with log files from `~/.claude/debug/`
- Example files:
  - `2025-01-15-session-abc123.log`
  - `2025-01-14-session-def456.log`

### View Log Content
- Click on most recent log
- Show log viewer:
  - Line numbers
  - Syntax highlighting
  - Timestamps
  - Search within log (demo search for "ERROR" or "tool:")

### Search Logs
- Enter "tool:" in search box
- Results highlight matching lines

**Talking Points:**
- "Debug logs help troubleshoot Claude Code sessions"
- "View logs from ~/.claude/debug/ directory"
- "Search within logs to find specific events or errors"

---

## 10. Bonus: Sessions (ccusage Integration)

**Navigation:** Sidebar → Sessions

**What to Show:**

### If ccusage is installed:
- Show usage data table
- Example output:
  ```
  SESSION                DATE       MODEL          INPUT   OUTPUT   COST
  abc123def456           2025-01-15 sonnet-4       1,234   567     $0.05
  ```

### If ccusage NOT installed:
- Show installation prompt
- Display installation command:
  ```bash
  npm install -g @anthropic-ai/ccusage
  ```
- Link to GitHub repository

**Talking Points:**
- "Track token usage and costs across Claude sessions"
- "Requires ccusage CLI (separate installation)"
- "Useful for budgeting and usage analysis"

---

## Closing Script

> "Claude Owl brings visual management to Claude Code configurations. Whether you're setting up security rules, creating custom agents, or applying status line templates, everything is just a few clicks away. No more manual JSON editing, no more syntax errors. Just a clean, intuitive interface for power users who want full control over their AI development workflow."

**Call to Action:**
- Download: [GitHub Releases]
- Documentation: [docs.claude.com]
- Feedback: [GitHub Issues]

---

## Demo Tips

1. **Have Sample Data Ready:**
   - Pre-configured permission rules to show editing
   - At least one subagent already created
   - Sample skill/command ready to demonstrate

2. **Keep Browser Tab Open:**
   - status.claude.com (for API status demo)
   - GitHub repo with commands to import

3. **Clean State:**
   - Fresh settings file (or known good state)
   - No error states that need explanation

4. **Backup Before Demo:**
   - Copy `~/.claude/settings.json` → `settings.json.backup`
   - Easy restore if something goes wrong

5. **Screen Recording Settings:**
   - High resolution (1080p minimum)
   - Hide desktop clutter
   - Zoom in on important UI elements
   - Use cursor highlighting for clarity

---

## Appendix: Quick Copy-Paste Library

### Sample Agent Prompt (Code Reviewer)
```markdown
You are a code review specialist focused on:
- Code quality and maintainability
- Security vulnerabilities
- Performance issues
- Best practices for the project's language/framework

Always provide specific file:line references in feedback.
Use Read and Grep tools to analyze code.
Run linters/formatters when available.
```

### Sample Skill (Git Workflow)
```markdown
---
name: git-workflow-manager
description: Manages Git branching, commits, and pull requests following best practices
allowed-tools: Bash, Read
---

# Git Workflow Skill

## Branch Naming
- feature/TICKET-description
- bugfix/TICKET-description
- hotfix/TICKET-description

## Commit Messages
- Use conventional commits (feat:, fix:, docs:, refactor:)
- First line: 50 chars max
- Body: wrap at 72 chars
- Reference ticket numbers

## Before Committing
1. Run linter
2. Run tests
3. Check for debug statements
4. Verify no secrets committed
```

### Sample Slash Command (/test)
```markdown
Run the project's test suite and analyze results.

Steps:
1. Detect test framework (pytest, jest, mocha, etc.)
2. Run tests with verbose output
3. If failures, analyze stack traces
4. Suggest fixes for failing tests
5. Report coverage if available

Use Bash to run test commands.
Use Read to examine failing test files.
```
