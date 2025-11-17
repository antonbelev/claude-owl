# Quick Release Guide

Quick reference for publishing Claude Owl releases.

## First Time Release (v0.1.0)

### Prerequisites: Create Main Branch

First, create your `main` branch from the latest work:

```bash
# Merge your current PR or create main from your feature branch
git checkout -b main
git push -u origin main

# Set main as default branch in GitHub Settings → Branches
```

### Release with Automation

**Option A: Simple (No GitFlow Yet)**

Use the automated first-release script:

```bash
git checkout main
git pull origin main
./scripts/first-release.sh
```

**Option B: Set Up GitFlow First (Recommended)**

```bash
# 1. Create develop branch from main
git checkout main
git checkout -b develop
git push -u origin develop

# 2. Set develop as default branch in GitHub Settings

# 3. Use regular release workflow
git checkout develop
./scripts/prepare-release.sh minor  # Creates release branch
./scripts/finalize-release.sh       # Merges to main, creates tag
```

**Why use scripts?** They guarantee git tag and package.json version are always in sync!

## What Happens Next

After pushing the tag:

1. **GitHub Actions** automatically runs (15-20 min):
   - ✅ Quality checks (lint, typecheck, tests)
   - ✅ Builds macOS `.dmg` (Intel + Apple Silicon)
   - ✅ Builds Windows `.exe`
   - ✅ Builds Linux `.AppImage`
   - ✅ Creates **Draft Release** with all artifacts

2. **Review & Publish**:
   - Go to: https://github.com/antonbelev/claude-owl/releases
   - Find the v0.1.0 draft
   - Review release notes
   - Test download links
   - Click **Publish release**

3. **GitHub Pages** auto-updates:
   - Download buttons fetch latest release from GitHub API
   - Users can download immediately

## Subsequent Releases

For v0.2.0 and later, use the automated scripts:

### Patch Release (v0.1.0 → v0.1.1)

```bash
./scripts/prepare-release.sh patch
# Review CHANGELOG.md
./scripts/finalize-release.sh
```

### Minor Release (v0.1.0 → v0.2.0)

```bash
./scripts/prepare-release.sh minor
# Review CHANGELOG.md
./scripts/finalize-release.sh
```

### Major Release (v0.1.0 → v1.0.0)

```bash
./scripts/prepare-release.sh major
# Review CHANGELOG.md
./scripts/finalize-release.sh
```

## Monitoring the Build

- **GitHub Actions**: https://github.com/antonbelev/claude-owl/actions
- **Releases**: https://github.com/antonbelev/claude-owl/releases

## Troubleshooting

### Tag Already Exists

```bash
# Delete local tag
git tag -d v0.1.0

# Delete remote tag
git push origin :refs/tags/v0.1.0

# Recreate and push
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

### Build Failed

Check the Actions tab for error logs. Common issues:
- Linting errors → Run `npm run lint:fix`
- Test failures → Run `npm run test:unit`
- Type errors → Run `npm run typecheck`

### Push Failed (Network)

The finalize script has retry logic, but you can manually retry:

```bash
git push origin main
git push origin v0.1.0
```

## Full Documentation

For the complete release process, branching strategy, and conventional commits:

- **Detailed Process**: `project-docs/RELEASE_PROCESS.md`
- **CI/CD Architecture**: `project-docs/adr/adr-006-cicd-release-automation.md`
- **GitHub Workflow**: `.github/workflows/release.yml`

## Quick Checklist

Before releasing:
- [ ] All tests pass (`npm run test:unit`)
- [ ] No linting errors (`npm run lint`)
- [ ] No type errors (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] All PRs merged to main

After releasing:
- [ ] Monitor GitHub Actions build
- [ ] Review draft release
- [ ] Test download links
- [ ] Publish release
- [ ] Verify GitHub Pages downloads work
- [ ] Announce release (Discord, Twitter, etc.)
