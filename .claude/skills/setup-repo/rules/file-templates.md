# File Templates

Concrete templates for every file this skill writes. Substitute `<placeholders>` with the values gathered from the user.

## Root `package.json`

```json
{
  "name": "<repo-name>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "fmt": "deno fmt .",
    "lint": "deno lint .",
    "check": "deno run -A scripts/parse-check.ts --unstable-tsgo .",
    "test": "deno run -A scripts/parse-test.ts ."
  },
  "dependencies": {
    "@tidy-ts/dataframe": "1.5.9",
    "@tidy-ts/shims": "1.5.9",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "~5.6.2"
  }
}
```

Use real, concrete version ranges here. This is the single source of truth. See [dependencies.md](dependencies.md) for the why.

### `--unstable-tsgo`

The user prefers `--unstable-tsgo` for type checking — it's faster and matches their conventions in other repos. Apply it to the root `check` script and to any per-package `check:<pkg>` scripts:

```json
"check:dataframe": "deno run -A scripts/parse-check.ts --unstable-tsgo packages/dataframe",
"check:shims": "deno run -A scripts/parse-check.ts --unstable-tsgo packages/shims"
```

`parse-check.ts` strips the `-A` allow-flag before invoking `deno check`, but passes `--unstable-tsgo` through.

## `pnpm-workspace.yaml`

Every dep listed in root `package.json` must appear here as `name: $name`. Quote scoped or `jsr:`-prefixed keys.

```yaml
packages:
  - "packages/*"

overrides:
  "@tidy-ts/dataframe": $@tidy-ts/dataframe
  "@tidy-ts/shims": $@tidy-ts/shims
  typescript: $typescript
  zod: $zod
```

## `deno.jsonc`

```jsonc
{
  "version": "0.1.0",
  "nodeModulesDir": "auto",
  "compilerOptions": {
    "lib": ["deno.ns", "dom"]
  },
  "fmt": {
    "exclude": ["node_modules/", "**/*.md", "dist/**"]
  },
  "lint": {
    "exclude": ["node_modules/**", "dist/**"]
  },
  "exclude": ["**/node_modules/**", "dist/**", "node_modules/**"],
  "workspace": ["packages/*"]
}
```

## `packages/<pkg>/package.json`

One per package. **Wildcards only** — see [dependencies.md](dependencies.md).

```json
{
  "name": "<scope>/<pkg>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "fmt": "deno fmt .",
    "lint": "deno lint ."
  },
  "dependencies": {
    "@tidy-ts/dataframe": "*",
    "@tidy-ts/shims": "*",
    "zod": "*"
  },
  "devDependencies": {
    "typescript": "*"
  }
}
```

Only list deps the package actually uses, and every one of those must be in root `package.json` and in the `overrides` block.

## Optional: package-specific `deno.json`

Most packages don't need one — the root `deno.jsonc` already includes `"workspace": ["packages/*"]`. Only add a package-level `deno.json` if you need per-package imports or tasks (e.g. extra `npm:` or `jsr:` imports, Playwright, etc.):

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

This merges with the root `deno.jsonc`.
