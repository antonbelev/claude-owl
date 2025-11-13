/**
 * Hook Templates Library
 *
 * Pre-built, security-reviewed hook templates for common use cases.
 * All templates have been audited for security and follow best practices.
 *
 * @see docs/hooks-implementation-plan.md
 */

import type { HookTemplate } from '../../shared/types/hook.types';

/**
 * Bash script: Protect .env files from edits
 */
const PROTECT_ENV_SCRIPT = `#!/bin/bash
# Protect sensitive files from edits
# This hook blocks edits to .env files and other sensitive configurations

# Read the tool input JSON from stdin
INPUT=$(cat)

# Extract the file path using jq
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  # No file path in input, allow operation
  exit 0
fi

# Check if the file is sensitive
case "$FILE_PATH" in
  *.env|*.env.*|.env.*)
    echo "❌ BLOCKED: Cannot edit sensitive file: $FILE_PATH" >&2
    echo "Reason: .env files contain secrets and credentials" >&2
    exit 2  # Exit code 2 = blocking error
    ;;
  *credentials*|*secrets*|*password*)
    echo "❌ BLOCKED: Cannot edit file containing credentials: $FILE_PATH" >&2
    exit 2
    ;;
  *)
    # File is safe, allow operation
    exit 0
    ;;
esac
`;

/**
 * Bash script: Auto-format code after edits
 */
const AUTO_FORMAT_SCRIPT = `#!/bin/bash
# Auto-format code after Write/Edit operations
# Runs Prettier for JS/TS/JSON/MD files

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Check if file should be formatted
case "$FILE_PATH" in
  *.js|*.ts|*.jsx|*.tsx|*.json|*.md)
    echo "📝 Formatting: $FILE_PATH"

    # Check if prettier is available
    if command -v prettier &> /dev/null; then
      prettier --write "$FILE_PATH" 2>&1
      echo "✅ Formatted successfully"
    else
      echo "⚠️  Prettier not found. Skipping format." >&2
    fi
    ;;
esac

exit 0
`;

/**
 * Bash script: Log bash commands
 */
const LOG_BASH_COMMANDS_SCRIPT = `#!/bin/bash
# Log all bash commands executed by Claude Code
# Creates an audit trail in ~/.claude/hooks/command-log.txt

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Create log directory if it doesn't exist
LOG_DIR="$HOME/.claude/hooks"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/command-log.txt"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Log the command (properly quoted)
echo "[$TIMESTAMP] [Session: $SESSION_ID]" >> "$LOG_FILE"
echo "Command: $COMMAND" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

echo "✅ Command logged to $LOG_FILE"
exit 0
`;

/**
 * Bash script: Block sensitive file edits
 */
const BLOCK_SENSITIVE_SCRIPT = `#!/bin/bash
# Block edits to sensitive directories and files
# Protects .git/, keys/, credentials/, and other critical paths

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Normalize path (remove ./ and ../)
NORMALIZED_PATH=$(realpath -m "$FILE_PATH" 2>/dev/null || echo "$FILE_PATH")

# Check for sensitive paths
case "$NORMALIZED_PATH" in
  */.git/*|*/.git)
    echo "❌ BLOCKED: Cannot modify .git directory" >&2
    echo "Reason: Git metadata should not be edited manually" >&2
    exit 2
    ;;
  */keys/*|*/private/*|*/secrets/*)
    echo "❌ BLOCKED: Cannot modify files in sensitive directory" >&2
    exit 2
    ;;
  *.pem|*.key|*.crt|*.p12)
    echo "❌ BLOCKED: Cannot modify cryptographic key file" >&2
    exit 2
    ;;
  *id_rsa*|*id_ed25519*)
    echo "❌ BLOCKED: Cannot modify SSH key" >&2
    exit 2
    ;;
esac

exit 0
`;

/**
 * Bash script: Session logging
 */
const SESSION_LOGGING_SCRIPT = `#!/bin/bash
# Log session start/end events
# Tracks Claude Code session activity

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
CWD=$(echo "$INPUT" | jq -r '.cwd // "unknown"')

LOG_DIR="$HOME/.claude/hooks"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/session-log.txt"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Determine event type from context (this script works for both SessionStart and SessionEnd)
# You can customize this to detect which event triggered it

echo "[$TIMESTAMP] Session: $SESSION_ID" >> "$LOG_FILE"
echo "Working Directory: $CWD" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

echo "✅ Session logged"
exit 0
`;

/**
 * All available hook templates
 */
export const HOOK_TEMPLATES: HookTemplate[] = [
  {
    id: 'protect-env-files',
    name: 'Protect .env Files',
    description:
      'Blocks edits to .env files and other sensitive configuration files containing secrets and credentials',
    event: 'PreToolUse',
    category: 'security',
    securityLevel: 'green',
    configuration: {
      matcher: 'Write|Edit',
      hooks: [
        {
          type: 'command',
          command: 'bash ~/.claude/hooks/protect-env.sh',
          timeout: 30,
        },
      ],
    },
    scriptContent: PROTECT_ENV_SCRIPT,
    scriptPath: '~/.claude/hooks/protect-env.sh',
  },
  {
    id: 'auto-format-code',
    name: 'Auto-Format Code',
    description:
      'Automatically runs Prettier to format JavaScript, TypeScript, JSON, and Markdown files after edits',
    event: 'PostToolUse',
    category: 'automation',
    securityLevel: 'green',
    configuration: {
      matcher: 'Write|Edit',
      hooks: [
        {
          type: 'command',
          command: 'bash ~/.claude/hooks/auto-format.sh',
          timeout: 60,
        },
      ],
    },
    scriptContent: AUTO_FORMAT_SCRIPT,
    scriptPath: '~/.claude/hooks/auto-format.sh',
  },
  {
    id: 'log-bash-commands',
    name: 'Log Bash Commands',
    description:
      'Creates an audit trail by logging all bash commands executed by Claude Code to ~/.claude/hooks/command-log.txt',
    event: 'PreToolUse',
    category: 'logging',
    securityLevel: 'green',
    configuration: {
      matcher: 'Bash',
      hooks: [
        {
          type: 'command',
          command: 'bash ~/.claude/hooks/log-bash.sh',
          timeout: 10,
        },
      ],
    },
    scriptContent: LOG_BASH_COMMANDS_SCRIPT,
    scriptPath: '~/.claude/hooks/log-bash.sh',
  },
  {
    id: 'block-sensitive-edits',
    name: 'Block Sensitive File Edits',
    description:
      'Prevents modifications to sensitive directories (.git/, keys/, private/) and cryptographic files (*.pem, *.key, SSH keys)',
    event: 'PreToolUse',
    category: 'security',
    securityLevel: 'green',
    configuration: {
      matcher: 'Write|Edit',
      hooks: [
        {
          type: 'command',
          command: 'bash ~/.claude/hooks/block-sensitive.sh',
          timeout: 30,
        },
      ],
    },
    scriptContent: BLOCK_SENSITIVE_SCRIPT,
    scriptPath: '~/.claude/hooks/block-sensitive.sh',
  },
  {
    id: 'session-logging',
    name: 'Session Logging',
    description:
      'Tracks session start and end events for analytics and debugging. Logs to ~/.claude/hooks/session-log.txt',
    event: 'SessionStart',
    category: 'logging',
    securityLevel: 'green',
    configuration: {
      hooks: [
        {
          type: 'command',
          command: 'bash ~/.claude/hooks/session-log.sh',
          timeout: 10,
        },
      ],
    },
    scriptContent: SESSION_LOGGING_SCRIPT,
    scriptPath: '~/.claude/hooks/session-log.sh',
  },
];

/**
 * Get all templates
 */
export function getHookTemplates(): HookTemplate[] {
  return HOOK_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getHookTemplateById(id: string): HookTemplate | undefined {
  return HOOK_TEMPLATES.find(template => template.id === id);
}

/**
 * Get templates by category
 */
export function getHookTemplatesByCategory(category: string): HookTemplate[] {
  return HOOK_TEMPLATES.filter(template => template.category === category);
}

/**
 * Get templates by event
 */
export function getHookTemplatesByEvent(event: string): HookTemplate[] {
  return HOOK_TEMPLATES.filter(template => template.event === event);
}
