# Verification

After any file changes (new repo, new package, or new dependency), run from the repo root:

```bash
pnpm install
pnpm check
```

`pnpm check` runs `deno run -A scripts/parse-check.ts --unstable-tsgo .` — see [file-templates.md](file-templates.md). The parse-check wrapper strips ANSI codes, extracts only the TS error lines, and prints "No type errors" on success. `--unstable-tsgo` is the user-preferred flag (faster type checking).

If the repo somehow lacks the wrapper script (older repo, partial setup), fall back to `deno check .` and consider adding the script — see [new-repo.md](new-repo.md) Step 2.

If the repo has tests, also run:

```bash
pnpm test
```

(wraps `scripts/parse-test.ts`.)

**Never report success without running `pnpm check`.** This is a standing user rule.

If either fails, surface the error verbatim — do **not** claim partial success.

## Troubleshooting

### "Package not found"

1. Listed in root `package.json` with a concrete version?
2. Listed in `pnpm-workspace.yaml` `overrides` as `name: $name`?
3. Listed in the package's `package.json` with `"*"`?
4. Did you run `pnpm install` after the edits?

### Version conflicts

This shouldn't happen with the override pattern, but if it does:

1. Check root `package.json` for duplicate or conflicting entries.
2. Verify every override matches its dep name exactly (case-sensitive, including scope).
3. Delete `node_modules` and `pnpm-lock.yaml`, then `pnpm install` again.

### Deno can't find npm packages

1. Confirm `pnpm install` has run — Deno reads from root `node_modules`.
2. Check `deno.jsonc` has `"nodeModulesDir": "auto"` and `"workspace": ["packages/*"]`.
3. If a package needs a Deno-specific import, add a package-level `deno.json` (see [file-templates.md](file-templates.md)).

### Override not working

1. Verify the YAML syntax: `package-name: $package-name`.
2. Scoped or `jsr:` keys must be quoted: `"@std/expect": $@std/expect`.
3. Run `pnpm install` to regenerate the lockfile.
