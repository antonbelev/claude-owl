# Changelog

All notable changes to Claude Owl will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2025-01-16 [Beta - macOS Only]

### 🎉 Initial Beta Release

First public beta release of Claude Owl - a desktop application for visually managing Claude Code configurations without manual JSON editing.

---

### ✨ Features

#### 🏠 Dashboard
- **Claude Code CLI Detection**
  - Real-time detection of Claude CLI installation status
  - Display of installed version and path
  - Installation guide links when CLI not found
  - Manual refresh capability

- **API Service Status Monitor**
  - Live status feed from status.claude.com
  - Operational/degraded/outage indicators with color coding
  - Recent incident timeline (last 3 days)
  - Incident update tracking with timestamps
  - Direct link to full status page

#### ⚙️ Settings Management
- **Three-Level Settings Hierarchy**
  - User Settings (`~/.claude/settings.json`) - global preferences
  - Project Settings (`.claude/settings.json`) - project-specific configs
  - Local Settings (`.claude/settings.local.json`) - gitignored overrides
  - Managed Settings (read-only) - organization policies

- **Core Configuration Editor**
  - Default model selection (Sonnet, Opus, Haiku)
  - Session timeout configuration
  - Disable all hooks toggle
  - Extension management settings

- **Advanced Permissions Editor** ⭐
  - Visual permission rule builder with 9+ tool types
  - Three permission levels: Allow, Ask, Deny
  - Pattern matching support (glob patterns, domain filters)
  - Individual rule cards with edit/delete actions
  - Color-coded rules (green/yellow/red) by permission level
  - 6 pre-built security templates:
    1. Block Environment Files (.env protection)
    2. Allow npm Scripts (safe development)
    3. Git Read-Only (confirm destructive operations)
    4. Block Secrets Directory (protect sensitive paths)
    5. Allow Trusted Domains (WebFetch whitelist)
    6. Block Dangerous Commands (rm -rf, sudo, etc.)
  - Interactive rule tester with match preview
  - Live validation with pattern syntax checking
  - Example matching previews for each rule
  - Compact UI (4x more rules visible without scrolling)

- **Environment Variables Editor**
  - Key-value pair management
  - Add/remove environment variables
  - Validation for key formats

- **Settings Operations**
  - Save/discard changes with dirty state tracking
  - Pre-save validation with detailed error messages
  - Success/error notifications
  - Backup and restore functionality
  - ESC key support for modal dismissal
  - Raw JSON editor mode (view-only)

#### 📊 Status Line Manager
- **Template Gallery**
  - 10+ pre-built templates organized by skill level:
    - Beginner: Basic Info, Simple Git
    - Intermediate: Git + Cost, Project Context
    - Advanced: Full Developer, Cost Tracker
    - Specialized: Git Guardian, Language Detective
  - Template categorization and filtering
  - Difficulty level indicators

- **Live Preview System**
  - Real-time preview with mock session data
  - Shows both rendered output and script code
  - Execution time tracking
  - Dependency warnings (git, jq, etc.)

- **Template Application**
  - One-click template application
  - Automatic script file creation in `~/.claude/`
  - Automatic executable permissions (chmod +x)
  - Auto-update of settings.json
  - Success confirmation with script details

- **Status Line Management**
  - Active status line indicator
  - Disable/enable current status line
  - Warning banner when hooks are disabled
  - Community project links (open in external browser)

#### 🤖 Subagents Manager
- **Agent Creation & Editing**
  - Visual form-based agent creation
  - Name validation (lowercase-with-hyphens pattern)
  - Rich description support
  - System prompt editor with markdown support
  - Model selection: Sonnet, Opus, Haiku, Inherit, Default
  - Tool restriction configuration (comma-separated)
  - Location selection (User/Project)

- **Agent Display**
  - Grid view with agent cards
  - Shows name, description, model, tool count
  - Location badges (User/Project/Plugin)
  - Last modified timestamps
  - Click to view full details

- **Agent Details Modal**
  - Full system prompt display with markdown rendering
  - Complete tool list
  - File path and metadata
  - Edit/Delete actions (disabled for plugin agents)
  - ESC key dismissal

- **Search & Filter**
  - Real-time search by name or description
  - Instant filtering as you type

#### 🎯 Skills Manager
- **Skill Creation**
  - Upload markdown files (.md) with auto-parsing
  - Manual form-based creation
  - Frontmatter validation (name, description, allowed-tools)
  - Supporting files detection and tracking
  - Location selection (User/Project)

- **Skill Display**
  - Grid view with skill cards
  - File count and tool count indicators
  - Location badges (User/Project/Plugin)
  - Hover effects for better UX

- **Skill Details Modal**
  - Full instructions display with markdown rendering
  - Allowed tools list
  - Supporting files list with paths
  - File location and last modified timestamp
  - Delete option (disabled for plugin skills)
  - ESC key dismissal

- **Validation**
  - Markdown frontmatter schema validation
  - Character limits (name: 64, description: 1024)
  - Name pattern validation
  - Warnings for missing optional fields

- **Unsaved Changes Protection**
  - Confirmation dialog before closing with unsaved changes
  - Dirty state tracking

#### ⚡ Slash Commands Manager
- **Command Creation**
  - Multi-step wizard with validation:
    1. Name and namespace configuration
    2. Frontmatter form (description, argument-hint, model, tools)
    3. Content editor (markdown)
  - Tool selector with preset combinations
  - Security warnings for dangerous command patterns
  - Location selection (User/Project)

- **GitHub Import Integration**
  - GitHub repository browser
  - Folder navigation with breadcrumbs
  - Select and import .md files directly
  - Metadata tracking (source URL)
  - Batch import support

- **Command Display**
  - Grid view with usage preview (`/namespace:command`)
  - Namespace display and grouping
  - Model and tool count badges
  - Location badges (User/Project/Plugin/MCP)

- **Search & Filter**
  - Multi-field search (name, description, namespace, content)
  - Location filter dropdown (All/User/Project/Plugin/MCP)
  - Category filtering
  - Real-time results

- **Command Details Modal**
  - Full content display with markdown rendering
  - Usage examples
  - Imported source tracking with links
  - ESC key dismissal

#### 🪝 Hooks Viewer (Read-Only)
- **8 Hook Events Support**
  - SessionStart, SessionEnd, Status
  - ToolBefore, ToolAfter
  - ToolErrorBefore, ToolErrorAfter
  - PromptHook

- **Event Cards Display**
  - Event name and description
  - Trigger timing information
  - Hook count badges
  - Validation status indicators (green/yellow/red)
  - Available context variables documentation
  - Matcher requirements

- **Hook Details Modal**
  - Script path and full content display
  - Validation results with severity levels
  - Security warnings for dangerous patterns
  - "Edit in settings.json" button (opens external editor)

- **Security Features**
  - Security warning banner
  - Validation score indicators
  - Security issue detection and reporting

- **Template Gallery**
  - Pre-built hook examples
  - Template descriptions and use cases
  - Category organization

- **Documentation Integration**
  - Per-event documentation links
  - Opens in default system browser

**Note:** Phase 1 is VIEW-ONLY. Template-based hook editing planned for Phase 2.

#### 🔌 MCP Servers Manager
- **Server Browsing**
  - Grid view of installed MCP server cards
  - Server name, type, and scope display
  - Server detail view modal

- **Server Configuration**
  - Add new servers via form
  - Scope selection (User/Project/Local)
  - Command and arguments configuration
  - Environment variable management

- **Server Cards**
  - Server type indicators
  - Scope badges (User/Project/Local)
  - Remove server action
  - View details button

- **Scope Filtering**
  - Filter by User/Project/Local scope
  - Refresh functionality

- **Server Details Modal**
  - Full configuration display
  - Environment variables list
  - Command and arguments
  - Remove option

#### 📈 Sessions (ccusage Integration)
- **Installation Detection**
  - Automatic ccusage CLI detection
  - Installation instructions when not found
  - Direct link to GitHub repository

- **Usage Display**
  - Raw ccusage output in terminal-style display
  - Session-by-session token usage
  - Cost calculations per session
  - Model information
  - Version information display

- **Data Management**
  - Refresh data button
  - Empty states with helpful guidance

- **External Links**
  - GitHub repository links (open in default browser)
  - Installation guide links

#### 📝 Debug Logs Viewer
- **Log File Browser**
  - List all logs from `~/.claude/debug/`
  - File names with embedded timestamps
  - Search/filter log files
  - Selected log highlighting

- **Log Content Viewer**
  - Full log content display
  - Syntax highlighting for readability
  - Line numbers
  - Timestamp parsing and formatting

- **Log Management**
  - Select any log to view
  - Delete individual log files
  - Search within log contents
  - Clear search functionality

#### 🔍 Project Discovery
- **Project Detection**
  - Reads `~/.claude.json` for project list
  - Displays recent Claude Code projects
  - Project metadata display

- **Project Selection**
  - Select project for project-level settings
  - Clear selection / change project
  - Project context maintained across app
  - Recent projects quick access

#### 🧩 Plugin System (Under Development)
- **Three-Tab Interface**
  - Browse (marketplace plugins)
  - Installed (local plugins)
  - Marketplaces (manage plugin sources)

- **Marketplace Management**
  - Add/remove marketplace sources
  - Multiple marketplace support
  - Marketplace metadata display

- **Plugin Display**
  - Grid/List view toggle
  - Plugin name, description, version
  - Category badges
  - Installation status indicators

- **Search & Filter**
  - Multi-field search (name, description, keywords)
  - Marketplace filter dropdown
  - Category filter
  - Feature filters (has commands/agents/skills)

- **Plugin Actions**
  - Install from marketplace
  - Uninstall plugins
  - Enable/disable toggle
  - View plugin details

**Note:** Marked as "under development" in sidebar navigation.

---

### 🏗️ Architecture & Technical

#### Three-Process Architecture
- **Main Process** (Node.js backend)
  - File system operations
  - Claude CLI execution
  - IPC handlers for renderer communication
  - 15+ backend services

- **Renderer Process** (React frontend)
  - React 18 with TypeScript
  - Zustand for state management
  - Tailwind CSS for styling
  - shadcn/ui component library

- **Preload Script** (Secure IPC bridge)
  - Context isolation enabled
  - Type-safe IPC communication
  - Limited API exposure to renderer

#### Backend Services (15+)
- **Core Services:**
  - FileSystemService - File operations
  - ValidationService - Config validation
  - PathService - Path resolution

- **Feature Services:**
  - ClaudeService - CLI detection
  - StatusService - API status monitoring
  - SettingsService - Settings CRUD
  - PermissionRulesService - Rule validation/matching
  - AgentsService - Subagent management
  - SkillsService - Skills management
  - CommandsService - Slash commands
  - HooksService - Hooks reading/validation
  - StatusLineService - Status line templates
  - MCPService - MCP server management
  - PluginsService - Plugin marketplace
  - DebugLogsService - Log file access
  - CCUsageService - Usage data integration
  - GitHubService - GitHub repository browsing
  - ProjectDiscoveryService - Project detection

#### Shared Infrastructure
- **UI Components** (shadcn/ui based):
  - Button, Card, Badge, Alert
  - Input, Textarea, Select, Checkbox
  - Tabs, Dropdown, Dialog, Radio Group
  - Tooltip, Scroll Area, Table, Skeleton

- **Common Patterns:**
  - ESC key support - Close modals with Escape
  - Unsaved changes warnings - Confirm before discarding
  - Loading states - Spinners and skeleton loaders
  - Error handling - Alert components with retry
  - Empty states - Helpful messages with CTAs
  - Search/filter - Real-time filtering
  - Location badges - User/Project/Plugin/MCP
  - Validation - Frontend and backend
  - External links - Open in default browser

#### Logging Infrastructure
- **Comprehensive Logging:**
  - Console logging throughout app
  - Format: `[Component/Service] Action: details`
  - DEBUG, INFO, WARN, ERROR levels
  - IPC request/response logging
  - Error stack traces

#### Type Safety
- **Strict TypeScript** configuration
- **Shared types** between main and renderer
- **IPC type safety** - all requests/responses typed
- **Zod schemas** for runtime validation
- **No `any` types** without justification

#### Configuration Management
- **File Access Policy:**
  - ✅ User Settings: Full read/write (`~/.claude/settings.json`)
  - ✅ Project Discovery: Read `~/.claude.json` for project list
  - ✅ Project Settings: Read/write after user selects project
  - ❌ Never write to `.claude.json` (CLI-managed)
  - ❌ Never assume project context

- **Settings Merge Hierarchy:**
  - User → Project → Local (gitignored)
  - Proper precedence handling

#### Security Features
- **Context isolation** enabled
- **Limited Node.js API** exposure
- **Input validation** before file operations
- **Path sanitization** to prevent traversal
- **Permission rule validation**
- **Security scanning** for hook scripts

---

### 🧪 Testing & Quality

#### Test Coverage
- **11+ unit tests** across components and services
- **Vitest + React Testing Library**
- **Mock electron API** for renderer tests
- **Component tests** with renderHook
- **Service tests** with mocked fs operations

#### Code Quality Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Strict type checking
- **CI Pipeline** - Automated checks on every commit

#### CI/CD Pipeline
- ✅ Lint checks
- ✅ Type checking
- ✅ Unit tests
- ✅ Build verification (main, renderer, preload)
- ⚠️ Security scanning (Trivy)
- ⚠️ Integration tests (optional)

---

### 📦 Build & Distribution

#### Build System
- **Vite** for renderer builds
- **esbuild** for main/preload processes
- **Electron Builder** for packaging
- **Support for:**
  - Development mode (`npm run dev:electron`)
  - Production builds (`npm run build`)
  - Platform-specific packaging (macOS .dmg)

#### Package Scripts
- `npm run dev:electron` - Development mode
- `npm run build` - Build all targets
- `npm run test:unit` - Run unit tests
- `npm run typecheck` - Type checking
- `npm run lint` - Code linting
- `npm run format` - Code formatting
- `npm run package:mac` - Build macOS installer

---

### 📚 Documentation

#### Developer Documentation
- **CLAUDE.md** - Comprehensive development guide
  - Architecture overview
  - IPC communication patterns
  - Adding new features workflow
  - Testing patterns
  - Code style guidelines
  - Logging best practices
  - Development workflow

- **ADR-001** - Settings Management Redesign
  - Architecture decision record
  - File access policies
  - Design constraints

- **Demo Guide** - Step-by-step demo walkthrough
  - 10-minute video script
  - Copy-paste examples
  - Talking points

#### Code Documentation
- **Inline comments** for complex logic
- **JSDoc** for public APIs
- **README.md** - Project overview and quick start

---

### 🎨 User Experience

#### Design Principles
- **Visual over manual** - Replace JSON editing with forms
- **Safety first** - Confirmation dialogs, validation, backups
- **Progressive disclosure** - Hide complexity until needed
- **Keyboard accessibility** - ESC, Enter, Tab navigation
- **Responsive feedback** - Loading states, success/error messages

#### UI/UX Features
- Dark mode support (system preference)
- Responsive layouts
- Hover states and transitions
- Empty states with helpful guidance
- Error boundaries for crash prevention
- Toast notifications for operations
- Modal dialogs with backdrop blur
- Skeleton loaders for async data

---

### ⚠️ Known Limitations

#### Phase 1 Restrictions
- **Hooks:** View-only (template-based editing planned for Phase 2)
- **Plugins:** Under development (marketplace integration incomplete)
- **Platform:** macOS only (Windows/Linux planned for future releases)

#### External Dependencies
- **Claude CLI** required for full functionality
- **ccusage** optional (for Sessions page)
- **git** optional (for status line templates)

---

### 🔮 Future Roadmap

#### Planned Features
- **Phase 2:**
  - Template-based hook editing
  - Complete plugin marketplace integration
  - Advanced validation and testing tools
  - Export/import configuration bundles

- **Future Releases:**
  - Windows support
  - Linux support
  - Team/organization settings sync
  - Configuration version control
  - Claude Code project templates

---

### 📊 Project Statistics

- **Lines of Code:** 2,000+ production code
- **Components:** 50+ React components
- **Services:** 15+ backend services
- **Tests:** 11+ unit tests
- **TypeScript Files:** 100+
- **Build Time:** <10 seconds
- **Bundle Size:** ~50MB (including Electron runtime)

---

### 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- State management with [Zustand](https://zustand-demo.pmnd.rs/)

---

### 📝 Notes

This is a **BETA release** for macOS only. Expect bugs and rough edges. Please report issues on GitHub.

**Important:** Claude Owl is a standalone desktop application. It does NOT have access to your current working directory or project structure. It manages Claude Code configurations through the official config file locations (`~/.claude/` and `{PROJECT}/.claude/`).

---

## Version History

- **0.1.0** - 2025-01-16 - Initial Beta Release (macOS)

---

**Next Release:** TBD
