---
name: dataframe-grouping
description: groupBy, summarize / summarizeAsync, count, ungroup, mutateOverGroup. Grouped DataFrames are not iterable — they change verb behaviour. Use `s.*` aggregations, never manual reduce.
metadata:
  tags: dataframe, groupBy, summarize, mutateOverGroup, count, ungroup
---

# Grouping

`groupBy(...cols)` is a **marker** that changes how subsequent verbs behave. It does not produce iterable groups. There is no `.map(...)` on a `GroupedDataFrame`.

```typescript
df.groupBy("region")               // single column
df.groupBy("region", "product")    // multiple
```

## summarize (sync)

Each function receives a sub-DataFrame for its group and returns a scalar per summary column.

```typescript
df.groupBy("region").summarize({
  total: (g) => s.sum(g.revenue),
  count: (g) => g.nrows(),
  avg_price: (g) => s.mean(g.price),
});
```

Alias: `summarise` (same method).

### Cardinal rule: use `s.*` aggregations

```typescript
// ✓ GOOD
g => s.sum(g.column)
g => s.mean(g.column)
g => s.median(g.column)
g => s.max(g.column)
g => s.min(g.column)
g => s.stdev(g.column)

// ❌ BAD — manual reduce reimplements stats, ignores null/NaN, loses WASM acceleration
g => g.column.reduce((a, b) => a + b, 0)
g => g.column.reduce((a, b) => a + b, 0) / g.nrows()
g => [...g.column].sort((a, b) => a - b)[Math.floor(g.nrows() / 2)]
```

Access columns directly inside the group: `g.revenue`, not `g.extract("revenue")` (use `extract` only when a stats function needs a plain array).

## summarizeAsync

Use when any aggregation returns a Promise. Returns a `PromisedDataFrame`.

```typescript
await df.groupBy("id").summarizeAsync({
  x: async (g) => await remoteSum(g.extract("v")),
});
```

## Counting rows

```typescript
df.nrows()                                              // total rows
df.groupBy("region").summarize({ count: (g) => g.nrows() })
df.groupBy("region", "product").summarize({ count: (g) => g.nrows() })
```

There is no `df.count(...)` method — counting per group is always `groupBy(...).summarize({ count: g => g.nrows() })`.

## ungroup

Strip grouping; return to a regular DataFrame. Useful when chaining a grouped result into a verb that should operate on the whole frame.

```typescript
df.groupBy("region")
  .summarize({ total: (g) => s.sum(g.sales) })
  .ungroup();
```

## mutateOverGroup

Compute new columns from each group's sub-DataFrame. Each function returns an array with one value per row in that group. Dispatch is `O(groups)`, so it's the right tool for window functions on groups.

```typescript
df.groupBy("symbol").mutateOverGroup({
  prev_price: (g) => s.lag(g.extract("price"), { defaultValue: 0 }),
  next_price: (g) => s.lead(g.extract("price")),
});
```

When `mutateOverGroup` calls are the right shape: window helpers (`s.lag`, `s.lead`, `s.cumsum`, `s.rolling`) applied within each group.

## Grouped slice verbs

Slice variants respect the grouping:

```typescript
df.groupBy("cyl").sliceHead(2)       // first 2 rows per group
df.groupBy("cyl").sliceTail(1)       // last row per group
df.groupBy("cyl").sliceMax("hp", 1)  // highest hp per group
df.groupBy("cyl").sliceMin("mpg", 1) // lowest mpg per group
df.groupBy("cyl").sliceSample(2)     // 2 random rows per group
df.groupBy("year").distinct("product")  // unique products per year
```

## Anti-patterns

- ❌ `df.groupBy("x").map(...)` — `GroupedDataFrame` is not iterable. Use `summarize`, `mutateOverGroup`, or a slice verb.
- ❌ Manual `reduce` for sum/mean/median inside `summarize` — use `s.*`.
- ❌ Calling async aggregators inside `summarize` — use `summarizeAsync`.
- ❌ Forgetting to `ungroup()` before a verb that should operate on the whole frame.
