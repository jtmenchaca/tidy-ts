---
name: stats-window
description: Window, cumulative, and ranking functions — rolling, lag, lead, forwardFill/backwardFill, interpolate, cumsum/cummean/cumprod/cummax/cummin, rank/denseRank/percentile_rank. Plus async utilities batch/parallel/chunk.
metadata:
  tags: stats, rolling, lag, lead, cumsum, rank, window, ranking
---

# Window, cumulative, ranking

## Rolling window

Two call shapes: pure-array (returns array) and DataFrame-column (returns a mutate function).

```typescript
// Array mode
s.rolling({ values: [1, 2, 3, 4, 5], windowSize: 3, fn: s.mean })
// [1, 1.5, 2, 3, 4]

// DataFrame mode — use inside mutate
df.mutate({
  rolling_mean: s.rolling({ column: "price", windowSize: 3, fn: s.mean }),
  rolling_max: s.rolling({ column: "value", windowSize: 5, fn: (w) => Math.max(...w) }),
});
```

First few rows use partial windows.

## Lag / lead (shift)

```typescript
s.lag([1, 2, 3, 4, 5])                   // [undefined, 1, 2, 3, 4]
s.lag([1, 2, 3, 4, 5], { k: 2 })         // [undefined, undefined, 1, 2, 3]
s.lag([1, 2, 3, 4, 5], { defaultValue: 0 })  // [0, 1, 2, 3, 4]  → typed T[]
s.lead([1, 2, 3, 4, 5])                  // [2, 3, 4, 5, undefined]
```

Providing `defaultValue` narrows the return type from `(T | undefined)[]` to `T[]`.

### Inside grouped mutate

```typescript
// Ungrouped
df.mutate({ prev_sales: s.lag(df.extract("sales"), { defaultValue: 0 }) });

// Grouped — use mutateOverGroup
df.groupBy("symbol").mutateOverGroup({
  prev_price: (g) => s.lag(g.extract("price")),
  next_price: (g) => s.lead(g.extract("price")),
});
```

## Forward / backward fill (array form)

```typescript
s.forwardFill([10, null, null, 20, null]) // [10, 10, 10, 20, 20]
s.backwardFill([null, null, 10, null, 20]) // [10, 10, 10, 20, 20]
```

Use the DataFrame-level helpers (`df.fillForward`, `df.fillBackward`) when you're inside a pipeline.

## Interpolate (array form, requires x-axis)

```typescript
s.interpolate([100, null, null, 200], [1, 2, 3, 4], "linear")
// [100, 133.33, 166.67, 200]

s.interpolate(values, xValues, "spline")  // ≥4 points; falls back to linear otherwise
```

Use `df.interpolate(valueCol, xCol, method)` (see [dataframe-missing-data.md](dataframe-missing-data.md)) when inside a pipeline.

## Cumulative

```typescript
s.cumsum([1, 2, 3, 4, 5])   // [1, 3, 6, 10, 15]
s.cummean([1, 2, 3, 4])     // [1, 1.5, 2, 2.5]
s.cumprod([1, 2, 3, 4, 5])  // [1, 2, 6, 24, 120]
s.cummax([1, 3, 2, 5, 4])   // [1, 3, 3, 5, 5]
s.cummin([5, 3, 4, 1, 2])   // [5, 3, 3, 1, 1]
```

All accept `{ removeNull, removeUndefined, removeNaN }` to skip values instead of propagating null.

## Ranking

```typescript
s.rank([3, 1, 4, 1, 5])                                // [3, 1.5, 4, 1.5, 5]  (default: average)
s.rank([3, 1, 4, 1, 5], { ties: "min" })               // [3, 1, 4, 1, 5]
s.rank([3, 1, 4, 1, 5], { ties: "max" })               // [3, 2, 4, 2, 5]
s.rank([3, 1, 4, 1, 5], { ties: "first" })             // [3, 1, 4, 2, 5]  (strictly unique 1..n; ties by encounter order)
s.rank([3, 1, 4, 1, 5], { ties: "average", desc: true }) // descending
s.rank([3, 1, 4, 1, 5], 3)                             // 3 (rank of value 3; positional target lookup)

s.denseRank([10, 20, 20, 30])            // [1, 2, 2, 3]  (no gap after tie)
s.denseRank([10, 20, 20, 30], { desc: true }) // [4, 3, 3, 1]

s.percentileRank([1, 2, 3, 4, 5], 3)     // 0.6  (60th percentile)
s.percentileRank([1, 2, 3, 4, 5])        // [0.2, 0.4, 0.6, 0.8, 1.0]

s.rowNumber(5)                           // [1, 2, 3, 4, 5]
s.rowNumber(arr)                         // [1..arr.length] — for per-row positions / running counts
```

Pick the tie-breaker by intent:

- `"average"` (default) — R's classical rank, fractional ranks for ties.
- `"min"` — competition rank: 1, 2, 2, 4 (skip after tie).
- `"max"` — modified competition rank: 1, 3, 3, 4.
- `"dense"` — no gap after ties: 1, 2, 2, 3. (Same result as `s.denseRank`.)
- `"first"` — strictly unique 1..n; ties broken by original encounter order.

For "running count of rows" (a typical use of `mutateOverGroup`), reach for `s.rowNumber(g.nrows())` — it's clearer than `s.cumsum(new Array(g.nrows()).fill(1))`.

## Async utilities

Concurrency helpers live in `@tidy-ts/shims` — see [shims.md](shims.md) for `parallel`, `batch`, `chunk`, and retry configuration. They're also re-exposed on `stats` (`s.parallel`, `s.batch`, `s.chunk`) for convenience when you're already in stats-land, but prefer the shims import for cross-runtime app code.

## Anti-patterns

- ❌ Manual slicing in a loop to build a rolling window — use `s.rolling`.
- ❌ Using `s.lag` directly on a grouped frame's column array — use `mutateOverGroup` so lag is applied within each group.
- ❌ Using `s.rank` when you want no gaps after ties — use `s.denseRank`.
- ❌ Passing started promises to `s.parallel` when retrying — retry needs factories.
