// Claude Owl Website - Main JavaScript
// Handles OS detection, version fetching, and download links

const GITHUB_REPO = 'antonbelev/claude-owl';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`;

// Supported platforms
const SUPPORTED_PLATFORMS = ['macOS', 'Windows'];

/**
 * Detect user's operating system
 */
function detectOS() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'macOS';
  } else if (platform.includes('win') || userAgent.includes('win')) {
    return 'Windows';
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'Linux';
  }

  return 'Unknown';
}

/**
 * Detect if user is on Apple Silicon Mac
 */
function isMacAppleSilicon() {
  // Check for Apple Silicon indicators
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (renderer.toLowerCase().includes('apple')) {
        return true;
      }
    }
  }

  // Fallback: check navigator.userAgentData (new API)
  if (navigator.userAgentData && navigator.userAgentData.platform) {
    return navigator.userAgentData.platform.toLowerCase().includes('mac');
  }

  // Default to ARM if we can't detect (safer bet for newer Macs)
  return true;
}

/**
 * Fetch latest release from GitHub API
 */
async function fetchLatestRelease() {
  try {
    const response = await fetch(`${GITHUB_API}/releases/latest`);
    if (!response.ok) {
      throw new Error('Failed to fetch release data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching release:', error);
    return null;
  }
}

/**
 * Fetch all releases for total download count
 */
async function fetchAllReleases() {
  try {
    const response = await fetch(`${GITHUB_API}/releases`);
    if (!response.ok) {
      throw new Error('Failed to fetch releases data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all releases:', error);
    return null;
  }
}

/**
 * Fetch repository stats
 */
async function fetchRepoStats() {
  try {
    const response = await fetch(GITHUB_API);
    if (!response.ok) {
      throw new Error('Failed to fetch repo stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

/**
 * Format file size in MB
 */
function formatFileSize(bytes) {
  return `~${Math.round(bytes / 1024 / 1024)} MB`;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Update download section based on detected OS
 */
function updateDownloadSection(os) {
  const macosDownloads = document.getElementById('macos-downloads');
  const windowsDownloads = document.getElementById('windows-downloads');

  // Only update if elements exist (home page only)
  if (!macosDownloads || !windowsDownloads) {
    return;
  }

  // Show appropriate download section based on OS
  if (os === 'macOS') {
    macosDownloads.classList.remove('hidden');
    windowsDownloads.classList.add('hidden');
  } else if (os === 'Windows') {
    macosDownloads.classList.add('hidden');
    windowsDownloads.classList.remove('hidden');
  } else {
    // For unsupported OS, show macOS downloads as default
    macosDownloads.classList.remove('hidden');
    windowsDownloads.classList.add('hidden');
  }
}

/**
 * Update architecture detection message
 */
function updateArchDetection() {
  const detectedArchSpan = document.getElementById('detected-arch');
  if (detectedArchSpan) {
    const isAppleSilicon = isMacAppleSilicon();
    if (isAppleSilicon) {
      detectedArchSpan.textContent = '✓ Detected: Apple Silicon (M1/M2/M3)';
      detectedArchSpan.classList.add('text-green-400');
    } else {
      detectedArchSpan.textContent = '✓ Detected: Intel Mac';
      detectedArchSpan.classList.add('text-blue-400');
    }
  }
}

/**
 * Update version displays and download links
 */
async function updateVersionInfo() {
  const release = await fetchLatestRelease();

  if (!release) {
    console.warn('Could not fetch release data, using defaults');
    return;
  }

  const version = release.tag_name || 'v0.1.0';
  const versionWithoutV = version.replace('v', '');

  // Update version badges (present on all pages)
  const versionBadge = document.getElementById('version-badge');
  const versionDisplay = document.getElementById('version-display');
  const latestVersion = document.getElementById('latest-version');

  if (versionBadge) versionBadge.textContent = version;
  if (versionDisplay) versionDisplay.textContent = version;
  if (latestVersion) latestVersion.textContent = version;

  // Find download assets
  const assets = release.assets || [];
  const arm64Asset = assets.find(a => a.name.includes('arm64.dmg'));
  const x64Asset = assets.find(a => a.name.includes('x64.dmg'));
  const windowsAsset = assets.find(a => a.name.includes('Setup') && a.name.endsWith('.exe'));

  // Update file size (home page only)
  const fileSizeEl = document.getElementById('file-size');
  if (fileSizeEl && arm64Asset) {
    fileSizeEl.textContent = formatFileSize(arm64Asset.size);
  }

  // Update download links (home page only)
  const downloadArm64 = document.getElementById('download-arm64');
  const downloadX64 = document.getElementById('download-x64');

  if (downloadArm64 && arm64Asset) {
    downloadArm64.href = arm64Asset.browser_download_url;
    downloadArm64.onclick = () => trackDownload('macOS', 'arm64', version);
  } else if (downloadArm64) {
    // Fallback to constructed URL
    downloadArm64.href = `https://github.com/${GITHUB_REPO}/releases/download/${version}/Claude-Owl-${versionWithoutV}-arm64.dmg`;
  }

  if (downloadX64 && x64Asset) {
    downloadX64.href = x64Asset.browser_download_url;
    downloadX64.onclick = () => trackDownload('macOS', 'x64', version);
  } else if (downloadX64) {
    // Fallback to constructed URL
    downloadX64.href = `https://github.com/${GITHUB_REPO}/releases/download/${version}/Claude-Owl-${versionWithoutV}-x64.dmg`;
  }

  // Update Windows download link
  const downloadWindows = document.getElementById('download-windows');
  if (downloadWindows && windowsAsset) {
    downloadWindows.href = windowsAsset.browser_download_url;
    downloadWindows.onclick = () => trackDownload('Windows', 'x64', version);
  } else if (downloadWindows) {
    // Fallback to constructed URL
    downloadWindows.href = `https://github.com/${GITHUB_REPO}/releases/download/${version}/Claude-Owl-Setup-${versionWithoutV}.exe`;
  }

  // Calculate total downloads across all releases
  await updateTotalDownloads();
}

/**
 * Calculate and update total downloads across all releases
 */
async function updateTotalDownloads() {
  const releases = await fetchAllReleases();

  if (!releases || !Array.isArray(releases)) {
    console.warn('Could not fetch all releases for download count');
    return;
  }

  // Sum up all download counts from all releases
  let totalDownloads = 0;
  releases.forEach(release => {
    const assets = release.assets || [];
    assets.forEach(asset => {
      totalDownloads += asset.download_count || 0;
    });
  });

  const downloadsEl = document.getElementById('downloads');
  if (downloadsEl) {
    downloadsEl.textContent = formatNumber(totalDownloads);
  }

  console.log(`Total downloads across ${releases.length} releases: ${totalDownloads}`);
}

/**
 * Update GitHub stats
 */
async function updateGitHubStats() {
  const repo = await fetchRepoStats();

  if (!repo) {
    console.warn('Could not fetch repo stats');
    return;
  }

  const starsEl = document.getElementById('github-stars');
  if (starsEl) {
    starsEl.textContent = formatNumber(repo.stargazers_count || 0);
  }
}

/**
 * Track download (for analytics)
 */
function trackDownload(platform, arch, version) {
  console.log(`Download tracked: ${platform} ${arch} ${version}`);
  // Future: Send to analytics service
  // Example: gtag('event', 'download', { platform, arch, version });
}

/**
 * Mobile menu toggle
 */
function setupMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const nav = document.querySelector('nav');

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      // Mobile menu implementation
      alert('Mobile menu coming soon!');
    });
  }
}

/**
 * Setup platform tabs on installation page
 */
function setupPlatformTabs() {
  const tabs = document.querySelectorAll('.platform-tab');
  const macosSection = document.getElementById('macos-section');
  const windowsSection = document.getElementById('windows-section');

  if (!tabs.length || !macosSection || !windowsSection) {
    return; // Not on installation page
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const platform = tab.dataset.platform;

      // Update active tab styling
      tabs.forEach(t => {
        t.classList.remove('active', 'bg-blue-600');
        t.classList.add('bg-slate-700');
      });
      tab.classList.add('active', 'bg-blue-600');
      tab.classList.remove('bg-slate-700');

      // Show/hide sections
      if (platform === 'macos') {
        macosSection.classList.remove('hidden');
        windowsSection.classList.add('hidden');
      } else if (platform === 'windows') {
        macosSection.classList.add('hidden');
        windowsSection.classList.remove('hidden');
      }
    });
  });
}

/**
 * Initialize the page
 */
async function init() {
  console.log('🦉 Claude Owl website initialized');

  // Detect OS and update UI
  const detectedOS = detectOS();
  console.log(`Detected OS: ${detectedOS}`);
  updateDownloadSection(detectedOS);

  // Update architecture detection (only for macOS)
  if (detectedOS === 'macOS') {
    updateArchDetection();
  }

  // Fetch and update version info
  await updateVersionInfo();

  // Fetch and update GitHub stats
  await updateGitHubStats();

  // Setup mobile menu
  setupMobileMenu();

  // Setup platform tabs (installation page only)
  setupPlatformTabs();

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && document.querySelector(href)) {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
