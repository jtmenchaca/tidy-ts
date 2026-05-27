---
name: setup-repo
description: Bootstrap a hybrid pnpm + Deno monorepo, add a package to an existing one, or scaffold an SPA package (Vite + React 19 + TanStack Router + Tailwind 4 + shadcn). Use when the user wants to set up a new repo, scaffold a project, create/add a package under packages/, or scaffold a frontend SPA. Asks like "set up a repo", "create a monorepo", "add a package", "scaffold an SPA", "new website package".
---

# Set Up a Repo

Covers three flows that share the same dependency invariant and file templates:

1. Bootstrapping a brand-new monorepo.
2. Adding a package to an existing monorepo.
3. Scaffolding an SPA package (composes with #1 or #2).

Load the rule files below for the path you need.

## The Core Invariant

**Root `package.json` owns versions. `pnpm-workspace.yaml` maps them with `$name` overrides. Package `package.json` files reference deps with `"*"`.**

Keep this intact at every step. Full rules in [rules/dependencies.md](rules/dependencies.md).

## Picking a flow

- **Bootstrapping a fresh repo?** Load [rules/new-repo.md](rules/new-repo.md).
- **Adding a package to an existing repo?** Load [rules/add-package.md](rules/add-package.md).
- **Scaffolding an SPA package?** Load [rules/spa/overview.md](rules/spa/overview.md). SPA is an add-on — combine it with one of the two above depending on whether the repo exists yet.

## Shared supporting rules

All flows reference these:

- [rules/dependencies.md](rules/dependencies.md) — the root-owns-versions invariant, adding new deps, JSR conventions.
- [rules/file-templates.md](rules/file-templates.md) — concrete templates for `package.json` (root + package), `pnpm-workspace.yaml`, `deno.jsonc`.
- [rules/verify.md](rules/verify.md) — `pnpm install`, `deno check .`, common failure modes.

## SPA rules (load only if scaffolding an SPA)

- [rules/spa/overview.md](rules/spa/overview.md) — entry point and prompts.
- [rules/spa/vite-router-query.md](rules/spa/vite-router-query.md) — Vite config, `main.tsx`, TanStack Router + Query, tsconfig trio, router-generator patch.
- [rules/spa/tailwind-shadcn.md](rules/spa/tailwind-shadcn.md) — Tailwind 4 + shadcn/ui wiring.
- [rules/spa/eslint.md](rules/spa/eslint.md) — ESLint flat config.
- [rules/spa/deno-deploy.md](rules/spa/deno-deploy.md) — Deno Deploy (optional): CLI vs dashboard schema, gotchas, day-2 commands, env vars, logs.

## Standing user rules

- Never run `git init` as part of this skill — the user opts in separately.
- Never report success without running `pnpm check` (or `deno check .`) — this is a hard rule in the user's global CLAUDE.md.
- For SPA work, also verify in a browser before claiming success (the user's UI testing rule).
