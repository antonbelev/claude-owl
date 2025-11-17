# ADR-002: Status Line Management and Configuration

**Status:** Proposed
**Date:** 2025-11-16
**Deciders:** Product, Engineering, Security
**Context:** Visual customization and real-time metrics display for Claude Code sessions

---

## Context and Problem Statement

Claude Code supports customizable status lines—a terminal footer similar to shell prompts (PS1) that displays contextual session information. While power users have created sophisticated implementations (ccstatusline, claude-code-statusline), there's no accessible way for average users to configure status lines without writing shell scripts.

**Key Challenge:** How can Claude Owl democratize status line customization while maintaining security, providing templates for common use cases, and enabling power users to extend functionality?

---

## Current State: How Claude Code Status Lines Work

### Configuration Format

Status lines are configured in `.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 0
  }
}
```

### Technical Implementation

**Input Mechanism:**
- Status line scripts receive JSON data via stdin
- Updates triggered when conversation messages change (max 300ms intervals)
- Scripts must output single-line text to stdout
- ANSI color codes supported for styling

**Input Data Structure:**
```json
{
  "hook_event_name": "Status",
  "session_id": "abc123...",
  "model": {
    "id": "claude-sonnet-4-5-20250929",
    "display_name": "Sonnet 4.5"
  },
  "workspace": {
    "current_dir": "/home/user/project",
    "project_dir": "/home/user/project"
  },
  "cost": {
    "total_cost_usd": 0.45,
    "total_lines_added": 1234
  }
}
```

### State of the Ecosystem

#### 1. ccstatusline (sirmalloc)

**Strengths:**
- Interactive TUI configuration (React/Ink)
- 20+ widgets (model, git, tokens, session clock, block timer)
- Powerline-style rendering with arrow separators
- Cross-platform (Bun/Node.js)
- Zero installation (npx/bunx)
- Real-time preview
- Smart terminal width detection

**Architecture:**
- Settings stored in `~/.config/ccstatusline/settings.json`
- Widget-based composition
- Intelligent caching for git operations
- Sub-50ms response times

**Configuration Approach:**
```bash
npx ccstatusline@latest  # Launches interactive TUI
```

#### 2. claude-code-statusline (rz1989s)

**Strengths:**
- Enterprise-grade with 77+ tests
- Multi-tier caching (70-90% performance improvement)
- Advanced features: prayer times, billing metrics, MCP monitoring
- Single `Config.toml` configuration (227 settings)
- 18 atomic components with standardized interfaces
- XDG-compliant security
- SHA-256 integrity protection

**Architecture:**
- Modular component system (`collect_data()`, `render()`, `get_config()`)
- Three-tier download system (direct GitHub URLs)
- Session-wide caching for command lookups
- Duration-based caching for git operations

**Configuration Approach:**
```bash
curl -sSL https://raw.githubusercontent.com/.../install.sh | bash
```

---

## User Personas and Needs

### Persona 1: Beginner Developer (Sarah)

**Profile:**
- New to Claude Code
- Not comfortable writing shell scripts
- Wants basic info (model, directory, cost)
- Values simplicity over customization

**Pain Points:**
- "I don't know bash/python/node well enough to write a status line script"
- "The official examples are too technical"
- "I just want to see which model I'm using"

**Needs:**
- ✅ One-click templates
- ✅ Visual preview of output
- ✅ No code editing required
- ✅ Clear descriptions of what each element shows

### Persona 2: Power User (Alex)

**Profile:**
- Experienced developer
- Uses multiple Claude Code projects
- Wants detailed metrics (tokens, git status, session duration)
- Comfortable with code but prefers visual tools

**Pain Points:**
- "Setting up ccstatusline requires understanding its config format"
- "I want to mix pre-built components with custom ones"
- "Managing ANSI color codes manually is tedious"

**Needs:**
- ✅ Component library (drag-and-drop widgets)
- ✅ Custom script support
- ✅ Live preview with sample data
- ✅ Export to shell script
- ✅ Color picker for styling

### Persona 3: Security-Conscious Enterprise User (Jordan)

**Profile:**
- Works on sensitive projects
- Concerned about data exposure in terminal
- Needs audit trail for configuration changes
- Company policy restricts external script execution

**Pain Points:**
- "Status line scripts could leak API keys or secrets"
- "I don't trust installing random npm packages"
- "Need to verify what data is being displayed"

**Needs:**
- ✅ Sandboxed preview mode
- ✅ Script validation and security scanning
- ✅ Built-in templates (no external dependencies)
- ✅ Sensitive data masking options
- ✅ Audit logging

---

## Decision: Status Line Management Strategy

### 1. Core Architecture

#### Configuration Storage

**Location:** Managed through `~/.claude/settings.json` (user-level) and `{PROJECT}/.claude/settings.json` (project-level)

**Format:**
```json
{
  "statusLine": {
    "type": "template" | "command" | "advanced",
    "template": "minimal" | "developer" | "full",
    "command": "/path/to/script.sh",
    "widgets": [...],
    "theme": {...},
    "padding": 0
  }
}
```

#### Three-Tier System

##### Tier 1: Pre-Built Templates (Beginner-Friendly)

**Templates:**

1. **Minimal** - Model name + directory
   ```
   Sonnet 4.5 • ~/my-project
   ```

2. **Developer** - Model + directory + git branch + cost
   ```
   Sonnet 4.5 • ~/my-project (main) • $0.45
   ```

3. **Full** - All metrics
   ```
   Sonnet 4.5 • ~/my-project (main ✓) • $0.45 • 1.2k lines • 45m
   ```

4. **Cost-Focused** - Budget tracking
   ```
   $0.45 / $10.00 daily • 4.5% • Sonnet 4.5
   ```

5. **Git-Focused** - Repository status
   ```
   main • ↑2 ↓1 • +3 ~5 -1 • ~/my-project
   ```

6. **Performance** - Speed metrics
   ```
   Sonnet 4.5 • 23 tokens/s • 89% cache hit • 120ms avg
   ```

**Implementation:**
- Templates generate shell scripts automatically
- No user coding required
- One-click activation
- Live preview before applying

##### Tier 2: Widget Composer (Power User)

**Component Library:**

| Widget | Data Source | Example Output |
|--------|-------------|----------------|
| Model Name | `session.model.display_name` | `Sonnet 4.5` |
| Model Emoji | Mapped from model ID | `🧠` |
| Current Directory | `session.workspace.current_dir` | `~/project` |
| Project Name | Basename of project_dir | `claude-owl` |
| Git Branch | `git branch --show-current` | `main` |
| Git Status | `git status --porcelain` | `+3 ~2 -1` |
| Session Cost | `session.cost.total_cost_usd` | `$0.45` |
| Lines Added | `session.cost.total_lines_added` | `1.2k lines` |
| Session Duration | Time since session start | `45m 32s` |
| Token Count | Calculated from cost | `~450k tokens` |
| Timestamp | Current time | `14:32:05` |
| Custom Command | User-defined shell command | `(user output)` |
| Separator | Visual spacing | ` • ` |
| Spacer | Flexible spacing | (fills available space) |

**Features:**
- Drag-and-drop widget ordering
- Per-widget color customization
- Conditional display rules (e.g., "only show git branch if in git repo")
- Format customization (e.g., `$0.45` vs `45¢` vs `0.45 USD`)
- Export to shell script for version control

**UI Design:**
```
┌─ Status Line Builder ─────────────────────────────────┐
│                                                        │
│  Preview:                                              │
│  ┌────────────────────────────────────────────────┐   │
│  │ Sonnet 4.5 • ~/project (main) • $0.45         │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  Widgets:                                              │
│  ┏━━━━━━━━━━━━━━┓                                      │
│  ┃ Model Name   ┃  [🎨 Color: Orange] [⚙️ Format]     │
│  ┗━━━━━━━━━━━━━━┛                                      │
│  ┏━━━━━━━━━━━━━━┓                                      │
│  ┃ Separator    ┃  [•] [|] [→]                        │
│  ┗━━━━━━━━━━━━━━┛                                      │
│  ┏━━━━━━━━━━━━━━┓                                      │
│  ┃ Directory    ┃  [🎨 Color: Blue] [⚙️ Format: ~]    │
│  ┗━━━━━━━━━━━━━━┛                                      │
│                                                        │
│  Available Widgets: [+ Add Widget ▼]                  │
│  • Git Branch   • Cost   • Time   • Custom Command    │
│                                                        │
│  [⬆️ Move Up] [⬇️ Move Down] [🗑️ Remove] [Export] [Save] │
└────────────────────────────────────────────────────────┘
```

##### Tier 3: Advanced Mode (Expert Users)

**Features:**
- Full shell script editor (Monaco Editor)
- Language selection: Bash, Python, Node.js
- Syntax highlighting and validation
- Sample input data injection for testing
- Security scanning (detect potential credential leaks)
- Script versioning and rollback

**Built-in Script Templates:**

1. **Bash Template**
   ```bash
   #!/bin/bash
   # Read JSON from stdin
   input=$(cat)

   # Parse using jq
   model=$(echo "$input" | jq -r '.model.display_name')
   dir=$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|$HOME|~|")

   # Output formatted string
   echo -e "\033[33m$model\033[0m • $dir"
   ```

2. **Python Template**
   ```python
   #!/usr/bin/env python3
   import sys, json

   data = json.load(sys.stdin)
   model = data['model']['display_name']
   cost = data['cost']['total_cost_usd']

   print(f"\033[33m{model}\033[0m • ${cost:.2f}")
   ```

3. **Node.js Template**
   ```javascript
   #!/usr/bin/env node
   const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
   const { model, cost } = data;

   console.log(`\x1b[33m${model.display_name}\x1b[0m • $${cost.total_cost_usd.toFixed(2)}`);
   ```

### 2. Security Considerations

#### Threat Model

**Risks:**

1. **Credential Exposure**
   - Status line script accidentally prints API keys from environment
   - Git commit messages containing secrets displayed in status

2. **Command Injection**
   - Malicious data in session JSON executes arbitrary commands
   - User-provided custom commands not sanitized

3. **Information Leakage**
   - Sensitive project names/paths visible in shared terminal
   - Cost data reveals usage patterns

4. **Supply Chain**
   - External status line packages (ccstatusline, etc.) could be compromised
   - Auto-update mechanisms could inject malicious code

#### Security Controls

**1. Sandboxed Preview Mode**

```typescript
class StatusLinePreviewService {
  async previewStatusLine(config: StatusLineConfig): Promise<string> {
    // Run in isolated subprocess with:
    // - No network access
    // - Read-only filesystem
    // - Limited environment variables (no API keys)
    // - Timeout: 2 seconds

    const sanitizedEnv = {
      HOME: process.env.HOME,
      USER: process.env.USER,
      PATH: '/usr/bin:/bin',
      // Explicitly exclude AWS_*, API_KEY_*, etc.
    };

    const result = await execFile(config.command, [], {
      input: JSON.stringify(mockSessionData),
      env: sanitizedEnv,
      timeout: 2000,
      shell: false,
    });

    return result.stdout;
  }
}
```

**2. Sensitive Data Detection**

```typescript
class SecurityScanner {
  scanScriptForSecrets(scriptContent: string): SecurityIssue[] {
    const patterns = [
      { regex: /AWS_ACCESS_KEY_ID|AWS_SECRET/, level: 'high' },
      { regex: /API_KEY|ANTHROPIC_API_KEY/, level: 'high' },
      { regex: /password|secret|token/i, level: 'medium' },
      { regex: /\$\{?[A-Z_]+_KEY\}?/, level: 'medium' },
    ];

    return patterns
      .map(p => scriptContent.match(p.regex))
      .filter(Boolean)
      .map(match => ({
        line: getLineNumber(match),
        severity: p.level,
        message: `Potential credential reference: ${match[0]}`,
      }));
  }
}
```

**3. Permission System Integration**

```json
{
  "permissions": {
    "ask": [
      "Bash:statusline:~/.claude/statusline.sh",
      "Write(~/.claude/statusline.sh)"
    ]
  }
}
```

Users must approve status line scripts before execution.

**4. Built-in Template Auditing**

```typescript
// All built-in templates are:
// - Reviewed by security team
// - Versioned in git
// - Digitally signed
// - No external dependencies
// - No network calls
// - No sensitive data access

const BUILT_IN_TEMPLATES = {
  minimal: {
    script: fs.readFileSync('./templates/minimal.sh', 'utf-8'),
    checksum: 'sha256:abc123...',
    reviewed: '2025-11-16',
    reviewer: 'security@claude.ai',
  },
};
```

### 3. Implementation Architecture

#### Service Layer

```typescript
// StatusLineService - Main business logic
class StatusLineService {
  async getActiveStatusLine(): Promise<StatusLineConfig | null> {
    // Read from ~/.claude/settings.json
    const settings = await this.settingsService.getUserSettings();
    return settings.statusLine || null;
  }

  async setTemplate(templateName: string): Promise<void> {
    // Generate script from template
    const script = this.templateEngine.generateScript(templateName);
    const scriptPath = path.join(homedir(), '.claude', 'statusline.sh');

    // Write script with executable permissions
    await fs.writeFile(scriptPath, script, { mode: 0o755 });

    // Update settings.json
    await this.settingsService.updateUserSettings({
      statusLine: {
        type: 'template',
        template: templateName,
        command: scriptPath,
        padding: 0,
      },
    });
  }

  async setCustomScript(scriptContent: string): Promise<void> {
    // Security scan
    const issues = this.securityScanner.scanScriptForSecrets(scriptContent);
    if (issues.some(i => i.severity === 'high')) {
      throw new Error('Script contains potential security issues');
    }

    // Validate script syntax
    await this.validator.validateScript(scriptContent);

    // Save and configure
    const scriptPath = path.join(homedir(), '.claude', 'statusline-custom.sh');
    await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });

    await this.settingsService.updateUserSettings({
      statusLine: {
        type: 'command',
        command: scriptPath,
        padding: 0,
      },
    });
  }

  async previewStatusLine(config: StatusLineConfig): Promise<string> {
    // Sandboxed preview with mock data
    return this.previewService.previewStatusLine(config);
  }

  async exportToScript(widgets: Widget[]): Promise<string> {
    // Generate standalone shell script from widget configuration
    return this.scriptGenerator.generateFromWidgets(widgets);
  }
}

// TemplateEngine - Generate scripts from templates
class TemplateEngine {
  private templates: Map<string, StatusLineTemplate>;

  generateScript(templateName: string): string {
    const template = this.templates.get(templateName);
    if (!template) throw new Error(`Template not found: ${templateName}`);

    return template.generator();
  }

  registerTemplate(name: string, template: StatusLineTemplate): void {
    this.templates.set(name, template);
  }
}

// WidgetComposer - Build status lines from widgets
class WidgetComposer {
  composeStatusLine(widgets: Widget[]): string {
    return widgets.map(w => this.renderWidget(w)).join('');
  }

  private renderWidget(widget: Widget): string {
    switch (widget.type) {
      case 'model':
        return `\\033[${widget.color}m$(echo "$input" | jq -r '.model.display_name')\\033[0m`;
      case 'directory':
        return `$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|$HOME|~|")`;
      case 'git-branch':
        return `$(git branch --show-current 2>/dev/null || echo "")`;
      case 'separator':
        return ` ${widget.separator} `;
      // ... more widget types
    }
  }
}

// SecurityScanner - Detect potential issues
class SecurityScanner {
  scanScriptForSecrets(script: string): SecurityIssue[];
  scanForCommandInjection(script: string): SecurityIssue[];
  scanForPrivilegeEscalation(script: string): SecurityIssue[];
}
```

#### IPC Layer

```typescript
// src/shared/types/ipc.types.ts
export const STATUSLINE_CHANNELS = {
  GET_ACTIVE: 'statusline:get-active',
  SET_TEMPLATE: 'statusline:set-template',
  SET_CUSTOM: 'statusline:set-custom',
  PREVIEW: 'statusline:preview',
  LIST_TEMPLATES: 'statusline:list-templates',
  EXPORT_SCRIPT: 'statusline:export-script',
  SCAN_SECURITY: 'statusline:scan-security',
};

export interface SetTemplateRequest {
  templateName: string;
}

export interface SetCustomScriptRequest {
  scriptContent: string;
  language: 'bash' | 'python' | 'node';
}

export interface PreviewRequest {
  config: StatusLineConfig;
  mockData?: SessionData;
}

// src/main/ipc/statuslineHandlers.ts
ipcMain.handle(STATUSLINE_CHANNELS.SET_TEMPLATE, async (_, request: SetTemplateRequest) => {
  console.log('[StatusLineHandler] Set template request:', request.templateName);

  try {
    await statusLineService.setTemplate(request.templateName);
    return { success: true };
  } catch (error) {
    console.error('[StatusLineHandler] Failed to set template:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle(STATUSLINE_CHANNELS.PREVIEW, async (_, request: PreviewRequest) => {
  console.log('[StatusLineHandler] Preview request');

  try {
    const output = await statusLineService.previewStatusLine(request.config);
    return { success: true, data: output };
  } catch (error) {
    console.error('[StatusLineHandler] Preview failed:', error);
    return { success: false, error: error.message };
  }
});
```

#### React Layer

```typescript
// src/renderer/hooks/useStatusLine.ts
export function useStatusLine() {
  const [activeConfig, setActiveConfig] = useState<StatusLineConfig | null>(null);
  const [templates, setTemplates] = useState<StatusLineTemplate[]>([]);
  const [previewOutput, setPreviewOutput] = useState<string>('');

  useEffect(() => {
    loadActiveConfig();
    loadTemplates();
  }, []);

  const setTemplate = async (templateName: string) => {
    const response = await window.electronAPI.statusLine.setTemplate({ templateName });
    if (response.success) {
      await loadActiveConfig();
    }
    return response;
  };

  const preview = async (config: StatusLineConfig) => {
    const response = await window.electronAPI.statusLine.preview({ config });
    if (response.success) {
      setPreviewOutput(response.data);
    }
    return response;
  };

  return {
    activeConfig,
    templates,
    previewOutput,
    setTemplate,
    setCustomScript,
    preview,
    exportScript,
  };
}

// src/renderer/components/StatusLine/StatusLineBuilder.tsx
export function StatusLineBuilder() {
  const { templates, setTemplate, preview } = useStatusLine();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('minimal');

  return (
    <div className="statusline-builder">
      <h2>Status Line Configuration</h2>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="composer">Widget Composer</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <TemplateSelector
            templates={templates}
            selected={selectedTemplate}
            onSelect={setSelectedTemplate}
            onApply={() => setTemplate(selectedTemplate)}
          />
        </TabsContent>

        <TabsContent value="composer">
          <WidgetComposer />
        </TabsContent>

        <TabsContent value="advanced">
          <ScriptEditor />
        </TabsContent>
      </Tabs>

      <PreviewPanel output={previewOutput} />
    </div>
  );
}
```

### 4. Template Library

#### Built-in Templates

```typescript
export const BUILT_IN_TEMPLATES: StatusLineTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Model name and current directory',
    category: 'beginner',
    preview: 'Sonnet 4.5 • ~/my-project',
    generator: () => `#!/bin/bash
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name')
dir=$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|$HOME|~|")
echo -e "\\033[33m$model\\033[0m • $dir"
`,
  },

  {
    id: 'developer',
    name: 'Developer',
    description: 'Model, directory, git branch, and cost',
    category: 'intermediate',
    preview: 'Sonnet 4.5 • ~/my-project (main) • $0.45',
    generator: () => `#!/bin/bash
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name')
dir=$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|$HOME|~|")
branch=$(git -C "$dir" branch --show-current 2>/dev/null)
cost=$(echo "$input" | jq -r '.cost.total_cost_usd')

output="\\033[33m$model\\033[0m • $dir"
[[ -n "$branch" ]] && output+=" \\033[36m($branch)\\033[0m"
output+=" • \\$${cost}"

echo -e "$output"
`,
  },

  {
    id: 'full',
    name: 'Full Metrics',
    description: 'All available information',
    category: 'advanced',
    preview: 'Sonnet 4.5 • ~/my-project (main ✓) • $0.45 • 1.2k lines • 45m',
    generator: () => `#!/bin/bash
# Full metrics statusline
# ... (comprehensive script)
`,
  },

  {
    id: 'cost-focused',
    name: 'Cost Tracking',
    description: 'Budget monitoring and cost metrics',
    category: 'specialized',
    preview: '$0.45 / $10.00 daily • 4.5% • Sonnet 4.5',
    generator: () => `#!/bin/bash
# Cost-focused statusline
# ... (cost-centric script)
`,
  },

  {
    id: 'git-focused',
    name: 'Git Status',
    description: 'Repository information and changes',
    category: 'specialized',
    preview: 'main • ↑2 ↓1 • +3 ~5 -1 • ~/my-project',
    generator: () => `#!/bin/bash
# Git-focused statusline
# ... (git-centric script)
`,
  },

  {
    id: 'ccstatusline-inspired',
    name: 'Powerline Style',
    description: 'Beautiful powerline rendering with arrows',
    category: 'advanced',
    preview: ' Sonnet 4.5  ~/project  main  $0.45 ',
    generator: () => `#!/bin/bash
# Powerline-style statusline (inspired by ccstatusline)
# Requires Nerd Font for special characters
# ... (powerline script with arrow separators)
`,
  },
];
```

#### Community Templates

**Future Enhancement:** Allow users to share templates via GitHub Gists

```typescript
interface CommunityTemplate extends StatusLineTemplate {
  author: string;
  url: string;
  downloads: number;
  rating: number;
  verified: boolean; // Reviewed by Claude team
}

// User can browse and install community templates
// All community templates run in sandbox mode by default
```

---

## User Workflows

### Workflow 1: Beginner Setup (30 seconds)

```
1. User opens Claude Owl → Settings → Status Line
2. Clicks "Templates" tab
3. Clicks "Minimal" template
4. Sees live preview: "Sonnet 4.5 • ~/my-project"
5. Clicks "Apply"
6. Status line immediately appears in Claude Code sessions
```

### Workflow 2: Power User Customization (5 minutes)

```
1. User opens Claude Owl → Settings → Status Line
2. Clicks "Widget Composer" tab
3. Adds widgets:
   - Model Name (color: orange)
   - Separator (•)
   - Git Branch (color: cyan)
   - Separator (•)
   - Session Cost (format: $0.00)
4. Drags widgets to reorder
5. Sees live preview update in real-time
6. Clicks "Export Script" to save standalone version
7. Clicks "Apply" to activate
```

### Workflow 3: Advanced Scripting (15 minutes)

```
1. User opens Claude Owl → Settings → Status Line
2. Clicks "Advanced" tab
3. Selects "Python" from language dropdown
4. Writes custom script with Monaco Editor
5. Clicks "Test with Sample Data"
6. Security scanner shows warnings (if any)
7. Adjusts script to fix issues
8. Clicks "Preview"
9. Verifies output looks correct
10. Clicks "Apply"
```

---

## Security Best Practices (User-Facing)

### Security Scorecard

```
┌─ Status Line Security Analysis ────────────────────┐
│                                                     │
│  ✅ No API keys detected                           │
│  ✅ No file system writes                          │
│  ✅ No network calls                               │
│  ⚠️  Executes git commands (medium risk)           │
│  ℹ️  Displays directory paths                      │
│                                                     │
│  Overall: LOW RISK                                 │
│                                                     │
│  Recommendations:                                   │
│  • Consider masking sensitive project names        │
│  • Limit git command execution to known repos      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Sensitive Data Masking

```typescript
// Optional feature: mask sensitive paths
const masking = {
  enabled: true,
  rules: [
    { pattern: '/home/user/clients/**', replace: '~/clients/[REDACTED]' },
    { pattern: '/work/proprietary/**', replace: '~/work/[MASKED]' },
  ],
};
```

---

## Integration with Existing Features

### 1. Permission System

Status line scripts respect permission rules:

```json
{
  "permissions": {
    "allow": [
      "Bash:git:*",  // Allow git commands for status line
    ],
    "deny": [
      "Bash:curl:*",  // Prevent network calls
      "Bash:wget:*",
    ]
  }
}
```

### 2. Project Context

When user selects a project in Claude Owl:
- Status line preview uses actual project path
- Git branch detection works with selected project
- Cost data can be project-specific

### 3. Hooks Integration

Status lines are a type of hook (`Status` event):

```json
{
  "hooks": {
    "Status": {
      "command": "~/.claude/statusline.sh",
      "enabled": true
    }
  }
}
```

Claude Owl's Status Line UI is a specialized editor for this hook type.

---

## Performance Considerations

### Caching Strategy

```typescript
class StatusLineCache {
  private cache = new Map<string, { value: string; expires: number }>();

  async getCached(key: string, ttl: number, fetcher: () => Promise<string>): Promise<string> {
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    const value = await fetcher();
    this.cache.set(key, { value, expires: Date.now() + ttl });
    return value;
  }
}

// Example: Cache git branch for 5 seconds
const branch = await cache.getCached('git-branch', 5000, () =>
  exec('git branch --show-current')
);
```

### Optimization Guidelines

**For Template Developers:**
- ✅ Cache git operations (branch, status) for 2-5 seconds
- ✅ Use `git -C <path>` instead of `cd && git`
- ✅ Avoid expensive operations (API calls, database queries)
- ✅ Keep output under 200 characters
- ✅ Exit quickly (< 100ms target)

**Performance Budget:**
- Script execution: < 100ms (50ms ideal)
- Update frequency: 300ms max (Claude Code limit)
- Memory usage: < 10MB per script

---

## Testing Strategy

### Unit Tests

```typescript
describe('StatusLineService', () => {
  it('should generate script from template', async () => {
    const script = await service.setTemplate('minimal');
    expect(script).toContain('jq -r .model.display_name');
  });

  it('should validate script syntax', async () => {
    await expect(service.setCustomScript('invalid bash')).rejects.toThrow();
  });

  it('should detect API keys in scripts', () => {
    const script = 'echo $ANTHROPIC_API_KEY';
    const issues = securityScanner.scanScriptForSecrets(script);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('high');
  });
});
```

### Integration Tests

```typescript
describe('StatusLine E2E', () => {
  it('should apply template and preview', async () => {
    // User selects template
    await statusLineUI.selectTemplate('minimal');

    // Preview updates
    const preview = await statusLineUI.getPreview();
    expect(preview).toMatch(/Sonnet 4\.5 • ~/);

    // Apply template
    await statusLineUI.clickApply();

    // Verify settings.json updated
    const settings = await readSettings('~/.claude/settings.json');
    expect(settings.statusLine.template).toBe('minimal');
  });
});
```

### Manual Testing Checklist

- [ ] Templates generate valid shell scripts
- [ ] Preview shows correct output
- [ ] Scripts execute in < 100ms
- [ ] ANSI colors render correctly
- [ ] Security scanner detects secrets
- [ ] Widget composer exports valid script
- [ ] Advanced editor syntax highlights correctly
- [ ] Changes persist across app restarts

---

## Consequences

### Positive

✅ **Accessibility** - Non-technical users can customize status lines without coding
✅ **Safety** - Built-in templates are audited and secure
✅ **Flexibility** - Power users can still write custom scripts
✅ **Integration** - Fits naturally into Claude Owl's settings management
✅ **Education** - Users learn about status lines through templates
✅ **Performance** - Templates follow optimization best practices
✅ **Security** - Sandbox mode and script scanning prevent data leaks

### Negative

⚠️ **Maintenance Burden** - Need to keep templates updated with Claude Code changes
⚠️ **Limited Preview** - Can't fully replicate real terminal environment
⚠️ **Platform Differences** - Scripts may behave differently on Windows/macOS/Linux
⚠️ **External Dependencies** - Advanced features (git, jq) may not be available on all systems

### Mitigations

1. **Template Versioning** - Track template versions, allow users to update
2. **Dependency Detection** - Warn if required tools (git, jq) not installed
3. **Cross-Platform Testing** - Test templates on all major platforms
4. **Fallback Behavior** - Graceful degradation if features unavailable

---

## Alternatives Considered

### Alternative 1: Integrate ccstatusline Directly ❌

**Rejected because:**
- Adds external npm dependency
- Requires Node.js runtime in user environment
- Harder to audit security
- License compatibility concerns
- Want first-class integration with Claude Owl UI

### Alternative 2: No UI, Only Documentation ❌

**Rejected because:**
- Misses opportunity to democratize feature
- Forces users to read docs and write scripts
- Doesn't align with Claude Owl's mission (visual configuration)
- No security scanning or validation

### Alternative 3: Web-Based Visual Editor Only ❌

**Rejected because:**
- Limits advanced users who want full scripting power
- Can't cover all use cases
- Forces compromise between simplicity and flexibility
- Better to offer multiple tiers (templates + composer + advanced)

---

## Implementation Roadmap

### Phase 1: Foundation (v0.3)

**Scope:**
- [ ] StatusLineService with template support
- [ ] 6 built-in templates (minimal, developer, full, cost, git, powerline)
- [ ] Template selector UI
- [ ] Live preview with mock data
- [ ] Settings.json integration
- [ ] Security scanner (basic)

**Deliverables:**
- Users can select and apply pre-built templates
- Preview shows what status line will look like
- Changes persist in `~/.claude/settings.json`

### Phase 2: Widget Composer (v0.4)

**Scope:**
- [ ] Widget library (15+ components)
- [ ] Drag-and-drop composer UI
- [ ] Color picker for styling
- [ ] Format customization
- [ ] Export to shell script
- [ ] Conditional display rules

**Deliverables:**
- Visual editor for building custom status lines
- No coding required for common use cases
- Export feature for version control

### Phase 3: Advanced Mode (v0.5)

**Scope:**
- [ ] Monaco Editor integration
- [ ] Multi-language support (Bash, Python, Node.js)
- [ ] Syntax validation
- [ ] Enhanced security scanning
- [ ] Script versioning
- [ ] Sandbox preview mode

**Deliverables:**
- Full scripting power for expert users
- Security warnings and best practice suggestions
- Safe testing environment

### Phase 4: Community & Optimization (v0.6)

**Scope:**
- [ ] Community template marketplace
- [ ] Template rating and reviews
- [ ] Performance profiling
- [ ] Caching recommendations
- [ ] Cross-platform compatibility testing
- [ ] Sensitive data masking

**Deliverables:**
- Users can discover and install community templates
- Performance tools help optimize slow scripts
- Enhanced privacy controls

---

## Success Metrics

### User Adoption
- **Target:** 60% of Claude Owl users enable status lines within first week
- **Measure:** Telemetry on status line configuration saves

### User Satisfaction
- **Target:** 4.5/5 stars for status line feature
- **Measure:** In-app feedback and GitHub issues

### Template Usage
- **Target:** 80% use built-in templates, 15% use composer, 5% use advanced
- **Measure:** Telemetry on configuration type distribution

### Performance
- **Target:** 95% of status line scripts execute in < 100ms
- **Measure:** Performance logging in preview mode

### Security
- **Target:** Zero security incidents related to status line scripts
- **Measure:** Issue tracking and security reports

---

## References

### Official Documentation
- [Claude Code Status Line Docs](https://code.claude.com/docs/en/statusline)

### Open Source Implementations
- [ccstatusline](https://github.com/sirmalloc/ccstatusline) - Interactive TUI configuration
- [claude-code-statusline](https://github.com/rz1989s/claude-code-statusline) - Enterprise-grade with advanced features

### Related ADRs
- ADR-001: Settings Management Architecture

### Security Resources
- OWASP Top 10
- Shell Script Security Best Practices
- ANSI Escape Code Injection Prevention

---

## Decision Owners

- **Product Strategy**: Product Team
- **Engineering Architecture**: Engineering Team
- **Security Review**: Security Team
- **UX Design**: Design Team
- **Implementation**: Phase 1-2 (v0.3-0.4), Phase 3-4 (v0.5-0.6)

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-16 | 1.0 | Initial ADR based on ecosystem research |
