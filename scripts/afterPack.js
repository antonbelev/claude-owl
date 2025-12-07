/**
 * electron-builder afterPack hook to embed icon into Windows executables.
 *
 * This runs AFTER the app is packaged but BEFORE the installer is built,
 * which is the correct timing to embed icons so they appear in the installer.
 *
 * This is needed because we disable signAndEditExecutable to avoid
 * symbolic link privilege errors when extracting winCodeSign cache.
 */

const rcedit = require('rcedit');
const path = require('path');
const fs = require('fs');

module.exports = async function afterPack(context) {
  // Only run for Windows builds
  if (context.electronPlatformName !== 'win32') {
    return;
  }

  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productName}.exe`);
  const iconPath = path.join(context.packager.projectDir, 'assets', 'icon.ico');

  if (!fs.existsSync(exePath)) {
    console.log(`[afterPack] Executable not found: ${exePath}`);
    return;
  }

  if (!fs.existsSync(iconPath)) {
    console.error(`[afterPack] Icon not found: ${iconPath}`);
    return;
  }

  console.log(`[afterPack] Embedding icon into: ${exePath}`);

  try {
    await rcedit(exePath, {
      icon: iconPath,
      'version-string': {
        ProductName: context.packager.appInfo.productName,
        FileDescription: context.packager.appInfo.productName,
        CompanyName: 'Claude Owl Contributors',
        LegalCopyright: 'MIT License',
      },
      'file-version': context.packager.appInfo.version,
      'product-version': context.packager.appInfo.version,
    });
    console.log(`[afterPack] ✓ Icon embedded successfully`);
  } catch (error) {
    console.error(`[afterPack] ✗ Failed to embed icon:`, error);
    throw error;
  }
};
