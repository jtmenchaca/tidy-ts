# Benchmarks

## Quick Start

```bash
# Run the full cross-language benchmark suite (TS + Python + R)
cd packages/testing/benchmarks
deno run -A runner.ts

# Analyze results and generate comparison table
deno run -A analyze.ts
```

Results are saved to `results/` as JSON and CSV. The analyze step produces
the comparison table used in `docs/api/benchmark-results.md`.

## File Guide

### Cross-Language Suite (canonical)

| File | Purpose |
|------|---------|
| `runner.ts` | Main entry point — runs all three language benchmarks and saves results |
| `typescript.ts` | tidy-ts vs Arquero benchmarks |
| `python.py` | pandas vs Polars benchmarks |
| `r.R` | R base/dplyr benchmarks |
| `analyze.ts` | Reads `results/` CSV files and prints formatted comparison tables |

### Optimization Benchmarks

| File | Purpose |
|------|---------|
| `bench-npm-tidy.ts` | Head-to-head tidy-ts operations (for npm/published package) |
| `bench-npm-polars.py` | Head-to-head Polars operations (companion to bench-npm-tidy) |
| `bench-local-stats.ts` | Stats-focused benchmark using local source imports |
| `mutate-jit.ts` | JIT compilation benchmark for mutate operations |

### Documentation

| File | Purpose |
|------|---------|
| `native-rayon-progress-log.md` | Optimization history and mistakes-to-avoid for napi/rayon work |

### Python Environment

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
