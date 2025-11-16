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
