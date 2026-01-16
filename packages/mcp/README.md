# Tidy-TS MCP Server

MCP server providing documentation, code examples, and operation discovery for tidy-ts DataFrames and statistics.

## Quick Setup

### Step 1: Install Globally (One-Time)

From the tidy-ts directory:

```bash
deno install --global --allow-read --allow-env --import-map import_map.json --name tidy-ts-mcp --force src/mcp/cli.ts
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
Lists all DataFrame operations, statistics functions, and I/O by category.
- Parameter: `category` - "dataframe", "stats", "io", or "all"

### `tidy-get-docs`
Gets detailed documentation with signatures and examples.
- Parameter: `topic` - Operation name(s) like "mutate" or ["filter", "select"]

### `tidy-get-example`
Fetches complete, self-contained working code examples.
- Parameter: `use_case` - Example name like "grouping-aggregation"
- Available: getting-started, creating-dataframes, filtering-rows, transforming-data, grouping-aggregation, joining-dataframes, stats-descriptive, stats-distributions, and more

**Note:** All examples are self-contained within the MCP server and work independently of the tidy-ts repository. Examples use inline data (no external file dependencies) and can be run anywhere after installing tidy-ts.

## Usage

Just ask Claude naturally:
- "What DataFrame operations are available?"
- "Show me docs for mutate and filter"
- "Give me an example of grouping data"

Claude will automatically call the appropriate tools.

## Updating

If you make changes to the MCP code, reinstall:

```bash
deno install --global --allow-read --allow-env --import-map import_map.json --name tidy-ts-mcp --force src/mcp/cli.ts
```

Then restart your AI tool.

## For Maintainers

### Add Documentation
Edit `src/mcp/docs/index.ts` to add new operations to the `DOCS` object.

### Add Examples
Edit `src/mcp/docs/examples.ts` to map new example files.

### Architecture
```
src/mcp/
├── cli.ts                 # Entry point
├── index.ts              # Server setup
├── handlers/tools/       # Tool implementations
└── docs/                 # Documentation data
```

### Test Server
```bash
deno task mcp  # Starts stdio server
deno run --allow-read --allow-env src/mcp/test-tools.ts  # Runs tests
```
