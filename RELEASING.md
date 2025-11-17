# Release Process Guide

This document explains how to create and publish releases for Claude Owl. Our release process is automated using GitHub Actions and follows semantic versioning.

## Table of Contents

- [Overview](#overview)
- [Release Types](#release-types)
- [Prerequisites](#prerequisites)
- [Quick Start - First Release (v0.1.0)](#quick-start---first-release-v010)
- [Standard Release Process](#standard-release-process)
- [Hotfix Release Process](#hotfix-release-process)
- [Version Management](#version-management)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

---

## Overview

Claude Owl uses a **Git Flow-inspired workflow** with automated builds via GitHub Actions:

```
develop → release/vX.Y.x → main (tagged) → GitHub Actions → Draft Release
         ↓                  ↓
         └──────────────────┘ (merge back to develop)
```

**Key Points:**
- All development happens on `develop` branch
- Releases are prepared on `release/vX.Y.x` branches
- Tags on `main` trigger multi-platform builds (macOS, Windows, Linux)
- Version bumping and changelog generation are automated via `standard-version`
- GitHub releases are created as **drafts** for manual review before publishing

---

## Release Types

### 1. **Major Release** (Breaking Changes)
- Example: `1.0.0` → `2.0.0`
- Use when: API changes, major feature overhauls, breaking changes
- Command: `./scripts/prepare-release.sh major`

### 2. **Minor Release** (New Features)
- Example: `0.1.0` → `0.2.0`
- Use when: New features, enhancements, non-breaking changes
- Command: `./scripts/prepare-release.sh minor`

### 3. **Patch Release** (Bug Fixes)
- Example: `0.1.0` → `0.1.1`
- Use when: Bug fixes, security patches, minor improvements
- Command: `./scripts/prepare-release.sh patch`

### 4. **Hotfix Release** (Emergency Fixes)
- Example: `0.2.0` → `0.2.1`
- Use when: Critical bugs in production that need immediate fix
- Command: `./scripts/hotfix.sh` (from hotfix branch)

---

## Prerequisites

Before creating a release, ensure you have:

- [x] **Git** installed and configured
- [x] **Node.js 18+** and npm installed
- [x] Write access to the repository
- [x] All changes merged to `develop` branch
- [x] CI pipeline passing on `develop`
- [x] Working directory is clean (no uncommitted changes)

### Environment Check

Run these commands to verify your setup:

```bash
# Check you're on develop branch
git branch --show-current

# Pull latest changes
git pull origin develop

# Verify all tests pass
npm run format && npm run lint && npm run typecheck && npm run test:unit && npm run build
```

---

## Quick Start - First Release (v0.1.0)

Since `package.json` already has version `0.1.0` and `CHANGELOG.md` has an entry for it, you can skip the preparation step and go straight to finalization.

### Option A: Manual Tag Creation (Simplest)

```bash
# 1. Ensure you're on develop and it's up to date
git checkout develop
git pull origin develop

# 2. Run CI checks locally
npm run format && npm run lint && npm run typecheck && npm run test:unit && npm run build

# 3. Merge develop to main
git checkout main
git pull origin main
git merge develop --no-ff -m "chore(release): merge develop into main for v0.1.0"

# 4. Create and push tag (this triggers GitHub Actions build)
git tag -a v0.1.0 -m "Release 0.1.0 - Initial Beta"
git push origin main
git push origin v0.1.0

# 5. Merge main back to develop
git checkout develop
git merge main --no-ff -m "chore(release): sync main back to develop"
git push origin develop

# 6. Monitor GitHub Actions
# Visit: https://github.com/antonbelev/claude-owl/actions
# Wait ~15-20 minutes for builds to complete

# 7. Publish draft release
# Visit: https://github.com/antonbelev/claude-owl/releases
# Review, edit if needed, then click "Publish release"
```

### Option B: Use Finalize Script (Alternative)

If you want to use the existing automation:

```bash
# 1. Create a temporary release branch
git checkout develop
git checkout -b release/v0.1.x

# 2. Run finalize script
./scripts/finalize-release.sh

# Follow the prompts - it will:
# - Merge to main
# - Create tag v0.1.0
# - Push tag (triggers build)
# - Merge back to develop
```

---

## Standard Release Process

Follow this workflow for regular feature releases (minor/patch):

### Step 1: Prepare Release

```bash
# From develop branch, run preparation script
git checkout develop
git pull origin develop

# For a minor release (0.1.0 → 0.2.0)
./scripts/prepare-release.sh minor

# For a patch release (0.1.0 → 0.1.1)
./scripts/prepare-release.sh patch

# For a major release (0.1.0 → 1.0.0)
./scripts/prepare-release.sh major
```

**What this does:**
1. ✅ Verifies you're on `develop` branch
2. ✅ Runs CI checks (format, lint, typecheck, test, build)
3. ✅ Creates release branch (e.g., `release/v0.2.x`)
4. ✅ Bumps version in `package.json`
5. ✅ Generates changelog from commit messages
6. ✅ Commits changes with message: `chore(release): v0.2.0`
7. ✅ Pushes release branch to GitHub

### Step 2: Review Changes

```bash
# The script creates and checks out the release branch automatically
git branch --show-current  # Should show: release/vX.Y.x

# Review the changes
cat CHANGELOG.md           # Check changelog accuracy
cat package.json | grep version  # Verify version number

# Make any final edits if needed
vim CHANGELOG.md           # Edit changelog
git add CHANGELOG.md
git commit -m "docs(release): update changelog"
git push origin release/v0.2.x
```

### Step 3: Test Release Candidate (Optional)

```bash
# Build locally to test
npm run clean
npm ci
npm run build
npm run package:mac  # Or package:win, package:linux

# Test the built application
open release/0.2.0/Claude\ Owl-0.2.0-arm64.dmg  # macOS example
```

### Step 4: Finalize Release

```bash
# From the release branch, run finalize script
./scripts/finalize-release.sh
```

**What this does:**
1. ✅ Confirms you're on a release branch
2. ✅ Shows summary and asks for confirmation
3. ✅ Merges release branch → `main`
4. ✅ Creates git tag (e.g., `v0.2.0`)
5. ✅ Pushes `main` and tag to GitHub (triggers CI/CD)
6. ✅ Merges release branch → `develop`
7. ✅ Optionally deletes release branch

### Step 5: Monitor Build & Publish

```bash
# 1. Monitor GitHub Actions build progress
open https://github.com/antonbelev/claude-owl/actions

# Build typically takes 15-20 minutes and produces:
# - macOS: .dmg (Intel + Apple Silicon)
# - Windows: .exe installer (x64 + ARM64)
# - Linux: .AppImage and .deb (x64 + ARM64)

# 2. Once build completes, review draft release
open https://github.com/antonbelev/claude-owl/releases

# 3. Edit release notes if needed, then click "Publish release"
```

---

## Hotfix Release Process

For critical bugs that need immediate fixing in production:

### Step 1: Create Hotfix Branch

```bash
# Start from main (production code)
git checkout main
git pull origin main

# Create hotfix branch with descriptive name
git checkout -b hotfix/v0.2.1-security-fix
```

### Step 2: Make Fix

```bash
# Fix the bug
vim src/main/services/ClaudeService.ts

# Commit with conventional commit message
git add .
git commit -m "fix(security): sanitize user inputs in ClaudeService"

# Push hotfix branch
git push -u origin hotfix/v0.2.1-security-fix
```

### Step 3: Run Hotfix Script

```bash
# From hotfix branch, run hotfix script
./scripts/hotfix.sh
```

**What this does:**
1. ✅ Verifies you're on a hotfix branch
2. ✅ Runs CI checks
3. ✅ Bumps patch version (0.2.0 → 0.2.1)
4. ✅ Updates CHANGELOG.md
5. ✅ Asks for confirmation
6. ✅ Merges hotfix → `main`
7. ✅ Creates tag and pushes (triggers build)
8. ✅ Merges hotfix → `develop`
9. ✅ Deletes hotfix branch

### Step 4: Monitor & Publish

```bash
# Same as standard release - monitor Actions and publish draft
open https://github.com/antonbelev/claude-owl/actions
open https://github.com/antonbelev/claude-owl/releases
```

---

## Version Management

### How Versions Are Synced

Claude Owl ensures version consistency across:
- `package.json` - Node.js package version
- `CHANGELOG.md` - Release notes
- Git tags - GitHub release triggers

**Version Flow:**
```
standard-version → package.json → git commit → git tag → GitHub Actions
```

### standard-version Configuration

Located in `.versionrc.json`:

```json
{
  "skip": { "tag": true },  // Tags created manually by scripts
  "packageFiles": [{ "filename": "package.json", "type": "json" }],
  "bumpFiles": [{ "filename": "package.json", "type": "json" }]
}
```

### Changelog Generation

Changelogs are auto-generated from **conventional commits**:

| Commit Type | Changelog Section | Example |
|------------|------------------|---------|
| `feat:` | ✨ Features | `feat(settings): add dark mode toggle` |
| `fix:` | 🐛 Bug Fixes | `fix(cli): handle missing claude binary` |
| `perf:` | ⚡ Performance | `perf(render): optimize large file lists` |
| `docs:` | 📚 Documentation | `docs(api): add JSDoc comments` |
| `refactor:` | ♻️ Code Refactoring | `refactor(hooks): simplify IPC handlers` |

**Hidden types** (not shown in changelog):
- `style:`, `test:`, `build:`, `ci:`, `chore:`

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Examples:**
```bash
feat(dashboard): add API status monitor
fix(settings): prevent duplicate permission rules
perf(ipc): cache Claude installation check
docs(readme): update installation instructions
refactor(services): extract common file utilities
```

---

## CI/CD Pipeline

### Workflow Triggers

**.github/workflows/release.yml** triggers on tag push:

```yaml
on:
  push:
    tags:
      - 'v*'  # Matches v0.1.0, v1.0.0, etc.
```

### Build Pipeline Stages

```
Tag Push (v0.2.0)
  ↓
Quality Gate (lint, typecheck, test, build)
  ↓
Parallel Builds:
  - macOS (macos-latest)
  - Windows (windows-latest)
  - Linux (ubuntu-latest)
  ↓
Create GitHub Release (draft)
  ↓
Upload Artifacts:
  - .dmg, .exe, .AppImage, .deb
  - latest-mac.yml, latest.yml (auto-update manifests)
```

### Build Artifacts

Each release produces:

| Platform | Files | Architectures |
|----------|-------|--------------|
| **macOS** | `Claude-Owl-0.2.0-{arch}.dmg` | x64, arm64 |
| | `latest-mac.yml` | (auto-update) |
| **Windows** | `Claude-Owl-Setup-0.2.0.exe` | x64, arm64 |
| | `latest.yml` | (auto-update) |
| **Linux** | `Claude-Owl-0.2.0-{arch}.AppImage` | x64, arm64 |
| | `claude-owl_0.2.0_{arch}.deb` | x64, arm64 |
| | `latest-linux.yml` | (auto-update) |

### Release as Draft

Releases are created as **drafts** by default:

```json
// electron-builder.json
{
  "publish": {
    "provider": "github",
    "releaseType": "draft"  // ← Manual publish required
  }
}
```

**Why drafts?**
- Allows manual review of release notes
- Time to test download links
- Opportunity to add screenshots or additional docs
- Control over release timing

---

## Troubleshooting

### Issue: "No tag found" when running scripts

**Cause:** Git tags are created manually by scripts, not by standard-version.

**Solution:** Tags are created during finalization step. If you need to manually create a tag:

```bash
git checkout main
git tag -a v0.1.0 -m "Release 0.1.0"
git push origin v0.1.0
```

### Issue: Version in package.json doesn't match tag

**Cause:** Manual edits to package.json or skipped preparation step.

**Solution:** Always use scripts to bump version:

```bash
# Undo changes
git checkout package.json CHANGELOG.md

# Use standard-version directly
npm run release:patch  # or minor/major
```

### Issue: GitHub Actions build fails

**Common causes:**
1. **Linting errors** - Run `npm run lint:fix` before release
2. **Type errors** - Run `npm run typecheck` to find issues
3. **Test failures** - Run `npm run test:unit` locally
4. **Build errors** - Run `npm run build` to verify

**Solution:** Fix issues locally, commit, and create a new tag:

```bash
# Fix the issue
npm run lint:fix
git add .
git commit -m "fix(ci): resolve linting errors"
git push origin main

# Delete old tag
git tag -d v0.2.0
git push origin :refs/tags/v0.2.0

# Create new tag
git tag -a v0.2.0 -m "Release 0.2.0"
git push origin v0.2.0
```

### Issue: Push to GitHub fails (network error)

**Cause:** Temporary network issues or large file size.

**Solution:** Scripts include retry logic (4 attempts with exponential backoff). If all retries fail:

```bash
# Manual push with retry
for i in {1..4}; do
  git push origin main && git push origin v0.2.0 && break
  sleep $((2**i))
done
```

### Issue: Release branch already exists

**Cause:** Previous release wasn't cleaned up.

**Solution:** Delete old branch or continue with existing:

```bash
# Option 1: Delete and recreate
git branch -D release/v0.2.x
git push origin --delete release/v0.2.x
./scripts/prepare-release.sh minor

# Option 2: Continue with existing
git checkout release/v0.2.x
git merge develop --no-edit
./scripts/finalize-release.sh
```

### Issue: Changelog has incorrect entries

**Cause:** Commit messages don't follow conventional commit format.

**Solution:** Edit CHANGELOG.md manually before finalizing:

```bash
# On release branch
vim CHANGELOG.md
git add CHANGELOG.md
git commit -m "docs(changelog): update release notes"
git push origin release/v0.2.x
./scripts/finalize-release.sh
```

### Issue: Need to cancel a release in progress

**Scenario 1: Before tag is pushed**

```bash
# Delete release branch
git checkout develop
git branch -D release/v0.2.x
git push origin --delete release/v0.2.x
```

**Scenario 2: After tag is pushed**

```bash
# Delete tag locally and remotely
git tag -d v0.2.0
git push origin :refs/tags/v0.2.0

# Delete draft release on GitHub
# Visit: https://github.com/antonbelev/claude-owl/releases
# Click "Delete" on the draft release
```

**Scenario 3: After release is published**

⚠️ **Do NOT delete published releases!** Instead:

```bash
# Create a new patch release with fixes
git checkout main
git checkout -b hotfix/v0.2.1-rollback
# Make necessary changes
./scripts/hotfix.sh
```

---

## Checklist Templates

### Pre-Release Checklist

```markdown
- [ ] All features merged to `develop`
- [ ] CI pipeline passing on `develop`
- [ ] No uncommitted changes in working directory
- [ ] Version number follows semantic versioning
- [ ] CHANGELOG.md accurately describes changes
- [ ] Breaking changes documented (if major release)
- [ ] README.md updated with new features
- [ ] Documentation updated (if needed)
```

### Post-Release Checklist

```markdown
- [ ] GitHub Actions build completed successfully
- [ ] All platform artifacts present in release
- [ ] Download links tested (at least one platform)
- [ ] Release notes reviewed and accurate
- [ ] Release published (not draft)
- [ ] Announcement posted (Discord, Twitter, etc.)
- [ ] Documentation website updated (if applicable)
```

---

## Additional Resources

- **Semantic Versioning**: https://semver.org/
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Git Flow**: https://nvie.com/posts/a-successful-git-branching-model/
- **standard-version**: https://github.com/conventional-changelog/standard-version
- **electron-builder**: https://www.electron.build/

---

## Support

If you encounter issues not covered in this guide:

1. Check GitHub Actions logs: https://github.com/antonbelev/claude-owl/actions
2. Review open issues: https://github.com/antonbelev/claude-owl/issues
3. Ask in Discussions: https://github.com/antonbelev/claude-owl/discussions

---

**Last Updated:** 2025-01-17
**Process Version:** 1.0
**Maintainer:** Claude Owl Contributors
