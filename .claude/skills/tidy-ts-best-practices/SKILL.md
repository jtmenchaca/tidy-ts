---
name: tidy-ts-best-practices
description: Best practices for tidy-ts — typed DataFrames, statistics, regression, hypothesis testing, distributions, I/O, and cross-runtime shims. Use whenever writing or editing tidy-ts code so you reach for the right verbs, statistics, and patterns.
metadata:
  tags: dataframe, statistics, glm, hypothesis-testing, distributions, io, shims, deno, bun, node
---

## When to use

Use this skill whenever you are writing or editing tidy-ts code — DataFrames (`@tidy-ts/dataframe`), statistics (`stats as s`), I/O readers, shims (`@tidy-ts/shims`), or charts (`@tidy-ts/graph`).

## Mental model

Tidy-ts is a **fluent, immutable DataFrame pipeline** powered by columnar storage, lazy BitSet filtering, copy-on-write transforms, and WASM-backed joins/sort/stats.

- Verbs return a new DataFrame; data flows through chains.
- `groupBy(...cols)` is a marker that changes how `summarize`, `mutateOverGroup`, and slice verbs behave; it does not produce iterable groups.
- Statistics live under `stats` (alias `s`) — they take columns / arrays, not DataFrames. Always import as `import { stats as s } from "@tidy-ts/dataframe"`.
- Column access (`df.colName`) returns the underlying array. Prefer this over `toRows().map(r => r.x)` for reads.
- `print()` is the canonical inspection method — not `console.log(df)`.

## The 80% pipeline

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const sales = createDataFrame([
  { region: "North", product: "Widget", quantity: 10, price: 100 },
  { region: "South", product: "Widget", quantity: 20, price: 100 },
  { region: "North", product: "Gadget", quantity: 5, price: 200 },
]);

const analysis = sales
  .mutate({
    revenue: (r) => r.quantity * r.price,
    category: (r) => r.quantity > 10 ? "High Volume" : "Standard",
  })
  .filter((r) => r.revenue > 500)
  .groupBy("region")
  .summarize({
    total_revenue: (g) => s.sum(g.revenue),
    avg_quantity: (g) => s.mean(g.quantity),
    count: (g) => g.nrows(),
  })
  .arrange("total_revenue", "desc");

analysis.print();
```

## Cardinal rules (avoid the most common mistakes)

1. **Always `import { stats as s } from "@tidy-ts/dataframe"`** — `s.mean`, `s.sum`, `s.median`, `s.glm`, `s.test.*`, `s.dist.*`, `s.compare.*` all live there.
2. **`mutate` is sync only — `mutateAsync` for promises.** Same for `filter` / `filterAsync`, `summarize` / `summarizeAsync`. TypeScript rejects async functions in the sync verbs.
3. **Inside `summarize`, use `s.sum(group.col)` / `s.mean(group.col)` — never `group.col.reduce(...)` / manual sort.**
4. **`groupBy` is not iterable.** Don't write `df.groupBy("x").map(...)`. Reach for `summarize`, `mutateOverGroup`, `sliceMax`/`sliceMin`, or `distinct` instead.
5. **Use `removeNull` / `removeUndefined` over `filter(r => r.x != null)`** — only the former narrows the row type.
6. **Direct column access (`df.colName`)** is preferred over `df.extract("colName")` for reads. Stats functions and hypothesis tests accept `readonly number[]`, so column access works directly: `s.mean(df.bodyMass)`, `s.test.t.oneSample({ data: df.bodyMass, mu: 0 })`. Use `extract` only when you need a mutable copy. Pre-narrow nulls with `df.removeNull("col")`.
7. **All I/O readers take a Zod schema.** Use `peekCSV` / `peekXLSX` to inspect structure before defining the schema; never reach for `no_types: true` unless schema is genuinely unknown at compile time.
8. **`print()` not `console.log(df)`**, and not `console.log(df.toRows())`.
9. **Stats functions return `number | null`** when the input may have nulls/NaN; pass `{ removeNull: true }` (or `removeNaN`/`removeUndefined`) to narrow to `number`. `s.round()` already accepts `null` so you can chain `s.round(s.mean(x), 2)` without a non-null assertion.
10. **`graph()` lives in `@tidy-ts/graph`, not `@tidy-ts/dataframe`** — pass the DataFrame as `df` in the options; there is no `df.graph(...)` method.

## If something in this skill doesn't compile

When you copy an example from these rules and it fails to type-check, **the example is almost always right and your call site is almost always wrong**. Pause and isolate before reaching for a workaround.

1. **Paste the example verbatim into a scratch file**, with the simplest synthetic data that satisfies its types (e.g. `createDataFrame([{ price: 100 }, { price: 105 }])`). Type-check just that file. If it passes, the bug is in how you adapted it — wrong column name, wrong row type, off-by-one in a generic.
2. **Read the full TypeScript error from top to bottom.** TS often points at the call site but the root cause is a few lines up (a missing `await`, a column you renamed, a `Date | null` you forgot to narrow). Don't paraphrase the error — re-read it.
3. **Suspect the skill last.** If after isolating the example still doesn't compile, capture the exact error text and report it as a real gap — but only after step 1.

This rule exists because agents have repeatedly invented "the example doesn't compile" findings that turned out to be local mistakes: a stray `as any`, an unaligned schema, a `summarize` instead of `mutateOverGroup`. Don't be that agent.

## API surface (where to look for what)

### DataFrame verbs

- **Pipeline** — `mutate`, `mutateOverGroup`, `mutateAsync`, `transmute`, `arrange`, `distinct`, `rename`, `select`, `drop`, `filter`, `filterAsync`, `slice`, `sliceHead`, `sliceTail`, `sliceMax`, `sliceMin`, `sliceSample`. See [rules/dataframe-pipeline.md](rules/dataframe-pipeline.md).
- **Joins** — `innerJoin`, `leftJoin`, `rightJoin`, `outerJoin`, `crossJoin`, `asofJoin`. Non-matches are `undefined`, not `null`. WASM-backed and ~4-13× faster than Arquero on 500K rows. See [rules/dataframe-joins.md](rules/dataframe-joins.md).
- **Grouping** — `groupBy`, `summarize` (sync) / `summarizeAsync`, `count`, `ungroup`, `mutateOverGroup`. See [rules/dataframe-grouping.md](rules/dataframe-grouping.md).
- **Reshaping** — `pivotLonger`, `pivotWider`, `transpose`, `unnest`, `bindRows`, `concatDataFrames`. See [rules/dataframe-reshaping.md](rules/dataframe-reshaping.md).
- **Missing data** — `removeNull`, `removeUndefined`, `replaceNull`, `replaceUndefined`, `fillForward`, `fillBackward`, `interpolate`. See [rules/dataframe-missing-data.md](rules/dataframe-missing-data.md).
- **Time series** — `downsample`, `upsample`, plus the fill helpers above. Date column required; aggregations use `stats.*`. See [rules/dataframe-time-series.md](rules/dataframe-time-series.md).
- **Extraction & display** — `extract`, `extractHead`, `extractTail`, `extractNth`, `extractSample`, `extractUnique`, `print`, `toRows`, `toString`, `profile`. See [rules/dataframe-pipeline.md](rules/dataframe-pipeline.md).
- **Async + Result types** — `mutateAsync`, `filterAsync`, `summarizeAsync` return `PromisedDataFrame` (still chainable). Composes with `@tidy-ts/shims` `Result`, `tryAsync`, `defineError`. See [rules/async-and-result.md](rules/async-and-result.md).
- **Performance & architecture** — columnar storage, BitSet masks, copy-on-write, WASM. See [rules/dataframe-performance.md](rules/dataframe-performance.md).

### Statistics

- **Descriptive & aggregate** — `s.mean`, `s.median`, `s.sum`, `s.max`, `s.min`, `s.mode`, `s.product`, `s.first`, `s.last`, `s.stdev`, `s.variance`, `s.range`, `s.iqr`, `s.quantile`, `s.quartiles`, `s.covariance`, `s.unique`, `s.uniqueCount`, `s.countValue`, `s.any`, `s.all`, `s.normalize`, `s.round`, `s.percent`. See [rules/stats-descriptive.md](rules/stats-descriptive.md).
- **Window / cumulative / ranking** — `s.rolling`, `s.lag`, `s.lead`, `s.forwardFill`, `s.backwardFill`, `s.interpolate`, `s.cumsum`, `s.cummean`, `s.cumprod`, `s.cummax`, `s.cummin`, `s.rank`, `s.denseRank`, `s.percentile_rank`. (Concurrency helpers `parallel` / `batch` / `chunk` live in `@tidy-ts/shims`; re-exposed on `stats` for convenience.) See [rules/stats-window.md](rules/stats-window.md).
- **Regression** — `s.glm({ formula, family, link, data, options? })`. Numeric columns only. See [rules/stats-glm.md](rules/stats-glm.md).
- **Probability distributions** — `s.dist.<name>.density / probability / quantile / random / data`. 17 distributions (normal, t, chi-square, F, beta, binomial, poisson, …). See [rules/stats-distributions.md](rules/stats-distributions.md).
- **Hypothesis tests** — `s.test.t.*`, `s.test.z.*`, `s.test.anova.*`, `s.test.nonparametric.*`, `s.test.categorical.*`, `s.test.correlation.*`, `s.test.proportion.*`, `s.test.normality.*`, `s.test.variance.levene`, `s.compare.postHoc.{tukey, gamesHowell, dunn}`. Every test returns `{ pValue, alpha, … }`; significant when `pValue < (alpha ?? 0.05)`. See [rules/stats-tests.md](rules/stats-tests.md).
- **Group comparison API** — `s.compare.oneGroup.*`, `s.compare.twoGroups.*`, `s.compare.multiGroups.*` auto-pick parametric vs nonparametric and run post-hoc when ANOVA / Kruskal-Wallis is significant. Prefer these when you want the right test selected for you. See [rules/stats-compare.md](rules/stats-compare.md).

### I/O

- **CSV** — `readCSV`, `peekCSV`, `readCSVMetadata`, `writeCSV` (browser triggers download).
- **XLSX** — `readXLSX`, `peekXLSX`, `readXLSXMetadata`, `writeXLSX` (browser triggers download).
- **JSON** — `readJSON`, `writeJSON`.
- **Arrow** — `readArrow` from `@tidy-ts/arrow`.
- **Parquet** — `readParquet`, `writeParquet` from `@tidy-ts/parquet`.

All readers take a Zod schema; use the `peek*` helpers first. See [rules/io.md](rules/io.md).

### Shims (`@tidy-ts/shims`)

Cross-runtime helpers that work identically in Deno, Bun, and Node.js.

- **Result types** — `Result<T, E>`, `ok`, `err`, `tryAsync`, `defineError`, `AppError`.
- **Enhanced fetch** — `tidyfetch`, `tidyfetch.create`, typed errors (`HTTPError`, `TimeoutError`, `NetworkError`, `ParseError`, `AbortError`).
- **Concurrency** — `parallel`, `batch`, `chunk`, `RetryConfig`.
- **Filesystem** — `readFile`, `readTextFile`, `writeFile`, `writeTextFile`, `mkdir`, `stat`, `remove`, `listDir`, `copyFile`, `rename`, `exists`, `open` (+ `*Sync` variants).
- **Encryption** — AES-256-GCM (`encrypt`, `decrypt`, `generateKey`) + envelope (`encryptFields`, `decryptFields`, `rotateMasterKey`).
- **Env & runtime** — `env`, `args`, `exit`, `test`, `getCurrentRuntime`, `currentRuntime`, `Runtime`.
- **Path** — `resolve`, `dirname`, `fileURLToPath`, `pathToFileURL`.

See [rules/shims.md](rules/shims.md).

### Graphs / charts

`graph({ df, type, mappings, config?, tooltip? })` from `@tidy-ts/graph`. Types: scatter, line, bar, area. Returns a widget with `.savePNG`, `.saveSVG`. Use `graphReact` to get `{ spec, data }` for `react-vega`. See [rules/graph.md](rules/graph.md).

## Repo discipline (the meta-rules)

- **Type check after edits**: run `pnpm check:dataframe` (or `:shims`, `:graph`) — never `pnpm check` for the whole repo unless explicitly asked.
- **Type-check output is already parsed.** Don't pipe through `tail`, `grep`, or `2>&1`.
- **Tests**: `pnpm test:dataframe`, `pnpm test:stats`, etc. — use `-A` for Deno tests (`deno test -A path/to/test.ts`).
- **Browsers need `await setupTidyTS()` once at startup** before any WASM-backed stats. No-op in Deno/Bun/Node.
- **Cross-runtime**: the package runs identically in Deno, Bun, and Node. Use `@tidy-ts/shims` whenever you'd reach for `Deno.*`, `process.env`, or `fs.*`.
