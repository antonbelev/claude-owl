/**
 * Test fixtures for core services
 */

export const MOCK_JSON_DATA = {
  name: 'Test Skill',
  description: 'A test skill for testing',
  version: '1.0.0',
  tags: ['test', 'demo'],
};

export const MOCK_YAML_FRONTMATTER = `name: Test Skill
description: A test skill for testing
version: 1.0.0`;

export const MOCK_MARKDOWN_CONTENT = `# Test Skill

This is a test skill.

## Usage

Use this skill for testing purposes.`;

export const MOCK_FULL_MARKDOWN = `---
${MOCK_YAML_FRONTMATTER}
---
${MOCK_MARKDOWN_CONTENT}`;

export const MOCK_INVALID_MARKDOWN = `---
invalid frontmatter without closing
${MOCK_MARKDOWN_CONTENT}`;

export const MOCK_VALIDATION_ERRORS = [
  {
    path: 'name',
    message: 'Missing required field: name',
    severity: 'error' as const,
  },
];

export const MOCK_SETTINGS = {
  colorScheme: 'dark',
  fontSize: 14,
  autoSave: true,
  maxRetries: 3,
};
