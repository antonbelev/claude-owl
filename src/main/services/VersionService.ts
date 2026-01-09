import https from 'https';
import type { VersionInfo } from '@/shared/types';

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
}

export class VersionService {
  private readonly REPO_OWNER = 'antonbelev';
  private readonly REPO_NAME = 'claude-owl';
  private readonly GITHUB_API_URL = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/releases/latest`;

  /**
   * Check if the current version is outdated compared to the latest GitHub release
   * @param currentVersion - Current version of the app (e.g., "0.5.1")
   * @returns Version information including whether update is available
   */
  async checkVersion(currentVersion: string): Promise<VersionInfo> {
    console.log('[VersionService] Checking for updates:', {
      currentVersion,
      apiUrl: this.GITHUB_API_URL,
    });

    try {
      const latestRelease = await this.fetchLatestRelease();

      console.log('[VersionService] Latest release fetched:', {
        version: latestRelease.tag_name,
        publishedAt: latestRelease.published_at,
      });

      // Remove 'v' prefix if present (e.g., "v0.5.1" -> "0.5.1")
      const latestVersion = latestRelease.tag_name.replace(/^v/, '');
      const current = currentVersion.replace(/^v/, '');

      const isOutdated = this.compareVersions(current, latestVersion) < 0;

      console.log('[VersionService] Version comparison:', {
        currentVersion: current,
        latestVersion,
        isOutdated,
      });

      return {
        currentVersion: current,
        latestVersion,
        isOutdated,
        releaseUrl: latestRelease.html_url,
        releaseNotes: latestRelease.body,
        publishedAt: latestRelease.published_at,
      };
    } catch (error) {
      console.error('[VersionService] Failed to check version:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Fetch the latest release from GitHub API
   */
  private async fetchLatestRelease(): Promise<GitHubRelease> {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Claude-Owl-App',
          Accept: 'application/vnd.github.v3+json',
        },
      };

      console.log('[VersionService] Fetching latest release from GitHub API...');

      https
        .get(this.GITHUB_API_URL, options, res => {
          let data = '';

          res.on('data', chunk => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const release = JSON.parse(data) as GitHubRelease;

                // Filter out pre-releases and drafts
                if (release.prerelease || release.draft) {
                  console.warn('[VersionService] Latest release is a pre-release or draft');
                  reject(new Error('Latest release is a pre-release or draft'));
                  return;
                }

                console.log('[VersionService] Successfully parsed release data');
                resolve(release);
              } catch (error) {
                console.error('[VersionService] Failed to parse GitHub API response:', error);
                reject(new Error('Failed to parse GitHub API response'));
              }
            } else {
              console.error('[VersionService] GitHub API request failed:', {
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
              });
              reject(
                new Error(`GitHub API request failed: ${res.statusCode} ${res.statusMessage}`)
              );
            }
          });
        })
        .on('error', error => {
          console.error('[VersionService] Network error fetching release:', error);
          reject(error);
        });
    });
  }

  /**
   * Compare two semantic version strings
   * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }

    return 0;
  }
}
