# Deno Deploy (optional)

Hosting for SPA packages scaffolded by this skill. Optional — skip the whole rule if the user opted out during [overview.md](overview.md) Step 1.

This rule covers everything from scaffold-time config through day-2 operations (deploys, env vars, logs). Skim the Scaffolding section first; the rest is reference for when the user comes back later asking "how do I deploy?" / "how do I add a secret?" / "why did the deploy fail?".

## Scaffolding (do this during setup-repo)

### 1. Add the CLI targeting block to root `deno.jsonc`

```jsonc
{
  // ...existing config...
  "deploy": {
    "org": "<org>",
    "app": "<app>"
  }
}
```

**Critical:** This block is for **CLI targeting only**. The `deploy` field in `deno.json` has two valid schemas depending on context (see [The two schemas](#the-two-schemas)). For local CLI deploys via `deno deploy`, only `org` and `app` are allowed — adding `install`, `build`, or `runtime` here will fail with `unknown field, expected org or app`.

### 2. Wire root `package.json` deploy script

Already included in `overview.md` Step 4:

```json
"deploy": "pnpm build && deno deploy --prod"
```

`deno deploy --prod` reads `org` and `app` from the `deno.jsonc` block — no flags needed.

### 3. Tell the user how to create the app (one-time, manual)

The skill cannot create the app on Deno Deploy's side. Surface this in the final report. Two options:

**Option A — Dashboard (recommended; `deno deploy create` is currently flaky):**

1. Go to dash.deno.com → New App.
2. Link the GitHub repo (or pick "Local source" for CLI-only deploys).
3. Configure the build settings — see [Dashboard build settings](#dashboard-build-settings) below.
4. Once the app is created, `pnpm deploy` works locally because `deno.jsonc` already points at the right org/app.

**Option B — `deno deploy create` (interactive or scripted):**

```bash
# Interactive
deno deploy create

# Scripted for local source
deno deploy create \
  --org <org> \
  --app <app> \
  --source local \
  --runtime-mode static \
  --static-dir packages/<pkg>/dist \
  --single-page-app \
  --install-command "pnpm install" \
  --build-command "pnpm --filter <pkg-name> build"

# Scripted for GitHub source
deno deploy create \
  --org <org> \
  --app <app> \
  --source github \
  --owner <github-org-or-user> \
  --repo <repo> \
  --runtime-mode static \
  --static-dir packages/<pkg>/dist \
  --single-page-app \
  --install-command "pnpm install" \
  --build-command "pnpm --filter <pkg-name> build" \
  --pre-deploy-command "true"
```

As of April 2026 `deno deploy create` may return HTTP 500. If it does, fall back to the dashboard.

## Dashboard build settings

For a Vite SPA scaffolded by this skill:

| Setting | Value |
|---------|-------|
| App Directory | *(blank — see gotcha below)* |
| Framework Preset | No Preset |
| Install Command | `pnpm install` |
| Build Command | `pnpm --filter <pkg-name> build` |
| Pre-deploy Command | `true` (no-op; empty string is rejected) |
| Runtime | Static Site |
| Static Directory | `packages/<pkg>/dist` |
| Single Page App mode | **Enabled** |
| Disable cron jobs | **Enabled** |

### Why each setting

- **App Directory blank.** Static deploys fail with `Module not found "file:///.deno-deploy-static-server.ts"` if this is `/`. Deno Deploy injects a static-server entry file relative to the project root; an absolute App Directory of `/` resolves the injection path as a filesystem path and breaks. Leave it blank. ([denoland/deno#32296](https://github.com/denoland/deno/issues/32296))
- **No Preset.** Vite + TanStack Router isn't one of Deploy's auto-detected presets. Configure manually.
- **Pre-deploy `true`.** Empty string is rejected by validation. `true` is a shell no-op.
- **Single Page App mode enabled.** Without this, deep links like `/about` return 404 because Deno Deploy serves the filesystem literally. SPA mode falls back to `index.html` for any path that isn't a real file — required for client-side routing (TanStack Router, React Router, etc.).
- **Disable cron jobs.** Static sites have no server runtime to register crons against, so leaving this off will fail every deploy with "Register crons" errors.

## The two schemas

The `deploy` field in `deno.json` looks the same but accepts different shapes depending on who reads it:

**CLI (`deno deploy` command) — minimal:**

```jsonc
{
  "deploy": {
    "org": "my-org",
    "app": "my-app"
  }
}
```

**Dashboard / GitHub-linked builds — full:**

```jsonc
{
  "deploy": {
    "install": "pnpm install",
    "build": "pnpm --filter <pkg> build",
    "predeploy": "true",
    "runtime": {
      "type": "static",
      "cwd": "packages/<pkg>/dist",
      "spa": true
    }
  }
}
```

You **cannot combine the two in the same `deploy` block**. If you deploy via GitHub integration and also want CLI targeting, configure the build pipeline in the dashboard and keep only `org`/`app` in `deno.json`. That's the pattern this skill scaffolds.

If you'd rather drive everything from `deno.json` and skip the dashboard, use the full schema and rely on the `--org`/`--app` flags on `deno deploy` for CLI targeting instead of the config file.

## Day-2: deploying

```bash
# Production deploy (skill scaffolds this as `pnpm deploy`)
pnpm build && deno deploy --prod

# Preview deploy (no --prod flag → goes to a preview URL)
pnpm build && deno deploy

# With explicit target (override deno.json)
deno deploy --org <org> --app <app> --prod

# CI: pass an auth token
deno deploy --prod --token "$DENO_DEPLOY_TOKEN"

# Don't wait for the build to finish
deno deploy --prod --no-wait
```

### Auth

`deno deploy` uses a Deno Deploy auth token. Locally, `deno deploy login` opens a browser; the token is cached. In CI, set `DENO_DEPLOY_TOKEN` as a secret and pass `--token "$DENO_DEPLOY_TOKEN"` (or rely on the env var — the CLI picks it up automatically).

## Day-2: environment variables

```bash
# List
deno deploy env list --app <app>

# Add
deno deploy env add MY_VAR "some value" --app <app>

# Update value
deno deploy env update-value MY_VAR "new value" --app <app>

# Change which contexts it applies to (production/development/local)
deno deploy env update-contexts MY_VAR production --app <app>

# Delete
deno deploy env delete MY_VAR --app <app>

# Bulk-import from a .env file (lines starting with # are comments)
deno deploy env load .env --app <app>
```

Env vars can be **plain text** (visible in the dashboard) or **secrets** (write-only, never shown after creation). Variables can be scoped per-app or per-org, and support separate values for production / development / local contexts.

In code:

```ts
const myVar = Deno.env.get("MY_VAR");
```

For SPAs, env vars are only relevant if you read them in the **build step** (e.g. baking an API endpoint into the bundle via Vite's `import.meta.env`). The static runtime serves files — there's no server-side `Deno.env.get` happening at request time.

## Day-2: logs

```bash
# Stream live
deno deploy logs --app <app>

# Time range
deno deploy logs --app <app> --start 2026-04-01
deno deploy logs --app <app> --start 2026-04-01 --end 2026-04-02
```

For static SPAs, logs mostly show build output and CDN edge events — there's no per-request app log because there's no server runtime.

## Useful features for SPAs

### CDN caching

Set `Cache-Control` headers on responses (relevant if you add a `_headers` file or use Deploy's edge config):

```
Cache-Control: public, max-age=60, s-maxage=3600
```

- `max-age` — browser cache window
- `s-maxage` — CDN/edge cache window

### Local tunneling

Expose your local dev server on a public URL through Deno Deploy's infrastructure — useful for webhook testing or sharing WIP previews:

```bash
deno run --tunnel src/index.ts
deno task --tunnel dev
```

Pulls "Local" context env vars from the dashboard. Sends OpenTelemetry data to the dashboard.

## Not applicable to SPAs scaffolded by this skill

The skill's SPA flow is static-only. The following exist in Deno Deploy but are out of scope here:

- **Dynamic runtime** (`runtime.type: "dynamic"`) — for server apps. SPAs scaffolded here have no server.
- **Deno KV** (`deno deploy database`) — requires the dynamic runtime.
- **Cron jobs** — same reason; explicitly disabled in the dashboard settings.
- **Sandboxes** (`deno deploy sandbox`) — dev environment tool, not a deploy mechanism.
- **`setup-aws` / `setup-gcp`** — advanced cloud-connection setup.

If a future package needs a real backend, switch its `runtime.type` to `"dynamic"` and use the dashboard schema — but that's outside this skill's scope.

## Quick gotcha list

- **App Directory must be blank** — `/` breaks static-server injection.
- **Pre-deploy command can't be empty** — use `true` as a no-op.
- **Cron jobs must be disabled** for static sites or every deploy fails.
- **`deploy` field in `deno.json`: CLI and dashboard schemas are mutually exclusive** — pick one.
- **`deno deploy create` can return 500** (as of April 2026) — fall back to the dashboard.
- **SPA mode must be enabled** or deep links 404.

## CLI reference card

Common subcommands beyond `deno deploy` itself:

| Command | Purpose |
|---------|---------|
| `deno deploy create` | Create a new app (often flaky — prefer the dashboard) |
| `deno deploy env <subcmd>` | Manage env vars (see Day-2 above) |
| `deno deploy logs --app <app>` | Stream logs |
| `deno deploy switch` | Switch active org/app |
| `deno deploy logout` | Revoke the cached auth token |

For the full CLI surface (database, sandbox, setup-aws, setup-gcp) consult `deno deploy --help` or the upstream docs — this skill only scaffolds the SPA-relevant parts.
