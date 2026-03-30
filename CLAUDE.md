# Tidy-TS Architecture

- **Type checking output is already clean**: `pnpm check:dataframe` (and all check scripts) use `scripts/parse-check.ts` which strips verbose output and shows only errors with file locations. **Do NOT pipe through `2>&1`, `tail`, `grep`, or `head`** — just run the command directly and read the output as-is.

## Quick Reference

```bash
# Type check
pnpm check

# Run all CI tests
pnpm ci

# Run specific test suites
pnpm test:dataframe        # DataFrame core tests
pnpm test:examples         # Example tests
pnpm test:statistical-tests # Statistical test validation
pnpm test:glm              # GLM regression tests

# Build Rust → WASM
pnpm wasmbuild

# Format and lint
pnpm fmt && pnpm lint
```

## Notes for Development

- **Type check before success**: Always type check affected files before reporting success
- **Efficient type checking**: DO NOT run `pnpm check` - it checks ALL packages and takes too long. Instead, run the package-specific check for the package you modified:
  ```bash
  pnpm check:dataframe   # Check only the dataframe package
  pnpm check:shims       # Check only the shims package
  ```
  Output is already parsed to show only errors — never pipe through `2>&1 | tail` or `grep`.
  Only use `pnpm check` (all packages) when explicitly asked or for final CI validation.
- **Test permissions**: Use `-A` flag for Deno tests: `deno test -A [test-name]`
- **Bug debugging**: Create test files in `packages/testing/bugs/` using existing test patterns
- **Avoid bash heredocs**: They require custom approval every time

## Code Style Guidelines

- **Function Parameters**: Use destructured named parameters (e.g., `function({ path, width })` not `function(opts)`)
- **No Generic Names**: Avoid `opts`, `params`, `config` - use descriptive destructured parameters
- **File Length**: Target <200 lines, max 300-400 lines

## Core Architecture

```
Rust (Core) → WASM → TypeScript (Interface) → Deno/Node.js/Bun
```

## Project Structure (Monorepo)

```
packages/
├── dataframe/       # Core DataFrame library (@tidy-ts/dataframe)
│   ├── ts/          # TypeScript API
│   │   ├── dataframe/   # Core DataFrame implementation
│   │   ├── verbs/       # Data manipulation (filter, mutate, join, etc.)
│   │   ├── stats/       # Statistical functions and tests
│   │   ├── io/          # I/O (CSV, JSON, Excel)
│   │   ├── wasm/        # WASM bindings
│   │   └── graph/       # Graph data structures
│   ├── rust/        # Rust core (stats, distributions, regression)
│   └── lib/         # Compiled WASM output
├── arrow/           # Arrow IPC support (@tidy-ts/arrow)
├── parquet/         # Parquet support (@tidy-ts/parquet)
├── ai/              # In development, not yet documented or published
├── shims/           # Cross-runtime utilities (@tidy-ts/shims)
│   ├── async.ts     # Concurrency control
│   ├── encryption/  # Envelope encryption
│   ├── env.ts       # Environment variables
│   ├── fetch.ts     # Enhanced fetch with Result types
│   ├── fs.ts        # Filesystem utilities
│   └── result.ts    # Result type system
├── mcp/             # Model Context Protocol server (@tidy-ts/mcp)
├── docs/            # Documentation site (Vite + React)
├── examples/        # Usage examples
└── testing/         # Test suites
    ├── benchmarks/  # Performance comparisons
    ├── bugs/        # Bug reproduction tests
    ├── glm/         # GLM regression tests
    ├── gee/         # GEE tests
    └── statistical_tests/  # Hypothesis testing validation
```

## DataFrame Usage Example

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Create from rows
const sales = createDataFrame([
  { region: "North", product: "Widget", quantity: 10, price: 100 },
  { region: "South", product: "Widget", quantity: 20, price: 100 },
]);

// Or from columns
const salesFromColumns = createDataFrame({
  columns: {
    region: ["North", "South"],
    quantity: [10, 20],
    price: [100, 100],
  },
});

// Data analysis workflow
const analysis = sales
  .mutate({
    revenue: (r) => r.quantity * r.price,
    category: (r) => (r.quantity > 10 ? "High Volume" : "Standard"),
  })
  .groupBy("region")
  .summarize({
    total_revenue: (group) => s.sum(group.revenue),
    avg_quantity: (group) => s.mean(group.quantity),
    count: (group) => group.nrows(),
  })
  .arrange("total_revenue", "desc");

analysis.print();
```

## Key Components

- **Rust**: Statistical algorithms (GLM, LM, distributions, hypothesis tests)
- **WASM**: Rust compiled to WebAssembly (rebuild with `pnpm wasmbuild`)
- **TypeScript**: WASM bindings + DataFrame API
- **Cross-runtime**: Works in Deno, Node.js, and Bun

## Publishable Packages (JSR)

| Package | Description |
|---------|-------------|
| `@tidy-ts/dataframe` | Core DataFrame library |
| `@tidy-ts/arrow` | Arrow IPC file support |
| `@tidy-ts/parquet` | Parquet file support |
| `@tidy-ts/shims` | Cross-runtime utilities |

## Build Commands

```bash
# Development
pnpm check              # Type check all packages
pnpm check:dataframe    # Type check dataframe only
pnpm fmt                # Format code
pnpm lint               # Lint code

# Testing
pnpm ci                 # Full CI (fmt, lint, check, test)
pnpm ci:shims           # CI for shims package only
pnpm test:dataframe     # DataFrame tests
pnpm test:examples      # Example tests
pnpm test:glm           # GLM regression tests
pnpm test:statistical-tests  # Statistical test validation

# Build
pnpm wasmbuild          # Rebuild Rust → WASM

# Publishing
pnpm publish:all        # Publish all packages to JSR
pnpm check-versions     # Check JSR version status

# Benchmarks
pnpm benchmark          # Run and analyze benchmarks
```
