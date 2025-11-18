# macOS Code Signature Issue Investigation

## Problem Statement

Apps built locally via `npm run package:mac` install and run successfully on macOS, but the same version downloaded from GitHub Releases shows the error:

```
"Claude Owl" is damaged and can't be opened. You should eject the disk image.
```

When inspecting the downloaded app with `spctl -a -v`, we get:
```
code has no resources but signature indicates they must be present
```

## Root Cause Analysis

### Why Local Builds Work

When you build locally with `npm run package:mac`, the build output shows:
```
• skipped macOS code signing  reason=identity explicitly is set to null
```

The app is created **without any code signature** (not even an adhoc signature). macOS allows unsigned apps from local builds to run, especially when:
- The app is built on the same machine where it runs
- The user approves it via "Open Anyway" in System Settings
- No Gatekeeper quarantine attribute is applied

### Why GitHub Release Downloads Fail

When the DMG is downloaded from GitHub Releases:

1. **Quarantine Attribute Applied**: macOS automatically adds the `com.apple.quarantine` extended attribute to all files downloaded from the internet
2. **Gatekeeper Enforcement**: With the quarantine flag, macOS Gatekeeper performs strict validation
3. **Signature Mismatch**: The app has an **adhoc signature** (linker-signed) but missing required resources:
   - `Info.plist=not bound`
   - `Sealed Resources=none`
4. **Validation Failure**: This broken signature structure causes macOS to reject the app as "damaged"

### Difference Between CI/CD and Local Builds

**CI/CD Environment (GitHub Actions - macOS runner):**
- Uses `macos-latest` runner
- Different macOS version/configuration than your local machine
- May have different Xcode/SDK versions
- **Key Issue**: Despite `CSC_IDENTITY_AUTO_DISCOVERY=false` and `identity: null`, the build process on GitHub Actions runners may still apply an adhoc signature during the packaging phase
- The DMG creation process on CI may differ from local builds

**Local Environment:**
- Your specific macOS version (24.6.0)
- Your Xcode/SDK setup
- Electron-builder respects `identity: null` completely
- No adhoc signature applied

### Why the Fix Doesn't Work on CI/CD

The current configuration has:
```json
// electron-builder.json
"mac": {
  "identity": null
}
```

```yaml
# .github/workflows/release.yml
env:
  CSC_IDENTITY_AUTO_DISCOVERY: false
```

However, GitHub Actions macOS runners may still apply signatures due to:
1. **Xcode automatic signing**: Xcode command-line tools on GitHub runners may auto-sign binaries
2. **Default macOS behavior**: macOS SDK may add adhoc signatures during linking
3. **Electron packaging quirks**: Electron's packaging on remote builders behaves differently

## Proposed Solutions

### Option 1: Strip Signatures Post-Build (CI/CD Fix)

Add a post-build step in the GitHub Actions workflow to completely remove signatures:

```yaml
- name: Package macOS app
  run: npm run package:mac
  env:
    CSC_IDENTITY_AUTO_DISCOVERY: false

- name: Remove adhoc signatures (allow unsigned distribution)
  run: |
    find release -name "*.app" -type d | while read app; do
      echo "Removing signature from: $app"
      codesign --remove-signature "$app" || true
    done
```

**Pros:**
- Apps will be completely unsigned, matching local builds
- Users can bypass Gatekeeper with right-click → Open

**Cons:**
- Still requires manual user action
- Warning dialogs on first launch

### Option 2: Fix Adhoc Signature (Make it Valid)

Instead of removing signatures, fix the adhoc signature to be valid:

```yaml
- name: Fix adhoc signatures
  run: |
    find release -name "*.app" -type d | while read app; do
      echo "Re-signing with valid adhoc signature: $app"
      codesign --force --deep --sign - "$app"
    done
```

**Pros:**
- Creates a valid adhoc signature
- May pass Gatekeeper validation

**Cons:**
- Still unsigned by Apple Developer ID
- May still trigger warnings

### Option 3: Provide Notarized Builds (Future - Requires $99/year)

The proper long-term solution:

1. Enroll in Apple Developer Program ($99/year)
2. Obtain Developer ID certificate
3. Configure code signing in GitHub Actions with secrets:
   - `APPLE_ID`
   - `APPLE_APP_SPECIFIC_PASSWORD`
   - `CSC_LINK` (certificate)
   - `CSC_KEY_PASSWORD`
4. Enable notarization in electron-builder

**Pros:**
- No user warnings
- Professional distribution
- Auto-updates work seamlessly

**Cons:**
- $99/year cost
- Additional CI/CD complexity

## User Workaround (Current Required Steps)

### ✅ VERIFIED WORKING SOLUTION

**Status**: Tested and confirmed working as of 2025-11-18

After downloading from GitHub Releases, users **must** remove the quarantine flag that macOS applies to downloaded apps:

```bash
# Step 1: Download DMG from GitHub Releases
# Step 2: Mount DMG and drag Claude Owl to Applications folder
# Step 3: Run this command in Terminal:
xattr -r -d com.apple.quarantine "/Applications/Claude Owl.app"

# Step 4: Launch Claude Owl normally
open "/Applications/Claude Owl.app"
```

**Why this works**: macOS applies the `com.apple.quarantine` extended attribute to all apps downloaded from the internet. This attribute triggers Gatekeeper validation, which fails for unsigned apps with adhoc signatures. Removing the quarantine flag bypasses Gatekeeper entirely, allowing the app to launch.

**Verification**:
```bash
# Before fix:
xattr -l "/Applications/Claude Owl.app"
# Shows: com.apple.quarantine: 0381;691c5866;Chrome;...

# After fix:
xattr -l "/Applications/Claude Owl.app"
# Shows: com.apple.provenance: (no quarantine flag)
```

### ❌ Methods That DON'T Work

These approaches were tested and **do not work**:

1. **System Settings → Privacy & Security → "Open Anyway"**: Button never appears for apps with broken signatures
2. **Right-click → Open**: Still shows "damaged" error
3. **Removing quarantine from DMG**: Must be removed from the .app itself after installation
4. **Removing code signature entirely**: `codesign --remove-signature` causes launch failure

## Recommended Action Plan

### Short-term (v0.1.x)
1. Add Option 1 or Option 2 to the CI/CD workflow
2. Update `docs/installation.html` with clear workaround instructions
3. Add warning on download page that manual steps are required
4. Test the fix on CI/CD build and verify it matches local builds

### Medium-term (v0.2.x)
1. Evaluate cost/benefit of Apple Developer Program
2. If approved, implement Option 3 with full code signing + notarization

### Long-term
1. Maintain signed builds for macOS
2. Remove manual workaround instructions once signing is implemented

## Testing Checklist

To verify a fix works:

```bash
# 1. Build locally (baseline)
npm run package:mac
spctl -a -v "release/0.1.5/mac-arm64/Claude Owl.app"
# Expected: rejection but app should open with right-click → Open

# 2. Download from GitHub Release
# Download Claude-Owl-0.1.5-arm64.dmg
hdiutil mount ~/Downloads/Claude-Owl-0.1.5-arm64.dmg
spctl -a -v "/Volumes/Claude Owl 0.1.5-arm64/Claude Owl.app"
# Should match local build behavior

# 3. Check signature
codesign -dvvv "/Volumes/Claude Owl 0.1.5-arm64/Claude Owl.app"
# Local: Should show no signature or valid adhoc
# GitHub: Should match local
```

## References

- [electron-builder Code Signing Docs](https://www.electron.build/code-signing)
- [Apple Gatekeeper Documentation](https://support.apple.com/guide/security/gatekeeper-and-runtime-protection-sec5599b66df/web)
- Related Issues:
  - [electron-builder #7364](https://github.com/electron-userland/electron-builder/issues/7364)
  - [electron-forge #3131](https://github.com/electron/forge/issues/3131)

---

**Last Updated**: 2025-11-18
**Status**: Investigating - User workaround required for GitHub Release downloads
