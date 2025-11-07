/**
 * Markdown parsing and validation utilities
 */

export interface ParsedMarkdown<T = Record<string, unknown>> {
  frontmatter: T;
  content: string;
  isValid: boolean;
  errors: string[];
}

/**
 * Parse markdown file with YAML frontmatter
 */
export function parseMarkdownWithFrontmatter<T = Record<string, unknown>>(
  markdown: string
): ParsedMarkdown<T> {
  const errors: string[] = [];
  let frontmatter: T = {} as T;
  let content = '';
  let isValid = true;

  // Check if markdown starts with frontmatter delimiter
  if (!markdown.trim().startsWith('---')) {
    errors.push('File must start with YAML frontmatter (---)');
    isValid = false;
    return { frontmatter, content: markdown, isValid, errors };
  }

  // Extract frontmatter and content
  const parts = markdown.split('---');

  if (parts.length < 3) {
    errors.push('Invalid frontmatter structure. Expected format:\n---\nkey: value\n---\ncontent');
    isValid = false;
    return { frontmatter, content: markdown, isValid, errors };
  }

  const frontmatterText = (parts[1] || '').trim();
  content = parts.slice(2).join('---').trim();

  // Parse YAML frontmatter
  try {
    frontmatter = parseSimpleYAML<T>(frontmatterText);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Failed to parse frontmatter: ${message}`);
    isValid = false;
  }

  return { frontmatter, content, isValid, errors };
}

/**
 * Simple YAML parser for frontmatter
 * Handles basic key-value pairs and arrays
 */
function parseSimpleYAML<T>(yaml: string): T {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let currentKey: string | null = null;
  let currentArray: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue; // Skip empty lines and comments
    }

    // Array item
    if (trimmed.startsWith('-')) {
      const value = trimmed.substring(1).trim();
      currentArray.push(value);
      continue;
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      // Save previous array if exists
      if (currentKey && currentArray.length > 0) {
        result[currentKey] = currentArray;
        currentArray = [];
      }

      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      currentKey = key;

      if (value) {
        // Single value
        result[key] = parseValue(value);
        currentKey = null;
      }
      // else: key with array values on next lines
    }
  }

  // Save last array if exists
  if (currentKey && currentArray.length > 0) {
    result[currentKey] = currentArray;
  }

  return result as T;
}

/**
 * Parse a YAML value (string, number, boolean)
 */
function parseValue(value: string): string | number | boolean {
  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  // String
  return value;
}

/**
 * Validate skill markdown structure
 */
export interface SkillValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSkillMarkdown(markdown: string): SkillValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = parseMarkdownWithFrontmatter<{
    name?: string;
    description?: string;
    'allowed-tools'?: string[];
  }>(markdown);

  // Check parsing errors
  if (!parsed.isValid) {
    errors.push(...parsed.errors);
  }

  // Validate required fields
  if (!parsed.frontmatter.name) {
    errors.push('Frontmatter missing required field: name');
  } else {
    // Validate name format
    const namePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!namePattern.test(parsed.frontmatter.name)) {
      errors.push('Skill name must be lowercase with hyphens (e.g., my-skill-name)');
    }
    if (parsed.frontmatter.name.length > 64) {
      errors.push('Skill name must be 64 characters or less');
    }
  }

  if (!parsed.frontmatter.description) {
    errors.push('Frontmatter missing required field: description');
  } else if (parsed.frontmatter.description.length > 1024) {
    errors.push('Description must be 1024 characters or less');
  }

  // Validate optional fields
  if (parsed.frontmatter['allowed-tools']) {
    if (!Array.isArray(parsed.frontmatter['allowed-tools'])) {
      errors.push('allowed-tools must be an array');
    } else if (parsed.frontmatter['allowed-tools'].length === 0) {
      warnings.push('allowed-tools is empty - skill will have access to all tools');
    }
  }

  // Validate content
  if (!parsed.content || parsed.content.trim().length === 0) {
    warnings.push('Skill content is empty - consider adding detailed instructions');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert skill data to markdown format
 */
export function skillToMarkdown(
  name: string,
  description: string,
  content: string,
  allowedTools?: string[]
): string {
  let markdown = '---\n';
  markdown += `name: ${name}\n`;
  markdown += `description: ${description}\n`;

  if (allowedTools && allowedTools.length > 0) {
    markdown += 'allowed-tools:\n';
    allowedTools.forEach(tool => {
      markdown += `  - ${tool}\n`;
    });
  }

  markdown += '---\n\n';
  markdown += content;

  return markdown;
}
