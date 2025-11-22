# ADR-007: Windows Support Gaps and Remediation Strategy

**Status:** Proposed
**Date:** 2025-11-21
**Author:** Claude Owl Team
**Reviewers:** TBD

---

## Executive Summary

This ADR documents all gaps preventing Claude Owl from fully supporting Windows environments. Based on comprehensive review of Claude Code documentation and the current codebase, we identify **7 critical gaps** and **12 platform-specific considerations** that need addressing for production-ready Windows support.

**Current State:** Claude Owl v0.1.5 has partial Windows support (builds for Windows, basic path handling) but lacks Windows-specific implementations for CLI detection, MCP server management, hooks execution, and managed settings paths.

**Target State:** Full feature parity between macOS and Windows with platform-specific implementations and comprehensive Windows testing.

---

## Table of Contents

1. [Context and Background](#1-context-and-background)
2. [Critical Gaps Analysis](#2-critical-gaps-analysis)
3. [Platform-Specific Considerations](#3-platform-specific-considerations)
4. [Proposed Solutions](#4-proposed-solutions)
5. [Implementation Plan](#5-implementation-plan)
6. [Testing Strategy](#6-testing-strategy)
7. [Documentation Updates](#7-documentation-updates)
8. [References](#8-references)

---

## 1. Context and Background

### 1.1 Current Windows Support Status

**What Works:**
- ✅ Electron builds successfully for Windows (x64, arm64)
- ✅ NSIS installer configuration complete
- ✅ Basic path handling with `path.join()` (cross-platform)
- ✅ Settings file path resolution for Windows (`C:\ProgramData\ClaudeCode\managed-settings.json`)
- ✅ React UI renders correctly on Windows

**What Doesn't Work:**
- ❌ Claude CLI detection (uses Unix `which` command)
- ❌ MCP server management (missing `cmd /c` wrapper for npx)
- ❌ Hooks execution (assumes bash shell, missing PowerShell/cmd.exe support)
- ❌ Environment PATH handling (macOS-specific in `getExecEnv()`)
- ❌ No Windows-specific testing (all tests run on macOS)
- ❌ Managed settings path uses wrong location
- ❌ Debug logs path may not follow Windows conventions

### 1.2 Claude Code Windows Requirements

From official documentation:

1. **Installation:** PowerShell-based installer (`irm https://claude.ai/install.ps1 | iex`)
2. **MCP Servers:** Native Windows requires `cmd /c npx` wrapper for stdio servers
3. **Hooks:** Executes as bash commands (no Windows-specific guidance in docs)
4. **Managed Policies:**
   - Settings: `C:\ProgramData\ClaudeCode\managed-settings.json`
   - MCP: `C:\ProgramData\ClaudeCode\managed-mcp.json`
5. **File Paths:** Use forward slashes universally (even on Windows)

### 1.3 Design Constraints

**Critical Constraint:** Claude Owl is a standalone desktop application without project context awareness. This means:
- We cannot detect project framework/tooling at runtime
- We must rely on explicit user input for project paths
- All CLI operations require proper working directory (`cwd`) specification

---

## 2. Critical Gaps Analysis

### Gap 1: Claude CLI Detection Uses Unix `which` Command

**Location:** `src/main/services/ClaudeService.ts:67`

**Current Implementation:**
```typescript
async checkInstallation(): Promise<ClaudeInstallationInfo> {
  const env = this.getExecEnv();
  const { stdout, stderr } = await execAsync('which claude', { env });
  // ... macOS/Linux only
}
```

**Problem:**
- `which` command doesn't exist on Windows
- Windows uses `where` command instead
- PATH environment variable format differs (`;` separator on Windows vs `:` on Unix)

**Impact:** High - Claude CLI detection fails completely on Windows, blocking all features

**Evidence from Docs:**
- Claude Code docs show PowerShell installation for Windows
- No documentation of different CLI command names between platforms

---

### Gap 2: MCP Server Management Missing `cmd /c` Wrapper

**Location:** `src/main/services/ClaudeService.ts:416-451`

**Current Implementation:**
```typescript
private buildMCPAddCommand(options: MCPAddOptions): string {
  // Builds: claude mcp add <name> --transport stdio -- npx -y @package
  // Missing: cmd /c wrapper for Windows
}
```

**Problem:**
- Claude Code docs explicitly state: "On native Windows (not WSL), local MCP servers that use `npx` require the `cmd /c` wrapper"
- Our implementation doesn't detect Windows platform
- Command execution will fail on Windows for stdio MCP servers using npx

**Impact:** High - MCP server installation broken on Windows

**Evidence from Docs:**
```
For native Windows (not WSL):
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

---

### Gap 3: Hooks Execution Assumes Bash Shell

**Location:** `src/main/services/HooksService.ts` (not explicitly shell-aware)

**Current Implementation:**
- Hooks configuration stores bash commands as strings
- No platform detection for shell type
- No translation layer for PowerShell/cmd.exe

**Problem:**
- Claude Code docs state hooks execute as "bash commands"
- Windows doesn't have bash by default (requires WSL or Git Bash)
- Hooks like `git status` work, but complex shell scripts fail

**Impact:** Medium - Basic commands work, advanced hooks fail

**Evidence from Docs:**
- "Scripts execute as bash commands with 60-second default timeout"
- No mention of Windows CMD/PowerShell compatibility
- Environment variables: `$CLAUDE_PROJECT_DIR` (Unix syntax)

**Uncertainty:** Does Claude Code CLI handle shell translation on Windows? Documentation is silent on this.

---

### Gap 4: Environment PATH Handling is macOS-Specific

**Location:** `src/main/services/ClaudeService.ts:49-59`

**Current Implementation:**
```typescript
private getExecEnv() {
  const env = { ...process.env };

  // On macOS, add common binary paths
  if (process.platform === 'darwin') {
    const paths = [env.PATH || '', '/usr/local/bin', '/opt/homebrew/bin', '/usr/bin', '/bin'];
    env.PATH = paths.filter(p => p).join(':');
  }

  return env;
}
```

**Problem:**
- Only handles macOS PATH augmentation
- Windows PATH uses `;` separator (not `:`)
- Windows common binary paths differ:
  - `C:\Program Files\nodejs\` (Node.js)
  - `C:\Users\{user}\AppData\Roaming\npm\` (global npm packages)
  - `C:\Windows\System32\` (system binaries)
- Electron on Windows may not inherit proper PATH from system

**Impact:** Medium - CLI commands may fail to find `claude`, `npx`, etc.

---

### Gap 5: Managed Settings Path Implementation Incorrect

**Location:** `src/main/services/SettingsService.ts:49-62`

**Current Implementation:**
```typescript
private getManagedSettingsPath(): string {
  const platformType = platform();

  if (platformType === 'darwin') {
    return '/Library/Application Support/ClaudeCode/managed-settings.json';
  } else if (platformType === 'win32') {
    return 'C:\\ProgramData\\ClaudeCode\\managed-settings.json';
  } else {
    return '/etc/claude-code/managed-settings.json';
  }
}
```

**Problem:**
- Uses hardcoded Windows path with double backslashes
- Should use `path.join()` for consistency
- Path is correct per docs, but implementation style inconsistent

**Impact:** Low - Works but not maintainable

**Evidence from Docs:**
```
Windows: C:\ProgramData\ClaudeCode\managed-settings.json
Windows MCP: C:\ProgramData\ClaudeCode\managed-mcp.json
```

---

### Gap 6: Path Service Uses `process.cwd()` for Project Detection

**Location:** `src/main/services/core/PathService.ts:24-26`

**Current Implementation:**
```typescript
getProjectClaudeDir(projectPath?: string): string {
  const basePath = projectPath || process.cwd();
  return path.join(basePath, '.claude');
}
```

**Problem:**
- Violates Claude Owl design constraint (standalone app, no project awareness)
- `process.cwd()` returns Claude Owl's installation directory on Windows
- When users launch from Start Menu, cwd is unpredictable

**Impact:** Medium - Project-level features break when projectPath not provided

**Design Flaw:** This is a broader architectural issue, not Windows-specific, but Windows users more likely to trigger via Start Menu launch

---

### Gap 7: Debug Logs Path Calculation for Windows

**Location:** `src/main/services/core/PathService.ts:132-145`

**Current Implementation:**
```typescript
getDebugLogsPath(): string {
  const osType = platform();

  if (osType === 'win32') {
    const appData = process.env.APPDATA || path.join(homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'claude-owl', 'logs');
  }
  // ...
}
```

**Problem:**
- Implementation looks correct
- BUT: No validation that APPDATA exists
- Fallback uses hardcoded 'AppData/Roaming' instead of proper Windows API

**Impact:** Low - Likely works in practice

**Recommendation:** Add validation and logging

---

## 3. Platform-Specific Considerations

### 3.1 File Path Handling

**Current State:** ✅ Using `path.join()` correctly throughout codebase

**Evidence:**
- All file path construction uses Node.js `path` module
- Cross-platform compatible by design
- No hardcoded `/` or `\` separators

**Action:** None required

---

### 3.2 Command Execution Quoting

**Current State:** ⚠️ Partial - `escapeArg()` exists but may need Windows testing

**Location:** `src/main/services/ClaudeService.ts:456-473`

**Consideration:**
- Windows CMD has different quoting rules than bash
- PowerShell has yet another set of quoting rules
- Current implementation escapes for Unix-style shells

**Action:** Add Windows-specific escaping tests

---

### 3.3 Home Directory Resolution

**Current State:** ✅ Using `os.homedir()` correctly

**Evidence:**
- All services use `homedir()` from Node.js `os` module
- Cross-platform by default

**Action:** None required

---

### 3.4 Slash Command Execution

**Current State:** ❓ Unknown - depends on Claude CLI behavior

**Consideration:**
- Slash commands stored as Markdown files with bash-like syntax
- Claude CLI may handle Windows translation
- No testing on Windows yet

**Action:** Requires Windows testing

---

### 3.5 Skills and Agents File Format

**Current State:** ✅ Platform-agnostic (Markdown with YAML frontmatter)

**Evidence:**
- Files are plain text
- No shell scripting embedded
- Tools list is declarative, not executable

**Action:** None required

---

### 3.6 MCP Server Transport Types

**Current State:** ⚠️ Requires attention

**Consideration:**
- **HTTP transport:** ✅ Should work on Windows (network-based)
- **SSE transport:** ✅ Should work (network-based)
- **Stdio transport:** ❌ Broken without `cmd /c` wrapper (see Gap 2)

**Action:** Implement stdio-specific Windows handling

---

### 3.7 Sandbox Settings (Not Applicable to Windows)

**Current State:** ⚠️ macOS/Linux only feature

**Evidence from Docs:**
```
Sandbox Settings (macOS/Linux only):
- sandbox.enabled
- network.allowLocalBinding (macOS only)
```

**Consideration:**
- Claude Code doesn't support sandbox on Windows
- Claude Owl shouldn't expose these settings on Windows

**Action:** Hide sandbox settings in Windows builds

---

### 3.8 Environment Variable Syntax

**Current State:** ⚠️ Hooks use Unix `$VAR` syntax

**Consideration:**
- Windows CMD uses `%VAR%` syntax
- PowerShell uses `$env:VAR` syntax
- Bash (Git Bash/WSL) uses `$VAR` syntax

**Question:** Does Claude Code CLI translate environment variables on Windows?

**Action:** Requires testing and documentation

---

### 3.9 Hook Script Permissions

**Current State:** N/A on Windows

**Consideration:**
- Unix systems require `chmod +x` for scripts
- Windows uses file extensions (.bat, .ps1) for executability
- Claude Code may handle this transparently

**Action:** Document Windows hook script requirements

---

### 3.10 Electron IPC on Windows

**Current State:** ✅ Platform-agnostic by design

**Evidence:**
- Electron's IPC works identically across platforms
- No platform-specific IPC code needed

**Action:** None required

---

### 3.11 UI Rendering and Fonts

**Current State:** ✅ Tailwind CSS is cross-platform

**Consideration:**
- Windows default font stack differs from macOS
- May need font fallbacks for Chinese/Japanese characters

**Action:** Add Windows font stack to Tailwind config

---

### 3.12 Keyboard Shortcuts

**Current State:** ✅ Using Cmd/Ctrl abstractions

**Consideration:**
- macOS uses `Cmd+Key`, Windows uses `Ctrl+Key`
- Electron handles this with `CommandOrControl` accelerator

**Action:** Verify all shortcuts use `CommandOrControl`

---

## 4. Proposed Solutions

### 4.1 Solution for Gap 1: Platform-Aware CLI Detection

**Implementation:**
```typescript
// src/main/services/ClaudeService.ts

async checkInstallation(): Promise<ClaudeInstallationInfo> {
  try {
    const env = this.getExecEnv();
    const command = process.platform === 'win32' ? 'where claude' : 'which claude';

    const { stdout, stderr } = await execAsync(command, { env });

    if (stderr || !stdout.trim()) {
      return { installed: false, version: null, path: null };
    }

    const claudePath = stdout.trim().split('\n')[0]; // Windows 'where' may return multiple paths

    // Get version (same command on all platforms)
    const { stdout: versionOutput } = await execAsync('claude --version', { env });
    const version = versionOutput.trim();

    return {
      installed: true,
      version,
      path: claudePath,
    };
  } catch (error) {
    return { installed: false, version: null, path: null };
  }
}
```

**Testing:**
- Unit test with mocked `process.platform`
- Integration test on actual Windows VM
- Verify `where` returns multiple paths correctly

---

### 4.2 Solution for Gap 2: Windows MCP `cmd /c` Wrapper

**Implementation:**
```typescript
// src/main/services/ClaudeService.ts

private buildMCPAddCommand(options: MCPAddOptions): string {
  const parts: string[] = ['claude', 'mcp', 'add', this.escapeArg(options.name)];

  parts.push('--transport', options.transport);
  parts.push('--scope', options.scope);

  // Add environment variables and headers (existing code)...

  // Add command and args for stdio transport
  if (options.transport === 'stdio' && options.command) {
    parts.push('--');

    // Windows-specific: Wrap npx with cmd /c
    if (process.platform === 'win32' && options.command.toLowerCase().includes('npx')) {
      parts.push('cmd', '/c', this.escapeArg(options.command));
    } else {
      parts.push(this.escapeArg(options.command));
    }

    if (options.args && options.args.length > 0) {
      parts.push(...options.args.map(arg => this.escapeArg(arg)));
    }
  }

  // Add URL for HTTP/SSE transports (existing code)...

  return parts.join(' ');
}
```

**Testing:**
- Unit test verifying `cmd /c` only added on Windows for npx commands
- Integration test installing actual MCP server on Windows
- Verify non-npx stdio servers work without wrapper

**Documentation:**
- Add MCP installation guide for Windows users
- Explain when `cmd /c` is needed

---

### 4.3 Solution for Gap 3: Hooks Windows Shell Support

**Implementation Strategy:**

**Option A: Document Limitation (Recommended)**
- Document that hooks on Windows require Git Bash, WSL, or Cygwin
- Claude Code CLI likely already handles this
- No code changes needed

**Option B: Shell Detection and Translation**
```typescript
// src/main/services/HooksService.ts

private getShellExecutor(): { shell: string, args: string[] } {
  if (process.platform === 'win32') {
    // Check if Git Bash exists
    const gitBashPath = 'C:\\Program Files\\Git\\bin\\bash.exe';
    if (fs.existsSync(gitBashPath)) {
      return { shell: gitBashPath, args: ['-c'] };
    }

    // Fallback to cmd.exe with warning
    console.warn('[HooksService] Git Bash not found, using cmd.exe - some hooks may fail');
    return { shell: 'cmd.exe', args: ['/c'] };
  }

  return { shell: '/bin/bash', args: ['-c'] };
}
```

**Recommendation:** Start with Option A (documentation), implement Option B if users report issues

---

### 4.4 Solution for Gap 4: Windows PATH Handling

**Implementation:**
```typescript
// src/main/services/ClaudeService.ts

private getExecEnv() {
  const env = { ...process.env };

  if (process.platform === 'darwin') {
    // macOS PATH augmentation (existing code)
    const paths = [env.PATH || '', '/usr/local/bin', '/opt/homebrew/bin', '/usr/bin', '/bin'];
    env.PATH = paths.filter(p => p).join(':');
  } else if (process.platform === 'win32') {
    // Windows PATH augmentation
    const userProfile = env.USERPROFILE || 'C:\\Users\\Default';
    const paths = [
      env.PATH || '',
      'C:\\Program Files\\nodejs\\',
      path.join(userProfile, 'AppData', 'Roaming', 'npm'),
      'C:\\Windows\\System32',
      'C:\\Windows',
    ];
    env.PATH = paths.filter(p => p).join(';'); // Windows uses semicolon
  }

  return env;
}
```

**Testing:**
- Unit test for path separator (`:` vs `;`)
- Integration test verifying `claude` command found on Windows
- Test with Node.js in custom location

---

### 4.5 Solution for Gap 5: Managed Settings Path Refactoring

**Implementation:**
```typescript
// src/main/services/SettingsService.ts

private getManagedSettingsPath(): string {
  const platformType = platform();

  if (platformType === 'darwin') {
    return path.join('/Library', 'Application Support', 'ClaudeCode', 'managed-settings.json');
  } else if (platformType === 'win32') {
    const programData = process.env.ProgramData || 'C:\\ProgramData';
    return path.join(programData, 'ClaudeCode', 'managed-settings.json');
  } else {
    return path.join('/etc', 'claude-code', 'managed-settings.json');
  }
}
```

**Benefits:**
- Uses `path.join()` consistently
- Respects `ProgramData` environment variable
- Maintains same behavior

---

### 4.6 Solution for Gap 6: Remove `process.cwd()` Fallback

**Implementation:**
```typescript
// src/main/services/core/PathService.ts

getProjectClaudeDir(projectPath: string): string {
  // Remove fallback to process.cwd() - enforce explicit project path
  if (!projectPath) {
    throw new Error(
      'projectPath is required. Claude Owl is a standalone app without project context awareness.'
    );
  }
  return path.join(projectPath, '.claude');
}
```

**Impact:**
- Breaking change - all callers must provide projectPath
- Fixes design constraint violation
- Prevents Windows-specific bugs from unpredictable cwd

**Migration:**
- Update all service methods to require projectPath
- Update IPC handlers to validate projectPath
- Update React components to use ProjectContext

---

### 4.7 Solution for Gap 7: Validate Windows Debug Logs Path

**Implementation:**
```typescript
// src/main/services/core/PathService.ts

getDebugLogsPath(): string {
  const osType = platform();

  if (osType === 'win32') {
    const appData = process.env.APPDATA;
    if (!appData) {
      console.warn('[PathService] APPDATA not found, using fallback');
    }
    const basePath = appData || path.join(homedir(), 'AppData', 'Roaming');
    const logsPath = path.join(basePath, 'claude-owl', 'logs');

    console.log('[PathService] Windows debug logs path:', logsPath);
    return logsPath;
  } else if (osType === 'darwin') {
    // macOS (existing code)
    return path.join(homedir(), 'Library', 'Caches', 'claude-owl', 'logs');
  } else {
    // Linux (existing code)
    return path.join(homedir(), '.cache', 'claude-owl', 'logs');
  }
}
```

**Testing:**
- Verify logs written to correct location on Windows
- Test with missing APPDATA environment variable
- Verify directory creation with proper permissions

---

## 5. Implementation Plan

### Phase 1: Critical Fixes (Week 1)

**Priority: High - Blocking Windows Support**

1. ✅ **Gap 1:** Platform-aware CLI detection (`which` vs `where`)
   - Modify `ClaudeService.checkInstallation()`
   - Add unit tests with platform mocking
   - Estimated: 2 hours

2. ✅ **Gap 2:** MCP `cmd /c` wrapper for npx
   - Modify `ClaudeService.buildMCPAddCommand()`
   - Add platform detection for stdio transport
   - Estimated: 2 hours

3. ✅ **Gap 4:** Windows PATH handling in `getExecEnv()`
   - Add Windows-specific path augmentation
   - Use semicolon separator
   - Estimated: 1 hour

4. ✅ **Gap 5:** Refactor managed settings path
   - Use `path.join()` consistently
   - Respect `ProgramData` env var
   - Estimated: 30 minutes

**Total Phase 1:** 5.5 hours

---

### Phase 2: Architecture Improvements (Week 2)

**Priority: Medium - Design Constraint Fixes**

1. ✅ **Gap 6:** Remove `process.cwd()` fallback
   - Update PathService to require projectPath
   - Update all service callers
   - Update IPC handlers with validation
   - Update React components to use ProjectContext
   - Estimated: 4 hours

2. ✅ **Gap 7:** Validate debug logs path
   - Add logging for path resolution
   - Test directory creation on Windows
   - Estimated: 1 hour

3. ✅ **Consideration 3.7:** Hide sandbox settings on Windows
   - Add platform check in Settings UI
   - Display info message about macOS/Linux only
   - Estimated: 1 hour

**Total Phase 2:** 6 hours

---

### Phase 3: Hooks and Advanced Features (Week 3)

**Priority: Low - Document First, Implement If Needed**

1. ⏳ **Gap 3:** Document hooks Windows requirements
   - Test hooks on Windows with Git Bash
   - Document Git Bash requirement
   - Add troubleshooting guide
   - Estimated: 2 hours

2. ⏳ **Consideration 3.2:** Windows command escaping tests
   - Add Windows-specific escapeArg tests
   - Test with spaces, quotes, special characters
   - Estimated: 2 hours

3. ⏳ **Consideration 3.8:** Document environment variable syntax
   - Test $VAR vs %VAR% in hooks
   - Document Claude CLI behavior on Windows
   - Estimated: 1 hour

**Total Phase 3:** 5 hours

---

### Phase 4: Testing and Polish (Week 4)

**Priority: Medium - Quality Assurance**

1. ⏳ Set up Windows GitHub Actions runner
   - Add windows-latest to CI matrix
   - Run all unit tests on Windows
   - Estimated: 4 hours

2. ⏳ Manual testing on Windows 11
   - Full feature walkthrough
   - Test all CRUD operations
   - Test MCP server installation
   - Estimated: 4 hours

3. ⏳ Documentation updates
   - Update installation.html for Windows
   - Add Windows troubleshooting guide
   - Update README with Windows support status
   - Estimated: 2 hours

**Total Phase 4:** 10 hours

---

**Total Implementation Time:** ~26.5 hours (~3.5 developer days)

---

## 6. Testing Strategy

### 6.1 Unit Tests

**New Tests Required:**

1. **ClaudeService.checkInstallation() - Windows**
   ```typescript
   describe('ClaudeService - Windows', () => {
     beforeEach(() => {
       vi.stubGlobal('process', { platform: 'win32' });
     });

     it('should use "where" command on Windows', async () => {
       // Mock where command
       // Verify correct command used
     });

     it('should handle multiple paths from "where" command', async () => {
       // Windows 'where' returns multiple lines
       // Verify first path selected
     });
   });
   ```

2. **ClaudeService.buildMCPAddCommand() - Windows**
   ```typescript
   it('should add cmd /c wrapper for npx on Windows', () => {
     vi.stubGlobal('process', { platform: 'win32' });
     const command = service.buildMCPAddCommand({
       name: 'test',
       transport: 'stdio',
       scope: 'user',
       command: 'npx',
       args: ['-y', '@package'],
     });
     expect(command).toContain('cmd /c npx');
   });
   ```

3. **PathService - Windows**
   ```typescript
   describe('PathService - Windows', () => {
     it('should use correct separator in debug logs path', () => {
       const path = pathService.getDebugLogsPath();
       expect(path).toContain('AppData\\Roaming');
     });
   });
   ```

### 6.2 Integration Tests

**Test Scenarios:**

1. ✅ Install Claude Owl on Windows 11 VM
2. ✅ Verify Claude CLI detection (with and without Claude installed)
3. ✅ Add/remove MCP server (stdio transport with npx)
4. ✅ Create/edit user-level settings
5. ✅ Create/edit project-level settings (with explicit project path)
6. ✅ View hooks from user/project settings
7. ✅ Install plugin from GitHub
8. ✅ View debug logs

### 6.3 CI/CD Pipeline Updates

**Add to `.github/workflows/ci.yml`:**

```yaml
jobs:
  test-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run build
```

**Add to `.github/workflows/release.yml`:**

```yaml
- name: Package Windows
  run: npm run package:win
  if: matrix.os == 'windows-latest'
```

### 6.4 Manual Testing Checklist

**Windows 11 Testing Matrix:**

| Feature | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| **Installation** | Download and install NSIS installer | Installs to Program Files | ⏳ |
| **CLI Detection** | Launch app without Claude installed | Shows "Not Installed" status | ⏳ |
| **CLI Detection** | Install Claude, restart app | Shows version number | ⏳ |
| **Settings** | Edit user settings | Saves to `%USERPROFILE%\.claude\settings.json` | ⏳ |
| **MCP Servers** | Add stdio server with npx | Uses `cmd /c` wrapper | ⏳ |
| **MCP Servers** | Add HTTP server | Works without wrapper | ⏳ |
| **MCP Servers** | List all servers | Shows all configured servers | ⏳ |
| **Skills** | Create user-level skill | Saves to `%USERPROFILE%\.claude\skills\` | ⏳ |
| **Agents** | Create user-level agent | Saves to `%USERPROFILE%\.claude\agents\` | ⏳ |
| **Commands** | Create slash command | Saves to `%USERPROFILE%\.claude\commands\` | ⏳ |
| **Hooks** | View user hooks | Displays hooks from settings.json | ⏳ |
| **Plugins** | Import from GitHub | Downloads and installs correctly | ⏳ |
| **Debug Logs** | View debug logs | Reads from `%APPDATA%\claude-owl\logs\` | ⏳ |
| **Project Selection** | Select project path via dialog | Updates ProjectContext correctly | ⏳ |

---

## 7. Documentation Updates

### 7.1 Installation Guide Updates

**File:** `docs/installation.html`

**Add Windows Section:**

```markdown
## Windows Installation

### Step 1: Install Claude Code

Open PowerShell and run:

​```powershell
irm https://claude.ai/install.ps1 | iex
​```

Verify installation:

​```powershell
claude --version
​```

### Step 2: Download Claude Owl

Download the latest `.exe` installer from [GitHub Releases](https://github.com/antonbelev/claude-owl/releases).

### Step 3: Install Claude Owl

1. Run the downloaded installer
2. Choose installation directory (or use default)
3. Launch Claude Owl from Start Menu

### Step 4: Verify Installation

Claude Owl should detect your Claude CLI installation automatically and display the version on the Dashboard.

## Troubleshooting (Windows)

### Claude CLI Not Detected

If Claude Owl shows "Claude CLI: Not Installed" but `claude --version` works in PowerShell:

1. Restart Claude Owl
2. Check PATH environment variable includes Claude installation directory
3. Run Claude Owl as Administrator (one time)

### MCP Server Installation Fails

If adding MCP servers with `npx` fails:

- Claude Owl automatically adds `cmd /c` wrapper on Windows
- Ensure Node.js is installed and `npx` is in PATH
- Try installing the package globally first: `npm install -g @package-name`

### Hooks Not Working

Claude Owl hooks require Git Bash on Windows:

1. Install Git for Windows: https://git-scm.com/download/win
2. During installation, select "Git Bash" option
3. Restart Claude Owl
```

### 7.2 README Updates

**File:** `README.md`

**Update Platform Support Section:**

```markdown
## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| macOS (Intel) | ✅ Fully Supported | macOS 10.15+ |
| macOS (Apple Silicon) | ✅ Fully Supported | Native ARM64 build |
| Windows (x64) | ⏳ In Beta | Windows 10/11 |
| Windows (ARM64) | ⏳ In Beta | Windows 11 ARM |
| Linux (x64) | 🚧 Planned | Ubuntu 20.04+ |
| Linux (ARM64) | 🚧 Planned | Raspberry Pi 4+ |

**Windows Beta Status:** Core features working, advanced features in testing. See [Windows Support Guide](docs/windows-support.md).
```

### 7.3 New Windows Support Guide

**File:** `docs/windows-support.md` (new)

**Contents:**
- Windows-specific installation steps
- Known limitations (sandbox settings, hooks shell requirements)
- Troubleshooting common Windows issues
- Performance considerations
- Git Bash requirement for hooks

---

## 8. References

### 8.1 Claude Code Documentation

- [Settings Configuration](https://code.claude.com/docs/en/settings)
- [Sub-agents](https://code.claude.com/docs/en/sub-agents)
- [Skills](https://code.claude.com/docs/en/skills)
- [Slash Commands](https://code.claude.com/docs/en/slash-commands)
- [MCP Servers](https://code.claude.com/docs/en/mcp)
- [Hooks](https://code.claude.com/docs/en/hooks)
- [Overview & Installation](https://code.claude.com/docs/en/overview)

### 8.2 Platform-Specific Paths (from Documentation)

**Managed Settings:**
- macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`
- Windows: `C:\ProgramData\ClaudeCode\managed-settings.json`
- Linux/WSL: `/etc/claude-code/managed-settings.json`

**Managed MCP Servers:**
- macOS: `/Library/Application Support/ClaudeCode/managed-mcp.json`
- Windows: `C:\ProgramData\ClaudeCode\managed-mcp.json`
- Linux/WSL: `/etc/claude-code/managed-mcp.json`

**User Settings:**
- All Platforms: `~/.claude/settings.json` (`%USERPROFILE%\.claude\settings.json` on Windows)

### 8.3 Windows-Specific Requirements (from Documentation)

1. **MCP stdio servers:** "On native Windows (not WSL), local MCP servers that use `npx` require the `cmd /c` wrapper to ensure proper execution."

2. **Hooks:** "Scripts execute as bash commands" (no Windows-specific guidance provided)

3. **Sandbox:** macOS/Linux only (not supported on Windows)

### 8.4 Related ADRs

- [ADR-001: Settings Management Redesign](adr-001-settings-management-redesign.md)
- [ADR-004: MCP Manager](adr-004-mcp-manager.md)
- [ADR-005: Project Selection UX](adr-005-project-selection-ux.md)

### 8.5 External References

- [Electron Platform Detection](https://www.electronjs.org/docs/latest/api/process#processplatform-readonly)
- [Node.js Path Module](https://nodejs.org/api/path.html)
- [Windows Environment Variables](https://learn.microsoft.com/en-us/windows/win32/shell/csidl)
- [Git Bash for Windows](https://git-scm.com/download/win)

---

## Appendix A: Risk Assessment

### High Risk

1. **Hooks Shell Compatibility** - Unknown how Claude CLI handles Windows
   - Mitigation: Document Git Bash requirement, test extensively

2. **MCP `cmd /c` Wrapper** - Breaking change if implemented incorrectly
   - Mitigation: Add only for npx commands, preserve existing behavior

### Medium Risk

1. **PATH Environment Handling** - May not find Claude CLI
   - Mitigation: Add common paths, log resolution process

2. **Architecture Change (process.cwd removal)** - Breaking change
   - Mitigation: Implement gradually, update all callers systematically

### Low Risk

1. **Path Separator Issues** - Already using `path.join()`
2. **Managed Settings Path** - Refactoring existing working code
3. **Debug Logs Path** - Adding validation to working implementation

---

## Appendix B: Open Questions

1. **Q:** Does Claude Code CLI translate bash hooks to PowerShell/CMD on Windows?
   - **Status:** Undocumented - requires testing
   - **Impact:** Determines if we need shell translation layer

2. **Q:** How does Claude CLI handle environment variable syntax ($VAR vs %VAR%)?
   - **Status:** Undocumented - requires testing
   - **Impact:** Affects hook environment variable documentation

3. **Q:** Does Claude CLI have Windows-specific command differences?
   - **Status:** Docs show same commands across platforms
   - **Impact:** Low - assume commands are consistent

4. **Q:** Should we support cmd.exe hooks or require Git Bash?
   - **Status:** Recommendation: Require Git Bash (simpler)
   - **Impact:** User must install Git for Windows

---

## Decision

**Status:** Proposed - Awaiting approval

**Recommendation:**
1. ✅ Approve Phase 1 for immediate implementation (critical fixes)
2. ✅ Approve Phase 2 for architecture improvements
3. ⏳ Defer Phase 3 pending user feedback on Windows beta
4. ⏳ Approve Phase 4 for quality assurance

**Timeline:** 4 weeks for full Windows support parity

**Next Steps:**
1. Review this ADR with team
2. Create GitHub issues for each phase
3. Set up Windows testing environment
4. Begin Phase 1 implementation

---

**Last Updated:** 2025-11-21
**Version:** 1.0
