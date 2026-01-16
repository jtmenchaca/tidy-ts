# Tidy-TS Documentation Site

This documentation site is built with React, TanStack Router, and Vite. It uses a prerendering solution to make content accessible to AI crawlers while maintaining full SPA functionality.

## Setup

The site is a Single Page Application (SPA) that gets prerendered for SEO and AI crawler accessibility.

### Key Configuration

- **Base Path**: `/tidy-ts/` (configured for GitHub Pages)
- **Router**: TanStack Router with client-side routing
- **Build Tool**: Vite
- **Prerendering**: Playwright-based solution

### Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

### Prerendering

The site uses Playwright to prerender all routes after building:

```bash
# Build and prerender
bun run build
bun run prerender
```

This creates static HTML files for all 19 documentation routes while preserving the SPA behavior for interactive users.

### Deployment

Deployed to GitHub Pages via GitHub Actions. The workflow uploads the prebuilt `dist/` folder containing both the SPA assets and prerendered HTML files.

### Why Prerendering?

AI crawlers (Claude, ChatGPT, Gemini) cannot execute JavaScript, so they see empty pages from SPAs. Prerendering generates static HTML with full content while React hydrates for interactive functionality.