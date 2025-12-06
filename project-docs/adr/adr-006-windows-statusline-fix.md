# ADR-006: Windows StatusLine Implementation Fix

**Status:** Accepted
**Date:** 2025-12-05
**Decision Makers:** Claude Owl Development Team

## Executive Summary

The status line preview fails on Windows because **bash scripts are being written with `.bat` extensions** and executed by cmd.exe. The root cause is confusion between script language (bash/node/python) and target platform (Windows/Mac/Linux).

**Key Fix:** Platform-aware template filtering + proper language-to-extension mapping.

---

## Problem Statement

### Current Failure Mode

```
Error: Command failed: "C:\Users\...\statusline-preview-*.bat" < "input.json"
'#!/bin/bash' is not recognized as an internal or external command
```

**What's happening:**
1. User selects "Minimal" template (bash script)
2. Template incorrectly tagged as `platforms: ['unix', 'windows']`
3. On Windows, script saved with `.bat` extension
4. cmd.exe tries to execute bash syntax → fails

### Root Causes

1. **Incorrect Extension Logic** (StatusLineService.ts:74-84)
   ```typescript
   // WRONG: Uses platform to determine extension for bash
   case 'bash':
     return isWindows() ? 'bat' : 'sh';  // ❌
   ```

2. **Wrong Platform Tagging** (statusLineTemplates.ts)
   ```typescript
   {
     id: 'minimal',
     platforms: ['unix', 'windows'],  // ❌ Bash script can't run on Windows
     script: `#!/bin/bash...`
   }
   ```

3. **No Platform Validation**
   - Users can select incompatible templates
   - No runtime checks for platform compatibility

---

## Research Findings

### How Other Projects Solve This

**ccstatusline** (recommended approach):
- ✅ **Node.js for everything** - Same script, all platforms
- ✅ Runtime handles OS differences transparently
- ✅ No platform-specific code needed

**claude-code-statusline**:
- Uses **WSL** for Windows (not native)
- Explicitly states: "Windows: Use WSL"
- Bash scripts only

**Official Claude Code**:
- Platform-agnostic documentation
- Examples in Bash, Python, Node.js
- Users write platform-appropriate scripts

### Key Insight

> **Language determines extension, not platform**
>
> - Node.js script → `.js` (all platforms)
> - Python script → `.py` (all platforms)
> - Bash script → `.sh` (Unix only)
> - Batch script → `.bat` (Windows only)

---

## Final Solution: Windows stdin Redirection

### Problem with PowerShell

Initial attempt used PowerShell, but it **does not support the `<` operator**:

```
Error: The '<' operator is reserved for future use.
RedirectionNotSupported
```

### Solution: cmd.exe with `type` Command

Windows cmd.exe supports piping, so we use:

**Instead of:**
```cmd
node "script.js" < "input.json"  # ❌ Not supported
```

**We use:**
```cmd
type "input.json" | node "script.js"  # ✅ Works!
```

This approach:
- ✅ Works with cmd.exe (native Windows shell)
- ✅ Properly pipes file content to stdin
- ✅ No file association dialogs
- ✅ Consistent with Unix `cat file | command` pattern

---

## Decision

### Strategy: Three-Tier Template System

1. **Cross-Platform Templates (Node.js)** - PRIMARY RECOMMENDATION
   - Language: Node.js
   - Extension: `.js` (all platforms)
   - Execution: `node script.js < input.json`
   - Example: `minimal-cross-platform`, `developer-cross-platform`

2. **Unix-Only Templates (Bash)**
   - Language: Bash
   - Extension: `.sh` (Unix only)
   - Execution: `bash script.sh < input.json`
   - Example: `minimal`, `developer`, `full`, `git-focused`

3. **Windows-Only Templates (Batch/PowerShell)**
   - Language: Batch/PowerShell
   - Extension: `.bat` / `.ps1` (Windows only)
   - Execution: `script.bat < input.json`
   - Example: `minimal-windows`, `git-windows`

### Architecture Changes

#### 1. Platform-Aware Template Filtering

**New Function:** `getTemplatesForPlatform()`

```typescript
export function getTemplatesForPlatform(
  platform: 'windows' | 'macos' | 'linux'
): StatusLineTemplate[] {
  const platformKey = platform === 'windows' ? 'windows' : 'unix';

  return BUILT_IN_TEMPLATES.filter(template => {
    return template.platforms?.includes(platformKey);
  });
}
```

**Usage in UI:**
```typescript
// Only show compatible templates
const availableTemplates = getTemplatesForPlatform(getPlatform());
```

#### 2. Fixed Extension Logic

**Before (WRONG):**
```typescript
case 'bash':
  return isWindows() ? 'bat' : 'sh';  // ❌ Bash → .bat on Windows?!
```

**After (CORRECT):**
```typescript
private getScriptExtensionForLanguage(language: 'bash' | 'node' | 'python'): string {
  switch (language) {
    case 'node':
      return 'js';      // All platforms
    case 'python':
      return 'py';      // All platforms
    case 'bash':
      return 'sh';      // Unix only (never .bat!)
  }
}
```

#### 3. Platform Validation

**Add validation before execution:**

```typescript
async setTemplate(templateId: string): Promise<Result> {
  const template = getTemplateById(templateId);
  const platform = getPlatform();
  const platformKey = platform === 'windows' ? 'windows' : 'unix';

  // Validate platform compatibility
  if (!template.platforms?.includes(platformKey)) {
    throw new Error(
      `Template "${template.name}" is not compatible with ${platform}. ` +
      `Supported platforms: ${template.platforms.join(', ')}`
    );
  }

  // ... rest of implementation
}
```

#### 4. Updated Template Metadata

**Fix platform tags:**

```typescript
// BEFORE
{
  id: 'minimal',
  platforms: ['unix', 'windows'],  // ❌ WRONG
  script: `#!/bin/bash...`
}

// AFTER
{
  id: 'minimal',
  platforms: ['unix'],  // ✅ CORRECT - bash is Unix-only
  script: `#!/bin/bash...`
}

// Windows users should use this instead:
{
  id: 'minimal-cross-platform',
  platforms: ['unix', 'windows'],  // ✅ Node.js works everywhere
  script: `#!/usr/bin/env node...`
}
```

---

## Implementation Plan

### Phase 1: Fix Core Issues (CRITICAL - Do First)

#### 1.1 Fix `getScriptExtensionForLanguage()` ✅ HIGH PRIORITY

```typescript
private getScriptExtensionForLanguage(language: 'bash' | 'node' | 'python'): string {
  // Language determines extension, NOT platform
  switch (language) {
    case 'node':
      return 'js';
    case 'python':
      return 'py';
    case 'bash':
      return 'sh';  // NEVER return 'bat' for bash!
    default:
      return 'sh';
  }
}
```

#### 1.2 Fix Template Platform Tags ✅ HIGH PRIORITY

Update `statusLineTemplates.ts`:
- Bash templates: `platforms: ['unix']` ONLY
- Node.js templates: `platforms: ['unix', 'windows']`
- Batch templates: `platforms: ['windows']` ONLY

#### 1.3 Add Platform Filtering ✅ HIGH PRIORITY

```typescript
export function getTemplatesForPlatform(
  platform: 'windows' | 'macos' | 'linux'
): StatusLineTemplate[] {
  const platformKey = platform === 'windows' ? 'windows' : 'unix';
  return BUILT_IN_TEMPLATES.filter(t => t.platforms?.includes(platformKey));
}
```

#### 1.4 Add Platform Validation ✅ HIGH PRIORITY

```typescript
async previewStatusLine(templateId?: string): Promise<Result> {
  if (templateId) {
    const template = getTemplateById(templateId);
    const platform = getPlatform();
    const platformKey = platform === 'windows' ? 'windows' : 'unix';

    if (!template.platforms?.includes(platformKey)) {
      return {
        success: false,
        error: `Template "${template.name}" requires ${template.platforms.join(' or ')}. ` +
               `You are on ${platform}. Please select a cross-platform template.`,
      };
    }
  }
  // ... continue with preview
}
```

### Phase 2: UI Improvements (After Phase 1 works)

#### 2.1 Update Template Selector Component

```typescript
// Filter templates by platform
const platform = getPlatform();
const availableTemplates = getTemplatesForPlatform(platform);

// Show platform badge
{template.platforms.includes('windows') && template.platforms.includes('unix') && (
  <Badge>Cross-Platform</Badge>
)}
{template.platforms.includes('windows') && !template.platforms.includes('unix') && (
  <Badge>Windows Only</Badge>
)}
{template.platforms.includes('unix') && !template.platforms.includes('windows') && (
  <Badge>Mac/Linux Only</Badge>
)}
```

#### 2.2 Add Platform Warning in Preview

```typescript
{currentPlatform === 'windows' && template.platforms?.includes('unix') && (
  <Alert variant="warning">
    ⚠️ This template requires Unix/macOS. It will not work on Windows.
    Try a cross-platform template instead.
  </Alert>
)}
```

### Phase 3: Testing Strategy

#### 3.1 Unit Tests

```typescript
describe('Platform-aware template selection', () => {
  it('should filter bash templates on Windows', () => {
    const templates = getTemplatesForPlatform('windows');
    const bashTemplates = templates.filter(t =>
      t.script.includes('#!/bin/bash')
    );
    expect(bashTemplates).toHaveLength(0);
  });

  it('should include Node.js templates on Windows', () => {
    const templates = getTemplatesForPlatform('windows');
    const nodeTemplates = templates.filter(t =>
      t.script.includes('#!/usr/bin/env node')
    );
    expect(nodeTemplates.length).toBeGreaterThan(0);
  });

  it('should reject incompatible template preview', async () => {
    const result = await service.previewStatusLine('minimal'); // bash template
    expect(result.success).toBe(false);
    expect(result.error).toContain('not compatible');
  });
});
```

#### 3.2 Manual Testing Checklist

**On Windows:**
- [ ] Preview "Minimal (Node.js - Cross-Platform)" → ✅ Works
- [ ] Preview "Minimal" (bash) → ❌ Error message shown (doesn't crash)
- [ ] Template list only shows Windows-compatible templates
- [ ] Apply cross-platform template → Saves as `.js`, executes correctly

**On macOS:**
- [ ] Preview "Minimal" (bash) → ✅ Works
- [ ] Preview cross-platform templates → ✅ Works
- [ ] Template list shows all templates
- [ ] No regression from previous version

---

## Decision Matrix

| Approach | Windows Native | Unix Compat | User Experience | Maintenance |
|----------|----------------|-------------|-----------------|-------------|
| **Node.js First** (CHOSEN) | ✅ Excellent | ✅ Excellent | ✅ Best (same everywhere) | ✅ Minimal |
| WSL Required | ⚠️ Needs setup | ✅ Excellent | ⚠️ Extra steps | ✅ Minimal |
| Batch Scripts | ✅ Native | ❌ None | ❌ Different per platform | ❌ High |
| PowerShell | ✅ Native | ❌ None | ⚠️ Newer only | ⚠️ Medium |

**Winner:** Node.js-first approach
- Same scripts work everywhere
- No additional dependencies (Node.js already required for Claude Owl)
- Best user experience

---

## Breaking Changes

### None for Mac/Linux Users
- Bash templates continue to work
- No changes to existing scripts

### Windows Users
**Before:** Could select any template (but they didn't work)
**After:** Only see compatible templates (and they actually work!)

This is a **fix, not a breaking change** - the old behavior was broken.

---

## Success Criteria

### Must Have (Phase 1)
- [x] Temp file path mismatch fixed
- [ ] Preview works for cross-platform templates on Windows
- [ ] Bash templates filtered out on Windows
- [ ] No regression on Mac/Linux
- [ ] Clear error messages for incompatible templates

### Should Have (Phase 2)
- [ ] Platform badges in UI
- [ ] "Recommended for Windows" highlighting
- [ ] Warning when viewing incompatible template
- [ ] Comprehensive test coverage

### Nice to Have (Future)
- [ ] Auto-convert bash scripts to Node.js equivalent
- [ ] Custom script wizard with platform detection
- [ ] WSL detection and support

---

## Migration Guide

### For Windows Users

**Old (broken):**
```json
{
  "statusLine": {
    "command": "~/.claude/statusline-minimal.bat"  // Bash script with .bat extension!
  }
}
```

**New (working):**
```json
{
  "statusLine": {
    "command": "~/.claude/statusline-minimal-cross-platform.js"  // Node.js script
  }
}
```

**Action Required:**
- Open Claude Owl
- Go to Status Line settings
- Select a "Cross-Platform" template
- Apply template

---

## References

- [Claude Code StatusLine Docs](https://code.claude.com/docs/en/statusline)
- [ccstatusline](https://github.com/sirmalloc/ccstatusline) - Node.js cross-platform approach
- [claude-code-statusline](https://github.com/rz1989s/claude-code-statusline) - WSL approach

## Related Research

Earlier research explored temp file approach and other solutions as alternatives. The core insight remains valid: Windows command execution requires different handling than Unix shells, but the actual problem was simpler - incorrect template platform metadata and language-to-extension mapping.

---

## Appendix: Language vs Platform

**Key Principle:**

```
Script Language → Extension (fixed mapping)
Target Platform → Execution Command (varies)
```

**Correct Mappings:**

| Language | Extension | Unix Command | Windows Command |
|----------|-----------|--------------|-----------------|
| Node.js  | `.js`     | `node script.js` | `node script.js` |
| Python   | `.py`     | `python script.py` | `python script.py` |
| Bash     | `.sh`     | `bash script.sh` | ❌ Not supported |
| Batch    | `.bat`    | ❌ Not supported | `script.bat` |

**The Old (Wrong) Logic:**

```typescript
if (language === 'bash' && isWindows()) {
  return 'bat';  // ❌ Nonsense! Bash ≠ Batch
}
```

**The New (Correct) Logic:**

```typescript
if (language === 'bash') {
  if (isWindows()) {
    throw new Error('Bash scripts are not supported on Windows. Use Node.js templates.');
  }
  return 'sh';
}
```
