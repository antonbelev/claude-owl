# 🚀 Release Process

This document describes how to create releases for Claude Owl.

---

## Prerequisites

### One-Time Setup

1. **Install GitHub CLI** (if not already installed):
   ```bash
   brew install gh
   gh auth login
   ```

2. **Verify build works locally**:
   ```bash
   npm run build
   npm run package:mac
   ```

---

## Release Workflow

### Step 1: Prepare for Release

1. **Update version in package.json**:
   ```bash
   npm version patch  # 0.1.0 -> 0.1.1
   # or
   npm version minor  # 0.1.0 -> 0.2.0
   # or
   npm version major  # 0.1.0 -> 1.0.0
   # or manually edit package.json
   ```

2. **Update CHANGELOG.md** (if it exists):
   ```markdown
   ## [0.1.0] - 2025-01-10
   ### Added
   - Initial beta release
   - Skills management UI
   - Agents configuration
   ```

3. **Commit changes**:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to 0.1.0"
   git push origin main
   ```

### Step 2: Build Release Artifacts

```bash
# Clean previous builds
npm run clean

# Build the application
npm run build

# Package for macOS
npm run package:mac
```

**Verify the build:**
```bash
ls -lh release/0.1.0/
# Should show:
# - Claude Owl-0.1.0-arm64.dmg (~95MB)
# - Claude Owl-0.1.0.dmg (~101MB)
```

**Test the DMG** (Important!):
```bash
open "release/0.1.0/Claude Owl-0.1.0-arm64.dmg"
# Install and verify the app launches correctly
```

### Step 3: Create GitHub Release

#### Option A: GitHub CLI (Recommended)

```bash
# Create release with notes
gh release create v0.1.0-beta.1 \
  "release/0.1.0/Claude Owl-0.1.0-arm64.dmg" \
  "release/0.1.0/Claude Owl-0.1.0.dmg" \
  --title "🦉 Claude Owl v0.1.0 Beta 1" \
  --notes "First beta release for macOS. See README for installation instructions." \
  --prerelease
```

**With release notes file:**
```bash
gh release create v0.1.0-beta.1 \
  "release/0.1.0/Claude Owl-0.1.0-arm64.dmg" \
  "release/0.1.0/Claude Owl-0.1.0.dmg" \
  --title "🦉 Claude Owl v0.1.0 Beta 1" \
  --notes-file RELEASE_NOTES.md \
  --prerelease
```

#### Option B: GitHub UI

1. Go to: https://github.com/antonbelev/claude-owl/releases
2. Click "Create a new release"
3. Fill in:
   - **Tag:** `v0.1.0-beta.1` (creates new tag)
   - **Title:** `🦉 Claude Owl v0.1.0 Beta 1`
   - **Description:** See release notes template below
4. Upload both DMG files
5. Check "Set as a pre-release" (for beta)
6. Click "Publish release"

#### Option C: Automated CI/CD

Just push a tag - CI handles everything:
```bash
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
```

GitHub Actions will:
- Build the app
- Create DMG files
- Upload to GitHub Releases (as draft)
- You review and publish

---

## Release Notes Template

```markdown
## 🎉 Claude Owl v{VERSION} Beta

Visual UI for managing Claude Code configurations.

### 📦 Installation (macOS only)

**Apple Silicon (M1/M2/M3 Macs):**
Download `Claude Owl-{VERSION}-arm64.dmg`

**Intel Macs:**
Download `Claude Owl-{VERSION}.dmg`

**First Time Setup:**
1. Open the downloaded DMG file
2. Drag "Claude Owl" to your Applications folder
3. Right-click the app → "Open" (bypasses unsigned app warning)
4. Click "Open" in the dialog

### ✨ What's New

- [List new features]
- [List improvements]
- [List bug fixes]

### ⚠️ Known Issues

- Unsigned app warning (expected for beta)
- macOS only (Windows/Linux coming soon)
- [Add specific known issues]

### 🐛 Report Issues

Found a bug? [Open an issue](https://github.com/antonbelev/claude-owl/issues/new)

### 📚 Documentation

- [README](https://github.com/antonbelev/claude-owl#readme)
- [Contributing Guide](https://github.com/antonbelev/claude-owl/blob/main/CONTRIBUTING.md)
```

---

## Version Naming Convention

### Beta Releases
- `v0.1.0-beta.1` - First beta
- `v0.1.0-beta.2` - Second beta (bug fixes)
- `v0.1.0-beta.3` - Third beta

### Release Candidates
- `v0.1.0-rc.1` - First release candidate
- `v0.1.0-rc.2` - Second release candidate

### Stable Releases
- `v0.1.0` - First stable release
- `v0.2.0` - Minor version (new features)
- `v1.0.0` - Major version (breaking changes)

---

## Release Checklist

### Pre-Release
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run `npm run build` successfully
- [ ] Run `npm run package:mac` successfully
- [ ] Test DMG installation on clean macOS
- [ ] Verify app launches and core features work
- [ ] Run `npm run lint` (no errors)
- [ ] Run `npm run typecheck` (no errors)
- [ ] Run `npm test` (all tests pass)

### Release
- [ ] Create git tag
- [ ] Push tag to GitHub
- [ ] Upload DMG files to GitHub Release
- [ ] Write clear release notes
- [ ] Mark as pre-release (if beta)
- [ ] Publish release

### Post-Release
- [ ] Test download links work
- [ ] Share release with beta testers
- [ ] Monitor issue tracker for bugs
- [ ] Update project README if needed
- [ ] Announce on social media (if applicable)

---

## Troubleshooting

### Build Fails

```bash
# Clean everything and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
npm run package:mac
```

### DMG Creation Fails

**Error: "No identity found"**
- This is expected for unsigned builds
- Add to `electron-builder.json`: `"identity": null`

**Error: "Cannot create dmg"**
- Ensure you're on macOS (DMG requires macOS to build)
- Check electron-builder logs in `release/0.1.0/builder-debug.yml`

### GitHub CLI Issues

**Error: "gh: command not found"**
```bash
brew install gh
gh auth login
```

**Error: "HTTP 404: Not Found"**
```bash
# Verify repository exists and you have access
gh repo view antonbelev/claude-owl
```

### CI/CD Issues

**Build fails in GitHub Actions:**
- Check logs: https://github.com/antonbelev/claude-owl/actions
- Common issue: Node version mismatch
- Ensure `package-lock.json` is committed

---

## Future Enhancements

### Code Signing (When Ready)

1. **Get Apple Developer Certificate** ($99/year)
2. **Update electron-builder.json**:
   ```json
   {
     "mac": {
       "identity": "Developer ID Application: Your Name (TEAMID)",
       "hardenedRuntime": true,
       "gatekeeperAssess": false,
       "entitlements": "build/entitlements.mac.plist",
       "entitlementsInherit": "build/entitlements.mac.plist"
     }
   }
   ```

3. **Add entitlements file**: `build/entitlements.mac.plist`

### Auto-Updates

1. **Install electron-updater**:
   ```bash
   npm install electron-updater
   ```

2. **Add to main process**:
   ```typescript
   import { autoUpdater } from 'electron-updater';

   autoUpdater.checkForUpdatesAndNotify();
   ```

3. **Update electron-builder.json**:
   ```json
   {
     "publish": {
       "provider": "github",
       "owner": "antonbelev",
       "repo": "claude-owl"
     }
   }
   ```

### Multi-Platform Builds

When ready for Windows/Linux:

```yaml
# .github/workflows/release.yml
strategy:
  matrix:
    os: [macos-latest, ubuntu-latest, windows-latest]
```

---

## Resources

- [Electron Builder Docs](https://www.electron.build/)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

---

## Questions?

- Open an issue: https://github.com/antonbelev/claude-owl/issues
- Check discussions: https://github.com/antonbelev/claude-owl/discussions
