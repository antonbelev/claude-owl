# Claude Owl Security - Remediation Guide

**Last Updated**: 2024-11-18  
**Priority Level**: CRITICAL (3 issues requiring immediate action)

---

## CRITICAL FIXES (DO FIRST)

### 1. Enable Electron Sandbox

**Location**: `/home/user/claude-owl/src/main/index.ts:40`

**Current Code**:
```typescript
webPreferences: {
  preload: preloadPath,
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false,              // ❌ DISABLE
  webSecurity: false,
}
```

**Fix**:
```typescript
webPreferences: {
  preload: preloadPath,
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,               // ✅ ENABLE
  webSecurity: true,           // ✅ ENABLE (see below)
}
```

**Why**: Sandbox prevents renderer process from directly accessing Node.js APIs. With it disabled, a compromised renderer could read/write files directly.

**Testing**:
```bash
# Verify the change
grep "sandbox:" src/main/index.ts
# Should show: sandbox: true,

# Run tests
npm run test:unit
npm run build
```

---

### 2. Enable Web Security

**Location**: `/home/user/claude-owl/src/main/index.ts:41`

**Current Code**:
```typescript
webSecurity: false,  // "Allow loading local resources in production"
```

**Fix**:
```typescript
webSecurity: true,  // Enable CORS and security checks
```

**Why**: Web security enables CORS checks and prevents unauthorized resource loading. The comment mentions "local resources" but that's handled by `loadFile()`.

**Verification**:
- Check that `mainWindow.loadFile(indexPath)` is used in production (✅ Already done)
- Dev mode uses `loadURL('http://localhost:5173')` (✅ Already correct)

---

### 3. Add URL Validation to openExternal Handler

**Location**: `/home/user/claude-owl/src/main/ipc/systemHandlers.ts:43-53`

**Current Code**:
```typescript
ipcMain.handle('system:open-external', async (_event, url: string) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
```

**Fix**:
```typescript
ipcMain.handle('system:open-external', async (_event, url: string) => {
  try {
    // Validate URL before opening
    const validUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      console.warn('[SystemHandlers] Blocked URL with invalid protocol:', validUrl.protocol);
      return {
        success: false,
        error: 'Only http and https URLs are allowed',
      };
    }
    
    console.log('[SystemHandlers] Opening external URL:', url);
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
```

**Why**: Without validation, malicious URLs (file://, javascript:, etc.) could be opened.

**Testing**:
```typescript
// Test valid URLs
window.electronAPI.openExternal('https://github.com/anthropics/claude-code');  // ✅ Should work

// Test invalid URLs
window.electronAPI.openExternal('file:///etc/passwd');  // ❌ Should be blocked
window.electronAPI.openExternal('javascript:alert("xss")');  // ❌ Should be blocked
```

---

## HIGH PRIORITY FIXES (DO NEXT)

### 4. Update Vulnerable Dependencies

**Run**:
```bash
npm audit
npm audit fix
```

**For breaking changes** (only if needed):
```bash
npm audit fix --force
```

**Expected output**:
```
# Before
glob  10.3.7 - 10.4.5
Severity: high
glob CLI: Command injection via -c/--cmd executes matches with shell:true

# After
(vulnerabilities fixed or at acceptable level)
```

**Time**: 5-15 minutes

---

### 5. Add Timeout to CLI Executions

**Location**: `/home/user/claude-owl/src/main/services/ClaudeService.ts` (all execAsync calls)

**Current Code**:
```typescript
const { stdout, stderr } = await execAsync('which claude', { env });
```

**Fix**:
```typescript
const { stdout, stderr } = await execAsync('which claude', {
  env: this.getExecEnv(),
  timeout: 30000  // 30 second timeout
});
```

**Apply to all execAsync calls** in ClaudeService:
- Line 67: `which claude`
- Line 81: `claude --version`
- Line 111: `claude --version` (getVersion method)
- Line 264: MCP add command
- And any other execAsync calls

**Testing**:
```bash
npm run test:unit -- ClaudeService

# Manual test: create a command that takes >30 seconds
timeout 35 npm run dev
# Should timeout at 30 seconds
```

---

### 6. Add Timeout to Network Requests

**Location**: `/home/user/claude-owl/src/main/services/GitHubService.ts:147`

**Current Code**:
```typescript
const response = await fetch(contentsUrl);
```

**Fix**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);  // 10 second timeout

try {
  const response = await fetch(contentsUrl, {
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  
  // ... rest of code
} finally {
  clearTimeout(timeoutId);
}
```

**Or use AbortSignal.timeout** (Node 17.3+):
```typescript
const response = await fetch(contentsUrl, {
  signal: AbortSignal.timeout(10000)  // 10 second timeout
});
```

**Apply to**:
- `/home/user/claude-owl/src/main/services/GitHubService.ts:147` - GitHub API calls
- `/home/user/claude-owl/src/main/services/PluginsService.ts` - Marketplace fetches

**Testing**:
```bash
# Test timeout behavior
npm test -- GitHubService

# Manual test with slow network
npm run dev
# Try browsing slow repository
```

---

### 7. Replace Custom YAML Parser

**Location**: `/home/user/claude-owl/src/main/services/core/FileSystemService.ts:304-324`

**Current Code**:
```typescript
private parseYAML<T>(yamlStr: string): T {
  const obj: Record<string, unknown> = {};
  const lines = yamlStr.split('\n').filter(line => line.trim());
  for (const line of lines) {
    const parts = line.split(':');
    const key = parts[0];
    const valueParts = parts.slice(1);
    const value = valueParts.join(':').trim();
    
    if (!key) continue;
    
    if (value === 'true') obj[key.trim()] = true;
    else if (value === 'false') obj[key.trim()] = false;
    else if (!isNaN(Number(value)) && value !== '') obj[key.trim()] = Number(value);
    else obj[key.trim()] = value;
  }
  return obj as T;
}
```

**Step 1: Install js-yaml**
```bash
npm install js-yaml
npm install --save-dev @types/js-yaml
```

**Step 2: Replace the parser**
```typescript
import yaml from 'js-yaml';

// Replace parseYAML method:
private parseYAML<T = Record<string, unknown>>(yamlStr: string): T {
  try {
    return yaml.load(yamlStr) as T;
  } catch (error) {
    console.error('[FileSystemService] Failed to parse YAML:', error);
    throw new Error(`Invalid YAML format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Replace stringifyYAML method:
private stringifyYAML(obj: Record<string, unknown>): string {
  return yaml.dump(obj, {
    lineWidth: -1,  // No line wrapping
    indent: 2,
    quotingType: "'"
  });
}
```

**Testing**:
```bash
npm run typecheck
npm run test:unit -- FileSystemService

# Test parsing complex YAML
npm run dev
# Create a command with complex YAML frontmatter
```

---

## MEDIUM PRIORITY FIXES (DO LATER)

### 8. Add GitHub Token Support

**Purpose**: Increase API rate limit from 60/hour to 5000/hour

**Location**: `/home/user/claude-owl/src/main/services/GitHubService.ts`

**Implementation**:
```typescript
export class GitHubService {
  private static readonly GITHUB_API_BASE = 'https://api.github.com';
  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    // Allow optional token from environment
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    return headers;
  }

  static async navigateToFolder(
    owner: string,
    repo: string,
    branch: string,
    folderPath: string = '',
    preSelectedFile?: string
  ): Promise<GitHubFolderContents | null> {
    const contentsUrl = `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`;
    const response = await fetch(contentsUrl, {
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(10000)
    });
    // ... rest of code
  }
}
```

**User Setup**:
```bash
# Users set environment variable
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Or in .env file
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 9. Add IPC Rate Limiting

**Purpose**: Prevent DoS attacks via rapid IPC calls

**Create new file**: `/home/user/claude-owl/src/main/utils/rateLimiter.ts`
```typescript
export class RateLimiter {
  private limits = new Map<string, { count: number; resetTime: number }>();
  
  constructor(private maxRequests: number, private windowMs: number) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const limit = this.limits.get(key);
    
    if (!limit || limit.resetTime < now) {
      this.limits.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (limit.count >= this.maxRequests) {
      return false;
    }
    
    limit.count++;
    return true;
  }
}
```

**Use in handlers**:
```typescript
import { RateLimiter } from '../utils/rateLimiter';

const settingsLimiter = new RateLimiter(100, 60000);  // 100 requests per minute

ipcMain.handle(CHANNELS.GET_SETTINGS, async (event, request) => {
  if (!settingsLimiter.isAllowed('get-settings')) {
    return { success: false, error: 'Rate limit exceeded' };
  }
  
  // ... rest of handler
});
```

---

## OPTIONAL IMPROVEMENTS (NICE TO HAVE)

### 10. Add Content Security Policy (CSP)

Add to preload script or use webpack plugin to inject headers.

### 11. Implement Request Size Limits

```typescript
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024;  // 10 MB

const response = await fetch(url);
const contentLength = response.headers.get('content-length');

if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
  throw new Error(`Response too large: ${contentLength} > ${MAX_RESPONSE_SIZE}`);
}
```

### 12. Automated Dependency Updates

Set up Dependabot or Renovate:
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

---

## VALIDATION CHECKLIST

After making all changes:

```bash
# 1. Code Quality
npm run lint
npm run format
npm run typecheck

# 2. Tests
npm run test:unit
npm run test:coverage

# 3. Build
npm run build

# 4. Audit
npm audit

# 5. Manual Testing
npm run dev:electron
# Test:
# - Open settings
# - Browse GitHub
# - Execute Claude CLI
# - Open external URLs
```

---

## ROLLOUT PLAN

### Phase 1: Critical Fixes (Today)
1. Enable sandbox ✅
2. Enable web security ✅
3. Add URL validation ✅
4. Run npm audit fix ✅

**Testing**: 30 min
**Deployment**: Can deploy immediately

### Phase 2: High Priority (This Week)
1. Add CLI timeouts ✅
2. Add network timeouts ✅
3. Replace YAML parser ✅

**Testing**: 1 hour
**Deployment**: Deploy next build

### Phase 3: Medium Priority (Next Sprint)
1. Add GitHub token support ✅
2. Add IPC rate limiting ✅

**Testing**: 2 hours
**Deployment**: Next feature release

### Phase 4: Optional (Backlog)
1. CSP implementation
2. Request size limits
3. Automated updates

---

## DEPLOYMENT NOTES

**Before Each Fix**:
```bash
git checkout -b security/fix-<issue-name>
```

**After Completing Fix**:
```bash
npm run format
npm run lint:fix
npm run typecheck
npm run test:unit
git add .
git commit -m "security: <description>"
git push
# Create PR for review
```

**Merge Criteria**:
- ✅ All linting passes
- ✅ All tests pass
- ✅ TypeScript compilation successful
- ✅ Manual testing verified
- ✅ Code review approved

---

## MONITORING

After deploying security fixes:

1. **Watch for errors** in CI pipeline
2. **Test on all platforms** (macOS, Windows, Linux)
3. **Monitor GitHub issues** for user reports
4. **Run periodic audits** (`npm audit`)
5. **Update changelog** with security improvements

---

## REFERENCES

- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [OWASP Node.js Security](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [npm Audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Node.js Child Process](https://nodejs.org/en/docs/guides/nodejs-child-processes/)

---

**Questions?** Check SECURITY_ANALYSIS.md for detailed explanations of each issue.
