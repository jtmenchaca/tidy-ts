# Benchmarks

## Broad Comparison (tidy-ts vs Polars vs pandas, 2M rows)

```bash
# Run tidy-ts broad benchmark
deno run -A --no-check packages/testing/benchmarks/bench-broad-2m.ts

# Run matching Python broad benchmark (Polars + pandas)
python3 packages/testing/benchmarks/bench-broad-2m.py
```

| File | Purpose |
|------|---------|
| `bench-broad-2m.ts` | 22 operations at 2M rows: creation, filter (numeric/string/complex), select, sort (numeric/string/multi-col), mutate (col/scalar, col+col, string upper, scalar), distinct, groupBy (single/multi), summarise (ungrouped/grouped), innerJoin, leftJoin, pivotLonger, bindRows, stats |
| `bench-broad-2m.py` | Matching Polars + pandas benchmark for all 22 operations, with comparison table |

## Quick Start

```bash
# Run the stable benchmark (tidy-ts operations, 100K + 500K rows)
deno run -A --no-check packages/testing/benchmarks/bench-stable.ts

# Run matching Polars comparison
python3 packages/testing/benchmarks/bench-npm-polars.py

# Run the full cross-language benchmark suite (TS + Python + R)
cd packages/testing/benchmarks
deno run -A runner.ts

# Analyze results and generate comparison table
deno run -A analyze.ts
```

Results are saved to `results/` as JSON and CSV. The analyze step produces
the comparison table used in `docs/api/benchmark-results.md`.

## File Guide

### Stable Benchmarks (primary)

| File | Purpose |
|------|---------|
| `bench-stable.ts` | Primary tidy-ts benchmark — stats, verbs, joins at 100K/500K rows. Median of 50 iterations. |
| `bench-npm-polars.py` | Matching Polars benchmark for head-to-head comparison with bench-stable.ts |
| `bench-npm-tidy.ts` | npm-published package benchmark (uses `@tidy-ts/dataframe` from npm) |

### Profiling Benchmarks (per-operation instrumentation)

These use `__TIDY_PROFILE = true` to log time breakdowns for every phase inside each operation.

| File | Purpose |
|------|---------|
| `bench-profile-mutate.ts` | 18 mutate variants with full instrumentation: napi binary, col-scalar, boolean, scalar, array, string, mixed, chained, grouped, filtered, ternary |
| `bench-polars-mutate.py` | Matching Polars benchmark for all 18 mutate variants |

### Cross-Language Suite

| File | Purpose |
|------|---------|
| `runner.ts` | Main entry point — runs all three language benchmarks and saves results |
| `typescript.ts` | tidy-ts vs Arquero benchmarks |
| `python.py` | pandas vs Polars benchmarks |
| `r.R` | R base/dplyr benchmarks |
| `analyze.ts` | Reads `results/` CSV files and prints formatted comparison tables |

### Other

| File | Purpose |
|------|---------|
| `bench-local-stats.ts` | Stats-focused benchmark using local source imports |
| `mutate-jit.ts` | JIT compilation benchmark for mutate operations |

### Documentation

| File | Purpose |
|------|---------|
| `native-rayon-progress-log.md` | Full optimization history: sort, join, stats, mutate. Includes mistakes-to-avoid, architectural audits (Polars comparison), and per-phase profiling results. |

## Optimization Approach

Each optimization follows a consistent methodology:

1. **Profile first**: Enable `(globalThis as any).__TIDY_PROFILE = true` and run the profiling benchmark to see where time goes (e.g. `bench-profile-mutate.ts`)
2. **Measure Polars**: Run the matching Polars benchmark (e.g. `bench-polars-mutate.py`) for comparison
3. **Optimize**: Target the dominant cost — usually JS framework overhead, not Rust compute
4. **Verify**: Run `pnpm test:dataframe` (1153 tests) + `pnpm check:dataframe` (type check)
5. **Document**: Update `native-rayon-progress-log.md` with before/after numbers

### Common bottleneck patterns

- **napi Vec<u32> / Vec<u8> returns**: Creates N individual JS Number objects. Fix: return `Uint32Array` / `Buffer` instead.
- **Stale .node binary**: `pnpm napibuild` copies to both `packages/dataframe/lib/` and `packages/npm-darwin-arm64/`. If either is stale, benchmarks use old code.
- **Identity index materialization**: `materializeIndex` allocates a N-element Uint32Array even when no view exists. Fix: check `!view?.mask && !view?.index` and skip.
- **Array allocation for napi results**: `new Array(n)` is allocated then overwritten by napi Float64Array. The napi result can be used directly since `ColumnData = unknown[] | Float64Array`.
- **String(fn) regex parsing**: Each mutate call re-parses the function string. Adds ~0.1ms overhead.

## Python Environment

| File | Purpose |
|------|---------|
| `pyproject.toml` | Python dependencies (pandas, polars) |
| `poetry.lock` | Locked Python dependency versions |

## Updating docs/api/benchmark-results.md

1. Run the full suite: `deno run -A runner.ts`
2. Run analysis: `deno run -A analyze.ts`
3. Copy the at-a-glance table from analyze output into `docs/api/benchmark-results.md`

## Configuration

Each language file has an `OPTIONS` object at the top to enable/disable specific operations:

```typescript
// typescript.ts
const OPTIONS = {
  creation: true,
  filter: true,
  select: false,    // Disabled
  sort: true,
  // ...
};
```

Default dataset sizes: 100, 1,000, 10,000, 100,000, 1,000,000 rows.
