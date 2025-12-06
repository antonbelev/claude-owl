import { describe, it, expect } from 'vitest';
import { BUILT_IN_TEMPLATES, getTemplateById } from '@/main/services/statusLineTemplates';

describe('StatusLineService - Template Platform Support', () => {
  describe('Template Platform Specifications', () => {
    it('should have minimal template (bash) as Unix-only', () => {
      const template = getTemplateById('minimal');
      expect(template).toBeDefined();
      expect(template?.platforms).toContain('unix');
      expect(template?.platforms).not.toContain('windows'); // Bash scripts don't run on Windows
      expect(template?.script).toContain('#!/bin/bash');
    });

    it('should have developer template (bash) as Unix-only', () => {
      const template = getTemplateById('developer');
      expect(template).toBeDefined();
      expect(template?.platforms).toContain('unix');
      expect(template?.platforms).not.toContain('windows'); // Bash scripts don't run on Windows
      expect(template?.script).toContain('#!/bin/bash');
    });

    it('should have Windows-specific templates', () => {
      const windowsTemplates = BUILT_IN_TEMPLATES.filter(t =>
        t.platforms?.includes('windows')
      );
      expect(windowsTemplates.length).toBeGreaterThan(0);
    });

    it('should have Unix-only templates', () => {
      const unixOnlyTemplates = BUILT_IN_TEMPLATES.filter(t =>
        t.platforms?.includes('unix') &&
        !t.platforms?.includes('windows')
      );
      expect(unixOnlyTemplates.length).toBeGreaterThan(0);
    });

    it('should have cross-platform templates', () => {
      const crossPlatform = BUILT_IN_TEMPLATES.filter(t =>
        t.platforms?.includes('windows') &&
        t.platforms?.includes('unix')
      );
      expect(crossPlatform.length).toBeGreaterThan(0);
    });

    it('should include Windows batch template', () => {
      const windowsBatch = getTemplateById('minimal-windows');
      expect(windowsBatch).toBeDefined();
      expect(windowsBatch?.platforms).toContain('windows');
    });

    it('should include Node.js cross-platform template', () => {
      const crossPlatform = getTemplateById('minimal-cross-platform');
      expect(crossPlatform).toBeDefined();
      expect(crossPlatform?.platforms).toContain('windows');
      expect(crossPlatform?.platforms).toContain('unix');
      expect(crossPlatform?.script).toContain('node');
    });

    it('all templates should have required fields', () => {
      for (const template of BUILT_IN_TEMPLATES) {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.script).toBeDefined();
        expect(template.preview).toBeDefined();
        expect(template.category).toBeDefined();
      }
    });

    it('templates should specify platform support', () => {
      for (const template of BUILT_IN_TEMPLATES) {
        expect(template.platforms).toBeDefined();
        expect(Array.isArray(template.platforms)).toBe(true);
        expect(template.platforms!.length).toBeGreaterThan(0);
      }
    });

    it('full template should be Unix-only (uses jq, git, date)', () => {
      const fullTemplate = getTemplateById('full');
      expect(fullTemplate).toBeDefined();
      expect(fullTemplate?.platforms).toContain('unix');
      expect(fullTemplate?.platforms).not.toContain('windows');
      expect(fullTemplate?.dependencies).toContain('jq');
      expect(fullTemplate?.dependencies).toContain('git');
      expect(fullTemplate?.dependencies).toContain('date');
    });

    it('git-focused template should be Unix-only', () => {
      const gitTemplate = getTemplateById('git-focused');
      expect(gitTemplate).toBeDefined();
      expect(gitTemplate?.platforms).toContain('unix');
      expect(gitTemplate?.platforms).not.toContain('windows');
    });

    it('powerline template should be Unix-only', () => {
      const powerlineTemplate = getTemplateById('powerline');
      expect(powerlineTemplate).toBeDefined();
      expect(powerlineTemplate?.platforms).toContain('unix');
      expect(powerlineTemplate?.platforms).not.toContain('windows');
    });
  });

  describe('Template Script Content', () => {
    it('bash templates should have shebang', () => {
      const minimal = getTemplateById('minimal');
      expect(minimal?.script).toContain('#!/bin/bash');
    });

    it('Windows batch template should have batch syntax', () => {
      const windowsTemplate = getTemplateById('minimal-windows');
      expect(windowsTemplate?.script).toContain('@echo off');
      expect(windowsTemplate?.script).toContain('REM');
    });

    it('Node.js template should have node shebang', () => {
      const nodeTemplate = getTemplateById('minimal-cross-platform');
      expect(nodeTemplate?.script).toContain('#!/usr/bin/env node');
    });

    it('templates should handle JSON input', () => {
      const minimal = getTemplateById('minimal');
      expect(minimal?.script).toContain('input=$(cat)');
      expect(minimal?.script).toContain('jq');
    });

    it('should have colorized output using ANSI codes', () => {
      const minimal = getTemplateById('minimal');
      expect(minimal?.script).toContain('\\033[');
    });
  });

  describe('Template Categories', () => {
    it('should have beginner templates', () => {
      const beginnerTemplates = BUILT_IN_TEMPLATES.filter(
        t => t.category === 'beginner'
      );
      expect(beginnerTemplates.length).toBeGreaterThan(0);
    });

    it('should have intermediate templates', () => {
      const intermediateTemplates = BUILT_IN_TEMPLATES.filter(
        t => t.category === 'intermediate'
      );
      expect(intermediateTemplates.length).toBeGreaterThan(0);
    });

    it('should have advanced templates', () => {
      const advancedTemplates = BUILT_IN_TEMPLATES.filter(
        t => t.category === 'advanced'
      );
      expect(advancedTemplates.length).toBeGreaterThan(0);
    });

    it('should have specialized templates', () => {
      const specializedTemplates = BUILT_IN_TEMPLATES.filter(
        t => t.category === 'specialized'
      );
      expect(specializedTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('Template Dependencies', () => {
    it('should list dependencies for templates that require them', () => {
      const minimal = getTemplateById('minimal');
      expect(minimal?.dependencies).toContain('jq');
    });

    it('Node.js template should list node as dependency', () => {
      const nodeTemplate = getTemplateById('minimal-cross-platform');
      expect(nodeTemplate?.dependencies).toContain('node');
    });

    it('developer template should require git and jq', () => {
      const devTemplate = getTemplateById('developer');
      expect(devTemplate?.dependencies).toContain('git');
      expect(devTemplate?.dependencies).toContain('jq');
    });
  });

  describe('Windows-Specific Templates', () => {
    it('should have Windows batch template', () => {
      const windowsBatch = getTemplateById('minimal-windows');
      expect(windowsBatch).toBeDefined();
      expect(windowsBatch?.platforms).toEqual(['windows']);
      expect(windowsBatch?.script).toContain('@echo off');
    });

    it('should have Windows git template', () => {
      const gitWindows = getTemplateById('git-windows');
      expect(gitWindows).toBeDefined();
      expect(gitWindows?.platforms).toEqual(['windows']);
      expect(gitWindows?.script).toContain('#!/usr/bin/env node');
      expect(gitWindows?.dependencies).toContain('git');
    });

    it('should have cross-platform developer template', () => {
      const devCrossPlatform = getTemplateById('developer-cross-platform');
      expect(devCrossPlatform).toBeDefined();
      expect(devCrossPlatform?.platforms).toContain('windows');
      expect(devCrossPlatform?.platforms).toContain('unix');
      expect(devCrossPlatform?.script).toContain('#!/usr/bin/env node');
    });

    it('should have full metrics cross-platform template', () => {
      const fullCrossPlatform = getTemplateById('full-cross-platform');
      expect(fullCrossPlatform).toBeDefined();
      expect(fullCrossPlatform?.platforms).toContain('windows');
      expect(fullCrossPlatform?.platforms).toContain('unix');
      expect(fullCrossPlatform?.script).toContain('execSync');
    });

    it('Windows templates should use Node.js for complex operations', () => {
      const gitWindows = getTemplateById('git-windows');
      const devCross = getTemplateById('developer-cross-platform');
      const fullCross = getTemplateById('full-cross-platform');

      // All advanced Windows templates should use Node.js
      expect(gitWindows?.script).toContain('#!/usr/bin/env node');
      expect(devCross?.script).toContain('#!/usr/bin/env node');
      expect(fullCross?.script).toContain('#!/usr/bin/env node');
    });

    it('Windows git template should handle git operations', () => {
      const gitWindows = getTemplateById('git-windows');
      expect(gitWindows?.script).toContain('git branch --show-current');
      expect(gitWindows?.script).toContain('git status --porcelain');
      expect(gitWindows?.script).toContain('USERPROFILE');
    });
  });

  describe('Cross-Platform Templates', () => {
    it('should have at least 3 cross-platform templates (Node.js-based)', () => {
      const crossPlatform = BUILT_IN_TEMPLATES.filter(t =>
        t.platforms?.includes('windows') && t.platforms?.includes('unix')
      );
      // We have: minimal-cross-platform, developer-cross-platform, full-cross-platform
      expect(crossPlatform.length).toBeGreaterThanOrEqual(3);
    });

    it('Node.js cross-platform templates should have node shebang', () => {
      const nodeCrossPlatform = BUILT_IN_TEMPLATES.filter(t =>
        t.platforms?.includes('windows') &&
        t.platforms?.includes('unix') &&
        t.dependencies?.includes('node')
      );

      // Should have at least 3 Node.js cross-platform templates
      expect(nodeCrossPlatform.length).toBeGreaterThanOrEqual(3);

      for (const template of nodeCrossPlatform) {
        expect(template.script).toContain('#!/usr/bin/env node');
      }
    });

    it('cross-platform templates should handle Windows paths', () => {
      const minimalCross = getTemplateById('minimal-cross-platform');
      expect(minimalCross?.script).toContain('USERPROFILE');
      expect(minimalCross?.script).toContain('HOME');
    });
  });

  describe('Template Stdin Reading (Temp File Approach)', () => {
    it('Node.js templates should use synchronous stdin reading', () => {
      const nodeTemplates = ['minimal-cross-platform', 'developer-cross-platform', 'git-windows', 'full-cross-platform'];

      for (const templateId of nodeTemplates) {
        const template = getTemplateById(templateId);
        expect(template).toBeDefined();

        // Should use fs.readFileSync(0) instead of process.stdin.on()
        expect(template?.script).toContain('fs.readFileSync(0');
        expect(template?.script).toContain("const fs = require('fs')");

        // Should NOT use async event-based stdin reading
        expect(template?.script).not.toContain('process.stdin.on(');
        expect(template?.script).not.toContain('process.stdin.setEncoding');
      }
    });

    it('Node.js templates should parse JSON synchronously', () => {
      const minimalCross = getTemplateById('minimal-cross-platform');

      // Should read stdin and parse JSON in one go
      expect(minimalCross?.script).toContain('fs.readFileSync(0');
      expect(minimalCross?.script).toContain('JSON.parse(input)');
    });

    it('Node.js templates should have proper error handling', () => {
      const templates = ['minimal-cross-platform', 'developer-cross-platform', 'git-windows', 'full-cross-platform'];

      for (const templateId of templates) {
        const template = getTemplateById(templateId);
        expect(template?.script).toContain('try {');
        expect(template?.script).toContain('} catch (e)');
        expect(template?.script).toContain('console.error');
        expect(template?.script).toContain('process.exit(1)');
      }
    });

    it('minimal-cross-platform should use synchronous stdin pattern', () => {
      const template = getTemplateById('minimal-cross-platform');

      // Verify the exact pattern for temp file stdin reading
      expect(template?.script).toMatch(/const input = fs\.readFileSync\(0,\s*'utf-8'\)/);
      expect(template?.script).toMatch(/const data = JSON\.parse\(input\)/);
    });

    it('developer-cross-platform should use synchronous stdin pattern', () => {
      const template = getTemplateById('developer-cross-platform');

      expect(template?.script).toMatch(/const input = fs\.readFileSync\(0,\s*'utf-8'\)/);
      expect(template?.script).toMatch(/const data = JSON\.parse\(input\)/);
    });

    it('git-windows should use synchronous stdin pattern', () => {
      const template = getTemplateById('git-windows');

      expect(template?.script).toMatch(/const input = fs\.readFileSync\(0,\s*'utf-8'\)/);
      expect(template?.script).toMatch(/const data = JSON\.parse\(input\)/);
    });

    it('full-cross-platform should use synchronous stdin pattern', () => {
      const template = getTemplateById('full-cross-platform');

      expect(template?.script).toMatch(/const input = fs\.readFileSync\(0,\s*'utf-8'\)/);
      expect(template?.script).toMatch(/const data = JSON\.parse\(input\)/);
    });
  });
});
