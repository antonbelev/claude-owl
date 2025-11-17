# Project Documentation

This directory contains technical documentation for Claude Owl developers and contributors.

## Directory Structure

```
project-docs/
├── adr/                  # Architecture Decision Records
│   ├── adr-001-settings-management-redesign.md
│   ├── adr-002-hooks-manager-evolution.md
│   ├── adr-003-tailwind-shadcn-migration.md
│   ├── adr-004-mcp-manager.md
│   ├── adr-005-project-selection-ux.md
│   └── adr-006-cicd-release-automation.md
│
├── demo/                 # Demo and tutorial content
│
├── architecture.md       # System architecture overview
├── roadmap.md           # Feature roadmap and future plans
├── RELEASE_PROCESS.md   # How to cut releases
├── PROJECT_SELECTION_IMPLEMENTATION.md  # Implementation guide
├── CONFIGURATION-FINDINGS-2025-11-15.md  # Config research
├── MCP-DESIGN-CONSTRAINT.md  # MCP design decisions
├── TESTING-LOCAL-MCP-SERVERS.md  # MCP testing guide
├── QUICK-START-TEST-MCP.md  # MCP quick start
└── README.md            # This file
```

## Documentation Types

### Architecture Decision Records (ADRs)
Located in `adr/`, these documents explain significant architectural decisions:
- Why we made certain design choices
- Trade-offs considered
- Consequences and future implications

### Implementation Guides
Step-by-step guides for implementing features following established patterns.

### Research & Findings
Investigation results and technical discoveries.

### Process Documentation
Release workflows, testing strategies, and operational procedures.

## For Website Content

The **public-facing website** (GitHub Pages) is in `/docs`:
- Homepage: `docs/index.html`
- Screenshots: `docs/screenshots.html`
- Changelog: `docs/changelog.html`
- Installation: `docs/installation.html`

**Live site:** https://antonbelev.github.io/claude-owl/

## Contributing

When adding new documentation:
1. Follow existing naming conventions (kebab-case)
2. Add entry to this README under appropriate section
3. Link from related documents
4. Update ADRs when making architectural decisions
