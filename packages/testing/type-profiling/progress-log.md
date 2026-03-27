# Type Profiling Progress Log

## Workflow

Since `deno check` doesn't expose profiling flags, we use `tsc` directly for diagnostics:

1. **Measure** — `NODE_OPTIONS="--max-old-space-size=8192" tsc --noEmit --extendedDiagnostics -p packages/dataframe/deno.jsonc`
   - Key metric: **Instantiations** (proportional to check time). Also track Types, Symbols, Memory, Check time.
2. **Trace** — `tsc --noEmit --generateTrace ./trace-output --incremental false packages/dataframe/mod.ts`
   - Produces `trace.json` (timing events) and `types.json` (type identity map).
3. **Analyze** — `npx @typescript/analyze-trace ./trace-output`
   - Outputs a ranked tree of hotspots: which files/expressions took the most time, and which type comparisons drove the cost.
4. **Fix** — Address the hotspot, then re-run step 1 to measure the delta.
5. **Verify** — `deno check packages/dataframe` must pass with 0 errors after every change.

Trace output lives in `packages/testing/type-profiling/trace-output/`. Open `trace.json` in https://ui.perfetto.dev for a visual flamegraph.

---

## Baseline (2026-03-27)

Measured with `tsc --noEmit --extendedDiagnostics -p packages/dataframe/deno.jsonc` (NODE_OPTIONS=--max-old-space-size=8192)

| Metric              | Value       |
|---------------------|-------------|
| Check time          | 86.32s      |
| Instantiations      | 48,014,546  |
| Types               | 3,986,451   |
| Symbols             | 10,018,516  |
| Memory              | 6,587,777K  |
| Assignability cache | 1,304,647   |

### Trace hotspots (analyze-trace)

All three hotspots traced back to `dataframe.type.ts:130` — the `DataFrame<Row>` intersection type:

1. `read_xlsx.ts` — 1186ms comparing two DataFrame instantiations
2. `create-dataframe.ts` — 793ms, same pattern
3. `graph.ts` — 581ms

Root cause: `DataFrame<Row>` was a ~70-member intersection type (`& { ... } & DataFrameColumns<Row> & Forbid<...>`). Intersections can't be cached by the type checker — every assignability check re-compares all members.

---

## Change 1: Convert DataFrame static members to interface (2026-03-27)

**What**: Split `DataFrame<Row>` into `DataFrameBase<Row>` (interface with all static methods) + `DataFrame<Row>` (type alias = `DataFrameBase<Row> & DataFrameColumns<Row>`).

**Why**: Interfaces get structural identity caching. The ~70 static methods are now compared once and cached, instead of re-evaluated on every assignability check.

**File changed**: `packages/dataframe/ts/dataframe/types/dataframe.type.ts`

| Metric              | Before      | After       | Change |
|---------------------|-------------|-------------|--------|
| Check time          | 86.32s      | 33.52s      | -61%   |
| Instantiations      | 48,014,546  | 29,758,325  | -38%   |
| Types               | 3,986,451   | 2,059,092   | -48%   |
| Symbols             | 10,018,516  | 4,984,571   | -50%   |
| Memory              | 6,587,777K  | 3,457,035K  | -47%   |
| Assignability cache | 1,304,647   | 731,612     | -44%   |

`deno check packages/dataframe` — 0 errors.

### Trace hotspots after Change 1

1. `read_xlsx.ts` — 609ms (was 1186ms)
2. `graph.ts` — 538ms (was 581ms)
3. `create-dataframe.ts` — gone

---

## Change 2: Eliminate `.filter()` chain in read_xlsx empty-rows path (2026-03-27)

**What**: Replaced `createDataFrame([dummyRow as z.infer<S>], schema).filter(() => false)` with `createDataFrame([], schema) as unknown as DataFrame<z.infer<S>>`.

**Why**: The `.filter()` chain forced the checker to fully instantiate `FilterRowsMethod<z.infer<S>>` on a generic Zod-inferred type — expensive because `z.infer<S>` is a conditional type that tsc must resolve through the entire DataFrame method surface. `readCSV` already avoided this pattern by using `no_types: true` or direct casts for its empty-row paths.

**File changed**: `packages/dataframe/ts/io/read_xlsx.ts`

---

## Change 3: Add explicit return type to `toVegaData` in graph.ts (2026-03-27)

**What**: Added explicit return type annotation to `toVegaData<T>()` and explicit `unknown[]` annotations on `arrFrom()` call results.

**Why**: Without annotations, tsc had to infer the return type through several `arrFrom(df, m.x)` calls, each requiring resolution of `ColumnSpec<T, unknown>` against `DataFrame<T>`. The annotation cuts off the inference chain. This was a ~500ms hotspot but doesn't significantly affect the overall instantiation count since the cost was localized.

**File changed**: `packages/dataframe/ts/graph/graph.ts`

### Cumulative results after Changes 1–3

| Metric              | Baseline    | After All   | Change |
|---------------------|-------------|-------------|--------|
| Check time          | 86.32s      | 27.97s      | -68%   |
| Instantiations      | 48,014,546  | 29,302,042  | -39%   |
| Types               | 3,986,451   | 2,007,362   | -50%   |
| Symbols             | 10,018,516  | 4,924,051   | -51%   |
| Memory              | 6,587,777K  | 3,343,946K  | -49%   |
| Assignability cache | 1,304,647   | 709,815     | -46%   |

`deno check packages/dataframe` — 0 errors.

### analyze-trace after all changes

Only one hotspot remaining:
- `graph.ts` — 516ms on `arrFrom(df, m.x)` call (inherent cost of resolving `DataFrame<T>` parameter)

No other files above the 100ms threshold.

---

## Next opportunities

The remaining 29M instantiations are no longer concentrated in single hotspots — they're distributed across the codebase. Potential areas:

1. **PromisedDataFrame** — mirrors all DataFrame methods as async variants; same interface extraction could help
2. **Verb method types** (mutate, join, summarise) — each has complex conditional/mapped types that are instantiated per call site
3. **Duplicate method aliases** (summarise/summarize, bind/bindRows, head/sliceHead, etc.) — each alias doubles the instantiation cost for that method type
