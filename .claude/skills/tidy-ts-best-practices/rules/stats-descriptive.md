---
name: stats-descriptive
description: Descriptive statistics — mean, median, sum, max, min, mode, product, first, last, stdev, variance, range, iqr, quantile, quartiles, covariance, unique counts, boolean aggregates, normalize, round, percent. All accept removeNull/removeUndefined/removeNaN flags.
metadata:
  tags: stats, mean, median, sum, stdev, quantile, descriptive, aggregation
---

# Descriptive statistics

All functions live under `stats` (alias `s`):

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

## Null / NaN handling (the universal pattern)

Every numeric stat accepts an options object with `removeNull`, `removeUndefined`, `removeNaN`. Without flags, nulls/NaNs propagate (return `null` or `NaN`). With flags, the return type narrows to `number`.

```typescript
s.mean([1, 2, null, 4])                        // null
s.mean([1, 2, null, 4], { removeNull: true })  // 2.33 (typed as number)
s.mean([1, NaN, 3], { removeNaN: true })       // 2
```

Match the flag to the array's nullability for clean type inference.

## Central tendency

```typescript
s.mean([1, 2, 3, 4])              // 2.5
s.median([1, 2, 3, 4, 5])         // 3
s.mode([1, 1, 2, 3, 3, 3])        // 3
```

## Sum & product

```typescript
s.sum([1, 2, 3, 4, 5])    // 15
s.product([1, 2, 3, 4])   // 24
```

## Extremes & order

```typescript
s.max([1, 2, 3])                  // 3
s.min([1, 2, 3])                  // 1
s.first([1, 2, 3])                // 1 (T | null)
s.last([1, 2, 3])                 // 3
s.first([null, 2, 3], { removeNull: true })  // 2
```

`max` / `min` / `first` / `last` also work with `Date` and `Temporal.*` comparable types. Common OHLC pattern:

```typescript
{ open: s.first, high: s.max, low: s.min, close: s.last }
```

## Spread

```typescript
s.stdev([1, 2, 3, 4, 5])      // sample standard deviation
s.variance([1, 2, 3, 4, 5])   // sample variance (N-1)
s.range([1, 5, 3, 9, 2])      // max - min = 8
s.iqr([1, 2, 3, 4, 5])        // Q75 - Q25 = 2
```

## Quantiles

```typescript
s.quantile([1, 2, 3, 4, 5], 0.5)         // 3 (median)
s.quantile([1, 2, 3, 4, 5], [0.25, 0.75]) // [2, 4]
s.quartiles([1, 2, 3, 4, 5])              // [2, 3, 4]  (Q25, Q50, Q75)
```

Uses R's Type 7 algorithm.

## Bivariate

```typescript
s.covariance(df.height, df.weight)  // readonly column access works directly
```

For Pearson / Spearman / Kendall correlation coefficients with a p-value, use `s.test.correlation.*` (see [stats-tests.md](stats-tests.md)).

## Counts & uniqueness

```typescript
s.unique([1, 2, 1, 3, 2])             // [1, 2, 3]  (order of first appearance)
s.uniqueCount([1, 1, 2, 3])           // 3
s.countValue([1, 2, 1, 3], 1)         // 2
s.countValue(["a", "b", "a"], "a")    // 2
```

WASM fast paths for numeric, string, and boolean columns.

## Boolean aggregates

```typescript
s.any([true, false, false])  // true
s.all([true, true, false])   // false
s.any([])                    // null (empty)
s.any([null, true], { removeNull: true })  // true
```

## Transformations (operate on values)

```typescript
s.normalize([10, 20, 30])              // [0, 0.5, 1] (min-max)
s.normalize([10, 20, 30], "zscore")    // z-scores (mean=0, sd=1)
s.normalize([10, 20, 30], 20)          // 0.5 (just the target value)

s.round(3.14159, 2)                    // 3.14
s.round([1.234, 2.567], 2)             // [1.23, 2.57]
s.round(null)                          // null  ← accepts null, no assertion needed
s.round(s.mean(values), 2)             // chain directly with nullable stats

s.percent(1, 3)                        // 33.3
s.percent(2, 3, 2)                     // 66.67
s.percent(5, 0)                        // 0  (division-by-zero safe)
```

`s.round` accepting `null` lets you skip non-null assertions when chaining with stats that return `number | null`.

## Inside `summarize`

```typescript
df.groupBy("region").summarize({
  avg: (g) => s.mean(g.sales),
  total: (g) => s.sum(g.sales),
  min: (g) => s.min(g.price),
  max: (g) => s.max(g.price),
  std: (g) => s.stdev(g.sales),
  med: (g) => s.median(g.price),
  iqr: (g) => s.iqr(g.price),
  rounded_avg: (g) => s.round(s.mean(g.sales), 2),
});
```

## Anti-patterns

- ❌ `values.reduce((a, b) => a + b, 0) / values.length` — use `s.mean`.
- ❌ `values.reduce((a, b) => a + b, 0)` — use `s.sum`.
- ❌ `[...values].sort((a,b) => a - b)[Math.floor(values.length / 2)]` — use `s.median`.
- ❌ `s.sum(mixedArray)!` non-null assertion — use `{ removeNull: true }` for type-safe narrowing.
- ❌ `s.round(s.mean(values)!, 2)` — `s.round` accepts `null`; drop the `!`.
