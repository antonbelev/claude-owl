# ADR-008: Native Usage Metrics & Analytics System

**Status:** Proposed
**Date:** 2025-11-26
**Deciders:** Engineering Team, Product Owner
**Context:** Token usage tracking, cost analytics, and session insights for Claude Code users

---

## Context and Problem Statement

Claude Owl currently depends on the external `ccusage` CLI tool for token usage reporting. While ccusage is excellent for terminal-based analytics, this creates several limitations:

1. **External Dependency**: Users must separately install ccusage
2. **No Visual Analytics**: Text-based output lacks charts, trends, and interactive exploration
3. **Limited Features**: Cannot provide Claude Owl-specific insights (project comparisons, budget alerts, etc.)
4. **No Persistence**: No historical tracking beyond what ccusage parses from JSONL files
5. **CLI-Only**: Cannot leverage GUI advantages (filtering, drill-down, export, etc.)

**Goal:** Build a native, first-class metrics and analytics system within Claude Owl that eliminates the ccusage dependency while providing superior UX and deeper insights.

---

## How ccusage Works (Analysis)

### Data Source
- **Claude Code JSONL Files**: `~/.claude/projects/{project-name}/*.jsonl`
- Each file represents a conversation session (UUID-based filename)
- Contains message-level data with token usage in `message.usage` field

### JSONL Entry Structure
```json
{
  "type": "assistant",
  "sessionId": "104c584d-4191-4bb8-990e-a41a6b8596db",
  "cwd": "/Users/user/Projects/my-project",
  "version": "2.0.53",
  "gitBranch": "develop",
  "message": {
    "model": "claude-sonnet-4-5-20250929",
    "id": "msg_01...",
    "role": "assistant",
    "usage": {
      "input_tokens": 3,
      "cache_creation_input_tokens": 28988,
      "cache_read_input_tokens": 0,
      "cache_creation": {
        "ephemeral_5m_input_tokens": 28988,
        "ephemeral_1h_input_tokens": 0
      },
      "output_tokens": 1,
      "service_tier": "standard"
    }
  },
  "timestamp": "2025-11-26T22:40:25.146Z"
}
```

### ccusage Features
- **Report Types**: Daily, monthly, session, 5-hour billing blocks
- **Live Monitoring**: Real-time dashboard with burn rate projections
- **Cost Breakdown**: Per-model pricing (Opus, Sonnet 4, etc.)
- **Cache Tracking**: Separates cache creation vs. cache read tokens
- **Filters**: Date ranges, project filtering, timezone support
- **Export**: JSON output for programmatic access

### ccusage Limitations
- **No GUI**: Terminal-only, no charts or visual trends
- **No Persistence**: Re-parses JSONL files on every run
- **No Budgets**: Cannot set spending limits or alerts
- **No Comparisons**: Cannot compare projects, models, or time periods visually
- **No Forecasting**: Limited predictive analytics

---

## Decision: Native Metrics System Architecture

Build a comprehensive, native metrics system with three layers:

### Layer 1: Data Ingestion Service
Parse Claude Code JSONL files and store aggregated metrics in local database.

### Layer 2: Analytics Engine
Process raw metrics into insights, trends, and forecasts.

### Layer 3: Visualization Layer
Rich, interactive charts and dashboards using React components.

---

## Detailed Feature Design (Product Owner Perspective)

### 1. Dashboard Overview (Landing Page)

**User Story**: "As a Claude Code user, I want to see my usage at-a-glance when I open the Metrics page"

**Features**:
- **Current Month Summary**
  - Total tokens (input, output, cache create, cache read)
  - Total cost in USD
  - Sessions count
  - Messages count
  - Average cost per session
  - Comparison to previous month (% change)

- **Today's Activity**
  - Tokens used today
  - Cost today
  - Active projects
  - Burn rate ($/hour estimate)

- **Visual Cards**
  - Sparkline charts showing 7-day trend
  - Color-coded spending indicators (green = under budget, yellow = approaching limit, red = over budget)

- **Quick Actions**
  - "View Session Details"
  - "Set Budget Alert"
  - "Export This Month's Data"
  - "Refresh Data" (re-scan JSONL files)

**Technical Implementation**:
- React component: `MetricsDashboard.tsx`
- Data source: SQLite queries for aggregated daily/monthly totals
- Chart library: Recharts (React-based, responsive)

---

### 2. Usage Trends (Time-Series Analytics)

**User Story**: "As a user tracking costs, I want to visualize my usage over time to identify patterns and optimize spending"

**Features**:

**2.1. Time-Series Line Chart**
- **X-axis**: Date (last 7/30/90 days or custom range)
- **Y-axis (dual)**: Tokens (left) and Cost (right)
- **Lines**:
  - Input tokens (blue)
  - Output tokens (green)
  - Cache read tokens (yellow)
  - Cache creation tokens (purple)
  - Total cost (red, secondary axis)
- **Interactions**:
  - Hover tooltip showing exact values
  - Click data point to see that day's sessions
  - Zoom/pan for custom date ranges

**2.2. Stacked Area Chart (Token Composition)**
- Show proportion of input vs output vs cache tokens over time
- Identify cache efficiency trends (more cache reads = better cost optimization)

**2.3. Cost Breakdown Chart (Pie/Donut)**
- Per-model costs (e.g., Sonnet 4: 68%, Opus: 25%, Haiku: 7%)
- Per-project costs
- Interactive: Click slice to drill down

**2.4. Filters & Grouping**
- **Date Range Picker**: Last 7/30/90 days, custom range
- **Group By**: Daily, Weekly, Monthly
- **Project Filter**: All projects, or specific project
- **Model Filter**: All models, or specific model (e.g., only Sonnet 4)

**Technical Implementation**:
- Component: `UsageTrendsPage.tsx`
- Charts: Recharts (`LineChart`, `AreaChart`, `PieChart`)
- Data: SQLite query with date range and grouping
- State management: Zustand store for filter selections

---

### 3. Session Explorer (Detailed Logs)

**User Story**: "As a power user, I want to drill down into individual sessions to understand what drove costs"

**Features**:

**3.1. Session List Table**
- Columns:
  - Session ID (truncated, click to expand)
  - Project Path
  - Start Time / End Time
  - Duration
  - Messages Count
  - Total Tokens
  - Cache Hit Rate (%)
  - Total Cost ($)
  - Model Used
  - Git Branch (if available)
- Sorting: Click any column header
- Search: Filter by project path, session ID
- Pagination: 50 sessions per page

**3.2. Session Detail View**
- Click row to open side panel or modal with:
  - **Message-by-Message Breakdown**:
    - Each message shows: timestamp, role (user/assistant), tokens used, cost
    - Color-coded by model
  - **Session Timeline**:
    - Visual timeline showing message flow
    - Cache creation events highlighted (purple)
    - Cache read events highlighted (yellow)
  - **Session Stats**:
    - Average tokens per message
    - Cache efficiency score (read tokens / total cache tokens)
    - Most expensive message (highlight outlier)
  - **Export Session**:
    - "Export as JSON" button
    - "Copy Session ID" button

**3.3. Filters**
- Date range
- Project path
- Model type
- Cost threshold (e.g., "sessions over $1")

**Technical Implementation**:
- Component: `SessionExplorerPage.tsx`
- Table: React Table v8 (sorting, filtering, pagination)
- Detail view: Side drawer component (`SessionDetailDrawer.tsx`)
- Data: SQLite queries joining sessions + messages tables

---

### 4. Project Comparison

**User Story**: "As a developer working on multiple projects, I want to compare usage across projects to identify which consume the most resources"

**Features**:

**4.1. Project Stats Table**
- Columns:
  - Project Name/Path
  - Total Sessions
  - Total Tokens
  - Total Cost
  - Average Cost per Session
  - Last Activity Date
  - Most Used Model
- Sorting: Any column
- Highlight: Top 3 most expensive projects (red/yellow)

**4.2. Project Comparison Chart (Bar Chart)**
- **X-axis**: Project names
- **Y-axis**: Total cost (or tokens)
- **Grouped Bars**: Input tokens, output tokens, cache tokens
- Click bar to filter other views to that project

**4.3. Project Timeline Overlay**
- Line chart showing all projects' costs over time (multi-line)
- Each project = different color
- Legend: Toggle visibility per project

**Technical Implementation**:
- Component: `ProjectComparisonPage.tsx`
- Charts: Recharts (`BarChart`, `LineChart`)
- Data: SQLite query aggregating by project path

---

### 5. Model Analytics

**User Story**: "As a user optimizing costs, I want to understand which models I use and their relative costs"

**Features**:

**5.1. Model Usage Breakdown**
- Pie chart: Percentage of sessions by model
- Bar chart: Total cost per model
- Table: Model stats
  - Model Name
  - Sessions Count
  - Total Tokens
  - Average Tokens per Session
  - Total Cost
  - Average Cost per Message

**5.2. Model Over Time**
- Stacked area chart showing model usage evolution
- Identify migration patterns (e.g., Opus → Sonnet 4)

**5.3. Cost Efficiency Score**
- Calculate "value per token" (subjective metric based on output quality assumptions)
- Rank models by cost efficiency

**Technical Implementation**:
- Component: `ModelAnalyticsPage.tsx`
- Data: SQLite query grouping by model name

---

### 6. Budget & Alerts

**User Story**: "As a cost-conscious user, I want to set spending limits and receive alerts when approaching them"

**Features**:

**6.1. Budget Configuration**
- Set monthly budget ($)
- Set per-project budgets (optional)
- Set warning thresholds (e.g., 80%, 90%, 100%)

**6.2. Budget Tracking Dashboard**
- Visual progress bar: Current spending vs. budget
- Color-coded: Green (under 80%), Yellow (80-100%), Red (over budget)
- Projected end-of-month spending (based on daily burn rate)

**6.3. Alerts**
- **In-App Notifications**: Badge on sidebar when threshold crossed
- **Visual Indicators**: Red warning icon on dashboard
- **Alert History**: Log of past alerts with timestamps

**6.4. Budget Reset**
- Automatic monthly reset
- Manual reset option

**Technical Implementation**:
- Budget storage: SQLite table `budgets` (project_path, monthly_limit, thresholds)
- Alert logic: Background job checking current month spending vs. budget
- Notifications: Electron notification API + in-app badge
- Component: `BudgetSettingsPage.tsx`

---

### 7. Cache Optimization Insights

**User Story**: "As a performance-focused user, I want to maximize cache efficiency to reduce costs"

**Features**:

**7.1. Cache Efficiency Dashboard**
- **Overall Cache Hit Rate**: (cache read tokens / total tokens) × 100%
- **Cache Savings**: Cost saved by cache reads (vs. paying full input price)
- **Cache Miss Analysis**: Identify sessions with low cache utilization

**7.2. Cache Trends**
- Line chart: Cache hit rate over time
- Goal: Increase cache hit rate (target: >50%)

**7.3. Recommendations**
- "Your cache hit rate is 35%. Consider enabling more aggressive caching in settings."
- "Project X has 0% cache usage. Check Claude Code configuration."

**Technical Implementation**:
- Component: `CacheOptimizationPage.tsx`
- Calculation: SQLite queries on cache_read_tokens and cache_creation_tokens
- Recommendations: Rule-based logic (if hit_rate < 30% → suggest enabling caching)

---

### 8. Export & Reporting

**User Story**: "As a user needing to report usage to management, I want to export data in standard formats"

**Features**:

**8.1. Export Formats**
- **CSV**: Session-level or message-level data
- **JSON**: Full structured data
- **PDF Report**: Pre-formatted monthly report with charts (future enhancement)

**8.2. Export Options**
- **Date Range**: Custom date selection
- **Scope**: All projects, single project, or filtered sessions
- **Fields**: Select which columns to include

**8.3. Scheduled Exports** (Future)
- Auto-export monthly reports to file path
- Email integration (requires SMTP config)

**Technical Implementation**:
- Export service: `ExportService.ts` in main process
- CSV generation: `papaparse` library
- JSON: Native JSON.stringify
- PDF: `pdfkit` or `puppeteer` (headless Chrome)
- Component: `ExportDialog.tsx`

---

### 9. Real-Time Monitoring (Live Dashboard)

**User Story**: "As an active developer, I want to see real-time usage while I'm coding"

**Features**:

**9.1. Live Session Tracking**
- Detect new JSONL entries using file watcher
- Update dashboard in real-time (no refresh needed)
- Show "Active Sessions" indicator

**9.2. Burn Rate Monitor**
- Current burn rate: $/hour (calculated from last 5 messages)
- Projected daily cost (if rate continues)
- Warning if burn rate exceeds threshold

**9.3. Live Activity Feed**
- Stream of recent messages:
  - "10:42 AM - claude-owl project: +1,234 tokens ($0.05)"
  - "10:45 AM - my-app project: +567 tokens ($0.02)"
- Limit: Last 20 events

**Technical Implementation**:
- File watching: Node.js `fs.watch()` or `chokidar` library
- Real-time updates: WebSocket or IPC events from main to renderer
- Component: `LiveMonitoringPage.tsx`
- State: Zustand store with real-time updates

---

### 10. Advanced Analytics (Future Enhancements)

**10.1. Predictive Forecasting**
- Machine learning model to predict monthly costs based on trends
- "At your current pace, you'll spend $X this month"

**10.2. Anomaly Detection**
- Identify unusual spikes in usage
- Alert user: "Your usage increased 300% today. Check session ABC."

**10.3. Comparative Benchmarks**
- "Your average cost per session is $0.15. Similar users average $0.10."
- (Requires opt-in anonymous telemetry)

**10.4. Custom Dashboards**
- Drag-and-drop widget builder
- Users create personalized metrics views

**10.5. Integrations**
- Export to Google Sheets
- Zapier webhooks for alerts
- Slack notifications

---

## Data Storage Architecture (Technical Design)

### Storage Technology: SQLite

**Rationale**:
- **Electron-friendly**: Bundled with app, no external DB installation
- **Fast**: Optimized for local queries, millions of rows
- **Reliable**: ACID-compliant, crash-safe
- **Portable**: Single file database (easy backup/export)
- **Queryable**: Full SQL support for complex analytics

**Alternatives Considered**:
- ❌ **IndexedDB**: Slow, browser security overhead, poor multi-tab support
- ❌ **JSON Files**: No query optimization, slow for large datasets
- ❌ **In-Memory**: Loses data on app restart

**References**:
- [Electron Database - SQLite Best Practices](https://rxdb.info/electron-database.html)
- [Offline-first frontend apps in 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [How to persist data in an Electron app](https://stackoverflow.com/questions/35660124/how-to-persist-data-in-an-electron-app)

### Database Schema

```sql
-- Sessions table (one row per conversation session)
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,           -- UUID from JSONL filename
  project_path TEXT NOT NULL,            -- Absolute path to project
  git_branch TEXT,                       -- Git branch (if available)
  claude_version TEXT,                   -- Claude Code version (e.g., "2.0.53")
  start_time DATETIME NOT NULL,          -- First message timestamp
  end_time DATETIME,                     -- Last message timestamp (NULL if ongoing)
  message_count INTEGER DEFAULT 0,       -- Total messages in session
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_cache_creation_tokens INTEGER DEFAULT 0,
  total_cache_read_tokens INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0.0,       -- Calculated total cost
  primary_model TEXT,                    -- Most used model in session
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX idx_sessions_project ON sessions(project_path);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_sessions_cost ON sessions(total_cost_usd);

-- Messages table (one row per message in JSONL)
CREATE TABLE messages (
  message_id TEXT PRIMARY KEY,           -- Message UUID from JSONL
  session_id TEXT NOT NULL,              -- Foreign key to sessions
  message_role TEXT NOT NULL,            -- 'user' or 'assistant'
  model_name TEXT,                       -- e.g., "claude-sonnet-4-5-20250929"
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cache_creation_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  ephemeral_5m_tokens INTEGER DEFAULT 0, -- 5-minute cache tokens
  ephemeral_1h_tokens INTEGER DEFAULT 0, -- 1-hour cache tokens
  cost_usd REAL DEFAULT 0.0,             -- Cost for this message
  timestamp DATETIME NOT NULL,
  parent_message_id TEXT,                -- Conversation threading
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_model ON messages(model_name);

-- Daily aggregates (pre-computed for fast dashboard loading)
CREATE TABLE daily_stats (
  date DATE PRIMARY KEY,                 -- YYYY-MM-DD
  project_path TEXT,                     -- NULL = all projects aggregate
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_cache_creation_tokens INTEGER DEFAULT 0,
  total_cache_read_tokens INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0.0,
  unique_models TEXT,                    -- JSON array of models used
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_stats_date ON daily_stats(date);
CREATE INDEX idx_daily_stats_project ON daily_stats(project_path);

-- Model stats (per-model aggregates)
CREATE TABLE model_stats (
  model_name TEXT PRIMARY KEY,
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0.0,
  first_used DATETIME,
  last_used DATETIME,
  avg_tokens_per_message REAL DEFAULT 0.0
);

-- Project stats (per-project aggregates)
CREATE TABLE project_stats (
  project_path TEXT PRIMARY KEY,
  project_name TEXT,                     -- Derived from path (last segment)
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0.0,
  first_activity DATETIME,
  last_activity DATETIME,
  primary_model TEXT
);

-- Budgets (user-defined spending limits)
CREATE TABLE budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL,                   -- 'global' or 'project'
  project_path TEXT,                     -- NULL if scope='global'
  period TEXT NOT NULL,                  -- 'monthly', 'weekly', 'daily'
  limit_usd REAL NOT NULL,               -- Budget amount
  warning_threshold REAL DEFAULT 0.8,    -- Alert at 80%
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scope, project_path, period)
);

-- Budget alerts history
CREATE TABLE budget_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  budget_id INTEGER NOT NULL,
  alert_type TEXT NOT NULL,              -- 'warning', 'limit_exceeded'
  current_spending REAL NOT NULL,
  limit_amount REAL NOT NULL,
  percentage_used REAL NOT NULL,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  acknowledged BOOLEAN DEFAULT 0,
  FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE
);

-- Pricing data (model costs per token)
CREATE TABLE model_pricing (
  model_name TEXT PRIMARY KEY,
  input_cost_per_mtok REAL NOT NULL,     -- Cost per 1M input tokens
  output_cost_per_mtok REAL NOT NULL,    -- Cost per 1M output tokens
  cache_creation_cost_per_mtok REAL DEFAULT 0.0,
  cache_read_cost_per_mtok REAL DEFAULT 0.0,
  effective_date DATE NOT NULL,          -- When pricing took effect
  source TEXT DEFAULT 'anthropic'        -- 'anthropic', 'manual', etc.
);

-- Sync metadata (track JSONL ingestion state)
CREATE TABLE sync_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jsonl_file_path TEXT UNIQUE NOT NULL,  -- Absolute path to JSONL file
  last_synced_at DATETIME,
  last_modified_at DATETIME,             -- File mtime
  line_count INTEGER DEFAULT 0,          -- Lines processed
  sync_status TEXT DEFAULT 'pending',    -- 'pending', 'syncing', 'completed', 'error'
  error_message TEXT
);

CREATE INDEX idx_sync_status ON sync_metadata(sync_status);
```

### Database Location
- **Path**: `{app.getPath('userData')}/metrics.db`
- **Example**:
  - macOS: `/Users/user/Library/Application Support/claude-owl/metrics.db`
  - Windows: `C:\Users\user\AppData\Roaming\claude-owl\metrics.db`
  - Linux: `/home/user/.config/claude-owl/metrics.db`
- **Key Insight**: `userData` directory persists across app updates (not deleted during reinstall)
- **Backup**: Auto-backup to `metrics.db.backup` on schema migrations

---

## Database Versioning & Migration Strategy

### Critical Constraint: Data Must Survive App Updates

**Problem**: When users download a new version of Claude Owl (e.g., v0.4.0 → v0.5.0), the app binary gets replaced but **user data must persist**.

**Solution**: Electron's `app.getPath('userData')` returns a **user-specific data directory** that is:
- ✅ **Persistent** - Never deleted during app updates/reinstalls
- ✅ **User-specific** - Separate from app installation directory
- ✅ **Cross-platform** - Standardized location per OS

### Directory Structure (Production)

```
# macOS Example
/Applications/Claude Owl.app/                  # App binary (replaced on update)
/Users/user/Library/Application Support/
  └── claude-owl/                              # userData (PERSISTS)
      ├── metrics.db                           # Primary database
      ├── metrics.db.backup                    # Auto-backup (latest)
      ├── metrics.db.backup.20250115           # Timestamped backups
      ├── migrations/                          # Migration history
      │   └── migration.log                    # Applied migrations log
      └── logs/
          └── metrics-service.log              # Debug logs

# The app binary changes, but userData directory stays intact
```

### Database Schema Versioning

Add a `schema_version` table to track migrations:

```sql
CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,               -- Schema version number (1, 2, 3...)
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  migration_name TEXT NOT NULL,              -- e.g., "add_budgets_table"
  rollback_sql TEXT                          -- SQL to undo this migration (optional)
);

-- Insert initial version
INSERT INTO schema_version (version, migration_name)
VALUES (1, 'initial_schema');
```

### Migration System Architecture

```typescript
// src/main/services/DatabaseMigrationService.ts

export interface Migration {
  version: number;
  name: string;
  up: (db: Database) => Promise<void>;    // Forward migration
  down?: (db: Database) => Promise<void>; // Rollback (optional)
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: async (db) => {
      // Create all initial tables (sessions, messages, etc.)
      await db.exec(`CREATE TABLE sessions (...)`);
      await db.exec(`CREATE TABLE messages (...)`);
      // ... all other tables
    }
  },
  {
    version: 2,
    name: 'add_budget_alerts_table',
    up: async (db) => {
      await db.exec(`
        CREATE TABLE budget_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          budget_id INTEGER NOT NULL,
          alert_type TEXT NOT NULL,
          -- ... rest of schema
        )
      `);
    },
    down: async (db) => {
      await db.exec(`DROP TABLE IF EXISTS budget_alerts`);
    }
  },
  {
    version: 3,
    name: 'add_cache_efficiency_index',
    up: async (db) => {
      await db.exec(`
        CREATE INDEX idx_messages_cache_tokens
        ON messages(cache_read_tokens, cache_creation_tokens)
      `);
    },
    down: async (db) => {
      await db.exec(`DROP INDEX IF EXISTS idx_messages_cache_tokens`);
    }
  },
  // Future migrations added here...
];

export class DatabaseMigrationService {
  constructor(private db: Database) {}

  async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.get(`
        SELECT MAX(version) as version FROM schema_version
      `);
      return result?.version || 0;
    } catch {
      // Table doesn't exist = version 0 (fresh install)
      return 0;
    }
  }

  async migrate(): Promise<MigrationResult> {
    const currentVersion = await this.getCurrentVersion();
    const targetVersion = MIGRATIONS.length;

    console.log(`[Migration] Current version: ${currentVersion}, Target: ${targetVersion}`);

    if (currentVersion === targetVersion) {
      console.log('[Migration] Database is up to date');
      return { success: true, migrationsApplied: 0 };
    }

    if (currentVersion > targetVersion) {
      throw new Error(
        `Database version (${currentVersion}) is newer than app version (${targetVersion}). ` +
        `Please update Claude Owl to the latest version.`
      );
    }

    // CRITICAL: Backup before migration
    await this.createBackup(`pre-migration-v${currentVersion}-to-v${targetVersion}`);

    const migrationsToApply = MIGRATIONS.slice(currentVersion);
    let appliedCount = 0;

    try {
      for (const migration of migrationsToApply) {
        console.log(`[Migration] Applying: ${migration.name} (v${migration.version})`);

        await this.db.exec('BEGIN TRANSACTION');

        try {
          await migration.up(this.db);

          // Record migration in schema_version table
          await this.db.run(`
            INSERT INTO schema_version (version, migration_name)
            VALUES (?, ?)
          `, [migration.version, migration.name]);

          await this.db.exec('COMMIT');
          appliedCount++;
          console.log(`[Migration] ✅ Applied: ${migration.name}`);
        } catch (error) {
          await this.db.exec('ROLLBACK');
          throw new Error(
            `Failed to apply migration ${migration.name}: ${error.message}`
          );
        }
      }

      return {
        success: true,
        migrationsApplied: appliedCount,
        fromVersion: currentVersion,
        toVersion: targetVersion
      };
    } catch (error) {
      console.error('[Migration] ❌ Migration failed:', error);

      // Restore from backup
      await this.restoreFromBackup();

      throw error;
    }
  }

  private async createBackup(suffix: string): Promise<void> {
    const userData = app.getPath('userData');
    const dbPath = path.join(userData, 'metrics.db');
    const backupPath = path.join(userData, `metrics.db.backup.${suffix}`);

    console.log(`[Migration] Creating backup: ${backupPath}`);
    await fs.promises.copyFile(dbPath, backupPath);

    // Also create a "latest" backup
    const latestBackupPath = path.join(userData, 'metrics.db.backup');
    await fs.promises.copyFile(dbPath, latestBackupPath);
  }

  private async restoreFromBackup(): Promise<void> {
    const userData = app.getPath('userData');
    const dbPath = path.join(userData, 'metrics.db');
    const backupPath = path.join(userData, 'metrics.db.backup');

    console.log('[Migration] Restoring from backup...');
    await fs.promises.copyFile(backupPath, dbPath);
    console.log('[Migration] ✅ Restored from backup');
  }
}
```

### Application Startup Flow (with Migration Check)

```typescript
// src/main/services/MetricsService.ts

export class MetricsService {
  private db: Database;
  private migrationService: DatabaseMigrationService;

  async initialize(): Promise<void> {
    console.log('[MetricsService] Initializing...');

    const userData = app.getPath('userData');
    const dbPath = path.join(userData, 'metrics.db');

    console.log(`[MetricsService] Database path: ${dbPath}`);

    // Ensure userData directory exists
    await fs.promises.mkdir(userData, { recursive: true });

    // Open SQLite database (creates file if doesn't exist)
    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable WAL mode for better concurrency and crash resistance
    await this.db.exec('PRAGMA journal_mode = WAL');
    await this.db.exec('PRAGMA foreign_keys = ON');

    // Initialize migration service
    this.migrationService = new DatabaseMigrationService(this.db);

    // Check and apply migrations
    try {
      const result = await this.migrationService.migrate();

      if (result.migrationsApplied > 0) {
        console.log(
          `[MetricsService] ✅ Applied ${result.migrationsApplied} migration(s): ` +
          `v${result.fromVersion} → v${result.toVersion}`
        );

        // Optional: Show user notification
        this.notifyUserOfMigration(result);
      }
    } catch (error) {
      console.error('[MetricsService] ❌ Migration failed:', error);

      // Show error to user
      dialog.showErrorBox(
        'Database Migration Failed',
        `Claude Owl failed to upgrade your metrics database. ` +
        `Your data has been restored from backup. Error: ${error.message}`
      );

      throw error;
    }

    console.log('[MetricsService] ✅ Initialized successfully');
  }

  private notifyUserOfMigration(result: MigrationResult): void {
    // Optional: Show subtle notification
    const notification = new Notification({
      title: 'Claude Owl Updated',
      body: `Your metrics database has been upgraded to v${result.toVersion}. All data preserved.`,
      silent: true
    });
    notification.show();
  }
}
```

### Update Scenarios & Data Preservation

#### Scenario 1: Fresh Install (No Existing Database)
```
1. User installs Claude Owl v0.3.0 for first time
2. App starts, userData directory doesn't exist
3. MetricsService.initialize():
   - Creates userData directory
   - Creates metrics.db
   - getCurrentVersion() returns 0
   - Applies all migrations (v1, v2, v3, ...)
   - Database ready at latest schema version
4. User starts using metrics
```

#### Scenario 2: Update from v0.3.0 → v0.4.0 (Minor Update)
```
1. User has Claude Owl v0.3.0 with metrics.db at schema v3
2. User downloads v0.4.0 installer
3. Installer replaces app binary in /Applications/
4. userData directory untouched (still has metrics.db v3)
5. User launches v0.4.0
6. MetricsService.initialize():
   - Opens existing metrics.db
   - getCurrentVersion() returns 3
   - New app has migrations up to v5
   - Creates backup: metrics.db.backup.pre-migration-v3-to-v5
   - Applies migrations v4 and v5
   - Updates schema_version table
   - Database now at v5, all data preserved
7. User sees notification: "Database upgraded to v5"
```

#### Scenario 3: Major Update with Breaking Changes (v0.5.0 → v1.0.0)
```
1. User has v0.5.0 with metrics.db at schema v8
2. v1.0.0 introduces new aggregation logic (breaking change)
3. User downloads v1.0.0
4. App starts, runs migrations v9-v12
5. Migration v10 includes data transformation:
   - Re-compute all daily_stats with new algorithm
   - Takes 30 seconds for 10,000 sessions
   - Show progress in splash screen
6. Migration completes, all data preserved
7. User sees updated metrics with new calculations
```

#### Scenario 4: Downgrade (v0.5.0 → v0.4.0) - Edge Case
```
1. User has v0.5.0 with metrics.db at schema v6
2. User downloads older v0.4.0 installer (schema v4)
3. App starts, getCurrentVersion() returns 6
4. App detects: currentVersion (6) > targetVersion (4)
5. Throws error: "Database too new, please update app"
6. App shows error dialog with link to latest version
7. User cannot proceed (data safety measure)

Alternative (if we implement down() migrations):
- Prompt user: "Downgrade detected. Apply rollback migrations?"
- If yes: Run down() for v6 → v5 → v4
- Creates backup before rollback
```

### Backup Strategy

#### Automatic Backups
```typescript
export class BackupService {
  async createAutomaticBackup(): Promise<void> {
    const userData = app.getPath('userData');
    const dbPath = path.join(userData, 'metrics.db');
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const backupPath = path.join(userData, `metrics.db.backup.${timestamp}`);

    // Only create one backup per day
    if (await this.backupExists(backupPath)) {
      console.log('[Backup] Today\'s backup already exists');
      return;
    }

    await fs.promises.copyFile(dbPath, backupPath);
    console.log(`[Backup] Created: ${backupPath}`);

    // Clean up old backups (keep last 7 days)
    await this.cleanOldBackups(7);
  }

  private async cleanOldBackups(keepDays: number): Promise<void> {
    const userData = app.getPath('userData');
    const files = await fs.promises.readdir(userData);
    const backupFiles = files.filter(f => f.startsWith('metrics.db.backup.'));

    const now = Date.now();
    const maxAge = keepDays * 24 * 60 * 60 * 1000; // days to milliseconds

    for (const file of backupFiles) {
      const filePath = path.join(userData, file);
      const stats = await fs.promises.stat(filePath);
      const age = now - stats.mtime.getTime();

      if (age > maxAge) {
        await fs.promises.unlink(filePath);
        console.log(`[Backup] Deleted old backup: ${file}`);
      }
    }
  }
}
```

#### User-Initiated Backups
```typescript
// In Settings page: "Backup & Restore" section
export async function exportBackup(): Promise<void> {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Metrics Backup',
    defaultPath: `claude-owl-metrics-${new Date().toISOString().split('T')[0]}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  });

  if (filePath) {
    const userData = app.getPath('userData');
    const dbPath = path.join(userData, 'metrics.db');
    await fs.promises.copyFile(dbPath, filePath);

    dialog.showMessageBox({
      type: 'info',
      title: 'Backup Exported',
      message: `Metrics database backed up to:\n${filePath}`
    });
  }
}

export async function importBackup(): Promise<void> {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Import Metrics Backup',
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    properties: ['openFile']
  });

  if (filePaths.length > 0) {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Confirm Import',
      message: 'This will replace your current metrics data. Continue?',
      buttons: ['Cancel', 'Import'],
      defaultId: 0,
      cancelId: 0
    });

    if (result.response === 1) {
      const userData = app.getPath('userData');
      const dbPath = path.join(userData, 'metrics.db');

      // Backup current database first
      await fs.promises.copyFile(dbPath, `${dbPath}.backup.before-import`);

      // Import
      await fs.promises.copyFile(filePaths[0], dbPath);

      // Restart metrics service
      await metricsService.initialize();

      dialog.showMessageBox({
        type: 'info',
        title: 'Import Complete',
        message: 'Metrics database imported successfully. Please restart Claude Owl.'
      });
    }
  }
}
```

### Data Integrity Checks

```typescript
export class DatabaseIntegrityService {
  async checkIntegrity(): Promise<IntegrityCheckResult> {
    console.log('[Integrity] Running database integrity check...');

    const checks: IntegrityCheck[] = [];

    // 1. SQLite PRAGMA integrity_check
    const pragmaResult = await this.db.get('PRAGMA integrity_check');
    checks.push({
      name: 'SQLite Integrity',
      passed: pragmaResult.integrity_check === 'ok',
      message: pragmaResult.integrity_check
    });

    // 2. Foreign key consistency
    const fkResult = await this.db.get('PRAGMA foreign_key_check');
    checks.push({
      name: 'Foreign Keys',
      passed: !fkResult,
      message: fkResult ? 'FK violations found' : 'OK'
    });

    // 3. Orphaned messages (messages without sessions)
    const orphanedCount = await this.db.get(`
      SELECT COUNT(*) as count FROM messages
      WHERE session_id NOT IN (SELECT session_id FROM sessions)
    `);
    checks.push({
      name: 'Orphaned Messages',
      passed: orphanedCount.count === 0,
      message: `${orphanedCount.count} orphaned messages found`
    });

    // 4. Aggregate consistency (daily_stats match raw data)
    const statsCheck = await this.checkAggregateConsistency();
    checks.push(statsCheck);

    const allPassed = checks.every(c => c.passed);

    return {
      passed: allPassed,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  async repair(): Promise<RepairResult> {
    console.log('[Integrity] Starting database repair...');

    // 1. Delete orphaned messages
    await this.db.run(`
      DELETE FROM messages
      WHERE session_id NOT IN (SELECT session_id FROM sessions)
    `);

    // 2. Recompute all aggregates
    await this.recomputeAggregates();

    // 3. Vacuum database (reclaim space)
    await this.db.exec('VACUUM');

    return { success: true, message: 'Database repaired successfully' };
  }
}
```

### UI Components for Data Management

```typescript
// Settings page: "Data Management" section

export const DataManagementSettings: React.FC = () => {
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null);

  const handleCheckIntegrity = async () => {
    const result = await window.electronAPI.checkDatabaseIntegrity();
    setIntegrityResult(result);
  };

  const handleRepair = async () => {
    await window.electronAPI.repairDatabase();
    toast.success('Database repaired successfully');
  };

  const handleBackup = async () => {
    await window.electronAPI.exportMetricsBackup();
  };

  const handleRestore = async () => {
    await window.electronAPI.importMetricsBackup();
  };

  return (
    <div className="data-management-section">
      <h3>Database Maintenance</h3>

      <div className="action-buttons">
        <button onClick={handleCheckIntegrity}>
          Check Database Integrity
        </button>

        {integrityResult && !integrityResult.passed && (
          <button onClick={handleRepair} className="btn-warning">
            Repair Database
          </button>
        )}
      </div>

      {integrityResult && (
        <IntegrityReport result={integrityResult} />
      )}

      <h3>Backup & Restore</h3>
      <div className="backup-actions">
        <button onClick={handleBackup}>
          Export Backup
        </button>
        <button onClick={handleRestore}>
          Import Backup
        </button>
      </div>

      <p className="info-text">
        Database location: {'{userData}/metrics.db'}
        <br />
        Last backup: {lastBackupDate}
      </p>
    </div>
  );
};
```

### Testing Migration Strategy

#### Unit Tests for Migrations

```typescript
// tests/unit/services/DatabaseMigrationService.test.ts

describe('DatabaseMigrationService', () => {
  let db: Database;
  let migrationService: DatabaseMigrationService;

  beforeEach(async () => {
    // Use in-memory database for testing
    db = await open({
      filename: ':memory:',
      driver: sqlite3.Database
    });
    migrationService = new DatabaseMigrationService(db);
  });

  test('should apply all migrations on fresh database', async () => {
    const result = await migrationService.migrate();

    expect(result.success).toBe(true);
    expect(result.migrationsApplied).toBe(MIGRATIONS.length);
    expect(result.fromVersion).toBe(0);
    expect(result.toVersion).toBe(MIGRATIONS.length);

    // Verify schema_version table
    const version = await migrationService.getCurrentVersion();
    expect(version).toBe(MIGRATIONS.length);
  });

  test('should apply incremental migrations', async () => {
    // Apply first 3 migrations
    await migrationService.migrate();
    await db.run('DELETE FROM schema_version WHERE version > 3');

    // Apply remaining migrations
    const result = await migrationService.migrate();

    expect(result.migrationsApplied).toBe(MIGRATIONS.length - 3);
    expect(result.fromVersion).toBe(3);
  });

  test('should create backup before migration', async () => {
    const createBackupSpy = vi.spyOn(migrationService as any, 'createBackup');

    await migrationService.migrate();

    expect(createBackupSpy).toHaveBeenCalledWith(
      expect.stringContaining('pre-migration')
    );
  });

  test('should rollback on migration failure', async () => {
    // Create a migration that fails
    const failingMigrations = [
      ...MIGRATIONS,
      {
        version: 99,
        name: 'failing_migration',
        up: async () => {
          throw new Error('Intentional failure');
        }
      }
    ];

    const service = new DatabaseMigrationService(db);
    (service as any).MIGRATIONS = failingMigrations;

    await expect(service.migrate()).rejects.toThrow('Intentional failure');

    // Verify rollback: version should be same as before
    const version = await migrationService.getCurrentVersion();
    expect(version).toBeLessThan(99);
  });

  test('should reject downgrade attempts', async () => {
    // Set database to version 10
    await db.run('CREATE TABLE schema_version (version INTEGER PRIMARY KEY)');
    await db.run('INSERT INTO schema_version VALUES (10)');

    // App only supports up to version 5
    (migrationService as any).MIGRATIONS = MIGRATIONS.slice(0, 5);

    await expect(migrationService.migrate()).rejects.toThrow(
      'Database version (10) is newer than app version (5)'
    );
  });
});
```

#### Integration Tests for Update Scenarios

```typescript
// tests/integration/metrics-migration.test.ts

describe('Metrics Database Migration (Integration)', () => {
  test('Scenario: Update from v0.3.0 → v0.4.0', async () => {
    // 1. Simulate v0.3.0 database (schema v3)
    const userData = await createTempUserDataDir();
    const dbPath = path.join(userData, 'metrics.db');

    const db = await createV3Database(dbPath); // Helper to create v3 schema
    await insertMockData(db, { sessions: 100, messages: 1000 });

    const sessionCountBefore = await db.get('SELECT COUNT(*) as count FROM sessions');
    await db.close();

    // 2. Simulate v0.4.0 app starting up
    const metricsService = new MetricsService();
    await metricsService.initialize(); // This runs migrations

    // 3. Verify data preserved
    const dbAfter = await open({ filename: dbPath, driver: sqlite3.Database });
    const sessionCountAfter = await dbAfter.get('SELECT COUNT(*) as count FROM sessions');

    expect(sessionCountAfter.count).toBe(sessionCountBefore.count);

    // 4. Verify schema updated to v5
    const version = await dbAfter.get('SELECT MAX(version) as v FROM schema_version');
    expect(version.v).toBe(5);

    // 5. Verify backup created
    const backupExists = await fs.promises.access(
      path.join(userData, 'metrics.db.backup')
    ).then(() => true).catch(() => false);
    expect(backupExists).toBe(true);
  });

  test('Scenario: Fresh install (no existing database)', async () => {
    const userData = await createTempUserDataDir();

    const metricsService = new MetricsService();
    await metricsService.initialize();

    const dbPath = path.join(userData, 'metrics.db');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    // Verify all tables exist
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );

    expect(tables.map(t => t.name)).toEqual([
      'budgets',
      'budget_alerts',
      'daily_stats',
      'messages',
      'model_pricing',
      'model_stats',
      'project_stats',
      'schema_version',
      'sessions',
      'sync_metadata'
    ]);

    // Verify schema at latest version
    const version = await db.get('SELECT MAX(version) as v FROM schema_version');
    expect(version.v).toBe(MIGRATIONS.length);
  });
});
```

#### Manual Testing Checklist

**Pre-Release Testing (before shipping new version):**

1. ✅ **Fresh Install Test**
   - Delete `~/Library/Application Support/claude-owl/`
   - Install new version
   - Open Metrics page
   - Verify database created with latest schema
   - Add test data, restart app, verify data persists

2. ✅ **Upgrade Test (v0.3.0 → v0.4.0)**
   - Install v0.3.0
   - Generate test data (run metrics for 1 hour)
   - Note session count and total cost
   - Install v0.4.0 (replace app)
   - Launch app, check console for migration logs
   - Verify data matches pre-upgrade values
   - Check `metrics.db.backup` exists

3. ✅ **Multiple Sequential Upgrades**
   - v0.3.0 → v0.4.0 → v0.5.0 → v0.6.0
   - Verify data survives all upgrades

4. ✅ **Backup/Restore Test**
   - Export backup via Settings
   - Delete database
   - Import backup
   - Verify data restored

5. ✅ **Integrity Check Test**
   - Run "Check Database Integrity"
   - Manually corrupt database (invalid FK)
   - Run integrity check (should fail)
   - Run "Repair Database"
   - Verify repaired

6. ✅ **Large Dataset Test**
   - Import 1 year of JSONL data (10,000+ sessions)
   - Run migration
   - Verify performance (< 2 minutes)

### Summary: Why This Approach Guarantees Data Preservation

**Key Guarantees:**

1. **userData Directory is Sacred**
   - Electron's `app.getPath('userData')` is **never** touched by installers
   - OS-managed location, separate from app binary
   - Survives uninstall/reinstall cycles (unless user explicitly deletes)

2. **Database is Outside App Bundle**
   - `metrics.db` lives in userData, not in `/Applications/Claude Owl.app/`
   - When installer replaces app, database is untouched
   - Same mechanism used by Chrome, VS Code, Slack, etc.

3. **Migration System is Bulletproof**
   - ✅ Automatic backup before every migration
   - ✅ Transactional migrations (rollback on failure)
   - ✅ Schema versioning (tracks what's been applied)
   - ✅ Downgrade protection (prevents data loss from old app versions)

4. **Multiple Safety Nets**
   - Automatic daily backups (kept for 7 days)
   - User-initiated export/import
   - Database integrity checks with repair
   - WAL mode (crash-resistant)

5. **Real-World Proven Pattern**
   - This is the **industry standard** for Electron apps
   - Used by: VS Code extensions, Discord data, Spotify cache, etc.
   - Well-tested across millions of users

**Bottom Line:** Users can confidently update Claude Owl knowing their metrics history is safe. Even in worst-case failure scenarios, backups enable full recovery.

---

## Data Ingestion Pipeline

### Phase 1: Initial Scan (First Launch)

```
1. User opens Metrics page
2. Background job: Scan ~/.claude/projects/
3. Discover all JSONL files
4. Parse each file line-by-line
5. Insert sessions + messages into SQLite
6. Compute aggregates (daily_stats, model_stats, project_stats)
7. Mark files as synced in sync_metadata
8. Display results to user
```

**Performance Considerations**:
- Use SQLite transactions (batch inserts for speed)
- Process files in parallel (Worker threads)
- Show progress indicator: "Indexing 127 sessions... 45% complete"
- Estimated time: ~1 second per 1000 messages on modern hardware

### Phase 2: Incremental Updates

```
1. File watcher on ~/.claude/projects/**/*.jsonl
2. On file change event:
   - Check sync_metadata for last_modified_at
   - If file is newer: parse new lines only
   - Insert new messages/sessions
   - Update aggregates incrementally
3. Update UI in real-time (IPC event to renderer)
```

**Optimization**: Use tail-read (read from end of file) for active sessions.

### Phase 3: Data Refresh (Manual)

User clicks "Refresh Data" button:
- Re-scan all JSONL files
- Detect deleted sessions (remove from DB)
- Detect modified sessions (re-parse)
- Full aggregate recompute

---

## Cost Calculation Logic

### Pricing Database (Hardcoded, Updateable)

```typescript
// src/main/services/PricingService.ts
const MODEL_PRICING = {
  'claude-sonnet-4-5-20250929': {
    input: 3.00,    // $3 per 1M tokens
    output: 15.00,  // $15 per 1M tokens
    cache_creation: 3.75,  // $3.75 per 1M tokens (25% markup)
    cache_read: 0.30       // $0.30 per 1M tokens (90% discount)
  },
  'claude-opus-4-20250514': {
    input: 15.00,
    output: 75.00,
    cache_creation: 18.75,
    cache_read: 1.50
  },
  // ... more models
};

function calculateMessageCost(message: Message): number {
  const pricing = MODEL_PRICING[message.model_name];
  if (!pricing) return 0;

  const inputCost = (message.input_tokens / 1_000_000) * pricing.input;
  const outputCost = (message.output_tokens / 1_000_000) * pricing.output;
  const cacheCreateCost = (message.cache_creation_tokens / 1_000_000) * pricing.cache_creation;
  const cacheReadCost = (message.cache_read_tokens / 1_000_000) * pricing.cache_read;

  return inputCost + outputCost + cacheCreateCost + cacheReadCost;
}
```

### Pricing Updates
- Store pricing in `model_pricing` table
- Allow users to manually update prices (Settings → Pricing)
- Future: Fetch latest pricing from Anthropic API (requires web scraping or official API)

---

## Services Architecture

### Main Process Services

```typescript
// src/main/services/MetricsService.ts
export class MetricsService {
  private db: Database;                // SQLite connection
  private ingestionService: IngestionService;
  private pricingService: PricingService;

  async initialize(): Promise<void> {
    // Open SQLite database, run migrations
  }

  async scanAllSessions(): Promise<ScanResult> {
    // Full JSONL scan + ingestion
  }

  async getDashboardStats(dateRange: DateRange): Promise<DashboardStats> {
    // Query daily_stats for overview
  }

  async getSessionList(filters: SessionFilters): Promise<Session[]> {
    // Query sessions table with filters
  }

  async getSessionDetail(sessionId: string): Promise<SessionDetail> {
    // Get session + all messages
  }

  async getProjectComparison(): Promise<ProjectStats[]> {
    // Query project_stats
  }

  async getModelAnalytics(): Promise<ModelStats[]> {
    // Query model_stats
  }

  async exportData(format: 'csv' | 'json', options: ExportOptions): Promise<string> {
    // Generate export file
  }
}

// src/main/services/IngestionService.ts
export class IngestionService {
  async ingestJSONLFile(filePath: string): Promise<IngestResult> {
    // Parse JSONL, extract sessions + messages, insert to DB
  }

  async watchForChanges(): Promise<void> {
    // Setup file watchers on ~/.claude/projects/
  }

  private parseJSONLLine(line: string): Message | null {
    // Parse single JSONL line, extract usage data
  }
}

// src/main/services/PricingService.ts
export class PricingService {
  async getModelPricing(modelName: string): Promise<ModelPricing> {
    // Lookup pricing from DB or fallback to hardcoded
  }

  async updatePricing(modelName: string, pricing: ModelPricing): Promise<void> {
    // User-editable pricing updates
  }

  calculateCost(message: Message): number {
    // Cost calculation logic
  }
}

// src/main/services/BudgetService.ts
export class BudgetService {
  async setBudget(budget: Budget): Promise<void> {
    // Create or update budget
  }

  async checkBudgets(): Promise<BudgetAlert[]> {
    // Compare current spending vs. budgets, trigger alerts
  }

  async getBudgetStatus(scope: string, projectPath?: string): Promise<BudgetStatus> {
    // Get current spending vs. budget for dashboard
  }
}
```

### IPC Handlers

```typescript
// src/main/ipc/metricsHandlers.ts
export function registerMetricsHandlers() {
  ipcMain.handle('metrics:scan-all', async () => {
    return await metricsService.scanAllSessions();
  });

  ipcMain.handle('metrics:get-dashboard', async (_, dateRange: DateRange) => {
    return await metricsService.getDashboardStats(dateRange);
  });

  ipcMain.handle('metrics:get-sessions', async (_, filters: SessionFilters) => {
    return await metricsService.getSessionList(filters);
  });

  ipcMain.handle('metrics:get-session-detail', async (_, sessionId: string) => {
    return await metricsService.getSessionDetail(sessionId);
  });

  ipcMain.handle('metrics:export', async (_, format, options) => {
    return await metricsService.exportData(format, options);
  });

  ipcMain.handle('metrics:set-budget', async (_, budget: Budget) => {
    return await budgetService.setBudget(budget);
  });

  ipcMain.handle('metrics:get-budget-status', async (_, scope, projectPath) => {
    return await budgetService.getBudgetStatus(scope, projectPath);
  });
}
```

---

## Frontend Components

### Page Components

```
src/renderer/pages/metrics/
├── MetricsOverviewPage.tsx       # Dashboard (entry point)
├── UsageTrendsPage.tsx           # Time-series charts
├── SessionExplorerPage.tsx       # Session list + detail
├── ProjectComparisonPage.tsx     # Multi-project analytics
├── ModelAnalyticsPage.tsx        # Per-model stats
├── BudgetSettingsPage.tsx        # Budget configuration
└── CacheOptimizationPage.tsx     # Cache insights
```

### Reusable Components

```
src/renderer/components/metrics/
├── MetricCard.tsx                # Stat card (tokens, cost, etc.)
├── TokenUsageChart.tsx           # Line chart for tokens
├── CostBreakdownChart.tsx        # Pie chart for costs
├── SessionTable.tsx              # Sortable session table
├── SessionDetailDrawer.tsx       # Side panel for session details
├── BudgetProgressBar.tsx         # Visual budget tracker
├── ExportDialog.tsx              # Export configuration modal
└── LiveActivityFeed.tsx          # Real-time activity stream
```

### React Hooks

```typescript
// src/renderer/hooks/useMetrics.ts
export function useMetricsDashboard(dateRange: DateRange) {
  return useQuery(['metrics-dashboard', dateRange], async () => {
    return await window.electronAPI.getMetricsDashboard(dateRange);
  });
}

export function useSessionList(filters: SessionFilters) {
  return useQuery(['sessions', filters], async () => {
    return await window.electronAPI.getSessions(filters);
  });
}

export function useSessionDetail(sessionId: string) {
  return useQuery(['session-detail', sessionId], async () => {
    return await window.electronAPI.getSessionDetail(sessionId);
  });
}

export function useBudgetStatus(scope: string, projectPath?: string) {
  return useQuery(['budget-status', scope, projectPath], async () => {
    return await window.electronAPI.getBudgetStatus(scope, projectPath);
  });
}
```

---

## Implementation Phases

### Phase 0: Foundation (Week 1)
- ✅ Design ADR (this document)
- ✅ Get stakeholder approval
- Set up SQLite database service
- Create database schema + migrations
- Write IngestionService (JSONL parser)

### Phase 1: Basic Dashboard (Week 2)
- Implement initial data scan (sync all JSONL files)
- Create `MetricsOverviewPage` with summary cards
- Display total tokens, cost, session count
- Add "Refresh Data" button
- Basic error handling (no JSONL files found, etc.)

### Phase 2: Session Explorer (Week 3)
- Build `SessionExplorerPage` with table
- Session list with sorting, filtering
- Session detail drawer with message breakdown
- Export session to JSON

### Phase 3: Charts & Trends (Week 4)
- Integrate Recharts library
- Build `UsageTrendsPage` with line charts
- Add cost breakdown pie chart
- Date range picker

### Phase 4: Project & Model Analytics (Week 5)
- `ProjectComparisonPage` with bar charts
- `ModelAnalyticsPage` with stats tables
- Multi-line project timeline chart

### Phase 5: Budgets & Alerts (Week 6)
- `BudgetSettingsPage` UI
- Budget service + alert logic
- In-app notification badges
- Budget progress bars on dashboard

### Phase 6: Advanced Features (Weeks 7-8)
- Cache optimization insights
- Live monitoring (file watcher + real-time updates)
- Export to CSV/PDF
- Predictive forecasting (ML model)

### Phase 7: Polish & Testing (Week 9)
- Unit tests for services
- Integration tests for IPC
- E2E tests for UI flows
- Performance optimization (large datasets)
- Documentation

---

## Migration from ccusage

### Deprecation Plan
1. **v0.3.0**: Ship native metrics (beta), keep ccusage integration
2. **v0.4.0**: Mark Sessions page as "Legacy (ccusage)", promote Metrics page
3. **v0.5.0**: Remove ccusage integration entirely

### User Communication
- In-app banner: "New native Metrics feature available! No ccusage installation needed."
- Migration guide: "Your data is automatically imported from JSONL files"
- FAQ: "What happened to ccusage?" → Explain benefits of native solution

---

## Success Metrics

### Product Metrics
- **Adoption**: % of users who open Metrics page (vs. old Sessions page)
- **Engagement**: Average time spent on Metrics page per session
- **Feature Usage**: % of users who set budgets, export data, use filters

### Technical Metrics
- **Performance**: Dashboard load time < 1 second for 10,000 sessions
- **Reliability**: Zero data loss during ingestion
- **Storage**: Database size < 50MB for typical user (1 year of data)

### User Satisfaction
- **Net Promoter Score (NPS)**: Survey after 2 weeks of use
- **GitHub Issues**: Track feature requests and bug reports
- **User Feedback**: Collect qualitative feedback via in-app survey

---

## Risks & Mitigations

### Risk 1: Large Dataset Performance
**Problem**: Users with years of JSONL files (100,000+ sessions) may experience slow ingestion.

**Mitigation**:
- Show progress indicator during initial scan
- Use SQLite indexes aggressively
- Implement pagination (never load all sessions at once)
- Add "Import Last N Days Only" option

### Risk 2: JSONL Format Changes
**Problem**: Claude Code may change JSONL structure in future versions.

**Mitigation**:
- Version detection in parser (check `version` field)
- Graceful degradation (skip unknown fields)
- Unit tests for multiple JSONL formats
- Monitor Claude Code changelog

### Risk 3: Pricing Data Outdated
**Problem**: Anthropic changes pricing, our DB becomes stale.

**Mitigation**:
- User-editable pricing table
- Warning banner: "Pricing data last updated: Jan 2025"
- Future: Auto-fetch from Anthropic API

### Risk 4: SQLite Corruption
**Problem**: App crash during write could corrupt database.

**Mitigation**:
- Use SQLite WAL mode (Write-Ahead Logging)
- Auto-backup before schema migrations
- Provide "Rebuild Database" option (re-scan all JSONL)

---

## Alternatives Considered

### Alternative 1: Keep Using ccusage
**Pros**: No development effort, proven tool
**Cons**: No GUI, external dependency, limited features
**Decision**: Rejected - UX too limited for desktop app

### Alternative 2: Embed ccusage as Library
**Pros**: Reuse parsing logic
**Cons**: ccusage is CLI-focused, not library-friendly
**Decision**: Rejected - easier to write native parser

### Alternative 3: Cloud-Based Analytics
**Pros**: No local storage, cross-device sync
**Cons**: Privacy concerns, requires backend, costs
**Decision**: Rejected - violates offline-first principle

### Alternative 4: IndexedDB Instead of SQLite
**Pros**: Built-in to Electron
**Cons**: Slow, no SQL, browser overhead
**Decision**: Rejected - SQLite is superior for analytics

---

## Future Enhancements

### AI-Powered Insights (v1.0)
- "You spent 30% more this month. Main driver: Project X increased output tokens by 200%."
- "Tip: Enable prompt caching to reduce costs by ~25%."

### Team/Multi-User Support (v1.5)
- Share metrics across team members
- Compare individual vs. team usage
- Centralized budget management

### Integration Ecosystem (v2.0)
- Export to Google Sheets (auto-sync)
- Slack alerts for budget thresholds
- Jira integration (track costs per ticket)

### Custom Metrics (v2.5)
- User-defined KPIs (e.g., "Cost per feature shipped")
- Custom SQL queries (power users)
- Saved reports (monthly executive summary)

---

## Conclusion

This native metrics system eliminates the ccusage dependency while delivering a **superior user experience** through:

1. **Visual Analytics**: Charts, graphs, and interactive dashboards
2. **Advanced Features**: Budgets, alerts, forecasting, live monitoring
3. **Performance**: Fast SQLite queries, pre-computed aggregates
4. **Offline-First**: All data local, no network required
5. **Seamless Integration**: Embedded in Claude Owl, no external tools

**Implementation Effort**: ~9 weeks (1 engineer)
**Maintenance**: Low (stable JSONL format, SQLite reliability)
**ROI**: High (core differentiator, user retention)

**Recommendation**: Proceed with implementation starting Phase 0.

---

## References

- [ccusage GitHub Repository](https://github.com/ryoppippi/ccusage)
- [Electron Database Best Practices - RxDB](https://rxdb.info/electron-database.html)
- [Offline-first frontend apps in 2025 - LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [How to persist data in an Electron app - Stack Overflow](https://stackoverflow.com/questions/35660124/how-to-persist-data-in-an-electron-app)
- [SQLite RxStorage for Hybrid Apps - RxDB](https://rxdb.info/rx-storage-sqlite.html)
- [Electron Data Persistence Tutorial](https://www.techiediaries.com/electron-data-persistence/)

---

**Approval Signatures**:
- [ ] Product Owner: ___________________________
- [ ] Engineering Lead: ___________________________
- [ ] UX Designer: ___________________________

**Next Steps**:
1. Review this ADR with stakeholders
2. Approve or request revisions
3. Create GitHub project board with Phase 0-7 tasks
4. Begin implementation (target start: Dec 2025)
