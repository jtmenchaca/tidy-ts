# Scaffold an SPA Package

Adds a Vite + React 19 + TanStack Router + TanStack Query + Tailwind 4 + shadcn/ui package to a workspace. Modeled on `/Users/jtmenchaca/office-website` — that repo is the canonical reference.

This is an **add-on** flow that composes with the other two:

- New repo + SPA → run [../new-repo.md](../new-repo.md) first to create the workspace, then come back here.
- SPA in an existing repo → run [../add-package.md](../add-package.md) to create the package shell, then come back here to layer the SPA conventions on top.

## Step 1 — Gather inputs

One `AskUserQuestion` call covering only what's missing:

- **Package name + scope** — e.g. `@myproject/website`. Goes into `packages/<name>/package.json` `"name"` and the path `packages/<name>/`.
- **Deno Deploy org + app** — optional. If provided, gets written to the root `deno.jsonc` `deploy` block. Skip otherwise.

Tailwind 4 + shadcn/ui are **always included** (user preference). Dark mode and pre-installed shadcn components are not — the user runs `npx shadcn add <name>` for what they need.

State the plan back in plain prose, then proceed without re-confirming.

## Step 2 — Layer the SPA conventions

Apply these rule files in order:

1. [vite-router-query.md](vite-router-query.md) — package layout, Vite + plugins, `index.html`, `main.tsx`, TanStack Router + Query, three-tsconfig setup.
2. [tailwind-shadcn.md](tailwind-shadcn.md) — `@tailwindcss/vite`, oklch CSS variables, `components.json`, `lib/utils.ts`.
3. [eslint.md](eslint.md) — ESLint flat config (React hooks + react-refresh rules).
4. [deno-deploy.md](deno-deploy.md) — Deno Deploy config (only if the user provided org/app). Covers the CLI vs dashboard schema split, "App Directory must be blank" gotcha, and day-2 commands.

## Step 3 — Copy `capture-errors.mjs` into root scripts

Copy the headless-browser smoke-check script into the repo's `scripts/` directory and substitute the package name:

```bash
cp <skill-path>/rules/spa/assets/capture-errors.mjs <target>/scripts/capture-errors.mjs
# Then substitute <PKG_NAME> with the SPA's package name (e.g. @myproject/website):
sed -i '' 's|<PKG_NAME>|<scope>/<pkg>|g' <target>/scripts/capture-errors.mjs
```

(On Linux, use `sed -i` without the empty `''` argument.)

The script boots the SPA on port 9147, launches headless Chrome via CDP, reloads the page, and reports any uncaught exceptions / console errors / Vite overlays / empty root. macOS Chrome path is the default — adjust for Linux/Windows by editing the `chrome` spawn line (commented in the script).

## Step 4 — Wire up root scripts

In the **root** `package.json`, replace the stub scripts from `new-repo.md` with these filter-scoped versions:

```json
{
  "scripts": {
    "dev": "pnpm --filter <pkg-name> dev",
    "build": "pnpm --filter <pkg-name> build",
    "preview": "pnpm --filter <pkg-name> preview --port 5173",
    "deploy": "pnpm build && deno deploy --prod",
    "fmt": "deno fmt .",
    "lint": "deno lint .",
    "check": "deno run -A scripts/parse-check.ts --unstable-tsgo . && node scripts/capture-errors.mjs",
    "test": "deno run -A scripts/parse-test.ts ."
  }
}
```

Note: `check` chains the type check **and** the browser smoke-check, matching office-website's convention. If `capture-errors.mjs` fails (e.g. Chrome isn't installed in CI), the whole `check` fails — fine for local dev, but consider splitting them in CI configs.

Omit `deploy` if the user opted out of Deno Deploy.

## Step 5 — Install + verify

See [../verify.md](../verify.md). `pnpm install`, then `pnpm check`. Don't report success without it.

`pnpm check` already runs the browser smoke-check via `capture-errors.mjs`, so a separate `pnpm dev` walk-through is only needed if the user explicitly wants to inspect the page visually.

## Step 6 — Report

Tell the user:

- Package path
- Dev server command (`pnpm dev`)
- Deployment command (`pnpm deploy`) if configured — **and that they still need to create the app on the Deno Deploy side** (dashboard or `deno deploy create`). See [deno-deploy.md](deno-deploy.md) Scaffolding §3.
- What's intentionally not scaffolded: no shadcn components (run `npx shadcn add <name>`), no dark mode, no test setup
