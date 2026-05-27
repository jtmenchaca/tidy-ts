# Bootstrap a New Repo

End-to-end flow for setting up a fresh hybrid pnpm + Deno monorepo at a chosen path. Does **not** run `git init` — the user opts in to that separately if they want it.

> **Bootstrapping a repo for an SPA?** Walk through this whole flow first to create the workspace, then load [spa/overview.md](spa/overview.md) to layer in the Vite + React + Tailwind + shadcn package. The SPA flow has its own input-gathering step, so keep this one focused on workspace-level decisions.

## Step 1 — Gather inputs

One `AskUserQuestion` call, covering only what's missing from the conversation:

- **Repo name** — used as `name` in root `package.json` (e.g. `my-project`).
- **Target directory** — absolute path where the repo will live (e.g. `/Users/jtmenchaca/my-project`). Verify with `ls` that the parent exists and the target itself does not.
- **Package scope** — npm scope for workspace members (e.g. `@myproject`). Defaults to `@<repo-name>` if no preference.
- **Initial packages** — names of one or more starter packages to create under `packages/`. The user will commonly want `@tidy-ts/dataframe` and `@tidy-ts/shims` available as deps; ask if those should be pre-added.
- **Starter dependencies** — which runtime + dev deps to pre-populate at root. Reasonable defaults to offer: `typescript`, `@tidy-ts/dataframe`, `@tidy-ts/shims`, `zod`, `@std/expect` (jsr).

Then **state the plan back in plain prose** — directory, scope, packages, deps — and proceed without re-confirming. The user already agreed.

## Step 2 — Write the files

Create the tree:

```
<target>/
├── package.json
├── pnpm-workspace.yaml
├── deno.jsonc
├── scripts/
│   ├── parse-check.ts              (from rules/assets/)
│   └── parse-test.ts               (from rules/assets/)
└── packages/
    └── <pkg>/package.json          (one per initial package)
```

Use the templates in [file-templates.md](file-templates.md). The dependency invariant (root owns versions, workspace maps them, packages reference `"*"`) is laid out in [dependencies.md](dependencies.md).

### Copy the parse scripts

The two scripts in `rules/assets/` ship with every new repo. Copy them verbatim into `<target>/scripts/`:

```bash
mkdir -p <target>/scripts
cp <skill-path>/rules/assets/parse-check.ts <target>/scripts/
cp <skill-path>/rules/assets/parse-test.ts <target>/scripts/
```

`<skill-path>` is the on-disk location of this skill (usually `.claude/skills/setup-repo` under the project that hosts it).

Both scripts depend on `createSpinner` from `@tidy-ts/shims` — that package is already in the default starter deps. If the user opts out of `@tidy-ts/shims`, replace the spinner imports with no-ops before copying.

## Step 3 — Install + verify

See [verify.md](verify.md). Run `pnpm install` then `pnpm check` from the target directory. Do not report success without this.

## Step 4 — Report

Tell the user:

- Repo path
- Packages created
- Deps installed
- Any follow-up they need to do manually (e.g. `git init` if they want version control — the skill deliberately does not run it)
