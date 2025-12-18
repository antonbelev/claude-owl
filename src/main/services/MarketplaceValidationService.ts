/**
 * Service for validating plugin marketplace repositories
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MarketplaceValidationResult {
  valid: boolean;
  url: string;
  hasManifest: boolean;
  manifestPath?: string;
  marketplaceName?: string; // Name from manifest.json
  pluginCount?: number; // Number of plugins in manifest
  error?: string;
  suggestions?: string[];
}

export interface MarketplaceManifest {
  name: string;
  owner: {
    name: string;
    email: string;
  };
  plugins: Array<{
    name: string;
    source: string | object;
    description?: string;
    version?: string;
  }>;
  metadata?: {
    description?: string;
    version?: string;
    website?: string;
    pluginRoot?: string;
  };
}

export class MarketplaceValidationService {
  private static readonly MANIFEST_PATH = '.claude-plugin/marketplace.json';
  private static readonly GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

  /**
   * Validate a marketplace repository URL
   */
  async validateMarketplace(url: string): Promise<MarketplaceValidationResult> {
    console.log('[MarketplaceValidation] Validating marketplace:', url);

    try {
      // Normalize the URL
      const normalizedUrl = this.normalizeGitHubUrl(url);
      if (!normalizedUrl) {
        return {
          valid: false,
          url,
          hasManifest: false,
          error: 'Invalid repository URL. Must be a GitHub repository URL.',
          suggestions: [
            'Use format: https://github.com/owner/repo',
            'Example: https://github.com/anthropics/claude-code',
          ],
        };
      }

      // Check if manifest exists
      const manifestUrl = this.getManifestUrl(normalizedUrl);
      console.log('[MarketplaceValidation] Checking manifest at:', manifestUrl);

      const manifestCheck = await this.checkManifestExists(manifestUrl);

      if (!manifestCheck.exists) {
        return {
          valid: false,
          url: normalizedUrl,
          hasManifest: false,
          error: 'Repository does not contain a .claude-plugin/marketplace.json file',
          suggestions: [
            'The repository must have a .claude-plugin/marketplace.json file in the root',
            'See documentation: https://code.claude.com/docs/en/plugin-marketplaces',
            'For official Anthropic plugins, use the pre-configured "Anthropic Official" marketplace',
          ],
        };
      }

      // Validate manifest structure
      const manifestValidation = await this.validateManifestStructure(manifestCheck.content!);

      if (!manifestValidation.valid) {
        const result: MarketplaceValidationResult = {
          valid: false,
          url: normalizedUrl,
          hasManifest: true,
          manifestPath: MarketplaceValidationService.MANIFEST_PATH,
        };
        if (manifestValidation.error) {
          result.error = manifestValidation.error;
        }
        if (manifestValidation.suggestions) {
          result.suggestions = manifestValidation.suggestions;
        }
        return result;
      }

      // Parse manifest to get name and plugin count
      const manifest: MarketplaceManifest = JSON.parse(manifestCheck.content!);

      return {
        valid: true,
        url: normalizedUrl,
        hasManifest: true,
        manifestPath: MarketplaceValidationService.MANIFEST_PATH,
        marketplaceName: manifest.name,
        pluginCount: manifest.plugins?.length || 0,
      };
    } catch (error) {
      console.error('[MarketplaceValidation] Validation failed:', error);
      return {
        valid: false,
        url,
        hasManifest: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Normalize GitHub URL to standard format
   */
  private normalizeGitHubUrl(url: string): string | null {
    try {
      // Remove trailing slashes and .git
      const normalized = url
        .trim()
        .replace(/\/+$/, '')
        .replace(/\.git$/, '');

      // Handle github.com URLs
      const githubMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+\/[^/]+)/);
      if (githubMatch) {
        return `https://github.com/${githubMatch[1]}`;
      }

      return null;
    } catch (error) {
      console.error('[MarketplaceValidation] URL normalization failed:', error);
      return null;
    }
  }

  /**
   * Get the raw GitHub URL for the marketplace manifest
   */
  private getManifestUrl(repoUrl: string): string {
    const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL');
    }

    const repoPath = match[1];
    return `${MarketplaceValidationService.GITHUB_RAW_BASE}/${repoPath}/main/${MarketplaceValidationService.MANIFEST_PATH}`;
  }

  /**
   * Check if manifest exists at the URL
   */
  private async checkManifestExists(
    manifestUrl: string
  ): Promise<{ exists: boolean; content?: string }> {
    try {
      // Use curl to check if file exists (more reliable than fetch for CLI context)
      const command = `curl -f -s "${manifestUrl}"`;
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stdout) {
        console.log('[MarketplaceValidation] Manifest not found (curl failed)');
        return { exists: false };
      }

      if (!stdout || stdout.trim().length === 0) {
        console.log('[MarketplaceValidation] Manifest not found (empty response)');
        return { exists: false };
      }

      console.log('[MarketplaceValidation] Manifest found, length:', stdout.length);
      return { exists: true, content: stdout };
    } catch (error) {
      console.log('[MarketplaceValidation] Manifest check failed:', error);
      return { exists: false };
    }
  }

  /**
   * Validate the structure of the marketplace manifest
   */
  private async validateManifestStructure(
    content: string
  ): Promise<{ valid: boolean; error?: string; suggestions?: string[] }> {
    try {
      const manifest: MarketplaceManifest = JSON.parse(content);

      // Required fields
      if (!manifest.name) {
        return {
          valid: false,
          error: 'Manifest missing required field: name',
          suggestions: ['Add a "name" field with a kebab-case identifier'],
        };
      }

      if (!manifest.owner || !manifest.owner.name || !manifest.owner.email) {
        return {
          valid: false,
          error: 'Manifest missing required field: owner (with name and email)',
          suggestions: ['Add an "owner" object with "name" and "email" fields'],
        };
      }

      if (!manifest.plugins || !Array.isArray(manifest.plugins)) {
        return {
          valid: false,
          error: 'Manifest missing required field: plugins (must be an array)',
          suggestions: ['Add a "plugins" array with plugin definitions'],
        };
      }

      if (manifest.plugins.length === 0) {
        return {
          valid: false,
          error: 'Manifest has no plugins',
          suggestions: ['Add at least one plugin to the "plugins" array'],
        };
      }

      // Validate each plugin
      for (let i = 0; i < manifest.plugins.length; i++) {
        const plugin = manifest.plugins[i];
        if (!plugin) {
          return {
            valid: false,
            error: `Plugin at index ${i} is invalid`,
            suggestions: ['Each plugin must be a valid object'],
          };
        }
        if (!plugin.name) {
          return {
            valid: false,
            error: `Plugin at index ${i} missing required field: name`,
            suggestions: ['Each plugin must have a "name" field'],
          };
        }
        if (!plugin.source) {
          return {
            valid: false,
            error: `Plugin "${plugin.name}" missing required field: source`,
            suggestions: ['Each plugin must have a "source" field (string or object)'],
          };
        }
      }

      console.log('[MarketplaceValidation] Manifest structure is valid');
      return { valid: true };
    } catch (error) {
      console.error('[MarketplaceValidation] Manifest parsing failed:', error);
      return {
        valid: false,
        error: 'Invalid JSON in marketplace.json',
        suggestions: ['Ensure the marketplace.json file contains valid JSON'],
      };
    }
  }
}
