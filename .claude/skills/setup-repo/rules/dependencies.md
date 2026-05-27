# Dependency Rules

## The Core Invariant

**Root `package.json` owns versions. `pnpm-workspace.yaml` maps them with `$name` overrides. Package `package.json` files reference deps with `"*"`.**

Never put a real version range inside a package's `package.json`. Always use `"*"` and let the workspace override resolve it from root.

## Adding a New Dependency

Touch three places, in order:

1. **Root `package.json`** — concrete version range:
   ```json
   "dependencies": { "new-package": "^1.2.3" }
   ```
2. **`pnpm-workspace.yaml`** — override entry:
   ```yaml
   overrides:
     new-package: $new-package
   ```
   For scoped or `jsr:` names, quote the key: `"@std/expect": $@std/expect`.
3. **Package `package.json`** — wildcard reference:
   ```json
   "dependencies": { "new-package": "*" }
   ```

Then run `pnpm install` to refresh the lockfile.

## JSR Packages

JSR deps live in root `package.json` with a `jsr:` prefix:

```json
"@std/expect": "jsr:@std/expect@^1.0.17"
```

In the override and in the package they behave like any other scoped name — just quote the key in YAML.

## Common Mistakes

- **Real version range in package `package.json`** — breaks the single-source-of-truth guarantee.
- **Missing override entry** — pnpm will install something, but versions can drift between packages.
- **Unquoted scoped/jsr key in YAML** — parser will reject or misread it. Quote `"@scope/..."` and `"@std/..."`.
- **Editing workspace file without re-running `pnpm install`** — lockfile goes stale.
