# Add a Package to an Existing Repo

For when the repo already has root `package.json`, `pnpm-workspace.yaml`, and `deno.jsonc`. You're just adding a new workspace member under `packages/`.

> **Scaffolding an SPA?** Do Steps 1–3 here to create the package shell, then layer the SPA conventions on top by loading [spa/overview.md](spa/overview.md). Skip Step 5 (verify) until after the SPA scaffold is in place.

## Step 1 — Confirm scope and name

Before scaffolding, confirm with the user:

- The package name (e.g. `@personal/foo` — match the existing scope used elsewhere in `packages/`).
- Whether it needs UI/browser code, a CLI, a library, or just scripts.
- Which dependencies (if any) it needs beyond what root already provides.

If anything is ambiguous, ask — don't guess.

## Step 2 — Create the package directory

```bash
mkdir -p packages/<name>
```

## Step 3 — Create `packages/<name>/package.json`

Wildcards for every dependency. See the template in [file-templates.md](file-templates.md).

Only include the dependencies the package actually uses. Every one must already be present in root `package.json` and in the `overrides` block of `pnpm-workspace.yaml`. If any isn't, follow [dependencies.md](dependencies.md) to add it.

## Step 4 — Optional: package-specific `deno.json`

Most packages don't need one — the root `deno.jsonc` already includes `"workspace": ["packages/*"]`. Only add a package-level `deno.json` if you need per-package imports or tasks. See [file-templates.md](file-templates.md).

## Step 5 — Install + verify

See [verify.md](verify.md).
