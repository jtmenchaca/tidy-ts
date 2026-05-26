---
name: dataframe-performance
description: Columnar storage, BitSet filter masks, copy-on-write, WASM-backed joins/sort/stats. Quantitative benchmarks and the patterns that let you exploit them.
metadata:
  tags: performance, wasm, bitset, columnar, copy-on-write, benchmarks
---

# Performance & architecture

## How it's built

- **Columnar storage.** Data is stored by column, not by row. `df.colName` is direct array access (`O(1)`).
- **Lazy BitSet filtering.** `filter()` builds a compact `Uint32Array` mask (one bit per row). No row copy. Chained filters combine masks with bitwise AND.
- **Copy-on-write.** `mutate({ y })` allocates only the new column; existing columns are shared references between the source and the result DataFrame.
- **WASM-backed hot paths.** Joins, sort, stats (`s.mean`, `s.stdev`, …), regression (`s.glm`), distributions, hypothesis tests, and `distinct` run in Rust compiled to WebAssembly.

## Quantitative benchmarks (500K rows)

| Op          | tidy-ts | arquero | Speedup     |
|-------------|---------|---------|-------------|
| creation    | 115.8ms | 37.6ms  | (slower)    |
| filter      | 12.9ms  | 11.8ms  | ~equal      |
| mutate      | 2.0ms   | 3.3ms   | ~1.7×       |
| sort        | 119ms   | 343ms   | ~2.9×       |
| leftJoin    | 50.2ms  | 400.1ms | ~8×         |
| innerJoin   | 65.8ms  | 296ms   | ~4.5×       |
| outerJoin   | 98.9ms  | 1245ms  | ~12.6×      |
| distinct    | 108ms   | 616ms   | ~5.7×       |

For 100K+ rows, prefer `leftJoin` / `innerJoin` / `arrange` over hand-written loops.

## Patterns that exploit the architecture

### Direct column access for reads

```typescript
const mean = s.mean(df.x);              // good: WASM mean on the column array
const bad = df.toRows().map(r => r.x);  // bad: row reconstruction
```

### Chained filters (mask AND, not row copy)

```typescript
df.filter(r => r.status === "active").filter(r => r.id > 1);
// Internally: mask1 AND mask2; no intermediate rows materialized.
```

Data is materialized only when something needs row-level access (`print()`, `toRows()`, `groupBy`, `arrange`, `summarize`, …).

### `extract` for stats functions that want arrays

```typescript
const result = s.test.t.oneSample({
  data: df.extract("measurement"),
  mu: 100,
});
```

### `select` to narrow wide tables before heavy work

```typescript
const narrow = wide.select("id", "date", "value");
narrow.groupBy("date").summarize({ total: g => s.sum(g.value) });
```

### Creation from columns when you have arrays

```typescript
const cols = { id: [1, 2, 3], value: [10, 20, 30] };
const df = createDataFrame({ columns: cols }); // no row materialization
```

## Browser setup

```typescript
import { setupTidyTS, createDataFrame, stats as s } from "@tidy-ts/dataframe";
await setupTidyTS();  // call once at app startup before any WASM-backed stats
```

In Node.js / Deno / Bun, `setupTidyTS()` is a no-op (WASM loads synchronously on demand). The function is idempotent and safe to call unconditionally.

Optional custom WASM URL: `setupTidyTS("https://cdn.example.com/tidy_ts_dataframe.wasm")`.

## Anti-patterns

- ❌ `df.toRows().map(r => r.col)` for column reads — use `df.col` or `df.extract("col")`.
- ❌ Hand-written JS join/sort on large frames — use `leftJoin` / `arrange`.
- ❌ Materializing intermediate DataFrames you'll only filter again — chain filters and let BitSet masks combine.
- ❌ Calling `setupTidyTS()` in a render loop or per-request — call once at startup.
- ❌ Stats functions on small WASM arrays where JS overhead dominates — only matters at thousands of rows.
