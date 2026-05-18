# Tidy-TS MCP Server

MCP server providing documentation and operation discovery for tidy-ts DataFrames and statistics (documentation text and examples are embedded in this package).

## Quick Setup

### Step 1: Install Globally (One-Time)

From the repository root (`tidy-ts`):

```bash
pnpm mcp:install
```

Equivalent Deno command (from repo root):

```bash
deno install --global -A --name tidy-ts-mcp --force packages/mcp/cli.ts
```

This creates a `tidy-ts-mcp` command available anywhere on your system.

### Step 2: Add to Claude Code

```bash
claude mcp add -t stdio -s user tidy-ts -- tidy-ts-mcp
```

**Or** for project-only (not available in other workspaces):

```bash
claude mcp add -t stdio -s project tidy-ts -- tidy-ts-mcp
```

**Or** create `.mcp.json` in your project:

```json
{
  "mcpServers": {
    "tidy-ts": {
      "command": "tidy-ts-mcp"
    }
  }
}
```

### Step 3: Verify

In Claude Code, type `/mcp` to see the server status.

## Other AI Tools

### Claude Desktop

Settings > Developer > Edit Config:

```json
{
  "mcpServers": {
    "tidy-ts": {
      "command": "tidy-ts-mcp"
    }
  }
}
```

### Cursor

Command palette > "View: Open MCP Settings" > "Add custom MCP":

```json
{
  "mcpServers": {
    "tidy-ts": {
      "command": "tidy-ts-mcp"
    }
  }
}
```

### VS Code

1. Command palette > "MCP: Add Server..."
2. Select "Command (stdio)"
3. Enter: `tidy-ts-mcp`
4. Name it `tidy-ts`

## Available Tools

### `tidy-list-operations`

Lists operations by category.

- Parameter: `category` — `dataframe`, `graph`, `stats`, `stats-distributions`, `stats-tests`, `stats-compare`, `io`, `shims`, `string`, or `all` (default).

### `tidy-get-docs`

Gets detailed documentation with signatures and examples.

- Parameter: `topic` — Operation name(s), e.g. `"mutate"` or `["filter", "select"]`. Topics match keys in `packages/mcp/docs/` (e.g. `glm`, `mean`, `readCSV`).

### `tidy-get-file-structure`

Inspects CSV/XLSX structure (headers, preview) before reading.

### `tidy-get-package-version`

Looks up latest versions on JSR or npm for package specifiers like `jsr:@tidy-ts/dataframe` or `npm:lodash`.

## Usage

Ask naturally, for example:

- "What DataFrame operations are available?"
- "Show me docs for mutate and filter"
- "Document stats.glm"

The client will call the appropriate tools.

## Updating

After changing MCP code, reinstall:

```bash
pnpm mcp:install
```

Then restart your AI tool.

## For Maintainers

### Add documentation

Edit files under `packages/mcp/docs/` and ensure new topics are merged in `packages/mcp/docs/index.ts` (the `DOCS` object).

### Architecture

```
packages/mcp/
├── cli.ts                 # Entry point (stdio)
├── server-base.ts         # MCP server config
├── handlers/tools/      # Tool implementations
└── docs/                 # Documentation data (DocEntry objects)
```

### Run server locally

From repo root:

```bash
pnpm mcp
```
