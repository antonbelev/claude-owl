/**
 * Built-in status line templates
 *
 * These templates are pre-built, security-audited scripts that users can apply
 * with one click. Each template generates a shell script that Claude Code executes
 * to display the status line.
 */

import type { StatusLineTemplate } from '@/shared/types/statusline.types';

/**
 * All built-in status line templates
 * Organized from beginner-friendly to advanced
 */
export const BUILT_IN_TEMPLATES: StatusLineTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Model name and current directory - perfect for beginners',
    category: 'beginner',
    preview: 'Sonnet 4.5 • ~/my-project',
    dependencies: ['jq'],
    platforms: ['unix'], // Bash script - Unix/Mac/Linux only
    script: `#!/bin/bash
# Minimal Status Line Template
# Shows: Model name • Current directory

# Read JSON from stdin
input=$(cat)

# Extract model name and directory
model=$(echo "$input" | jq -r '.model.display_name')
dir=$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|$HOME|~|")

# Output with ANSI colors
# Orange model name • Blue directory
echo -e "\\033[38;5;214m$model\\033[0m • \\033[38;5;39m$dir\\033[0m"
`,
  },

  {
    id: 'developer',
    name: 'Developer',
    description: 'Model, directory, git branch, and session cost',
    category: 'intermediate',
    preview: 'Sonnet 4.5 • ~/my-project (main) • $0.45',
    dependencies: ['jq', 'git'],
    platforms: ['unix'], // Bash script - Unix/Mac/Linux only
    script: `#!/bin/bash
# Developer Status Line Template
# Shows: Model • Directory (git branch) • Cost

input=$(cat)

# Extract data
model=$(echo "$input" | jq -r '.model.display_name')
dir=$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|$HOME|~|")
project_dir=$(echo "$input" | jq -r '.workspace.project_dir')
cost=$(echo "$input" | jq -r '.cost.total_cost_usd')

# Get git branch (if in a git repo)
branch=""
if [ -d "$project_dir/.git" ]; then
  branch=$(git -C "$project_dir" branch --show-current 2>/dev/null)
fi

# Build output
output="\\033[38;5;214m$model\\033[0m • \\033[38;5;39m$dir\\033[0m"

# Add git branch if available
if [ -n "$branch" ]; then
  output+=" \\033[38;5;120m($branch)\\033[0m"
fi

# Add cost
output+=" • \\033[38;5;226m\\$$cost\\033[0m"

echo -e "$output"
`,
  },

  {
    id: 'full',
    name: 'Full Metrics',
    description:
      'Complete information: model, directory, git status, cost, lines, and session time',
    category: 'advanced',
    preview: 'Sonnet 4.5 • ~/my-project (main ✓) • $0.45 • 1.2k lines • 45m',
    dependencies: ['jq', 'git', 'date'],
    platforms: ['unix'],
    script: `#!/bin/bash
# Full Metrics Status Line Template
# Shows: Model • Directory (branch status) • Cost • Lines • Time

input=$(cat)

# Extract data
model=$(echo "$input" | jq -r '.model.display_name')
dir=$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|$HOME|~|")
project_dir=$(echo "$input" | jq -r '.workspace.project_dir')
cost=$(echo "$input" | jq -r '.cost.total_cost_usd')
lines=$(echo "$input" | jq -r '.cost.total_lines_added')

# Get git info
branch=""
git_status=""
if [ -d "$project_dir/.git" ]; then
  branch=$(git -C "$project_dir" branch --show-current 2>/dev/null)

  # Check if working tree is clean
  if git -C "$project_dir" diff-index --quiet HEAD -- 2>/dev/null; then
    git_status="✓"
  else
    git_status="✗"
  fi
fi

# Format lines (1234 -> 1.2k)
if [ "$lines" -ge 1000 ]; then
  lines_formatted="$(echo "scale=1; $lines/1000" | bc)k"
else
  lines_formatted="$lines"
fi

# Calculate session duration (mock for now - would need session start time)
duration="45m"

# Build output
output="\\033[38;5;214m$model\\033[0m • \\033[38;5;39m$dir\\033[0m"

if [ -n "$branch" ]; then
  output+=" \\033[38;5;120m($branch $git_status)\\033[0m"
fi

output+=" • \\033[38;5;226m\\$$cost\\033[0m"
output+=" • \\033[38;5;147m\${lines_formatted} lines\\033[0m"
output+=" • \\033[38;5;249m$duration\\033[0m"

echo -e "$output"
`,
  },

  {
    id: 'cost-focused',
    name: 'Cost Tracking',
    description: 'Budget monitoring with daily cost tracking and percentage',
    category: 'specialized',
    preview: '$0.45 / $10.00 daily • 4.5% • Sonnet 4.5',
    dependencies: ['jq', 'bc'],
    platforms: ['unix'],
    script: `#!/bin/bash
# Cost-Focused Status Line Template
# Shows: Current cost / Daily budget • Percentage • Model

input=$(cat)

# Extract data
model=$(echo "$input" | jq -r '.model.display_name')
cost=$(echo "$input" | jq -r '.cost.total_cost_usd')

# Daily budget (customize this value)
DAILY_BUDGET=10.00

# Calculate percentage
percentage=$(echo "scale=1; ($cost / $DAILY_BUDGET) * 100" | bc)

# Determine color based on percentage
if (( $(echo "$percentage < 50" | bc -l) )); then
  cost_color="\\033[38;5;120m"  # Green
elif (( $(echo "$percentage < 80" | bc -l) )); then
  cost_color="\\033[38;5;226m"  # Yellow
else
  cost_color="\\033[38;5;196m"  # Red
fi

# Build output
output="\${cost_color}\\$$cost\\033[0m / \\$$DAILY_BUDGET daily"
output+=" • \${cost_color}\${percentage}%\\033[0m"
output+=" • \\033[38;5;214m$model\\033[0m"

echo -e "$output"
`,
  },

  {
    id: 'git-focused',
    name: 'Git Status',
    description: 'Detailed repository information with changes and sync status',
    category: 'specialized',
    preview: 'main • ↑2 ↓1 • +3 ~5 -1 • ~/my-project',
    dependencies: ['git'],
    platforms: ['unix'],
    script: `#!/bin/bash
# Git-Focused Status Line Template
# Shows: Branch • Push/Pull • Changes • Directory

input=$(cat)

# Extract data
dir=$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|$HOME|~|")
project_dir=$(echo "$input" | jq -r '.workspace.project_dir')

# Check if in git repo
if [ ! -d "$project_dir/.git" ]; then
  echo -e "\\033[38;5;240mNot a git repository\\033[0m • $dir"
  exit 0
fi

# Get git info
branch=$(git -C "$project_dir" branch --show-current 2>/dev/null)

# Get commits ahead/behind
ahead_behind=$(git -C "$project_dir" rev-list --left-right --count HEAD...@{upstream} 2>/dev/null)
if [ -n "$ahead_behind" ]; then
  ahead=$(echo "$ahead_behind" | awk '{print $1}')
  behind=$(echo "$ahead_behind" | awk '{print $2}')
else
  ahead=0
  behind=0
fi

# Get file changes
changes=$(git -C "$project_dir" status --porcelain 2>/dev/null)
added=$(echo "$changes" | grep -c "^A" || echo "0")
modified=$(echo "$changes" | grep -c "^.M" || echo "0")
deleted=$(echo "$changes" | grep -c "^D" || echo "0")

# Build output
output="\\033[38;5;120m$branch\\033[0m"

# Add sync status
if [ "$ahead" -gt 0 ] || [ "$behind" -gt 0 ]; then
  output+=" • "
  [ "$ahead" -gt 0 ] && output+="\\033[38;5;226m↑$ahead\\033[0m"
  [ "$ahead" -gt 0 ] && [ "$behind" -gt 0 ] && output+=" "
  [ "$behind" -gt 0 ] && output+="\\033[38;5;196m↓$behind\\033[0m"
fi

# Add file changes
if [ "$added" -gt 0 ] || [ "$modified" -gt 0 ] || [ "$deleted" -gt 0 ]; then
  output+=" • "
  [ "$added" -gt 0 ] && output+="\\033[38;5;120m+$added\\033[0m "
  [ "$modified" -gt 0 ] && output+="\\033[38;5;226m~$modified\\033[0m "
  [ "$deleted" -gt 0 ] && output+="\\033[38;5;196m-$deleted\\033[0m"
fi

output+=" • \\033[38;5;39m$dir\\033[0m"

echo -e "$output"
`,
  },

  {
    id: 'powerline',
    name: 'Powerline Style',
    description:
      'Beautiful powerline-inspired rendering with arrow separators (requires Nerd Font)',
    category: 'advanced',
    preview: ' Sonnet 4.5  ~/project  main  $0.45 ',
    dependencies: ['jq', 'git'],
    platforms: ['unix'],
    script: `#!/bin/bash
# Powerline-Style Status Line Template
# Shows: Model  Directory  Branch  Cost
# Requires: Nerd Font for special characters

input=$(cat)

# Extract data
model=$(echo "$input" | jq -r '.model.display_name')
dir=$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|$HOME|~|")
project_dir=$(echo "$input" | jq -r '.workspace.project_dir')
cost=$(echo "$input" | jq -r '.cost.total_cost_usd')

# Get git branch
branch=""
if [ -d "$project_dir/.git" ]; then
  branch=$(git -C "$project_dir" branch --show-current 2>/dev/null)
fi

# Powerline arrow separator
SEP=""

# Colors (background colors for powerline effect)
BG_ORANGE="\\033[48;5;214m"
BG_BLUE="\\033[48;5;39m"
BG_GREEN="\\033[48;5;120m"
BG_YELLOW="\\033[48;5;226m"
FG_ORANGE="\\033[38;5;214m"
FG_BLUE="\\033[38;5;39m"
FG_GREEN="\\033[38;5;120m"
FG_YELLOW="\\033[38;5;226m"
FG_BLACK="\\033[38;5;16m"
RESET="\\033[0m"

# Build powerline output
output=""

# Model segment
output+="\${BG_ORANGE}\${FG_BLACK} $model \${RESET}"
output+="\${FG_ORANGE}\${BG_BLUE}\${SEP}\${RESET}"

# Directory segment
output+="\${BG_BLUE}\${FG_BLACK} $dir \${RESET}"

# Branch segment (if available)
if [ -n "$branch" ]; then
  output+="\${FG_BLUE}\${BG_GREEN}\${SEP}\${RESET}"
  output+="\${BG_GREEN}\${FG_BLACK} $branch \${RESET}"
  output+="\${FG_GREEN}\${BG_YELLOW}\${SEP}\${RESET}"
else
  output+="\${FG_BLUE}\${BG_YELLOW}\${SEP}\${RESET}"
fi

# Cost segment
output+="\${BG_YELLOW}\${FG_BLACK} \\$$cost \${RESET}"
output+="\${FG_YELLOW}\${SEP}\${RESET}"

echo -e "$output"
`,
  },

  // Windows-specific templates (batch scripts)
  {
    id: 'minimal-windows',
    name: 'Minimal (Windows)',
    description: 'Model name and current directory - Windows batch version',
    category: 'beginner',
    preview: 'Sonnet 4.5 • C:\\Users\\name\\my-project',
    platforms: ['windows'],
    script: `@echo off
REM Minimal Status Line Template (Windows Batch)
REM Shows: Model name - Current directory

setlocal enabledelayedexpansion
REM Read input line
set "input="
for /f "delims=" %%A in ('findstr ".*"') do set "input=%%A"

REM Check if jq is available
where jq >nul 2>&1
if !ERRORLEVEL! EQU 0 (
  for /f "delims=" %%A in ('echo !input! ^| jq -r ".model.display_name" 2^>nul') do set "model=%%A"
  for /f "delims=" %%A in ('echo !input! ^| jq -r ".workspace.current_dir" 2^>nul') do set "dir=%%A"
  if not "!model!"=="" (
    echo !model! - !dir!
    exit /b 0
  )
)

REM Fallback if jq not available
echo Sonnet 4.5 - Working...
`,
  },

  {
    id: 'minimal-cross-platform',
    name: 'Minimal (Node.js - Cross-Platform)',
    description: 'Model name and current directory - works on Windows, macOS, and Linux with Node.js',
    category: 'beginner',
    preview: 'Sonnet 4.5 • ~/my-project',
    dependencies: ['node'],
    platforms: ['windows', 'unix'],
    script: `#!/usr/bin/env node
// Cross-platform Minimal Status Line (requires Node.js)
// Works on Windows, macOS, and Linux

const fs = require('fs');

try {
  // Read JSON from stdin synchronously
  const input = fs.readFileSync(0, 'utf-8');
  const data = JSON.parse(input);
  const model = data.model.display_name;
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const dir = data.workspace.current_dir.replace(homeDir, '~');

  // Use ANSI color codes if terminal supports it
  const modelColor = '\\033[38;5;214m';
  const dirColor = '\\033[38;5;39m';
  const reset = '\\033[0m';

  console.log(\`\${modelColor}\${model}\${reset} • \${dirColor}\${dir}\${reset}\`);
} catch (e) {
  console.error('Error parsing input:', e.message);
  process.exit(1);
}
`,
  },

  {
    id: 'developer-cross-platform',
    name: 'Developer (Node.js - Cross-Platform)',
    description: 'Model, directory, git branch, and cost - works on all platforms',
    category: 'intermediate',
    preview: 'Sonnet 4.5 • ~/my-project (main) • $0.45',
    dependencies: ['node', 'git'],
    platforms: ['windows', 'unix'],
    script: `#!/usr/bin/env node
// Developer Status Line (Cross-Platform Node.js)
// Shows: Model • Directory (git branch) • Cost

const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Read JSON from stdin synchronously
  const input = fs.readFileSync(0, 'utf-8');
  const data = JSON.parse(input);
  const model = data.model.display_name;
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const dir = data.workspace.current_dir.replace(homeDir, '~');
  const projectDir = data.workspace.project_dir;
  const cost = data.cost.total_cost_usd;

  // Get git branch
  let branch = '';
  try {
    branch = execSync('git branch --show-current', {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (e) {
    // Not a git repo or git not available
  }

  // Build output
  let output = \`\${model} • \${dir}\`;
  if (branch) {
    output += \` (\${branch})\`;
  }
  output += \` • $\${cost}\`;

  console.log(output);
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
`,
  },

  {
    id: 'git-windows',
    name: 'Git Status (Windows PowerShell)',
    description: 'Detailed git repository info with branch and changes - Windows PowerShell',
    category: 'specialized',
    preview: 'main • +3 ~5 -1 • C:\\Users\\name\\project',
    dependencies: ['git', 'powershell'],
    platforms: ['windows'],
    script: `#!/usr/bin/env node
// Git-Focused Status Line for Windows (Node.js)
// Shows: Branch • Changes • Directory

const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Read JSON from stdin synchronously
  const input = fs.readFileSync(0, 'utf-8');
  const data = JSON.parse(input);
  const dir = data.workspace.current_dir.replace(process.env.USERPROFILE || '', '~');
  const projectDir = data.workspace.project_dir;

  // Check if in git repo
  let isGitRepo = false;
  try {
    execSync('git rev-parse --git-dir', {
      cwd: projectDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    isGitRepo = true;
  } catch (e) {
    console.log(\`Not a git repository • \${dir}\`);
    process.exit(0);
  }

  if (!isGitRepo) {
    console.log(\`Not a git repository • \${dir}\`);
    process.exit(0);
  }

  // Get git branch
  const branch = execSync('git branch --show-current', {
    cwd: projectDir,
    encoding: 'utf8'
  }).trim();

  // Get file changes
  const status = execSync('git status --porcelain', {
    cwd: projectDir,
    encoding: 'utf8'
  });

  const lines = status.split('\\n').filter(l => l.trim());
  const added = lines.filter(l => l.startsWith('A')).length;
  const modified = lines.filter(l => l.startsWith(' M') || l.startsWith('M')).length;
  const deleted = lines.filter(l => l.startsWith('D')).length;

  // Build output
  let output = \`\${branch}\`;
  if (added > 0 || modified > 0 || deleted > 0) {
    output += ' •';
    if (added > 0) output += \` +\${added}\`;
    if (modified > 0) output += \` ~\${modified}\`;
    if (deleted > 0) output += \` -\${deleted}\`;
  }
  output += \` • \${dir}\`;

  console.log(output);
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
`,
  },

  {
    id: 'full-cross-platform',
    name: 'Full Metrics (Node.js - Cross-Platform)',
    description: 'Complete info: model, directory, git, cost, lines - all platforms',
    category: 'advanced',
    preview: 'Sonnet 4.5 • ~/project (main ✓) • $0.45 • 1.2k lines',
    dependencies: ['node', 'git'],
    platforms: ['windows', 'unix'],
    script: `#!/usr/bin/env node
// Full Metrics Status Line (Cross-Platform)
// Shows: Model • Directory (branch status) • Cost • Lines

const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Read JSON from stdin synchronously
  const input = fs.readFileSync(0, 'utf-8');
  const data = JSON.parse(input);
  const model = data.model.display_name;
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const dir = data.workspace.current_dir.replace(homeDir, '~');
  const projectDir = data.workspace.project_dir;
  const cost = data.cost.total_cost_usd;
  const lines = data.cost.total_lines_added;

  // Get git info
  let branch = '';
  let gitStatus = '';
  try {
    branch = execSync('git branch --show-current', {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    // Check if working tree is clean
    const status = execSync('git status --porcelain', {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    gitStatus = status.trim() === '' ? '✓' : '✗';
  } catch (e) {
    // Not a git repo
  }

  // Format lines
  const linesFormatted = lines >= 1000
    ? (lines / 1000).toFixed(1) + 'k'
    : lines.toString();

  // Build output
  let output = \`\${model} • \${dir}\`;
  if (branch) {
    output += \` (\${branch} \${gitStatus})\`;
  }
  output += \` • $\${cost} • \${linesFormatted} lines\`;

  console.log(output);
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
`,
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): StatusLineTemplate | undefined {
  return BUILT_IN_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: StatusLineTemplate['category']
): StatusLineTemplate[] {
  return BUILT_IN_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get templates compatible with the current platform
 * Filters out templates that cannot run on the given platform
 *
 * @param platform - 'windows' | 'macos' | 'linux'
 * @returns Array of templates compatible with the platform
 */
export function getTemplatesForPlatform(
  platform: 'windows' | 'macos' | 'linux'
): StatusLineTemplate[] {
  const platformKey = platform === 'windows' ? 'windows' : 'unix';

  return BUILT_IN_TEMPLATES.filter(template => {
    return template.platforms?.includes(platformKey);
  });
}

/**
 * Generate mock session data for preview
 */
export function generateMockSessionData(): {
  hook_event_name: 'Status';
  session_id: string;
  model: { id: string; display_name: string };
  workspace: { current_dir: string; project_dir: string };
  cost: { total_cost_usd: number; total_lines_added: number };
} {
  return {
    hook_event_name: 'Status',
    session_id: 'preview-session-' + Date.now(),
    model: {
      id: 'claude-sonnet-4-5-20250929',
      display_name: 'Sonnet 4.5',
    },
    workspace: {
      current_dir: process.cwd(),
      project_dir: process.cwd(),
    },
    cost: {
      total_cost_usd: 0.45,
      total_lines_added: 1234,
    },
  };
}
