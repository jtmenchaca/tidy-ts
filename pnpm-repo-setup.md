# Repository Setup Guide

This document explains the monorepo setup, the interplay between pnpm workspaces and Deno, and how to replicate this setup in a new repository.

## Overview

This repository uses a **hybrid monorepo** approach combining:
- **pnpm workspaces** for package management and dependency resolution
- **Deno** for runtime execution, type checking, and tooling
- **JSR (JavaScript Registry)** for some Deno-native packages

## Architecture

### Monorepo Structure

```
calendar/
├── package.json              # Root package.json with all dependencies
├── pnpm-workspace.yaml       # pnpm workspace configuration
├── pnpm-lock.yaml            # Lockfile managed by pnpm
├── deno.jsonc                # Deno configuration for the entire workspace
└── packages/
    ├── calendar-api/         # Backend API (Deno runtime)
    │   ├── package.json      # Uses wildcard dependencies (*)
    │   └── src/
    ├── frontend/             # Frontend app (Vite/React)
    │   ├── package.json      # Uses wildcard dependencies (*)
    │   └── src/
    └── e2e/                  # E2E tests (Deno + Playwright)
        ├── package.json      # Uses wildcard dependencies (*)
        └── deno.json         # Package-specific Deno config
```

## Key Concepts

### 1. Dependency Management Strategy

**Root `package.json`**:
- Contains **all actual dependency versions** with specific version ranges
- Acts as the single source of truth for dependency versions
- Includes both `dependencies` and `devDependencies`

**Package `package.json` files**:
- Use **wildcard versions (`*`)** for all dependencies
- Dependencies are resolved from the root `package.json` via pnpm workspace overrides
- This ensures version consistency across all packages

**Example**:
```json
// Root package.json
{
  "dependencies": {
    "react": "^19.1.1",
    "zod": "^4.1.12"
  }
}

// packages/frontend/package.json
{
  "dependencies": {
    "react": "*",
    "zod": "*"
  }
}
```

### 2. pnpm Workspace Configuration

**`pnpm-workspace.yaml`**:
- Defines workspace packages: `packages/*`
- Contains **overrides** section that maps wildcard dependencies to root versions
- Uses pnpm's `$` syntax to reference root package versions

**Key Features**:
- **Overrides**: Maps every wildcard dependency (`*`) to the root version using `$package-name`
- **Patched Dependencies**: Can specify patches for specific packages
- **Workspace Resolution**: All packages share the same `node_modules` at the root

**Example override**:
```yaml
overrides:
  react: $react
  zod: $zod
  "@tanstack/react-router": $@tanstack/react-router
```

### 3. Deno Integration

**Root `deno.jsonc`**:
- Configures Deno for the entire workspace
- Defines workspace: `["packages/*"]` (similar to pnpm workspace)
- Sets compiler options, formatting, linting rules
- Excludes build artifacts and generated files

**Package-specific `deno.json`** (optional):
- Can override root Deno settings for specific packages
- Example: `packages/e2e/deno.json` defines imports for Playwright

**Deno + pnpm Interplay**:
- Deno can import npm packages installed by pnpm
- Deno uses `deno.jsonc` workspace to understand package boundaries
- Both tools recognize the same `packages/*` structure
- Deno scripts can run packages that use npm dependencies

### 4. JSR (JavaScript Registry) Packages

Some packages come from JSR instead of npm:
- Format: `jsr:@scope/package@^version`
- Examples: `jsr:@std/expect@^1.0.17`, `jsr:@tidy-ts/shims@^0.0.16`

**How it works**:
- JSR packages are specified in root `package.json` with `jsr:` prefix
- pnpm handles them like npm packages
- Deno natively supports JSR imports
- Package `package.json` files reference them with `*` (resolved via overrides)

## Setup Instructions

### Prerequisites

1. **Install pnpm**: `npm install -g pnpm`
2. **Install Deno**: Follow [Deno installation guide](https://deno.com/manual/getting_started/installation)

### Step-by-Step Setup

#### 1. Initialize Repository Structure

```bash
mkdir your-project
cd your-project
git init
```

#### 2. Create Root `package.json`

```json
{
  "name": "your-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @project/frontend dev & pnpm --filter @project/api dev",
    "fmt": "deno fmt .",
    "lint": "deno lint .",
    "check": "deno check ."
  },
  "dependencies": {
    // Add all your actual dependencies with versions here
    "react": "^19.1.1",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
```

#### 3. Create `pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"

overrides:
  # Map every dependency used in packages to root version
  react: $react
  zod: $zod
  typescript: $typescript
  # Add all dependencies here that packages will use
```

**Important**: Every dependency used in any package's `package.json` must be listed in `overrides` with the `$package-name` syntax.

#### 4. Create Root `deno.jsonc`

```jsonc
{
  "version": "0.0.1",
  "compilerOptions": {
    "lib": ["deno.ns", "dom"],
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  },
  "fmt": {
    "exclude": [
      "node_modules/",
      "**/*.md",
      "dist/**"
    ]
  },
  "lint": {
    "exclude": [
      "node_modules/**",
      "dist/**"
    ]
  },
  "exclude": [
    "**/node_modules/**",
    "dist/**",
    "node_modules/**"
  ],
  "workspace": [
    "packages/*"
  ]
}
```

#### 5. Create Package Structure

```bash
mkdir -p packages/api packages/frontend
```

#### 6. Create Package `package.json` Files

**`packages/api/package.json`**:
```json
{
  "name": "@project/api",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "deno run --allow-all --watch src/index.ts",
    "check": "deno check ."
  },
  "dependencies": {
    "zod": "*"
  },
  "devDependencies": {
    "typescript": "*"
  }
}
```

**`packages/frontend/package.json`**:
```json
{
  "name": "@project/frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "check": "deno check ."
  },
  "dependencies": {
    "react": "*",
    "zod": "*"
  },
  "devDependencies": {
    "typescript": "*",
    "vite": "*"
  }
}
```

#### 7. Install Dependencies

```bash
pnpm install
```

This will:
- Install all dependencies from root `package.json` to root `node_modules`
- Create symlinks for workspace packages
- Resolve wildcard dependencies via overrides

#### 8. Verify Setup

```bash
# Check pnpm workspace
pnpm list --depth=0

# Check Deno workspace
deno check .

# Run format check
deno fmt --check .

# Run lint check
deno lint .
```

## Adding New Dependencies

### Process

1. **Add to root `package.json`** with specific version:
   ```json
   "dependencies": {
     "new-package": "^1.2.3"
   }
   ```

2. **Add to `pnpm-workspace.yaml` overrides**:
   ```yaml
   overrides:
     new-package: $new-package
   ```

3. **Add to package `package.json`** with wildcard:
   ```json
   "dependencies": {
     "new-package": "*"
   }
   ```

4. **Run `pnpm install`** to update lockfile

### Adding JSR Packages

1. Add to root `package.json` with `jsr:` prefix:
   ```json
   "dependencies": {
     "@std/expect": "jsr:@std/expect@^1.0.17"
   }
   ```

2. Add to `pnpm-workspace.yaml` overrides:
   ```yaml
   overrides:
     "@std/expect": $@std/expect
   ```

3. Add to package `package.json` with wildcard:
   ```json
   "dependencies": {
     "@std/expect": "*"
   }
   ```

## Key Benefits

1. **Single Source of Truth**: All dependency versions defined in one place
2. **Version Consistency**: Impossible to have version conflicts between packages
3. **Simplified Updates**: Update once in root, all packages benefit
4. **Deno + npm Harmony**: Use Deno runtime with npm ecosystem packages
5. **Type Safety**: Deno's type checker works across the entire workspace
6. **Tooling Integration**: Both pnpm and Deno understand the workspace structure

## Common Patterns

### Running Scripts

```bash
# Run script in specific package
pnpm --filter @project/api dev

# Run script in all packages (if defined)
pnpm -r dev

# Run root script
pnpm dev
```

### Type Checking

```bash
# Check entire workspace with Deno
deno check .

# Check specific package
deno check packages/api
```

### Formatting & Linting

```bash
# Format entire workspace
deno fmt .

# Lint entire workspace
deno lint .
```

## Troubleshooting

### Issue: Package not found

**Solution**: Ensure the dependency is:
1. Listed in root `package.json` with version
2. Listed in `pnpm-workspace.yaml` overrides
3. Listed in package `package.json` with `*`
4. Run `pnpm install`

### Issue: Version conflicts

**Solution**: This shouldn't happen with this setup, but if it does:
1. Check root `package.json` for duplicate entries
2. Verify `pnpm-workspace.yaml` overrides are correct
3. Delete `node_modules` and `pnpm-lock.yaml`, then `pnpm install`

### Issue: Deno can't find npm packages

**Solution**: 
1. Ensure `pnpm install` has been run
2. Deno should find packages in root `node_modules`
3. Check `deno.jsonc` workspace configuration includes the package

### Issue: Override not working

**Solution**:
1. Verify override syntax: `package-name: $package-name`
2. Ensure package name matches exactly (case-sensitive)
3. Run `pnpm install` to regenerate lockfile

## Advanced Configuration

### Patched Dependencies

If you need to patch a dependency:

1. Create patch file in `patches/` directory
2. Add to `pnpm-workspace.yaml`:
   ```yaml
   patchedDependencies:
     "package-name": patches/package-name@version.patch
   ```

### Package-Specific Deno Config

Create `packages/package-name/deno.json`:
```json
{
  "imports": {
    "special-package": "npm:special-package@^1.0.0"
  },
  "tasks": {
    "custom-task": "deno run -A src/custom.ts"
  }
}
```

This merges with root `deno.jsonc` settings.

## Summary

This setup provides:
- ✅ Centralized dependency management
- ✅ Version consistency across packages
- ✅ Deno runtime with npm ecosystem access
- ✅ JSR package support
- ✅ Type safety across workspace
- ✅ Unified tooling (formatting, linting, type checking)

The key insight is that **root `package.json` owns versions**, **`pnpm-workspace.yaml` maps them**, and **package `package.json` files reference them with wildcards**. Deno provides the runtime and tooling layer that works seamlessly with this structure.
