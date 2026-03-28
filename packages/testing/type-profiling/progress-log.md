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

## Deep analysis (2026-03-27)

Used custom Python scripts (`analyze.py`, `analyze-deep.py`, `analyze-deep2.py`) to parse `trace.json` and `types.json` for patterns invisible to wall-clock hotspot analysis.

### Key findings

**Recursive depth-limit hits (3,248 total) by type:**

| Type | Hits | % |
|------|------|---|
| DataFrame | 2,032 | 63% |
| PromisedDataFrame | 429 | 13% |
| GroupedDataFrame | 309 | 10% |
| PreserveGrouping | 241 | 7% |
| PromisedGroupedDataFrame | 228 | 7% |

**Anonymous type (__type) generation by source file:**

| File | __type instances |
|------|-----------------|
| utility-types.ts | 8,826 |
| dataframe.type.ts | 5,772 |
| suffix.types.ts (joins) | 3,815 |
| promised-dataframe.type.ts | 1,721 |
| mutate.types.ts | 1,310 |
| data-helper.ts (distributions) | 610 |
| filter.types.ts | 547 |

**Most instantiated named types:**

| Type | Instances | Source |
|------|-----------|--------|
| ColName | 10,519 | dataframe.type.ts (76%) |
| DataFrameBase | 9,078 | dataframe.type.ts |
| DataFrameColumns | 7,971 | dataframe.type.ts |
| DataFrame | 7,063 | dataframe.type.ts |
| RestrictEmptyDataFrame | 1,449 | error-types.ts |
| PreserveGrouping | 861 | dataframe-type-helpers.ts |

**Distribution files: hidden amplifier.** Each of 11 distribution files triggers 129 depth-limit hits via `createDistributionData()` returning `DataFrame<T>`. Collectively: 972 depth hits (30% of all DataFrame depth hits), ~2,500ms comparison time.

**structuredTypeRelatedTo — most expensive comparison pairs:**

| Pair | Total time | Count |
|------|-----------|-------|
| DataFrame vs DataFrame | 2,050ms | 112x |
| DataFrame vs DataFrameBase | 1,054ms | 28x |
| DataFrameBase vs DataFrameBase | 940ms | 34x |
| FilterRowsMethod vs FilterRowsMethod | 672ms | 52x |
| FilterRowsMethod vs __type | 662ms | 49x |
| GroupedDataFrame vs DataFrameBase | 659ms | 24x |
| MutateMethod vs MutateMethod | 646ms | 31x |
| GroupedDataFrame vs GroupedDataFrame | 594ms | 22x |

### Root cause patterns

1. **Prettify<T> as anonymous type factory** — `{ [Key in keyof T]: T[Key] } & {}` forces a new anonymous type every usage. Used in virtually every return type. Drives 8,826 __type instances from utility-types.ts alone.

2. **FilterRowsMethod intersection** — `{ ...4 overloads } & TypePredicateFilterMethods<Row>` is uncacheable. 129ms variance computation, 547 anonymous types.

3. **PromisedDataFrame uses Omit<DataFrame, ...17 keys> intersection** — `Omit` on ~70 members generates anonymous types for every remaining member, then intersects with overrides. 1,721 anonymous types, 429 depth-limit hits.

4. **Distribution files amplify DataFrame comparison cost** — 11 files × 3 overloaded return paths, each triggering full DataFrame assignability check. No complex types of their own.

5. **RestrictEmptyDataFrame conditional guard** — 1,449 evaluations of `IsEmptyDataFrame<Row> extends true ? ErrorMessage<...> : ParamType` on every slice/head/tail parameter. Almost never triggered in practice.

6. **ColName conditional mapped key** — `Extract<keyof Row, string> as ColName extends "nrows" | ... ? never : ColName` re-evaluated per DataFrame instantiation. 10,519 instances.

7. **Join suffix types** — 5 join variants × multiple intersections of Pick/Omit/ApplySuffix/MakeUndefined. 3,815 anonymous types.

---

## Change 4: Remove FilterRowsMethod intersection (2026-03-27)

**What**: Moved the type predicate overload from a separate `TypePredicateFilterMethods<Row>` interface (joined via `&`) into the main `FilterRowsMethod<Row>` object type.

**Why**: `{ ...overloads } & TypePredicateFilterMethods<Row>` is an uncacheable intersection. Every comparison of `FilterRowsMethod` re-walks both sides. Moving the overload inside eliminates the intersection entirely.

**File changed**: `packages/dataframe/ts/verbs/filtering/filter.types.ts`

**Result**: FilterRowsMethod comparisons dropped from 52x (672ms) to 5x (178ms).

---

## Change 5: Explicit return type on `createDistributionData` implementation (2026-03-27)

**What**: Added explicit return type union to the implementation overload of `createDistributionData`.

**Why**: Without it, tsc inferred the return type through 3 `createDataFrame(...)` call paths, each resolving the full DataFrame type. With the annotation, tsc uses the declared overload return types directly. Same pattern as Change 3 (graph.ts).

**File changed**: `packages/dataframe/ts/stats/distributions/data-helper.ts`

---

### Cumulative results after Changes 1–5

| Metric              | Baseline    | After 1-3   | After 1-5   | Total Change |
|---------------------|-------------|-------------|-------------|--------------|
| Check time          | 86.32s      | 27.97s      | 23.14s      | -73%         |
| Instantiations      | 48,014,546  | 29,302,042  | 28,907,756  | -40%         |
| Types               | 3,986,451   | 2,007,362   | 1,957,000   | -51%         |
| Symbols             | 10,018,516  | 4,924,051   | 4,511,431   | -55%         |
| Assignability cache | 1,304,647   | 709,815     | 697,232     | -47%         |

`deno check packages/dataframe` — 0 errors.

---

## Attempted and reverted: PromisedDataFrame interface wrapper

**What**: Wrapped the PromisedDataFrame override methods in an interface (`PromisedDataFrameOverrides`) to get structural caching.

**Why it failed**: The `Omit<DataFrame<Row>, ...>` is still the core of the type. Wrapping the overrides in an interface meant tsc had to compare BOTH the Omit result AND the interface — adding a comparison layer rather than removing one. `PromisedGroupedDataFrameOverrides vs PromisedGroupedDataFrameOverrides` alone cost 5,079ms. Total comparison time jumped from 11.5s to 80.9s.

**Lesson**: Interface extraction only helps when it replaces an intersection. When the intersection (Omit) must remain, wrapping part of it in an interface adds cost.

---

## Attempted and reverted: DataFrameSharedMethods interface split (2026-03-27)

**What**: Split `DataFrameBase<Row>` into two interfaces — `DataFrameSharedMethods<Row>` (the ~47 methods inherited by PromisedDataFrame) and `DataFrameBase<Row> extends DataFrameSharedMethods<Row>` (adding the ~23 DataFrame-only methods). Then replaced `Omit<DataFrame<Row>, ...>` in PromisedDataFrame with `DataFrameSharedMethods<Row> & DataFrameColumns<Row>`, eliminating the Omit entirely.

**Hypothesis**: The Omit generates anonymous types; replacing it with an interface reference should let tsc cache the shared method surface.

**Result**:

| Metric              | After 1-5   | After split | Change |
|---------------------|-------------|-------------|--------|
| Check time          | 23.14s      | 90.08s      | +289%  |
| Instantiations      | 28,907,756  | 91,295,837  | +216%  |
| Types               | 1,957,000   | 4,038,570   | +106%  |
| Symbols             | 4,511,431   | 5,536,626   | +23%   |
| Assignability cache | 697,232     | 1,340,215   | +92%   |

Depth-limit hits rose from 3,248 to 4,089. DataFrame depth-limit hits rose from 2,032 to 2,896. PromisedDataFrame depth-limit hits rose from 429 to 469.

**Why it failed**: The interface inheritance layer (`DataFrameBase extends DataFrameSharedMethods`) didn't just affect PromisedDataFrame — it added an extra resolution step to *every* `DataFrameBase` comparison. Since `DataFrameBase` is compared 112x (DataFrame vs DataFrame) + 28x (DataFrame vs DataFrameBase) + 34x (DataFrameBase vs DataFrameBase) + 24x (GroupedDataFrame vs DataFrameBase), the cascading cost dwarfed any savings from eliminating the Omit. The Omit cost was localized to PromisedDataFrame usages (~429 depth hits); the inheritance tax hit everything.

**Lesson**: Interface inheritance is not free — extending an interface adds a resolution layer that tsc must walk on every comparison of the parent. Splitting an existing interface only helps if the *original* interface was the bottleneck (like Change 1, where the original was an intersection). When the original is already an efficiently-cached interface, splitting it makes things worse.

---

## Changes 6 & 7 (2026-03-27)

Changes 6 and 7 were developed concurrently and measured together.

### Change 6: Omit DataFrameBase instead of DataFrame in PromisedDataFrame

**What**: Changed `Omit<DataFrame<Row>, ...23 keys>` to `Omit<DataFrameBase<Row>, ...23 keys> & DataFrameColumns<Row>` in both PromisedDataFrame and PromisedGroupedDataFrame.

**Why**: `DataFrame<Row>` is an intersection (`DataFrameBase<Row> & DataFrameColumns<Row>`). Applying `Omit` to an intersection forces tsc to first resolve/merge the intersection's keys, then apply the mapped type. Applying `Omit` to just `DataFrameBase` (a cached interface) lets tsc resolve `keyof DataFrameBase` directly from the cached interface. Since none of the 23 omitted keys exist on `DataFrameColumns` (which only has row-data column accessors), the result is semantically identical.

**Files changed**: `packages/dataframe/ts/promised-dataframe/types/promised-dataframe.type.ts`, `packages/dataframe/ts/dataframe/types/dataframe.type.ts` (export DataFrameBase)

### Change 7: Remove redundant double-Prettify wrapping in mutate types

**What**: Removed 29 redundant `Prettify<RowAfterMutation<...>>` wrappers in `mutate.types.ts` and 6 redundant `Prettify<AddColumns<...>>` wrappers in `mutate.overloads.ts`, replacing them with bare `RowAfterMutation<...>` / `AddColumns<...>`.

**Why**: `RowAfterMutation` (and its alias `AddColumns`) already applies `Prettify` internally in its definition:
```typescript
export type RowAfterMutation<Row, Assignments> = Prettify<
  Omit<Row, keyof Assignments & keyof Row> & { [ColName in keyof Assignments]: ... }
>;
```
Wrapping in another `Prettify<>` creates a second anonymous mapped type per instantiation with identical tooltip output. The grouped overloads were especially wasteful — `Extract<GroupName, keyof Prettify<RowAfterMutation<...>>>` forces tsc to expand the Prettify just to extract keys, which are the same as `keyof RowAfterMutation<...>`.

**Files changed**: `mutate.types.ts`, `mutate.overloads.ts`

**Note**: The raw intersection `Prettify<Omit<Row, ...> & { ... }>` patterns in `mutate.overloads.ts` (lines 58, 104, 146, 186) were NOT changed — those are the only `Prettify` layer and are needed for tooltip flattening.

**Analysis**: See `prettify-analysis.md` for full audit of all 217 `Prettify<>` sites, which types already contain internal Prettify (safe to de-duplicate), and which don't (must keep outer Prettify).

### Cumulative results after Changes 1–7

| Metric              | Baseline    | After 1-5   | After 1-7   | Total Change |
|---------------------|-------------|-------------|-------------|--------------|
| Check time          | 86.32s      | 23.14s      | 21.88s      | -75%         |
| Instantiations      | 48,014,546  | 28,907,756  | 27,117,223  | -44%         |
| Types               | 3,986,451   | 1,957,000   | 1,926,862   | -52%         |
| Symbols             | 10,018,516  | 4,511,431   | 4,493,560   | -55%         |
| Assignability cache | 1,304,647   | 697,232     | 682,612     | -48%         |

`deno check packages/dataframe` — 0 errors.

PromisedGroupedDataFrame comparisons dropped from 12x to 1x. MutateMethod comparisons dropped from 39x/875ms to 27x/759ms. Total comparison time dropped from ~11.5s to 10.3s.

---

## Changes 8 & 9 (2026-03-27)

Changes 8 and 9 were developed concurrently and measured together.

### Change 8: Explicit return type on `createDataFrame` implementation overload

**What**: Added explicit return type union to the `createDataFrame` implementation signature:
```typescript
): DataFrame<R[number]> | DataFrame<z.infer<S>> | DataFrame<never> | DataFrame<{ [K in keyof T]: T[K][number] }> | DataFrame<any> {
```

**Why**: Without it, tsc inferred the return type through ~7 code paths, each calling `createColumnarDataFrameFromStore` and casting to various `DataFrame<...>` types. The implementation body is 125 lines with multiple branches — tsc had to unify all return expressions. Same pattern as Changes 3 and 5.

**File changed**: `packages/dataframe/ts/dataframe/implementation/create-dataframe.ts`

**Impact**: create-dataframe.ts was the second-heaviest file at 2,863ms / 131 comparisons / 1,517 depth-limit hits. The explicit return type cut off the bulk of depth-limit hits (~1,400 reduction).

### Change 9: Remove needless Prettify on plain object types in graph.ts + explicit return types

**What**:
1. Removed `Prettify<>` wrapping from ~19 plain object type aliases in graph.ts (AxisConfig, GridConfig, LayoutConfig, ColorConfig, LegendConfig, TooltipConfig, InteractivityConfig, AccessibilityConfig, AnimationConfig, LineChartConfig, ScatterChartConfig, BarChartConfig, AreaChartConfig, CommonConfig, ScatterMappings, LineMappings, BarMappings, AreaMappings). Kept Prettify on 5 intersection types (InternalConfig, ScatterConfig, LineConfig, BarConfig, AreaConfig) where it's needed for tooltip flattening.
2. Added explicit `Record<string, any>` return type to `buildVegaSpec()` in graph.ts and `buildStandaloneVlSpec()` in export-utils.ts.

**Why**: `Prettify<{ a?: string; b?: number }>` on a plain object (no intersection) creates an anonymous mapped type identical to the input — pure waste. Removing them eliminates anonymous type generation. The return type annotations cut off inference through ~250 lines of Vega-Lite spec construction.

**Files changed**: `packages/dataframe/ts/graph/graph.ts`, `packages/dataframe/ts/graph/export-utils.ts`

**Impact**: graph.ts was the heaviest single file at 3,465ms / 147 comparisons / 388 depth-limit hits. Comparisons dropped from 147 to ~67 range.

### Cumulative results after Changes 1–9

| Metric              | Baseline    | After 1-7   | After 1-9   | Total Change |
|---------------------|-------------|-------------|-------------|--------------|
| Check time          | 86.32s      | 21.88s      | 21.07s      | -76%         |
| Instantiations      | 48,014,546  | 27,117,223  | 26,708,072  | -44%         |
| Types               | 3,986,451   | 1,926,862   | 1,858,503   | -53%         |
| Symbols             | 10,018,516  | 4,493,560   | 4,261,629   | -57%         |
| Assignability cache | 1,304,647   | 682,612     | 673,436     | -48%         |

`deno check packages/dataframe` — 0 errors.

Depth-limit hits dropped from 3,893 to 2,491 (-36%). DataFrame comparisons dropped from 93x to 67x (-28%). Total comparison time dropped from 10,275ms to 8,406ms (-18%).

---

## Changes 10 & 11 (2026-03-27)

Changes 10 and 11 were developed concurrently and measured together.

### Change 10: Remove generics from shared-handler-utils.ts

**What**: Replaced all generic type parameters (`<T>`, `<Row, K>`) with `any` in `shared-handler-utils.ts`. Removed `DataFrame` and `GroupedDataFrame` imports entirely. Changed type guard parameters from `(x: unknown) => x is DataFrame<Row>` to `(x: unknown) => boolean`.

**Why**: This file is a runtime proxy implementation — all type safety comes from the PromisedDataFrame type definitions, not from the handler internals. The generic parameters on `processMethodResult<Row, K>`, `processAsyncMethodResult<Row, K>`, `resolveProperty<T>`, `createPrintMethodHandler<T>`, etc. forced tsc to instantiate `DataFrame<Row>` and `GroupedDataFrame<Row, K>` at every call site, triggering full structural comparisons. Since the proxy already uses `any` casts internally, the generics provided zero type safety.

**File changed**: `packages/dataframe/ts/promised-dataframe/implementation/handlers/shared-handler-utils.ts`

**Impact**: shared-handler-utils.ts was the #1 cost center at 497ms / 175 comparisons / 390 depth-limit hits. Dropped to 0ms / 0 comparisons / 2 depth hits.

### Change 11: Explicit `: any` return type on distribution implementation signatures

**What**: Added `: any` return type to the implementation overload of all 11 distribution `*Data` functions (normalData, betaData, binomialData, poissonData, gammaData, tData, paretoData, uniformData, weibullData, chiSquareData, exponentialData).

**Why**: The implementation signatures had no return type annotation, forcing tsc to infer the return through `createDistributionData()` → `createDataFrame()` for each of 3 code paths per file. The overload signatures already provide the correct specific `DataFrame<{...}>` return types for callers — the implementation signature only needs to satisfy the compiler. Using `: any` cuts off the inference chain entirely.

**Note**: An earlier attempt using `DistributionDataResult` (a union of 3 DataFrame types) was neutral on check time but introduced a new `DataFrame vs DistributionDataResult` comparison pair (250ms/29x). Switching to `: any` eliminated that overhead.

**Files changed**: All 11 distribution files in `packages/dataframe/ts/stats/distributions/`

**Impact**: Distribution depth-limit hits dropped from 1,134 to 162 (-86%). Distribution comparison time dropped from ~1,055ms to 183ms (-83%). All 11 individual files removed from the depth-limit hot list.

### Cumulative results after Changes 1–11

| Metric              | Baseline    | After 1-9   | After 1-11  | Total Change |
|---------------------|-------------|-------------|-------------|--------------|
| Check time          | 86.32s      | 21.07s      | 21.10s      | -76%         |
| Instantiations      | 48,014,546  | 26,708,072  | 26,514,337  | -45%         |
| Types               | 3,986,451   | 1,858,503   | 1,829,652   | -54%         |
| Symbols             | 10,018,516  | 4,261,629   | 4,156,317   | -59%         |
| Assignability cache | 1,304,647   | 673,436     | 665,705     | -49%         |

`deno check packages/dataframe` — 0 errors.

Depth-limit hits dropped from 2,491 to 1,369 (-45%). Total comparisons dropped from ~686 to 545 (-21%). graph.ts dropped from 3,528ms to 13ms (effectively zero — Changes 3/9 explicit return types now fully effective). shared-handler-utils.ts dropped from 497ms/#1 to 0ms.

---

## Remaining opportunities — reassessed after Change 11 (2026-03-27)

### Top cost centers by file (comparison time / depth-limit hits)

| File | Comparison time | Comparisons | Depth hits | Notes |
|------|---------------:|------------:|-----------:|-------|
| filter.verb.ts | 5,585ms | 147x | 415 | New #1. MutateMethod 706ms/15x, DataFrameBase 989ms/11x |
| create-dataframe.ts | 2,494ms | 87x | 304 | Down from 2,863ms. Structural overload cost |
| zod schemas.d.cts | 719ms | 57x | 5 | Third-party cost |
| left-join-parallel.verb.ts | 578ms | 26x | 108 | Join verb comparison cascade |
| slice.verb.ts | 417ms | 40x | 265 | Overload comparison cascade |
| data-helper.ts | 184ms | 26x | 204 | Distribution helper (residual) |

### Top comparison pairs globally

| Pair | Time | Count |
|------|-----:|------:|
| DataFrame vs DataFrame | 1,694ms | 39x |
| DataFrameBase vs DataFrameBase | 1,511ms | 30x |
| DataFrame vs DataFrameBase | 1,298ms | 22x |
| MutateMethod vs MutateMethod | 924ms | 24x |
| GroupedDataFrame vs DataFrameBase | 859ms | 21x |
| GroupedDataFrame vs GroupedDataFrame | 807ms | 18x |

### Not actionable (structural or intentional)

- **`__type` from utility-types.ts (Prettify): 5,557 instances** — Single-layer Prettify needed for tooltip UX. Double-layer redundancies already removed in Change 7.
- **`__type` from dataframe.type.ts: 3,292 instances** — Generated by `DataFrameColumns<Row>` mapped type. Structural to column accessor API.
- **ColName conditional mapped key: 7,103 instances** — Bound variable from `DataFrameColumns<Row>` mapped type. Fundamental to column accessors.
- **Join suffix types: 3,815 anonymous types** — Five `*WithSuffixes` types already behind conditional dispatch.
- **RestrictEmptyDataFrame: 1,448 instances** — Intentional UX feature for error clarity.
- **DataFrame vs DataFrame depth-limit hits (817 total)** — Inherent cost of comparing the ~70-member DataFrameBase interface. Already mitigated by caching (Change 1).
- **create-dataframe.ts (2,494ms)** — Already optimized with `: any` impl return type. Remaining cost is structural (overload signatures require DataFrame instantiation).
- **graph.ts (13ms)** — Fully optimized. Zero comparisons, zero depth hits.

### Possibly actionable (diminishing returns, some risk)

- **filter.verb.ts (5,585ms/415 depth hits)** — New #1 cost center. 147 comparisons dominated by DataFrameBase (989ms/11x), DataFrame (782ms/12x), MutateMethod (706ms/15x), GroupedDataFrame (609ms/10x each for GDF vs GDF and GDF vs DFBase). Worth investigating whether explicit return types or restructuring could help.
- **MutateMethod overloads: 24 comparisons at 924ms** — 14 overloads. Consolidation could reduce comparisons but risks degrading parameter inference quality.
- **Zod schemas: 719ms** — Third-party cost. Could reduce by lazy-loading `zDataFrame` or separate entry point.
- **slice.verb.ts (417ms/265 depth hits)** — Overload-heavy verb file.

### Summary

From 86s to 21s (76% reduction). Depth-limit hits from 3,248 to 1,369 (-58%). The remaining cost is dominated by structural DataFrame comparisons in verb implementation files — filter.verb.ts alone accounts for 5,585ms of comparison time. These are inherent costs of tsc structurally comparing the ~70-member DataFrameBase interface at verb call boundaries. Further gains would require either reducing the number of verb overloads or accepting `any` at more implementation boundaries, both of which risk degrading type inference quality for end users.
