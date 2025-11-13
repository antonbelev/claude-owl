import { CommandFrontmatter } from '../types/command.types';

/**
 * Generate markdown content from command configuration
 */
export function generateCommandMarkdown(frontmatter: CommandFrontmatter, content: string): string {
  const frontmatterLines: string[] = ['---'];

  // Add frontmatter fields in order
  if (frontmatter.description) {
    frontmatterLines.push(`description: ${quoteYamlValue(frontmatter.description)}`);
  }

  if (frontmatter['argument-hint']) {
    frontmatterLines.push(`argument-hint: ${quoteYamlValue(frontmatter['argument-hint'])}`);
  }

  if (frontmatter['allowed-tools'] && frontmatter['allowed-tools'].length > 0) {
    frontmatterLines.push('allowed-tools:');
    frontmatter['allowed-tools'].forEach(tool => {
      frontmatterLines.push(`  - ${tool}`);
    });
  }

  if (frontmatter.model) {
    frontmatterLines.push(`model: ${frontmatter.model}`);
  }

  if (frontmatter['disable-model-invocation']) {
    frontmatterLines.push(`disable-model-invocation: ${frontmatter['disable-model-invocation']}`);
  }

  frontmatterLines.push('---');
  frontmatterLines.push('');

  return frontmatterLines.join('\n') + content;
}

/**
 * Parse markdown to extract frontmatter and content
 */
export function parseCommandMarkdown(markdown: string): {
  frontmatter: CommandFrontmatter;
  content: string;
  isValid: boolean;
  error?: string;
} {
  const trimmed = markdown.trim();

  // Check if starts with ---
  if (!trimmed.startsWith('---')) {
    return {
      frontmatter: {},
      content: markdown,
      isValid: false,
      error: 'Markdown must start with --- (frontmatter delimiter)',
    };
  }

  // Find closing ---
  const firstNewline = trimmed.indexOf('\n');
  if (firstNewline === -1) {
    return {
      frontmatter: {},
      content: markdown,
      isValid: false,
      error: 'Incomplete frontmatter (missing closing ---)',
    };
  }

  const rest = trimmed.substring(firstNewline + 1);
  const secondDelimiter = rest.indexOf('\n---');

  if (secondDelimiter === -1) {
    return {
      frontmatter: {},
      content: markdown,
      isValid: false,
      error: 'Incomplete frontmatter (missing closing ---)',
    };
  }

  const frontmatterText = rest.substring(0, secondDelimiter);
  const contentText = rest.substring(secondDelimiter + 5).trimStart();

  try {
    const frontmatter = parseYamlFrontmatter(frontmatterText);
    return {
      frontmatter,
      content: contentText,
      isValid: true,
    };
  } catch (error) {
    return {
      frontmatter: {},
      content: markdown,
      isValid: false,
      error: `Failed to parse frontmatter: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Parse YAML-style frontmatter into CommandFrontmatter object
 */
function parseYamlFrontmatter(text: string): CommandFrontmatter {
  const frontmatter: CommandFrontmatter = {};
  const lines = text.split('\n');

  let i = 0;
  while (i < lines.length) {
    const currentLine = lines[i];
    if (!currentLine) {
      i++;
      continue;
    }

    const line = currentLine.trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Parse key: value pairs
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      i++;
      continue;
    }

    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();

    switch (key) {
      case 'description':
        frontmatter.description = unquoteYamlValue(value);
        break;

      case 'argument-hint':
        frontmatter['argument-hint'] = unquoteYamlValue(value);
        break;

      case 'model': {
        const modelValue = unquoteYamlValue(value);
        if (['sonnet', 'opus', 'haiku'].includes(modelValue)) {
          frontmatter.model = modelValue as 'sonnet' | 'opus' | 'haiku';
        }
        break;
      }

      case 'disable-model-invocation':
        frontmatter['disable-model-invocation'] = value === 'true';
        break;

      case 'allowed-tools': {
        // Multi-line list
        const tools: string[] = [];
        i++;
        while (i < lines.length) {
          const toolLine = lines[i];
          if (toolLine === undefined || !toolLine.startsWith('  - ')) {
            i--;
            break;
          }
          const tool = toolLine.substring(4).trim();
          if (tool) {
            tools.push(tool);
          }
          i++;
        }
        if (tools.length > 0) {
          frontmatter['allowed-tools'] = tools;
        }
        break;
      }
    }

    i++;
  }

  return frontmatter;
}

/**
 * Quote YAML value if it contains special characters
 */
function quoteYamlValue(value: string): string {
  // If value contains special YAML characters, quote it
  if (/^[[{}&*!|>%@`]|[:\n]/.test(value) || value.includes('"')) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

/**
 * Remove quotes from YAML value if present
 */
function unquoteYamlValue(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value
      .substring(1, value.length - 1)
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.substring(1, value.length - 1);
  }
  return value;
}

/**
 * Validate markdown frontmatter
 */
export function validateCommandMarkdown(markdown: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const trimmed = markdown.trim();

  if (!trimmed.startsWith('---')) {
    errors.push('Markdown must start with --- (frontmatter delimiter)');
    return { valid: false, errors };
  }

  const result = parseCommandMarkdown(markdown);
  if (!result.isValid && result.error) {
    errors.push(result.error);
  }

  if (!result.frontmatter.description) {
    errors.push('description field is required');
  }

  if (!result.content || result.content.trim().length === 0) {
    errors.push('Command content cannot be empty');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
