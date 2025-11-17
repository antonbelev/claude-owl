# ADR 001: Migrate to Tailwind CSS + Shadcn/UI Component System

**Status:** Proposed
**Date:** 2025-11-15
**Decision Makers:** Development Team
**Technical Story:** Establish a modern, consistent, and maintainable UI system for Claude Owl

---

## Executive Summary

Migrate Claude Owl from traditional CSS files with inconsistent styling to a modern UI stack using **Tailwind CSS** for utility-first styling and **Shadcn/UI** for accessible, customizable React components. This migration will establish a cohesive design system, improve developer experience, and create a foundation for rapid, consistent UI development.

**Current State:** 28 separate CSS files, broken CSS variables, inconsistent colors, emoji icons, no component library
**Target State:** Utility-first Tailwind classes, shadcn/ui component library, lucide-react icons, standardized design system

---

## Context

### Current UI Architecture Analysis

**Styling Approach:**
- **28 separate CSS files** with traditional class-based styling
- CSS imported per-component: `import './ComponentName.css'`
- BEM-like naming conventions but inconsistent application
- No CSS modules, preprocessors, or CSS-in-JS

**Broken Design System:**
- CSS variables referenced (`var(--color-primary)`) but **never defined**
- **10+ different blue colors** across the codebase:
  - `#4f46e5`, `#3b82f6`, `#007bff`, `#0066cc`, `#4299e1`
- **3 different success greens, 3 different error reds**
- Hardcoded colors dominate; no centralized theme

**Component Reusability:**
- Only **2 reusable components** (`ConfirmDialog`, `PageHeader`)
- Heavy code duplication across 44 feature components
- No component library or design primitives
- Icons are **Unicode emojis** (📊, 🤖, ⚙️) - not accessible, not customizable

**Existing Infrastructure:**
- ✅ Tailwind CSS installed (`v3.4.6`) but **completely unused**
- ✅ PostCSS and autoprefixer installed
- ❌ No `tailwind.config.js/ts`
- ❌ No component library
- ❌ No icon library

**Tech Stack (from CLAUDE.md):**
- Electron + React 18 + TypeScript + Vite + Zustand
- Already mentions "Tailwind CSS" as intended tech

### Problems with Current Approach

1. **Inconsistency:** 10+ shades of blue, 6+ grays, inconsistent spacing
2. **Maintainability:** 28 CSS files to update for global style changes
3. **No Design System:** No single source of truth for colors, spacing, typography
4. **Poor Developer Experience:** Need to write custom CSS for every component
5. **Accessibility Gaps:** No focus states, ARIA patterns, or keyboard navigation standards
6. **Icon Issues:** Emoji icons are not screen-reader friendly or themeable
7. **Code Duplication:** Button styles, form inputs, modals duplicated across files
8. **Broken Theming:** CSS variables referenced but never defined

### Why Now?

- Project is in **Phase 2** - perfect time for systematic refactoring
- Current codebase is manageable size (~44 components)
- Migration now prevents accumulating more CSS debt
- Establishes foundation for rapid feature development ahead
- Aligns with stated tech stack in CLAUDE.md

---

## Decision

**We will migrate Claude Owl to:**

1. **Tailwind CSS v3+** for utility-first styling
2. **Shadcn/UI** for accessible React component primitives
3. **Lucide React** for consistent, accessible icon system
4. **Radix UI** primitives (via shadcn/ui) for complex interactions
5. **Centralized design system** with Tailwind theme configuration

### Technology Choices

#### 1. Tailwind CSS

**Why Tailwind:**
- Utility-first approach reduces CSS file size and complexity
- Built-in design constraints prevent color/spacing proliferation
- Dark mode support out-of-the-box
- Excellent TypeScript/IntelliSense support
- Active ecosystem and community
- Already installed in our dependencies

**Configuration:**
```js
// tailwind.config.js
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx}'],
  darkMode: 'class', // Electron apps often need explicit dark mode control
  theme: {
    extend: {
      colors: {
        // Custom color palette for Claude Owl
        primary: { ... },
        secondary: { ... },
        accent: { ... }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', ...],
        mono: ['Fira Code', 'Monaco', 'Menlo', ...]
      }
    }
  }
}
```

#### 2. Shadcn/UI

**Why Shadcn/UI (not a traditional component library):**
- **Copy-paste architecture** - components live in YOUR codebase, not node_modules
- Full control and customization - no "black box" dependencies
- Built on Radix UI primitives (accessibility-first)
- TypeScript-native with excellent type inference
- Each component is independently importable
- No runtime overhead - just React + Radix
- Perfect for Electron apps (no bundling conflicts)

**What shadcn/ui provides:**
- 40+ production-ready components (Button, Dialog, Select, Tabs, etc.)
- Accessible by default (ARIA, keyboard nav, focus management)
- Customizable via Tailwind classes
- Consistent API patterns across components

**Example:**
```tsx
// Traditional approach (current)
import './Button.css';
const Button = ({ variant, children }) => (
  <button className={`btn btn-${variant}`}>{children}</button>
);

// Shadcn/UI approach (target)
import { Button } from '@/renderer/components/ui/button';
<Button variant="default" size="sm">Click me</Button>
// Variants handled via cva (class-variance-authority)
```

#### 3. Lucide React

**Why Lucide:**
- Official icon library recommended by shadcn/ui
- 1000+ icons, consistently designed
- Tree-shakeable (only bundle icons you use)
- TypeScript support
- Customizable size, color, stroke-width
- Accessible (proper ARIA labels)

**Migration from emojis:**
```tsx
// Before
<span>📊</span> Dashboard
<span>🤖</span> Agents
<span>⚙️</span> Settings

// After
<BarChart3 className="h-4 w-4" /> Dashboard
<Bot className="h-4 w-4" /> Agents
<Settings className="h-4 w-4" /> Settings
```

#### 4. Radix UI (via Shadcn/UI)

**What Radix provides (under the hood):**
- Unstyled, accessible component primitives
- Dialog, DropdownMenu, Select, Tabs, Tooltip, etc.
- WAI-ARIA compliant
- Keyboard navigation
- Focus management
- Portal rendering (for modals, popovers)

**Why via shadcn/ui instead of direct:**
- Shadcn/ui wraps Radix with Tailwind styling
- Pre-configured variants and best practices
- Consistent API across all components

---

## Design System

### Color Palette

Standardize to **Tailwind's default palette** with custom extensions:

```js
// tailwind.config.js theme.extend.colors
{
  // Primary - Indigo (matches current #4f46e5)
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    // ... Tailwind indigo scale
    600: '#4f46e5', // Current primary color
    700: '#4338ca',
  },

  // Accent - Blue (for interactive elements)
  accent: {
    // ... Tailwind blue scale
    500: '#3b82f6', // Current button blue
  },

  // Success - Green
  success: colors.green, // Use Tailwind green instead of 3 different greens

  // Destructive - Red
  destructive: colors.red, // Use Tailwind red instead of 3 different reds

  // Neutral - Slate (for text, borders, backgrounds)
  neutral: colors.slate,

  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: '#f3f4f6',
  },

  // Electron-specific
  'window-bg': '#ffffff',
  'sidebar-bg': '#1e1e1e',
}
```

**Benefits:**
- Single source of truth
- Consistent color usage
- Dark mode support built-in
- Semantic naming (primary, success, destructive)

### Typography

```js
// tailwind.config.js theme.extend
{
  fontSize: {
    'xs': ['0.75rem', { lineHeight: '1rem' }],
    'sm': ['0.875rem', { lineHeight: '1.25rem' }],
    'base': ['1rem', { lineHeight: '1.5rem' }],
    'lg': ['1.125rem', { lineHeight: '1.75rem' }],
    'xl': ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
  },
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Helvetica Neue',
      'sans-serif'
    ],
    mono: [
      'Fira Code',
      'Monaco',
      'Menlo',
      'Courier New',
      'monospace'
    ]
  }
}
```

### Spacing & Layout

Use Tailwind's 4px spacing scale:
- `p-2` = 8px padding
- `p-4` = 16px padding
- `gap-4` = 16px gap
- `space-y-6` = 24px vertical spacing

**Benefits:**
- Consistent spacing throughout app
- No more arbitrary `margin: 13px`
- Design constraints prevent spacing chaos

### Component Variants

Using **CVA (Class Variance Authority)** for component variants:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'hover:bg-neutral-100',
        link: 'text-primary-600 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({ variant, size, className, ...props }: ButtonProps) => (
  <button className={buttonVariants({ variant, size, className })} {...props} />
);
```

**Benefits:**
- Type-safe variants
- Consistent styling across all button usage
- Easy to extend with new variants
- Single source of truth for button styles

---

## Component Architecture

### Directory Structure

```
src/renderer/
├── components/
│   ├── ui/                          # Shadcn/UI components (copied into codebase)
│   │   ├── button.tsx               # <Button> primitive
│   │   ├── dialog.tsx               # <Dialog> modal system
│   │   ├── input.tsx                # <Input> form field
│   │   ├── select.tsx               # <Select> dropdown
│   │   ├── tabs.tsx                 # <Tabs> navigation
│   │   ├── card.tsx                 # <Card> container
│   │   ├── badge.tsx                # <Badge> status indicator
│   │   ├── alert.tsx                # <Alert> notifications
│   │   ├── tooltip.tsx              # <Tooltip> hints
│   │   ├── dropdown-menu.tsx        # <DropdownMenu> actions
│   │   ├── separator.tsx            # <Separator> dividers
│   │   ├── label.tsx                # <Label> form labels
│   │   ├── switch.tsx               # <Switch> toggle
│   │   ├── checkbox.tsx             # <Checkbox> multi-select
│   │   ├── radio-group.tsx          # <RadioGroup> single-select
│   │   ├── textarea.tsx             # <Textarea> multi-line input
│   │   ├── scroll-area.tsx          # <ScrollArea> custom scrollbars
│   │   ├── table.tsx                # <Table> data display
│   │   ├── skeleton.tsx             # <Skeleton> loading states
│   │   └── ...                      # 30+ more components
│   │
│   ├── common/                      # App-specific reusable components
│   │   ├── PageHeader.tsx           # Migrated to use ui/button
│   │   ├── EmptyState.tsx           # NEW: Consistent empty states
│   │   ├── LoadingSpinner.tsx       # NEW: Loading indicators
│   │   ├── ErrorBoundary.tsx        # NEW: Error handling UI
│   │   ├── StatusBadge.tsx          # NEW: Status indicators (success/error/warning)
│   │   ├── ConfirmDialog.tsx        # Migrated to use ui/dialog
│   │   └── ...
│   │
│   ├── layout/                      # Layout components
│   │   ├── Sidebar.tsx              # Migrated to Tailwind
│   │   ├── Header.tsx               # Migrated to Tailwind
│   │   ├── MainLayout.tsx           # Migrated to Tailwind
│   │   └── ...
│   │
│   ├── Dashboard/                   # Feature components (unchanged structure)
│   ├── SettingsEditor/
│   ├── AgentsManager/
│   └── ...
│
├── lib/
│   └── utils.ts                     # Utility functions (cn, formatDate, etc.)
│
└── styles/
    └── globals.css                  # Tailwind directives + global styles
```

### Component Patterns

#### 1. UI Primitives (in `components/ui/`)

**Purpose:** Low-level, reusable building blocks
**Source:** Generated via `npx shadcn-ui@latest add <component>`
**Customization:** Via Tailwind classes and CVA variants
**Examples:** Button, Input, Dialog, Select

```tsx
// components/ui/button.tsx
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(/* ... */);

export const Button = ({ variant, size, className, ...props }) => (
  <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
);
```

#### 2. Common Components (in `components/common/`)

**Purpose:** App-specific reusable components
**Built with:** Shadcn/UI primitives + custom logic
**Examples:** PageHeader, EmptyState, StatusBadge

```tsx
// components/common/PageHeader.tsx
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary';
    icon?: React.ComponentType;
  }>;
}

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-6">
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      {description && <p className="text-sm text-neutral-600 mt-1">{description}</p>}
    </div>
    {actions && (
      <div className="flex gap-2">
        {actions.map((action, idx) => (
          <Button
            key={idx}
            variant={action.variant || 'default'}
            onClick={action.onClick}
          >
            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        ))}
      </div>
    )}
  </div>
);
```

#### 3. Feature Components (existing structure)

**Purpose:** Page-specific business logic components
**Built with:** UI primitives + Common components
**Migration:** Replace CSS classes with Tailwind utilities

```tsx
// components/AgentsManager/AgentCard.tsx (migrated)
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Settings, Trash2 } from 'lucide-react';

export const AgentCard = ({ agent, onEdit, onDelete }) => (
  <Card className="p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Bot className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h3 className="font-medium text-neutral-900">{agent.name}</h3>
          <p className="text-sm text-neutral-600 mt-1">{agent.description}</p>
        </div>
      </div>
      <Badge variant={agent.enabled ? 'success' : 'secondary'}>
        {agent.enabled ? 'Enabled' : 'Disabled'}
      </Badge>
    </div>
    <div className="flex gap-2 mt-4">
      <Button variant="secondary" size="sm" onClick={onEdit}>
        <Settings className="h-4 w-4 mr-2" />
        Configure
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  </Card>
);
```

### Utility Functions

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with proper precedence
 * Prevents className conflicts (e.g., "p-4 p-2" -> "p-2")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<Button className={cn('bg-blue-500', isDanger && 'bg-red-500')} />
```

---

## Migration Strategy

### Phase 0: Setup & Configuration (Week 1)

**Goal:** Configure Tailwind + Shadcn/UI infrastructure

**Tasks:**
1. **Configure Tailwind CSS**
   ```bash
   # Create config files
   npx tailwindcss init -p
   ```
   - Create `tailwind.config.ts` with custom theme
   - Create `postcss.config.js`
   - Update Vite config to support PostCSS

2. **Setup Tailwind Directives**
   ```css
   /* src/renderer/styles/globals.css */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   @layer base {
     /* Global resets and base styles */
   }

   @layer components {
     /* Custom component classes (use sparingly) */
   }
   ```

3. **Initialize Shadcn/UI**
   ```bash
   npx shadcn-ui@latest init
   ```
   - Creates `components.json` config
   - Sets up path aliases
   - Configures CSS variables for theming

4. **Install Core Dependencies**
   ```bash
   npm install class-variance-authority clsx tailwind-merge lucide-react
   npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
   # (More Radix primitives installed automatically by shadcn-ui)
   ```

5. **Create Utility Functions**
   - Create `src/renderer/lib/utils.ts` with `cn()` helper
   - Add TypeScript path alias for `@/renderer/lib`

6. **Verify Build Pipeline**
   - Run `npm run dev` - ensure Tailwind compiles
   - Check hot reload works with Tailwind classes
   - Verify no build errors

**Deliverables:**
- ✅ Tailwind config with custom theme
- ✅ PostCSS pipeline working
- ✅ Shadcn/UI initialized
- ✅ `components/ui/` directory created
- ✅ Build succeeds with Tailwind enabled

---

### Phase 1: Install Core UI Components (Week 1)

**Goal:** Add shadcn/ui components we'll use throughout the app

**Install components via CLI:**
```bash
# Core components (install all at once)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add label
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add table
npx shadcn-ui@latest add skeleton
```

**Customize components:**
- Review each component in `components/ui/`
- Adjust color variants to match Claude Owl brand
- Add any Claude Owl-specific variants

**Create app-specific common components:**
```tsx
// components/common/PageHeader.tsx (using new UI primitives)
// components/common/EmptyState.tsx (NEW)
// components/common/LoadingSpinner.tsx (NEW)
// components/common/StatusBadge.tsx (NEW)
```

**Deliverables:**
- ✅ 18+ shadcn/ui components installed
- ✅ All components customized with Claude Owl theme
- ✅ 4 new common components created
- ✅ Storybook/demo page showing all components (optional)

---

### Phase 2: Migrate Layout Components (Week 2)

**Goal:** Migrate high-impact layout components first for immediate visual consistency

**Components to migrate (in order):**

1. **MainLayout.tsx** - App shell
   - Remove `Layout.css`
   - Use Tailwind grid/flex for layout
   - Ensure sidebar + main content layout responsive

2. **Sidebar.tsx** - Navigation
   - Replace emoji icons with Lucide React
   - Use `cn()` for active state styling
   - Hover/focus states via Tailwind

3. **Header.tsx** - Top bar
   - Migrate to Tailwind
   - Use shadcn/ui Button for actions

**Migration pattern:**
```tsx
// BEFORE
import './Sidebar.css';
<div className="sidebar">
  <div className="sidebar-item active">
    <span>📊</span> Dashboard
  </div>
</div>

// AFTER
import { BarChart3 } from 'lucide-react';
<div className="flex flex-col w-64 bg-neutral-900 text-white">
  <button className={cn(
    "flex items-center gap-3 px-4 py-2 hover:bg-neutral-800 transition-colors",
    isActive && "bg-neutral-800 border-l-2 border-primary-500"
  )}>
    <BarChart3 className="h-5 w-5" />
    <span>Dashboard</span>
  </button>
</div>
```

**Testing:**
- Visual regression testing (screenshot comparison)
- Ensure no layout breaks
- Check dark mode if applicable

**Deliverables:**
- ✅ Layout components migrated
- ✅ 3 CSS files deleted
- ✅ Lucide icons replace emojis in navigation
- ✅ App shell looks identical or better

---

### Phase 3: Migrate Common Components (Week 2)

**Goal:** Establish patterns for reusable components

**Components to migrate:**

1. **ConfirmDialog.tsx**
   ```tsx
   // BEFORE: Custom modal with ConfirmDialog.css
   // AFTER: Use shadcn/ui Dialog + AlertDialog
   import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
   } from '@/components/ui/alert-dialog';
   ```

2. **PageHeader.tsx** (already exists)
   - Migrate to use shadcn/ui Button
   - Add icon support with Lucide React

**Create new common components:**

3. **EmptyState.tsx**
   ```tsx
   interface EmptyStateProps {
     icon: LucideIcon;
     title: string;
     description: string;
     action?: {
       label: string;
       onClick: () => void;
     };
   }

   export const EmptyState = ({ icon: Icon, title, description, action }) => (
     <div className="flex flex-col items-center justify-center py-12 text-center">
       <div className="p-4 bg-neutral-100 rounded-full mb-4">
         <Icon className="h-8 w-8 text-neutral-400" />
       </div>
       <h3 className="text-lg font-medium text-neutral-900 mb-2">{title}</h3>
       <p className="text-sm text-neutral-600 mb-6 max-w-md">{description}</p>
       {action && (
         <Button onClick={action.onClick}>{action.label}</Button>
       )}
     </div>
   );
   ```

4. **StatusBadge.tsx**
   ```tsx
   import { Badge } from '@/components/ui/badge';
   import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

   type Status = 'success' | 'error' | 'warning' | 'info';

   const statusConfig = {
     success: { icon: CheckCircle2, variant: 'success' },
     error: { icon: XCircle, variant: 'destructive' },
     warning: { icon: AlertCircle, variant: 'warning' },
     info: { icon: AlertCircle, variant: 'secondary' },
   };

   export const StatusBadge = ({ status, children }) => {
     const { icon: Icon, variant } = statusConfig[status];
     return (
       <Badge variant={variant} className="gap-1">
         <Icon className="h-3 w-3" />
         {children}
       </Badge>
     );
   };
   ```

**Deliverables:**
- ✅ ConfirmDialog migrated to AlertDialog
- ✅ PageHeader using shadcn/ui primitives
- ✅ 2 new common components created
- ✅ Usage examples in multiple features

---

### Phase 4: Migrate Feature Components (Weeks 3-4)

**Goal:** Systematically migrate all feature components

**Migration order (by priority):**

1. **Dashboard** (highest visibility)
2. **SettingsEditor** (most complex, sets patterns)
3. **AgentsManager**
4. **SkillsManager**
5. **PluginsManager**
6. **CommandsManager**
7. **HooksManager**
8. **MCPManager**
9. **Other features**

**Per-component migration checklist:**

For each component:
- [ ] Read existing CSS file
- [ ] Convert classes to Tailwind utilities
- [ ] Replace emojis with Lucide icons
- [ ] Use shadcn/ui components where applicable
- [ ] Extract reusable patterns to common components
- [ ] Delete CSS file
- [ ] Test component rendering
- [ ] Update tests if needed
- [ ] Visual QA (screenshot comparison)

**Example: AgentCard migration**

```tsx
// BEFORE (AgentCard.tsx + AgentCard.css)
import './AgentCard.css';
export const AgentCard = ({ agent }) => (
  <div className="agent-card">
    <div className="agent-header">
      <span className="agent-icon">🤖</span>
      <h3 className="agent-name">{agent.name}</h3>
      <span className={`status-badge ${agent.enabled ? 'active' : 'inactive'}`}>
        {agent.enabled ? 'Active' : 'Inactive'}
      </span>
    </div>
    <p className="agent-description">{agent.description}</p>
    <div className="agent-actions">
      <button className="btn-secondary" onClick={onEdit}>Edit</button>
      <button className="btn-danger" onClick={onDelete}>Delete</button>
    </div>
  </div>
);

// AFTER (AgentCard.tsx only)
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Edit, Trash2 } from 'lucide-react';

export const AgentCard = ({ agent, onEdit, onDelete }) => (
  <Card className="p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Bot className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h3 className="font-medium text-neutral-900">{agent.name}</h3>
        </div>
      </div>
      <Badge variant={agent.enabled ? 'success' : 'secondary'}>
        {agent.enabled ? 'Active' : 'Inactive'}
      </Badge>
    </div>
    <p className="text-sm text-neutral-600 mb-4">{agent.description}</p>
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={onEdit}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  </Card>
);
```

**Track progress:**
- Create GitHub issue or project board
- Check off components as migrated
- Track CSS files deleted

**Deliverables:**
- ✅ All 44 feature components migrated
- ✅ 28 CSS files deleted
- ✅ Consistent styling across entire app
- ✅ Emoji icons fully replaced

---

### Phase 5: Polish & Optimization (Week 5)

**Goal:** Refine design system and optimize bundle size

**Tasks:**

1. **Design System Refinement**
   - Audit all color usage (ensure using theme colors)
   - Standardize spacing (consistent padding/margins)
   - Verify typography scale usage
   - Ensure all focus states are accessible

2. **Dark Mode Support**
   - Add dark mode variants to all components
   - Create dark mode toggle in settings
   - Test all pages in dark mode

3. **Accessibility Audit**
   - Run axe DevTools on all pages
   - Ensure keyboard navigation works
   - Verify screen reader compatibility
   - Add missing ARIA labels

4. **Performance Optimization**
   - Tree-shake unused Tailwind classes (automatic in production)
   - Lazy load heavy components (Monaco Editor)
   - Optimize icon imports (tree-shaking already works with Lucide)

5. **Documentation**
   - Create component showcase page (Storybook or internal)
   - Document design tokens (colors, spacing, typography)
   - Write migration guide for future contributors
   - Update CLAUDE.md with new patterns

**Deliverables:**
- ✅ Dark mode fully functional
- ✅ Accessibility score >90 (Lighthouse)
- ✅ Design system documentation
- ✅ Production build optimized

---

### Phase 6: Testing & Validation (Week 6)

**Goal:** Ensure migration didn't break functionality

**Testing checklist:**

1. **Visual Regression Testing**
   - Screenshot all pages before/after migration
   - Compare for unintended changes
   - Use Percy or Chromatic (optional)

2. **Functional Testing**
   - Run all existing unit tests
   - Run integration tests
   - Manual QA on all features

3. **Cross-platform Testing** (Electron-specific)
   - Test on macOS (different UI conventions)
   - Test on Windows (different font rendering)
   - Test on Linux (different GTK themes)

4. **Performance Benchmarks**
   - Measure bundle size (before/after)
   - Measure time-to-interactive
   - Check memory usage

5. **User Acceptance Testing**
   - Internal team review
   - Beta testing with select users (if applicable)

**Deliverables:**
- ✅ All tests passing
- ✅ Visual regression tests passing
- ✅ Cross-platform validation complete
- ✅ Performance metrics within acceptable range

---

## Migration Tooling & Scripts

### Automated Migration Helpers

**CSS to Tailwind Converter** (semi-automated):
```bash
# Use tools like:
npx @tailwindcss/upgrade
# OR
# Use VSCode extension: Tailwind CSS IntelliSense
```

**Find/Replace Patterns:**
```bash
# Find all CSS imports
rg "import.*\.css" src/renderer/components

# Find all emoji usage
rg "[📊🤖⚙️⚡🔌🎯🔧📝🗂️]" src/renderer

# Find hardcoded colors
rg "#[0-9a-fA-F]{6}" src/renderer
```

**ESLint Rules** (optional):
```js
// .eslintrc - Enforce Tailwind usage
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": ["*.css"] // Prevent new CSS file imports
    }]
  }
}
```

---

## Component Library Reference

### Shadcn/UI Components to Install

**Priority 1 (Essential):**
- `button` - Buttons with variants
- `input` - Text inputs
- `label` - Form labels
- `dialog` - Modals and dialogs
- `select` - Dropdowns
- `card` - Container cards
- `badge` - Status indicators
- `separator` - Visual dividers
- `alert` - Notifications

**Priority 2 (Common):**
- `tabs` - Tab navigation
- `switch` - Toggle switches
- `checkbox` - Checkboxes
- `textarea` - Multi-line text
- `dropdown-menu` - Action menus
- `tooltip` - Contextual help
- `scroll-area` - Custom scrollbars
- `table` - Data tables
- `skeleton` - Loading states

**Priority 3 (Advanced):**
- `command` - Command palette
- `popover` - Floating content
- `radio-group` - Radio buttons
- `slider` - Range inputs
- `toast` - Toast notifications
- `accordion` - Collapsible sections
- `calendar` - Date picker
- `context-menu` - Right-click menus
- `hover-card` - Hover tooltips
- `menubar` - Menu bar navigation

### Lucide Icons Commonly Used

```tsx
// Navigation
import { Home, Settings, User, Bell, Search } from 'lucide-react';

// Actions
import { Plus, Edit, Trash2, Save, X, Check } from 'lucide-react';

// Status
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

// Features
import { Bot, Sparkles, Zap, Package, Code, Terminal } from 'lucide-react';

// Files
import { File, Folder, FileText, Download, Upload } from 'lucide-react';

// UI
import { ChevronDown, ChevronRight, Menu, MoreVertical } from 'lucide-react';
```

---

## Consequences

### Positive

1. **Consistency:** Single source of truth for colors, spacing, typography
2. **Productivity:** Build new features 3x faster with pre-built components
3. **Maintainability:** 28 CSS files → 0 CSS files, all styling in components
4. **Accessibility:** Radix UI primitives provide ARIA compliance out-of-the-box
5. **Type Safety:** Full TypeScript support with IntelliSense for all components
6. **Bundle Size:** Tree-shaking removes unused Tailwind classes (smaller build)
7. **Developer Experience:** No more writing custom CSS, faster iteration
8. **Design System:** Enforced design constraints prevent UI inconsistencies
9. **Dark Mode:** Built-in support, easy to implement
10. **Future-Proof:** Active ecosystem, long-term support from Tailwind & Radix teams

### Negative

1. **Learning Curve:** Team needs to learn Tailwind utilities and shadcn/ui patterns
2. **Migration Effort:** ~4-6 weeks to migrate all 44 components
3. **HTML Verbosity:** Tailwind classes make JSX longer (mitigated by components)
4. **Initial Bundle Size:** Tailwind CSS adds ~3-5KB gzipped (acceptable)
5. **Lock-in:** Switching away from Tailwind later would require rewrite
6. **Build Complexity:** Requires PostCSS pipeline (already have it)

### Neutral

1. **Component Ownership:** shadcn/ui components are copied into codebase (more code, but more control)
2. **CSS Knowledge:** Still need to understand CSS concepts (Flexbox, Grid, etc.)
3. **Customization:** Deep customization requires understanding CVA and Tailwind config

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration breaks functionality | High | Comprehensive testing, incremental migration, visual regression tests |
| Team rejects Tailwind syntax | Medium | Training sessions, pair programming, provide examples |
| Performance regression | Low | Monitor bundle size, lazy load components, tree-shaking enabled |
| Accessibility issues | Medium | Use Radix UI primitives (already accessible), run audits |
| Design inconsistencies | Low | Strict design system, code reviews, linting |

---

## Implementation Checklist

### Week 1: Setup & Core Components

**Phase 0: Configuration**
- [ ] Create `tailwind.config.ts` with custom theme (colors, fonts, spacing)
- [ ] Create `postcss.config.js`
- [ ] Update Vite config to process PostCSS
- [ ] Create `src/renderer/styles/globals.css` with Tailwind directives
- [ ] Import `globals.css` in app entry point
- [ ] Test development build (verify Tailwind compiles)
- [ ] Test production build (verify tree-shaking works)

**Phase 1: Shadcn/UI Setup**
- [ ] Run `npx shadcn-ui@latest init`
- [ ] Configure `components.json` (paths, colors, CSS variables)
- [ ] Install core dependencies: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
- [ ] Create `lib/utils.ts` with `cn()` helper
- [ ] Install Priority 1 components (button, input, dialog, select, card, badge, alert, label, separator)
- [ ] Customize component variants to match Claude Owl brand
- [ ] Create demo page showcasing all components (optional but recommended)

### Week 2: Layout & Common Components

**Phase 2: Layout Migration**
- [ ] Migrate `MainLayout.tsx` → Delete `Layout.css`
- [ ] Migrate `Sidebar.tsx` → Replace emojis with Lucide icons → Delete `Sidebar.css`
- [ ] Migrate `Header.tsx` → Delete `Header.css`
- [ ] Visual QA: Compare screenshots before/after
- [ ] Test navigation, routing still works
- [ ] Test responsive behavior (if applicable)

**Phase 3: Common Components**
- [ ] Migrate `ConfirmDialog.tsx` to use shadcn/ui `AlertDialog`
- [ ] Migrate `PageHeader.tsx` to use shadcn/ui `Button`
- [ ] Create `EmptyState.tsx` common component
- [ ] Create `StatusBadge.tsx` common component
- [ ] Create `LoadingSpinner.tsx` common component (optional)
- [ ] Update all usages of common components
- [ ] Delete obsolete CSS files

### Weeks 3-4: Feature Components

**Phase 4: Systematic Migration**

Dashboard:
- [ ] Migrate `Dashboard/ClaudeStatusCard.tsx`
- [ ] Migrate `Dashboard/SystemInfoCard.tsx`
- [ ] Migrate `Dashboard/QuickActions.tsx`
- [ ] Delete `Dashboard/*.css` files

SettingsEditor:
- [ ] Migrate `SettingsEditor/SettingsEditor.tsx`
- [ ] Migrate `SettingsEditor/PermissionsEditor.tsx`
- [ ] Migrate `SettingsEditor/RuleBuilder.tsx`
- [ ] Migrate `SettingsEditor/SecurityTemplates.tsx`
- [ ] Delete `SettingsEditor/*.css` files

AgentsManager:
- [ ] Migrate `AgentsManager/AgentsList.tsx`
- [ ] Migrate `AgentsManager/AgentCard.tsx`
- [ ] Migrate `AgentsManager/AgentEditor.tsx`
- [ ] Delete `AgentsManager/*.css` files

SkillsManager:
- [ ] Migrate `SkillsManager/SkillsList.tsx`
- [ ] Migrate `SkillsManager/SkillCard.tsx`
- [ ] Migrate `SkillsManager/SkillEditor.tsx`
- [ ] Delete `SkillsManager/*.css` files

PluginsManager:
- [ ] Migrate `PluginsManager/PluginsList.tsx`
- [ ] Migrate `PluginsManager/PluginCard.tsx`
- [ ] Migrate `PluginsManager/MarketplaceView.tsx`
- [ ] Delete `PluginsManager/*.css` files

CommandsManager:
- [ ] Migrate `CommandsManager/CommandsList.tsx`
- [ ] Migrate `CommandsManager/CommandEditor.tsx`
- [ ] Delete `CommandsManager/*.css` files

HooksManager:
- [ ] Migrate `HooksManager/HooksList.tsx`
- [ ] Migrate `HooksManager/HookEditor.tsx`
- [ ] Delete `HooksManager/*.css` files

MCPManager:
- [ ] Migrate `MCPManager/ServersList.tsx`
- [ ] Migrate `MCPManager/ServerCard.tsx`
- [ ] Migrate `MCPManager/ServerEditor.tsx`
- [ ] Delete `MCPManager/*.css` files

**Progress Tracking:**
- [ ] 0/28 CSS files deleted
- [ ] 0/44 components migrated
- [ ] All emoji icons replaced with Lucide

### Week 5: Polish

**Phase 5: Design System Refinement**
- [ ] Audit all color usage (ensure theme compliance)
- [ ] Standardize spacing (consistent padding/margins)
- [ ] Verify typography scale usage
- [ ] Add dark mode support (if planned)
- [ ] Create dark mode toggle component
- [ ] Test all pages in dark mode
- [ ] Run accessibility audit (axe DevTools)
- [ ] Fix accessibility issues found
- [ ] Optimize bundle size (check production build)
- [ ] Document design system (colors, spacing, typography)
- [ ] Create component showcase/Storybook
- [ ] Update CLAUDE.md with new patterns

### Week 6: Testing & Launch

**Phase 6: Validation**
- [ ] Run all unit tests → Fix any failures
- [ ] Run integration tests → Fix any failures
- [ ] Manual QA on all features → File bugs
- [ ] Visual regression testing (compare screenshots)
- [ ] Cross-platform testing:
  - [ ] macOS
  - [ ] Windows
  - [ ] Linux
- [ ] Performance benchmarks:
  - [ ] Bundle size (compare before/after)
  - [ ] Time-to-interactive
  - [ ] Memory usage
- [ ] Code review (all migration PRs)
- [ ] Update documentation
- [ ] Merge to main branch
- [ ] Release notes highlighting UI improvements

---

## Code Examples

### Example 1: Button Component

**Before (custom CSS):**
```tsx
// Button.tsx
import './Button.css';

export const Button = ({ variant = 'primary', children, ...props }) => (
  <button className={`btn btn-${variant}`} {...props}>
    {children}
  </button>
);
```

```css
/* Button.css */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}
```

**After (Tailwind + CVA):**
```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'hover:bg-neutral-100',
        link: 'text-primary-600 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = ({ variant, size, className, ...props }: ButtonProps) => (
  <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
);
```

**Usage:**
```tsx
<Button variant="default" size="sm">Save</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost" className="w-full">Custom width</Button>
```

### Example 2: Card Component Migration

**Before:**
```tsx
// AgentCard.tsx
import './AgentCard.css';

export const AgentCard = ({ agent, onEdit, onDelete }) => (
  <div className="agent-card">
    <div className="agent-header">
      <span className="agent-icon">🤖</span>
      <h3>{agent.name}</h3>
      <span className={`status ${agent.enabled ? 'active' : 'inactive'}`}>
        {agent.enabled ? 'Active' : 'Inactive'}
      </span>
    </div>
    <p className="description">{agent.description}</p>
    <div className="actions">
      <button className="btn-edit" onClick={onEdit}>Edit</button>
      <button className="btn-delete" onClick={onDelete}>Delete</button>
    </div>
  </div>
);
```

**After:**
```tsx
// AgentCard.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Edit, Trash2 } from 'lucide-react';

export const AgentCard = ({ agent, onEdit, onDelete }) => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Bot className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <CardTitle>{agent.name}</CardTitle>
            <CardDescription>{agent.description}</CardDescription>
          </div>
        </div>
        <Badge variant={agent.enabled ? 'success' : 'secondary'}>
          {agent.enabled ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </CardHeader>
    <CardFooter className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={onEdit}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </CardFooter>
  </Card>
);
```

### Example 3: Form with Validation

**Before:**
```tsx
// SettingsForm.tsx
import './SettingsForm.css';

export const SettingsForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  return (
    <form className="settings-form" onSubmit={onSubmit}>
      <div className="form-group">
        <label>Agent Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={error ? 'error' : ''}
        />
        {error && <span className="error-message">{error}</span>}
      </div>
      <button type="submit" className="btn-primary">Save</button>
    </form>
  );
};
```

**After:**
```tsx
// SettingsForm.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const SettingsForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Agent Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={error ? 'border-red-500' : ''}
        />
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
      <Button type="submit">Save</Button>
    </form>
  );
};
```

---

## Success Metrics

### Quantitative

- **CSS Reduction:** 28 CSS files → 0 CSS files (100% reduction)
- **Bundle Size:** CSS bundle <5KB gzipped (Tailwind tree-shaking)
- **Color Standardization:** 10+ blues → 1 primary palette
- **Component Reusability:** 2 common components → 20+ common components
- **Development Speed:** 50% faster feature development (after migration)
- **Accessibility Score:** Lighthouse accessibility >90

### Qualitative

- **Consistency:** Visual audit shows consistent spacing, colors, typography across all pages
- **Developer Experience:** Team reports higher confidence in UI changes
- **Maintainability:** New developers can understand styling without reading CSS files
- **Design Quality:** UI feels polished, professional, and modern
- **User Feedback:** Users notice improved visual consistency

---

## Future Enhancements

### Post-Migration Opportunities

1. **Storybook Integration**
   - Document all components with interactive examples
   - Visual testing and regression prevention

2. **Advanced Theming**
   - Multiple color themes (light/dark/auto)
   - User-customizable accent colors
   - High-contrast mode for accessibility

3. **Animation System**
   - Framer Motion integration for smooth transitions
   - Page transitions, modal animations
   - Loading state animations

4. **Advanced Components**
   - Command palette (Cmd+K) using shadcn/ui command
   - Rich text editor with formatting
   - Data visualization components
   - Advanced table with sorting/filtering

5. **Design Tokens Export**
   - Export Tailwind theme as design tokens
   - Sync with design tools (Figma, Sketch)

---

## References

### Documentation

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/UI Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Lucide Icons](https://lucide.dev/)
- [CVA (Class Variance Authority)](https://cva.style/docs)

### Tools

- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) - VSCode extension
- [Prettier Plugin for Tailwind](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) - Auto-sort classes
- [Tailwind Merge](https://github.com/dcastil/tailwind-merge) - Merge conflicting classes
- [CLSX](https://github.com/lukeed/clsx) - Conditional class names

### Community

- [Tailwind UI](https://tailwindui.com/) - Official component examples
- [Shadcn/UI Themes](https://ui.shadcn.com/themes) - Community themes
- [Tailwind Components](https://tailwindcomponents.com/) - Community components

---

## Conclusion

Migrating Claude Owl to Tailwind CSS + Shadcn/UI represents a significant architectural improvement that will:

1. **Eliminate 28 CSS files** and consolidate all styling into component-level utilities
2. **Establish a cohesive design system** with standardized colors, spacing, and typography
3. **Accelerate feature development** with pre-built, accessible components
4. **Improve maintainability** by removing CSS as a separate concern
5. **Enhance accessibility** through Radix UI primitives
6. **Future-proof the UI stack** with active, well-supported technologies

The migration is achievable in **4-6 weeks** with systematic execution, comprehensive testing, and attention to visual consistency. The long-term benefits far outweigh the initial effort, positioning Claude Owl for rapid, high-quality UI development.

**Recommendation:** Approve and prioritize this migration for the next development cycle.

---

**Approved by:** _[Pending]_
**Implementation Start Date:** _[TBD]_
**Target Completion Date:** _[TBD + 6 weeks]_
