# Documentation Directory Structure

This directory contains both GitHub Pages website files and project documentation.

## Directory Structure

```
docs/
├── github-pages/          # GitHub Pages website (deployed to antonbelev.github.io/claude-owl)
│   ├── index.html         # Homepage with download buttons
│   ├── screenshots.html   # Feature screenshots gallery
│   ├── changelog.html     # Rendered changelog
│   ├── installation.html  # Installation guide
│   └── assets/           # CSS, JS, images
│       ├── app.js        # Dynamic content (version fetching, OS detection)
│       ├── styles.css    # Custom styles
│       └── logo.svg      # Logo assets
│
├── adr/                  # Architecture Decision Records
├── *.md                  # Project documentation (markdown)
└── README.md            # This file
```

## GitHub Pages Deployment

The `github-pages/` directory is automatically deployed to GitHub Pages via `.github/workflows/deploy-docs.yml`.

**Deployment triggers:**
- Push to `main` branch with changes in `docs/github-pages/**`
- Changes to `CHANGELOG.md` or `SCREENSHOTS.md` (copied to site during deployment)
- Manual workflow dispatch

**Live site:** https://antonbelev.github.io/claude-owl/

## Documentation Files

All `.md` files in this directory are project documentation:
- `architecture.md` - System architecture overview
- `roadmap.md` - Feature roadmap
- `RELEASE_PROCESS.md` - Release workflow
- `PROJECT_SELECTION_IMPLEMENTATION.md` - Implementation guides
- And more...

These files are NOT deployed to GitHub Pages and are intended for developers.

## Adding New Pages to Website

1. Create HTML file in `docs/github-pages/`
2. Update navigation in all HTML files
3. Test locally
4. Commit and push to trigger deployment

## Local Testing

Serve the `github-pages` directory with any static server:

```bash
cd docs/github-pages
python3 -m http.server 8000
# Visit http://localhost:8000
```
