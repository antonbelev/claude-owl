# GitHub Import Flow for Slash Commands

**Feature:** One-click import of slash commands from public GitHub repositories
**Scope:** Import from any public repo with `.claude/commands/` directory
**Priority:** Phase 5 (Templates & Wizards)

---

## Table of Contents

1. [Overview & Value](#overview--value)
2. [UX Flow Design](#ux-flow-design)
3. [Security Model](#security-model)
4. [Implementation Details](#implementation-details)
5. [Risk Mitigation](#risk-mitigation)

---

## Overview & Value

### Problem

Users discover great slash commands in public repos (e.g., `awesome-claude-code`) but have to:
1. Navigate to the repo
2. Find `.claude/commands/` directory
3. Copy each file manually
4. Save to their local `~/.claude/commands/`

### Solution

**One-click GitHub import** that:
- Discovers all slash commands in a repo
- Shows preview + security scan before import
- Auto-fixes common issues (quoted variables, etc.)
- Saves to correct location with metadata
- Tracks command provenance

### Value Proposition

- **For Beginners:** Access pre-built command templates instantly
- **For Power Users:** Build personal command library from community collections
- **For Teams:** Share command sets via GitHub repos

---

## UX Flow Design

### Entry Point

**Location:** Commands Manager → Import Button

```
┌────────────────────────────────────────────────┐
│ Commands                  [🔍] [+ New] [Import]│  ← Import Button
└────────────────────────────────────────────────┘
```

---

### Step 1: Enter Repository URL

**Purpose:** Let user specify which repo to import from

**Design:**

```
┌─────────────────────────────────────────────────────────────┐
│ Import Commands from GitHub                    [× Close]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ How it works:                                                │
│ • Finds all commands in .claude/commands/                   │
│ • Scans for security issues                                 │
│ • Shows preview before installing                           │
│                                                              │
│ GitHub Repository URL:                                       │
│ [https://github.com/owner/repo_______________________]       │
│                                                              │
│ Examples:                                                    │
│ • https://github.com/hesreallyhim/awesome-claude-code       │
│ • https://github.com/wshobson/commands                      │
│ • https://github.com/anthropics/claude-commands             │
│                                                              │
│ ℹ️ Must be a public repository                             │
│                                                              │
│ ○ Import all commands from this repo                        │
│ ○ Choose specific commands (next step)                      │
│                                                              │
│ [Cancel] [Next: Scan Repository]                            │
└─────────────────────────────────────────────────────────────┘
```

**Validation:**
- ✅ Valid GitHub URL format
- ✅ Repo exists and is public
- ✅ Contains `.claude/commands/` directory
- ❌ Error message if invalid

**Key UX Elements:**
- Examples of popular repos (clickable shortcuts)
- Clear explanation of what happens
- Option to select all or choose later
- Scans for `commands/`, `slash-commands/`, `.claude/commands/` (flexible naming)

---

### Step 2: Discover & Security Scan

**Purpose:** Find commands and scan for security issues

**Design:**

```
┌──────────────────────────────────────────────────────────┐
│ Scanning Repository: hesreallyhim/awesome-claude-code    │
│ Scanning: .claude/commands/                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 📊 Progress: 8/12 files                                 │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  67%        │
│                                                          │
│ ✅ Found so far:                                        │
│                                                          │
│ ✅ git-commit.md                                        │
│    Trust: 92/100 (Trusted)                              │
│    Description: Create structured git commits           │
│                                                          │
│ ⚠️  code-review.md                                      │
│    Trust: 68/100 (Unknown)                              │
│    Description: Review code for quality issues          │
│    Issues: 2 (1 high, 1 medium)                         │
│                                                          │
│ 🟠 test-runner.md                                       │
│    Trust: 45/100 (Unknown)                              │
│    Description: Run tests with custom patterns          │
│    Issues: 3 (unquoted variables)                       │
│                                                          │
│ ❌ dangerous-cleanup.md                                 │
│    Trust: 15/100 (Dangerous)                            │
│    Status: Blocked (unquoted rm -rf)                    │
│                                                          │
│ Scanning remaining files...                             │
│                                                          │
│ [Cancel] [Pause]                                        │
└──────────────────────────────────────────────────────────┘
```

**What Happens Behind the Scenes:**

For each `.md` file found:
1. **Parse YAML frontmatter** - Extract metadata
2. **Validate structure** - Check required fields
3. **Security scan** - Detect dangerous patterns
4. **Calculate trust score** - Rate 0-100
5. **Check for auto-fixes** - Can we fix issues automatically?

**Trust Score Factors:**

```
Trust Level Classification:

90-100: ✅ TRUSTED
- No security issues
- From official/curated source
- Best practice patterns

70-89: 🟡 CURATED
- Minor issues (can auto-fix)
- Known safe repos
- Standard permissions

40-69: 🟠 UNKNOWN
- Multiple issues detected
- Unknown source
- Requires review

0-39: 🔴 DANGEROUS
- Critical security issues
- Will be blocked
- Do not install
```

---

### Step 3: Review Each Command (Filter View)

**Purpose:** Show commands grouped by risk level, allow selection

**Design:**

```
┌──────────────────────────────────────────────────────────┐
│ Found 12 Commands: 8 Safe, 3 Risky, 1 Blocked            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [✅ Safe (8)] [⚠️ Risky (3)] [❌ Blocked (1)]            │
│                                                          │
│ ═══ SAFE COMMANDS (Auto-select these) ═══               │
│                                                          │
│ ☑ /git-commit                           Trust: 92/100   │
│   Create structured commits with types                  │
│   Tools: Bash(git:*)                                    │
│   [Preview] [Details]                                   │
│                                                          │
│ ☑ /code-quality                         Trust: 88/100   │
│   Analyze code for quality issues                       │
│   Tools: Read, WebFetch                                 │
│   [Preview] [Details]                                   │
│                                                          │
│ ═══ RISKY COMMANDS (Review before install) ═══          │
│                                                          │
│ ☐ /code-review                          Trust: 68/100   │
│   ⚠️ 2 issues detected                                  │
│   [Preview] [Review Issues] [Auto-Fix]                  │
│                                                          │
│ ☐ /test-runner                          Trust: 45/100   │
│   🟠 3 issues detected                                  │
│   [Preview] [Review Issues] [Auto-Fix]                  │
│                                                          │
│ ═══ BLOCKED COMMANDS (Cannot install) ═══               │
│                                                          │
│ ✗ /cleanup                               Trust: 15/100  │
│   ❌ Critical issues (see details)                      │
│   [Preview] [Review Issues]                             │
│                                                          │
│                                                          │
│ [Cancel] [Review Risky] [Install Safe (8)]              │
└──────────────────────────────────────────────────────────┘
```

**Key Features:**

1. **Auto-Grouping by Risk**
   - Safe: Pre-checked ✅
   - Risky: Unchecked ⚠️
   - Blocked: Disabled ❌

2. **Quick Actions**
   - `[Preview]` - See command content
   - `[Details]` - Full metadata
   - `[Review Issues]` - Security scan details
   - `[Auto-Fix]` - One-click fixes (if available)

3. **Selection Logic**
   - All safe commands selected by default
   - User can deselect if desired
   - Risky commands must be explicitly selected
   - Blocked commands cannot be selected

---

### Step 3b: Review Risky Command (Detailed View)

**Purpose:** Show specific issues and fix options

**Design:**

```
┌──────────────────────────────────────────────────────────────┐
│ Review: /test-runner                                         │
│ Trust Score: 45/100 (🟠 Unknown)                             │
│ Found 3 security issues                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Command Preview:                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ---                                                   │   │
│ │ description: Run tests with custom patterns          │   │
│ │ allowed-tools: Bash(*)  ⚠️ CRITICAL                 │   │
│ │ ---                                                   │   │
│ │                                                       │   │
│ │ Run $1 tests matching $2:                            │   │
│ │ !`npm run test:$1 $2`  ⚠️ UNQUOTED VAR              │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ SECURITY ISSUES:                                             │
│                                                              │
│ 🔴 CRITICAL (1):                                            │
│ ├─ Line 3: Bash(*) allows ANY bash command                 │
│ │  Current: allowed-tools: Bash(*)                          │
│ │  Risk: User could execute dangerous commands              │
│ │  Recommendation: Bash(npm:*, jest:*, mocha:*)             │
│ │  [✅ Auto-Fix Available]                                  │
│                                                              │
│ 🟠 HIGH (1):                                                │
│ ├─ Line 6: Unquoted variable in bash                        │
│ │  Current: !`npm run test:$1 $2`                           │
│ │  Risk: Shell injection if $2 contains special chars       │
│ │  Example: /test-runner unit "; rm -rf /"                │
│ │  Recommendation: !`npm run test:\"$1\" \"$2\"`            │
│ │  [✅ Auto-Fix Available]                                  │
│                                                              │
│ 🟡 MEDIUM (1):                                              │
│ ├─ Missing argument-hint field                              │
│ │  Risk: Users won't know what arguments to provide         │
│ │  Recommendation: argument-hint: [test-type] [pattern]     │
│ │  [✅ Auto-Fix Available]                                  │
│                                                              │
│ ─────────────────────────────────────────────────────────  │
│                                                              │
│ AFTER AUTO-FIX:                                              │
│ ✅ All 3 issues fixed                                       │
│ 📈 Trust Score: 45 → 82 (Unknown → Curated)                │
│                                                              │
│ Preview (fixed):                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ allowed-tools: Bash(npm:*, jest:*, mocha:*)         │   │
│ │ !`npm run test:\"$1\" \"$2\"`                        │   │
│ │ argument-hint: [test-type] [pattern]                 │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ☐ I've reviewed these changes and accept the fixes         │
│                                                              │
│ [« Back] [Cancel] [Reject Fixes] [Apply Fixes & Install]   │
└──────────────────────────────────────────────────────────────┘
```

**Key Sections:**

1. **Command Preview**
   - Visual preview with issue markers
   - Line numbers for easy reference

2. **Issues List**
   - Grouped by severity (Critical → Medium)
   - Clear explanation of each issue
   - Shows current vs. recommended fix
   - Indicates if auto-fixable

3. **Auto-Fix Preview**
   - Shows what will change
   - New trust score after fixes
   - Before/after comparison

4. **User Confirmation**
   - Must acknowledge review
   - Can accept, reject, or edit manually

---

### Step 4: Batch Install Summary

**Purpose:** Confirm all selections before final install

**Design:**

```
┌──────────────────────────────────────────────────────────────┐
│ Ready to Install: 9 Commands                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ INSTALLATION SUMMARY:                                        │
│                                                              │
│ From: hesreallyhim/awesome-claude-code                      │
│ Branch: main                                                 │
│ Last updated: 2 days ago                                    │
│                                                              │
│ ✅ WILL INSTALL (9):                                        │
│                                                              │
│ Safe commands (8 - No changes):                              │
│ • /git-commit          Trust: 92/100  → ~/.claude/commands/ │
│ • /code-quality        Trust: 88/100  → ~/.claude/commands/ │
│ • /lint-code           Trust: 85/100  → ~/.claude/commands/ │
│ • ... 5 more                                                 │
│                                                              │
│ Fixed & installing (1 - With auto-fixes):                   │
│ • /test-runner         Trust: 45→82/100  [Fixed]            │
│   Changes:                                                   │
│   - Restricted Bash(*) → Bash(npm:*, jest:*)                │
│   - Quoted unquoted variables                               │
│   - Added argument-hint                                     │
│                                                              │
│ ❌ BLOCKED (1 - Cannot install):                            │
│                                                              │
│ • /cleanup             Trust: 15/100                         │
│   Reason: rm -rf with unquoted variables                    │
│   Action: Skipped (contact author for fix)                  │
│                                                              │
│ ─────────────────────────────────────────────────────────  │
│                                                              │
│ INSTALLATION LOCATION:                                       │
│ ◉ ~/.claude/commands/  (User - Personal)                    │
│ ○ .claude/commands/    (Project - Shared with team)         │
│                                                              │
│ ORGANIZATION:                                                │
│ ☑ Keep original structure (if subdirs exist)                │
│ ☑ Add git-imported tag to file comments                     │
│ ☑ Store import metadata (for updates)                       │
│                                                              │
│ [Cancel] [Install 9 Commands]                               │
└──────────────────────────────────────────────────────────────┘
```

**Key Information:**
- Clear breakdown of what will happen
- Safe vs. Fixed vs. Blocked
- Exact changes for each command
- Installation location choice
- Metadata preservation options

---

### Step 5: Success & Next Steps

**Design:**

```
┌──────────────────────────────────────────────────────────────┐
│ ✅ Successfully Imported 9 Commands                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Installed to: ~/.claude/commands/                           │
│ Timestamp: 2025-01-15 14:32 UTC                             │
│ Repository: hesreallyhim/awesome-claude-code                │
│ Branch: main (commit: abc1234...)                           │
│                                                              │
│ SUMMARY:                                                     │
│ ✅ 8 commands (no changes needed)                           │
│ 🔧 1 command (auto-fixed 3 issues)                          │
│ ⏭️  1 command (skipped - too risky)                         │
│                                                              │
│ NEXT STEPS:                                                  │
│                                                              │
│ 1. Try your new commands                                    │
│    └─ Type /git-commit in Claude Code                       │
│                                                              │
│ 2. Review the risky command                                 │
│    └─ /cleanup was skipped (see details)                    │
│    └─ [Review Details] [Edit Command]                      │
│                                                              │
│ 3. Share with your team                                     │
│    └─ Copy commands to .claude/commands/ for project        │
│    └─ Or push to your team's repo                           │
│                                                              │
│ 4. Update when repo changes                                 │
│    └─ [Check for Updates] (re-import with one click)        │
│                                                              │
│ IMPORT METADATA:                                             │
│ All commands tagged with:                                    │
│ <!-- source: github                                         │
│      repo: hesreallyhim/awesome-claude-code                │
│      imported: 2025-01-15T14:32:00Z                        │
│      commit: abc1234...                                    │
│ -->                                                         │
│                                                              │
│ [View Imported Commands] [Import Another Repo] [Close]      │
└──────────────────────────────────────────────────────────────┘
```

---

## Security Model

### Trust Scoring Algorithm

**Base Score: 100 points**

#### Deductions:

```
Unknown Source:              -30 points
  └─ GitHub repos (unless in CURATED_REPOS list)

Invalid YAML Structure:      -10 points
  └─ Malformed frontmatter

Critical Security Issues:    -50 points each
  ├─ rm -rf / (recursive delete from root)
  ├─ :(){:|:&}; (fork bomb)
  ├─ curl | sh (pipe to shell)
  ├─ unquoted variables in bash
  └─ Bash(*) without other restrictions

High Security Issues:        -20 points each
  ├─ Bash(*) alone
  ├─ Write(*) or Edit(*)
  ├─ curl | sh patterns
  └─ eval with user input

Medium Security Issues:      -10 points each
  ├─ chmod 777 patterns
  ├─ passwd/shadow file access
  ├─ Large file references (>10MB)
  └─ Overly broad permissions

Missing Fields:              -5 points each
  ├─ Missing description
  └─ Missing argument-hint (if uses $1, $2)

Final Score Calculation:
score = max(0, min(100, 100 - total_deductions))
```

#### Trust Level Classification:

```
90-100: ✅ TRUSTED
  • No security issues
  • From official/curated repos
  • Best practice patterns
  • Auto-selected for install

70-89: 🟡 CURATED
  • Minor issues that auto-fix
  • Known safe repositories
  • Standard permissions
  • Pre-checked, user can confirm

40-69: 🟠 UNKNOWN
  • Multiple issues detected
  • Unknown/untrusted source
  • Requires explicit review
  • Must fix or acknowledge risks

0-39: 🔴 DANGEROUS
  • Critical security issues found
  • Cannot be installed automatically
  • Requires major changes or rejection
  • User informed of risks
```

---

### Curated Repository List

```typescript
const CURATED_REPOS = [
  'github.com/hesreallyhim/awesome-claude-code',
  'github.com/wshobson/commands',
  'github.com/anthropics/claude-code-commands',
  'github.com/anthropics/claude-examples',
  // User can add personal trusted repos
];
```

Curated repos start with **+10 trust bonus**.

---

### Auto-Fix Capabilities

#### Automatically Fixable Issues:

```
✅ Quote Unquoted Variables
  Before: rm $1
  After:  rm "$1"
  Confidence: 100%

✅ Restrict Bash(*)
  Before: allowed-tools: Bash(*)
  After:  allowed-tools: Bash(npm:*, git:*)
  Confidence: 85% (uses npm, git patterns detected)

✅ Add Missing Description
  If empty → Extracted from comments or generated
  Confidence: 60% (may need user review)

✅ Add Argument Hint
  If uses $1, $2 → Auto-generate placeholder hints
  Confidence: 70% (may be inaccurate)

❌ NOT Auto-Fixable Issues
  • Fork bombs (remove entirely)
  • rm -rf / patterns (must be edited manually)
  • Critical permission issues (requires review)
```

---

## Implementation Details

### API Endpoints Needed

#### 1. **Discover Commands from GitHub**

```typescript
POST /api/commands/discover-github
Body: {
  repoUrl: string;  // https://github.com/owner/repo
  branch?: string;  // default: main
}

Response: {
  found: number;
  commands: {
    name: string;
    path: string;  // .claude/commands/name.md
    hash: string;  // File content hash
    size: number;
    lastModified: Date;
  }[];
  error?: string;
}
```

#### 2. **Scan Commands for Security**

```typescript
POST /api/commands/scan-security
Body: {
  repoUrl: string;
  commands: {
    name: string;
    content: string;
  }[];
}

Response: {
  results: {
    commandName: string;
    trustScore: number;
    trustLevel: 'trusted' | 'curated' | 'unknown' | 'dangerous';
    issues: {
      severity: 'critical' | 'high' | 'medium' | 'low';
      line?: number;
      message: string;
      recommendation: string;
      autoFixable: boolean;
      fix?: string;  // Suggested code change
    }[];
  }[];
}
```

#### 3. **Auto-Fix Commands**

```typescript
POST /api/commands/auto-fix
Body: {
  commands: {
    name: string;
    content: string;
  }[];
}

Response: {
  fixed: {
    commandName: string;
    before: string;
    after: string;
    changesApplied: string[];
    newTrustScore: number;
  }[];
}
```

#### 4. **Import Commands**

```typescript
POST /api/commands/import-github
Body: {
  repoUrl: string;
  branch: string;
  commands: {
    name: string;
    content: string;
  }[];
  location: 'user' | 'project';
  metadata: {
    sourceUrl: string;
    importedAt: Date;
    trustScore: number;
  };
}

Response: {
  success: boolean;
  imported: string[];  // Command names
  failed: { name: string; reason: string }[];
}
```

---

### File Structure for Imported Commands

Each imported command includes metadata in HTML comment:

```markdown
---
description: Create structured git commits
allowed-tools: Bash(git:*)
argument-hint: [commit-type]
---

Create a git commit with proper type:

!`git commit -m "$1"`

<!--
IMPORTED_FROM:
  source: github
  url: https://github.com/hesreallyhim/awesome-claude-code
  path: .claude/commands/git-commit.md
  imported: 2025-01-15T14:32:00Z
  commit: abc1234def567890
  trust_score: 92
  fixes_applied: []
  user_edits: false
-->
```

---

## Risk Mitigation

### 1. **Sandboxing**

- Commands never auto-execute after import
- Preview mode shows what would run
- User must explicitly open command in Claude Code
- Test in safe context first

### 2. **Rollback Capability**

```
✅ Import creates timestamped backup:
   ~/.claude/commands/.backups/
   ├── 2025-01-15_14-32_import.tar.gz
   ├── 2025-01-15_14-32_import.json  (metadata)
   └── ...

User can:
- [Undo Last Import]  → restore from backup
- [View Backup]       → see what was imported
- [Compare]           → diff before/after
```

### 3. **Transparency**

- Every imported command shows source
- Metadata never hidden from user
- Clear warnings for any modifications
- Import history visible in timeline

### 4. **User Confirmation**

- Risky commands require explicit checkbox
- Blocked commands show detailed explanation
- User must acknowledge risks to proceed
- No silent installations

### 5. **Community Feedback** (Future)

- Users can report malicious repos
- Maintain blocklist of dangerous sources
- Community trust ratings
- Security advisories

---

## Implementation Phases

### Phase 1: MVP (1 week)
- ✅ Step 1: Enter GitHub URL
- ✅ Step 2: Discover commands
- ✅ Step 3: Show list (safe/risky/blocked)
- ✅ Step 4: Import selected commands
- ✅ Basic security scanning

### Phase 2: Enhanced UX (1 week)
- ✅ Step 3b: Detailed review with fixes
- ✅ Auto-fix implementation
- ✅ Trust score visualization
- ✅ Better error messages

### Phase 3: Advanced (Future)
- ☐ Update checking (re-import when repo changes)
- ☐ Custom curated lists
- ☐ Community ratings
- ☐ Command comparison/merging

---

## Success Metrics

### UX
- Users can import commands in < 3 minutes
- 90%+ of safe commands auto-selected
- Clear understanding of risks
- Zero confusion about what will be installed

### Safety
- 100% of dangerous commands blocked
- All security issues explained
- Auto-fix improves 70%+ of risky commands
- Full audit trail maintained

### Adoption
- 30%+ of users import commands within first month
- Average 5+ commands imported per user
- Low rate of "imported then deleted"
- Positive feedback on command quality

---

## Next Steps

1. **Design Review** - Share mockups with team
2. **Security Review** - Validate threat model
3. **Implementation** - Build API endpoints & UI
4. **Testing** - Test with real repos (awesome-claude-code)
5. **Launch** - Release as part of Phase 5
