---
name: publish-npm
description: Publish the tidy-ts packages (shims, dataframe, graph) to npm. Walks through version bump, optional Rust/WASM/napi rebuilds, type checks, tests, npm builds, and publish. Use when the user wants to cut a new npm release ("publish to npm", "cut a release", "ship a new version").
---

# Publish to npm

Walk the user through a release in order. Stop at any step that fails — don't paper over failures or proceed without explicit confirmation when something is ambiguous.

Run commands as separate Bash calls (no `&&` chains — the repo blocks compound commands via a hook). Type-check output is already parsed; don't pipe through `tail`/`grep`/`2>&1`.

## Step 1 — Confirm the version bump

1. Run `pnpm bump` (no args) — it prints the current version.
2. Propose the next version as an incremental patch bump (e.g. `1.5.7` → `1.5.8`) and ask the user to confirm or override. Use `AskUserQuestion` with options for patch/minor/major when the choice isn't obvious.
3. Once confirmed, run `pnpm bump <version>`.

## Step 2 — Decide whether Rust needs rebuilding

Ask the user: *"Have any Rust files changed since the last release?"* If unsure, check with `git diff --stat <last-release-tag>..HEAD -- packages/dataframe/rust packages/dataframe/Cargo.toml` (or against `HEAD~N` if no tag exists).

If yes, run **all three** in this order (each as a separate Bash call):

1. `pnpm wasmbuild`
2. `pnpm napibuild`
3. `pnpm napibuild:win32-x64`

If no Rust changes, skip this step.

## Step 3 — Type check

Run each separately; stop on failure:

1. `pnpm check:dataframe`
2. `pnpm check:shims`
3. `pnpm check:graph`

## Step 4 — Tests

Run each separately; stop on failure:

1. `pnpm test:dataframe`
2. `pnpm test:graph`
3. `pnpm test:stats`

## Step 5 — Build the npm distributions

Run each separately; stop on failure:

1. `pnpm build:npm:shims`
2. `pnpm build:npm:dataframe`
3. `pnpm build:npm:graph`

## Step 6 — Publish

The aggregate command is `pnpm publish:all:npm`, but it starts with `publish:shims:npm`, which prompts for OTP / interactive approval. **Do not run `publish:all:npm` yourself.** Instead:

1. Offer the user the exact command to run manually for the first step:

   ```
   pnpm publish:shims:npm
   ```

2. After they confirm shims published successfully, you can run the rest of the chain (these don't need their hand-holding, but each may prompt for OTP — if any fail with auth, see below):

   - `pnpm publish:dataframe:npm:darwin-arm64`
   - `pnpm publish:dataframe:npm:win32-x64`
   - `pnpm publish:dataframe:npm`
   - `pnpm publish:graph:npm`

   Or, if the user prefers, they can run `pnpm publish:all:npm` themselves to do all five in sequence.

## If npm auth fails

If you see an error mentioning `ENEEDAUTH`, `401`, `must be logged in`, or similar, **stop and tell the user**: *"npm auth is missing — please run `npm login` and let me know when you're ready to retry."* Don't try to run `npm login` yourself; it's interactive.

## Notes

- Never skip the type checks or tests to "save time". A bad release is far more expensive than a slow one.
- Never use `git commit --no-verify` or amend an existing commit to backfill the bump.
- After publishing, the user usually wants a git tag + commit for the version. Offer it, don't assume.
