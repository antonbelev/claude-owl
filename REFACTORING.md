# 🦉 Claude Owl Refactoring Plan

## Executive Summary

**Current Grade: B+** → **Target Grade: A**

The codebase has excellent foundations but needs structural improvements in testing, code organization, and shared abstractions. This plan focuses on three phases of independent tasks that can be picked up by different developers.

---

## 📊 Phase 1: Critical Foundation (Weeks 1-2)

### Priority: **HIGH** | Impact: **CRITICAL**

These tasks address the most pressing technical debt and create infrastructure for future work.

### Task 1.1: Create Core Services Layer
**Impact:** Eliminates ~40% of code duplication
**Effort:** 2-3 days
**Dependencies:** None

**Objective:** Create shared service abstractions to DRY up common operations across existing services.

**Deliverables:**
- [ ] `FileSystemService.ts` - Centralized file operations
  - `readJSON<T>(path): Promise<T>`
  - `writeJSON<T>(path, data): Promise<void>`
  - `readMarkdownWithFrontmatter<T>(path): Promise<ParsedMarkdown<T>>`
  - `fileExists(path): Promise<boolean>`
  - `ensureDirectory(path): Promise<void>`
  - Proper error handling and logging

- [ ] `PathService.ts` - Centralized path construction
  - `getUserClaudeDir(): string`
  - `getProjectClaudeDir(projectPath?): string`
  - `getSkillsPath(location): string`
  - `getAgentsPath(location): string`
  - `getCommandsPath(location): string`
  - Path validation and normalization

- [ ] `ValidationService.ts` - Centralized validation logic
  - `validateJSON<T>(data, schema): ValidationResult<T>`
  - `validateYAMLFrontmatter<T>(content): ValidationResult<T>`
  - `validatePath(path): ValidationResult<string>`
  - Integration with Zod or JSON Schema

**Success Criteria:**
- All three services created with comprehensive TypeScript types
- Unit tests for each service (80%+ coverage)
- At least one existing service refactored to use new abstractions
- Documentation with usage examples

**Files to Create:**
- `src/main/services/core/FileSystemService.ts`
- `src/main/services/core/PathService.ts`
- `src/main/services/core/ValidationService.ts`
- `tests/unit/services/FileSystemService.test.ts`
- `tests/unit/services/PathService.test.ts`
- `tests/unit/services/ValidationService.test.ts`

---

### Task 1.2: Split and Organize IPC Types
**Impact:** Improves maintainability and navigation
**Effort:** 1-2 days
**Dependencies:** None

**Objective:** Split the massive 584-line `ipc.types.ts` into domain-specific files.

**Deliverables:**
- [ ] Split types into domain files:
  - `ipc.agents.types.ts` - Agent-related types
  - `ipc.settings.types.ts` - Settings types
  - `ipc.plugins.types.ts` - Plugin types
  - `ipc.skills.types.ts` - Skills types
  - `ipc.hooks.types.ts` - Hooks types
  - `ipc.system.types.ts` - System/Claude types
  - `ipc.common.types.ts` - Shared base types

- [ ] Create central export in `ipc.types.ts` (backwards compatibility)
- [ ] Update all imports across codebase
- [ ] Add JSDoc documentation to all types

**Success Criteria:**
- No file exceeds 200 lines
- All existing functionality preserved
- Type checking passes
- No breaking changes to existing code

**Files to Modify:**
- `src/shared/types/ipc.types.ts` (split into multiple files)
- Update imports in ~20 files across main/renderer/preload

---

### Task 1.3: Implement Service Layer Tests
**Impact:** Establishes testing foundation
**Effort:** 3-4 days
**Dependencies:** None (can run parallel to 1.1)

**Objective:** Achieve 70%+ test coverage for all existing services.

**Deliverables:**
- [ ] Test suite for each service:
  - `AgentsService.test.ts` (302 lines to cover)
  - `CCUsageService.test.ts` (283 lines to cover)
  - `ClaudeService.test.ts` (68 lines to cover)
  - `DebugLogsService.test.ts` (165 lines to cover)
  - `HooksService.test.ts` (209 lines to cover)
  - `PluginsService.test.ts` (645 lines to cover)
  - `SettingsService.test.ts` (540 lines to cover)
  - `SkillsService.test.ts` (324 lines to cover)
  - `StatusService.test.ts` (362 lines to cover)

- [ ] Test utilities and fixtures:
  - `tests/fixtures/mockClaudeConfig.ts`
  - `tests/fixtures/mockPlugins.ts`
  - `tests/fixtures/mockSkills.ts`
  - `tests/helpers/serviceTestHelpers.ts`

**Success Criteria:**
- 70%+ code coverage for service layer
- All happy paths tested
- Error cases tested
- File system operations mocked properly
- Tests run in isolation

**Files to Create:**
- `tests/unit/services/*.test.ts` (9 files)
- `tests/fixtures/*.ts` (test data)
- `tests/helpers/*.ts` (test utilities)

---

### Task 1.4: Standardize Error Handling
**Impact:** Consistent error UX and debugging
**Effort:** 2 days
**Dependencies:** None

**Objective:** Create centralized error handling with custom error types and consistent formatting.

**Deliverables:**
- [ ] Error type hierarchy:
  ```typescript
  // src/shared/errors/AppError.ts
  class AppError extends Error
  class FileSystemError extends AppError
  class ValidationError extends AppError
  class NetworkError extends AppError
  class ClaudeError extends AppError
  ```

- [ ] Error handler decorator for IPC:
  ```typescript
  // src/main/decorators/errorHandler.ts
  function withErrorHandler(handler: IPCHandler): IPCHandler
  ```

- [ ] Error transformation utilities:
  - User-friendly error messages
  - Error code mapping
  - Stack trace sanitization

- [ ] Update all IPC handlers to use decorator

**Success Criteria:**
- All errors extend AppError base class
- Consistent error response format across all IPC handlers
- User-friendly error messages in renderer
- Error codes documented

**Files to Create:**
- `src/shared/errors/AppError.ts`
- `src/shared/errors/index.ts`
- `src/main/decorators/errorHandler.ts`
- `tests/unit/errors/AppError.test.ts`

**Files to Modify:**
- All 9 IPC handler files in `src/main/ipc/`

---

### Task 1.5: Fix Preload Type Safety
**Impact:** Catches IPC type errors at compile time
**Effort:** 1 day
**Dependencies:** Task 1.2 (types reorganization)

**Objective:** Replace `unknown` types in preload API with specific request/response types.

**Deliverables:**
- [ ] Type-safe preload API:
  ```typescript
  // Before:
  installPlugin: (args: unknown) => Promise<unknown>

  // After:
  installPlugin: (request: InstallPluginRequest) => Promise<InstallPluginResponse>
  ```

- [ ] Update all ~30 API methods with proper types
- [ ] Add type guards for runtime validation
- [ ] Update `index.d.ts` with accurate types

**Success Criteria:**
- Zero `unknown` types in preload API
- TypeScript errors surface invalid IPC calls
- Autocomplete works for all API methods
- Type checking passes

**Files to Modify:**
- `src/preload/index.ts`
- `src/preload/index.d.ts`

---

## 📐 Phase 2: Code Organization (Weeks 3-4)

### Priority: **MEDIUM** | Impact: **HIGH**

These tasks improve code organization, reduce file sizes, and establish patterns.

### Task 2.1: Extract Shared UI Components
**Impact:** Reduces duplication, consistent UI
**Effort:** 3-4 days
**Dependencies:** None

**Objective:** Create reusable UI component library with Tailwind styling.

**Deliverables:**
- [ ] Create component library structure:
  ```
  src/renderer/components/ui/
  ├── Button/
  │   ├── Button.tsx
  │   ├── Button.test.tsx
  │   └── Button.stories.tsx (optional)
  ├── Input/
  ├── Select/
  ├── TextArea/
  ├── Modal/
  ├── Card/
  ├── Badge/
  ├── Spinner/
  ├── ErrorMessage/
  └── index.ts
  ```

- [ ] Each component with:
  - TypeScript props interface
  - Tailwind styling
  - Variants (primary, secondary, etc.)
  - Accessible markup
  - Unit tests

- [ ] Refactor 3+ existing components to use new library

**Success Criteria:**
- 10+ reusable components created
- All components tested
- Storybook integration (optional)
- At least 3 feature components refactored

**Files to Create:**
- `src/renderer/components/ui/*` (10+ components)
- `tests/unit/components/ui/*` (10+ test files)

---

### Task 2.2: Split Large Components
**Impact:** Better maintainability and testing
**Effort:** 2-3 days
**Dependencies:** Task 2.1 (UI components)

**Objective:** Break down monolithic components into focused, testable units.

**Target Components:**
1. **SkillsManager.tsx (509 lines)**
   - Extract `SkillCard.tsx`
   - Extract `SkillCreateModal.tsx`
   - Extract `SkillDetailModal.tsx`
   - Keep `SkillsManager.tsx` as orchestrator

2. **Other large files identified during work**

**Deliverables:**
- [ ] Split SkillsManager into 4 files
- [ ] Update imports and exports
- [ ] Add tests for each extracted component
- [ ] Verify functionality unchanged

**Success Criteria:**
- No component exceeds 300 lines
- Each component has single responsibility
- All tests pass
- No regression in functionality

**Files to Create:**
- `src/renderer/components/SkillsManager/SkillCard.tsx`
- `src/renderer/components/SkillsManager/SkillCreateModal.tsx`
- `src/renderer/components/SkillsManager/SkillDetailModal.tsx`
- Tests for each

**Files to Modify:**
- `src/renderer/components/SkillsManager/SkillsManager.tsx`

---

### Task 2.3: Split Large Services
**Impact:** Better testing and maintenance
**Effort:** 3-4 days
**Dependencies:** Task 1.1 (Core services)

**Objective:** Refactor oversized services into focused modules.

**Target Services:**

1. **PluginsService.ts (645 lines)**
   - Split into:
     - `PluginManagerService.ts` - Installation, removal
     - `MarketplaceService.ts` - Marketplace fetching, caching
     - `PluginValidationService.ts` - Manifest validation

2. **SettingsService.ts (540 lines)**
   - Split into:
     - `SettingsService.ts` - Core CRUD operations
     - `SettingsMergeService.ts` - Hierarchy merging logic
     - `SettingsValidationService.ts` - Schema validation

**Deliverables:**
- [ ] Split services maintaining public API
- [ ] Update IPC handlers to use new services
- [ ] Add tests for each new service
- [ ] Update documentation

**Success Criteria:**
- No service exceeds 400 lines
- All existing functionality preserved
- 70%+ test coverage maintained
- Clear service boundaries

**Files to Create:**
- `src/main/services/plugins/PluginManagerService.ts`
- `src/main/services/plugins/MarketplaceService.ts`
- `src/main/services/settings/SettingsMergeService.ts`
- `src/main/services/settings/SettingsValidationService.ts`
- Tests for each

**Files to Modify:**
- `src/main/services/PluginsService.ts`
- `src/main/services/SettingsService.ts`
- `src/main/ipc/pluginsHandlers.ts`
- `src/main/ipc/settingsHandlers.ts`

---

### Task 2.4: Eliminate Channel Duplication
**Impact:** Single source of truth, easier maintenance
**Effort:** 1 day
**Dependencies:** None

**Objective:** Define IPC channels once in shared code, import everywhere.

**Current Problem:**
```typescript
// Defined 3 times:
// 1. src/shared/types/ipc.types.ts
// 2. src/main/ipc/pluginsHandlers.ts
// 3. src/preload/index.ts
const PLUGINS_CHANNELS = { ... }
```

**Deliverables:**
- [ ] Create single source: `src/shared/constants/ipc.channels.ts`
- [ ] Export all channel definitions
- [ ] Update all imports across codebase
- [ ] Remove duplicate definitions
- [ ] Add compile-time check for unused channels

**Success Criteria:**
- Channels defined in exactly one place
- All code uses imported constants
- Type checking passes
- No runtime errors

**Files to Create:**
- `src/shared/constants/ipc.channels.ts`

**Files to Modify:**
- All 9 IPC handler files
- `src/preload/index.ts`
- Remove from `src/shared/types/ipc.types.ts`

---

### Task 2.5: Refactor Services to Use Core Abstractions
**Impact:** Completes DRY refactoring
**Effort:** 3-4 days
**Dependencies:** Task 1.1 (Core services must be complete)

**Objective:** Migrate all existing services to use FileSystemService, PathService, ValidationService.

**Services to Refactor (in order):**
1. ClaudeService (simplest, 68 lines)
2. SkillsService (324 lines)
3. AgentsService (302 lines)
4. HooksService (209 lines)
5. StatusService (362 lines)
6. CCUsageService (283 lines)
7. PluginManagerService (post-split)
8. SettingsService (post-split)

**Deliverables:**
- [ ] Remove direct fs/path usage from all services
- [ ] Use FileSystemService for all file operations
- [ ] Use PathService for all path construction
- [ ] Use ValidationService for all data validation
- [ ] Update tests to mock core services

**Success Criteria:**
- No service directly imports `fs`, `path`, or `os`
- All file operations go through FileSystemService
- All path construction uses PathService
- Tests pass with mocked core services
- Code reduction of ~30-40%

**Files to Modify:**
- All 8 service files listed above

---

## 🧪 Phase 3: Testing & Quality (Weeks 5-6)

### Priority: **MEDIUM** | Impact: **MEDIUM-HIGH**

These tasks establish comprehensive testing and improve code quality.

### Task 3.1: Add Integration Tests for IPC Flows
**Impact:** Catches integration bugs
**Effort:** 3-4 days
**Dependencies:** Task 1.3 (Service tests)

**Objective:** Test complete IPC flows from renderer to main process and back.

**Deliverables:**
- [ ] Integration test infrastructure:
  ```typescript
  // tests/integration/helpers/ipcTestHelper.ts
  - setupIPCTest()
  - mockElectronAPI()
  - simulateRendererCall()
  ```

- [ ] Integration tests for each domain:
  - `agents.integration.test.ts`
  - `skills.integration.test.ts`
  - `plugins.integration.test.ts`
  - `settings.integration.test.ts`
  - `hooks.integration.test.ts`
  - `system.integration.test.ts`

- [ ] Test end-to-end flows:
  - List → Create → Update → Delete
  - Error handling across processes
  - Data transformation accuracy

**Success Criteria:**
- 15+ integration tests covering major flows
- Tests run in isolated environment
- File system properly mocked
- All tests pass consistently

**Files to Create:**
- `tests/integration/helpers/ipcTestHelper.ts`
- `tests/integration/*.integration.test.ts` (6+ files)

---

### Task 3.2: Add Component Integration Tests
**Impact:** Prevents UI regressions
**Effort:** 3-4 days
**Dependencies:** Task 2.1 (UI components)

**Objective:** Test all manager components with realistic data flows.

**Deliverables:**
- [ ] Component integration tests:
  - `AgentsManager.integration.test.tsx`
  - `SkillsManager.integration.test.tsx`
  - `PluginsManager.integration.test.tsx`
  - `SettingsEditor.integration.test.tsx`
  - `HooksManager.integration.test.tsx`

- [ ] Test scenarios:
  - Loading states
  - Data fetching and display
  - User interactions (create, edit, delete)
  - Error states
  - Form validation

- [ ] Mock electron API responses
- [ ] Use React Testing Library best practices

**Success Criteria:**
- All manager components tested
- 80%+ coverage for component code
- Tests use realistic data
- Tests verify accessibility

**Files to Create:**
- `tests/unit/components/*.integration.test.tsx` (5+ files)

---

### Task 3.3: Add E2E Tests with Playwright
**Impact:** Confidence in full app flows
**Effort:** 4-5 days
**Dependencies:** None

**Objective:** Implement critical user journey tests.

**Deliverables:**
- [ ] E2E test infrastructure:
  - Configure Playwright for Electron
  - Setup test fixtures
  - Create page objects

- [ ] Critical path tests:
  - App launch and initialization
  - Claude Code detection flow
  - Skills management (list, create, edit, delete)
  - Agents configuration
  - Plugins installation
  - Settings editing and saving

- [ ] Cross-platform tests (macOS, Windows, Linux)

**Success Criteria:**
- 10+ E2E tests for critical paths
- Tests run on all platforms in CI
- Screenshots on failure
- Tests complete in <5 minutes

**Files to Create:**
- `tests/e2e/setup.ts`
- `tests/e2e/page-objects/*.ts`
- `tests/e2e/specs/*.e2e.test.ts`
- `playwright.config.ts` (update)

---

### Task 3.4: Add Utility Function Tests
**Impact:** Ensures reliability of shared code
**Effort:** 1-2 days
**Dependencies:** None

**Objective:** Test all utility functions in `src/shared/utils/`.

**Deliverables:**
- [ ] Test suites for:
  - `markdown.utils.test.ts` (YAML parsing, frontmatter)
  - `path.utils.test.ts` (path manipulation)
  - `validation.utils.test.ts` (validation functions)
  - Any new utilities created

- [ ] Edge case testing:
  - Empty inputs
  - Malformed data
  - Special characters
  - Platform differences

**Success Criteria:**
- 100% coverage for utility functions
- All edge cases tested
- Platform-specific behavior verified

**Files to Create:**
- `tests/unit/utils/markdown.utils.test.ts`
- `tests/unit/utils/path.utils.test.ts`
- `tests/unit/utils/validation.utils.test.ts`

---

### Task 3.5: Setup Test Coverage Reporting
**Impact:** Visibility into test quality
**Effort:** 1 day
**Dependencies:** Tasks 1.3, 3.1, 3.2, 3.4

**Objective:** Implement coverage reporting and enforce thresholds.

**Deliverables:**
- [ ] Configure coverage tool (Vitest/Istanbul)
- [ ] Set coverage thresholds:
  - Overall: 70%
  - Services: 75%
  - Utils: 90%
  - Components: 60%

- [ ] Add coverage reports to CI/CD
- [ ] Generate HTML coverage reports
- [ ] Setup coverage badges

**Success Criteria:**
- Coverage runs automatically in CI
- Failing tests block merges
- HTML reports accessible
- Coverage trends tracked

**Files to Modify:**
- `vitest.config.ts`
- `.github/workflows/*.yml` (CI config)
- Add coverage reporting scripts to `package.json`

---

## 🎯 Phase 4: State Management & Polish (Weeks 7-8)

### Priority: **LOW-MEDIUM** | Impact: **MEDIUM**

These tasks improve developer experience and code maintainability.

### Task 4.1: Clarify State Management Strategy
**Impact:** Consistent patterns, better DX
**Effort:** 2-3 days
**Dependencies:** None

**Objective:** Choose and implement consistent state management approach.

**Decision Options:**
1. **React Query + Zustand** (recommended)
   - React Query: Server state (IPC calls)
   - Zustand: Client state (UI state, preferences)

2. **React Query only**
   - Remove Zustand dependency
   - Use React Query for all state

**Deliverables:**
- [ ] Document decision in `docs/STATE_MANAGEMENT.md`
- [ ] Create example pattern for:
  - Server state (fetching Claude data)
  - Client state (UI toggles, forms)
  - Derived state (computed values)

- [ ] Migrate 2-3 existing hooks to new pattern
- [ ] Remove unused dependencies (if going React Query only)

**Success Criteria:**
- Clear documentation of when to use what
- Example hooks for each pattern
- No unused dependencies
- Team aligned on approach

**Files to Create:**
- `docs/STATE_MANAGEMENT.md`
- `src/renderer/hooks/examples/*.ts`

---

### Task 4.2: Add Shared Utilities
**Impact:** DRY up common operations
**Effort:** 2 days
**Dependencies:** None

**Objective:** Create utility functions for common operations.

**Deliverables:**
- [ ] Create utilities:
  - `date.utils.ts` - Date formatting, relative time
  - `string.utils.ts` - Truncate, slugify, capitalize
  - `number.utils.ts` - Format bytes, percentages
  - `async.utils.ts` - Debounce, throttle, retry
  - `object.utils.ts` - Deep clone, merge, pick/omit

- [ ] Add tests for all utilities (100% coverage)
- [ ] Add JSDoc documentation
- [ ] Export from `src/shared/utils/index.ts`

**Success Criteria:**
- 5+ new utility modules
- 100% test coverage
- Used in at least 3 places
- Full JSDoc documentation

**Files to Create:**
- `src/shared/utils/date.utils.ts`
- `src/shared/utils/string.utils.ts`
- `src/shared/utils/number.utils.ts`
- `src/shared/utils/async.utils.ts`
- `src/shared/utils/object.utils.ts`
- Tests for each

---

### Task 4.3: Standardize Component Patterns
**Impact:** Consistent React patterns
**Effort:** 2-3 days
**Dependencies:** Task 2.1 (UI components)

**Objective:** Document and enforce React component patterns.

**Deliverables:**
- [ ] Create pattern documentation:
  - Component structure (props, state, effects)
  - Naming conventions
  - File organization
  - When to split components
  - Performance patterns (memo, useMemo, useCallback)

- [ ] Create component templates:
  - Feature component template
  - UI component template
  - Modal/dialog template
  - Form component template

- [ ] Refactor 3+ components to match patterns

**Success Criteria:**
- Clear component guidelines documented
- Templates available for common patterns
- 3+ components refactored
- ESLint rules enforcing patterns

**Files to Create:**
- `docs/COMPONENT_PATTERNS.md`
- `templates/component.tsx`
- `templates/ui-component.tsx`

---

### Task 4.4: Add Runtime Validation
**Impact:** Catches data issues early
**Effort:** 2-3 days
**Dependencies:** Task 1.1 (ValidationService)

**Objective:** Add runtime validation for IPC messages and external data.

**Deliverables:**
- [ ] Choose validation library (Zod recommended)
- [ ] Create schemas for:
  - All IPC request/response types
  - Claude config files (settings.json, etc.)
  - Plugin manifests
  - Skill frontmatter

- [ ] Add validation middleware for IPC:
  ```typescript
  function withValidation<T>(schema: Schema<T>) {
    return (handler) => async (event, data) => {
      const validated = schema.parse(data);
      return handler(event, validated);
    }
  }
  ```

- [ ] Add validation to file parsing
- [ ] Proper error messages for validation failures

**Success Criteria:**
- All IPC messages validated at runtime
- File parsing validates structure
- Clear error messages for invalid data
- No breaking changes

**Files to Create:**
- `src/shared/schemas/*.schema.ts`
- `src/main/decorators/validation.decorator.ts`

**Files to Modify:**
- All IPC handlers (add validation)
- File parsing services

---

### Task 4.5: Improve Developer Experience
**Impact:** Faster development cycles
**Effort:** 2-3 days
**Dependencies:** None

**Objective:** Add tools and documentation to improve DX.

**Deliverables:**
- [ ] IPC debugger tool:
  - Log all IPC calls in dev mode
  - Measure call duration
  - Show request/response payloads

- [ ] Better error messages:
  - Dev mode shows full stack traces
  - Production mode shows user-friendly messages
  - Error codes with documentation links

- [ ] Development documentation:
  - Architecture overview with diagrams
  - How to add new features guide
  - Debugging tips
  - Common patterns

- [ ] Code snippets for VS Code:
  - New component
  - New service
  - New IPC handler
  - New test

**Success Criteria:**
- IPC calls visible in DevTools
- Error messages link to docs
- Documentation covers common tasks
- VS Code snippets working

**Files to Create:**
- `src/main/dev/ipcDebugger.ts`
- `docs/ARCHITECTURE.md`
- `docs/HOW_TO_ADD_FEATURES.md`
- `docs/DEBUGGING.md`
- `.vscode/snippets.code-snippets`

---

## 📋 Task Dependencies Visualization

```
Phase 1 (Critical Foundation)
├─ 1.1 Core Services [No deps] ✱ HIGH PRIORITY
├─ 1.2 Split IPC Types [No deps] ✱ HIGH PRIORITY
├─ 1.3 Service Tests [No deps] ✱ HIGH PRIORITY
├─ 1.4 Error Handling [No deps] ✱ HIGH PRIORITY
└─ 1.5 Preload Types [Requires 1.2]

Phase 2 (Code Organization)
├─ 2.1 UI Components [No deps]
├─ 2.2 Split Components [Requires 2.1]
├─ 2.3 Split Services [Requires 1.1] ✱ Blocks 2.5
├─ 2.4 Channel Deduplication [No deps]
└─ 2.5 Refactor Services [Requires 1.1, 2.3] ✱ HIGH IMPACT

Phase 3 (Testing & Quality)
├─ 3.1 Integration Tests [Requires 1.3]
├─ 3.2 Component Tests [Requires 2.1]
├─ 3.3 E2E Tests [No deps]
├─ 3.4 Utility Tests [No deps]
└─ 3.5 Coverage Reporting [Requires 1.3, 3.1, 3.2, 3.4]

Phase 4 (State & Polish)
├─ 4.1 State Strategy [No deps]
├─ 4.2 Shared Utils [No deps]
├─ 4.3 Component Patterns [Requires 2.1]
├─ 4.4 Runtime Validation [Requires 1.1]
└─ 4.5 Developer Experience [No deps]
```

---

## 🎯 Quick Win Tasks (Can Start Immediately)

These tasks have no dependencies and provide immediate value:

1. **Task 1.2** - Split IPC Types (1-2 days)
2. **Task 1.3** - Service Tests (3-4 days)
3. **Task 1.4** - Error Handling (2 days)
4. **Task 2.1** - UI Components (3-4 days)
5. **Task 2.4** - Channel Deduplication (1 day)
6. **Task 3.4** - Utility Tests (1-2 days)
7. **Task 4.2** - Shared Utils (2 days)

---

## 📈 Success Metrics

### Code Quality Metrics
- **Test Coverage:** 40% → 70%+
- **Average File Size:** 300 lines → <250 lines
- **Code Duplication:** 15% → <5%
- **Type Safety:** 85% → 95%+

### Developer Experience Metrics
- **Time to Add Feature:** 4 hours → 2 hours
- **Build Time:** Current → Same or faster
- **Test Run Time:** N/A → <30 seconds (unit)
- **Bugs Found in Code Review:** Baseline → 50% reduction

### Architecture Metrics
- **Services Using Core Abstractions:** 0% → 100%
- **Components Using Shared UI:** 0% → 80%+
- **IPC Handlers with Standard Error Handling:** 50% → 100%
- **Files Over 400 Lines:** 4 → 0

---

## 🚀 Recommended Execution Order

### Week 1-2 (Phase 1 - Critical)
- **Developer A:** Task 1.1 (Core Services) + 1.5 (Preload Types)
- **Developer B:** Task 1.2 (Split Types) + 1.4 (Error Handling)
- **Developer C:** Task 1.3 (Service Tests)

### Week 3-4 (Phase 2 - Organization)
- **Developer A:** Task 2.3 (Split Services) → 2.5 (Refactor Services)
- **Developer B:** Task 2.1 (UI Components) → 2.2 (Split Components)
- **Developer C:** Task 2.4 (Channels) + Start Phase 3

### Week 5-6 (Phase 3 - Testing)
- **Developer A:** Task 3.1 (Integration Tests)
- **Developer B:** Task 3.2 (Component Tests)
- **Developer C:** Task 3.3 (E2E Tests) + 3.4 (Utility Tests) + 3.5 (Coverage)

### Week 7-8 (Phase 4 - Polish)
- **Team Discussion:** Task 4.1 (State Strategy)
- **Developer A:** Task 4.4 (Runtime Validation)
- **Developer B:** Task 4.2 (Shared Utils) + 4.3 (Component Patterns)
- **Developer C:** Task 4.5 (Developer Experience)

---

## 💡 Notes

- **Parallel Execution:** Many tasks can run in parallel (especially in Phase 1)
- **Breaking Changes:** Most tasks avoid breaking changes; exceptions noted
- **Testing First:** Prioritize testing tasks to catch issues early
- **Documentation:** Update docs as patterns emerge
- **Code Review:** Each task should be reviewed before merge
- **Incremental Delivery:** Each task delivers working, tested code

---

This refactoring plan transforms Claude Owl from a solid B+ codebase to an A-grade, production-ready application with excellent test coverage, clear patterns, and maintainable architecture. Each task is independent and can be picked up by different developers, enabling parallel work and faster delivery.
