# Statistics Functions

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.interpolate](#sinterpolate)
- [s.mean](#smean)
- [s.median](#smedian)
- [s.sum](#ssum)
- [s.max](#smax)
- [s.min](#smin)
- [s.first](#sfirst)
- [s.last](#slast)
- [s.mode](#smode)
- [s.stdev](#sstdev)
- [s.variance](#svariance)
- [s.quantile](#squantile)
- [s.quartiles](#squartiles)
- [s.iqr](#siqr)
- [s.range](#srange)
- [s.product](#sproduct)
- [s.cumsum](#scumsum)
- [s.cummean](#scummean)
- [s.rolling](#srolling)
- [s.cumprod](#scumprod)
- [s.cummax](#scummax)
- [s.cummin](#scummin)
- [s.lag](#slag)
- [s.lead](#slead)
- [s.forwardFill](#sforwardfill)
- [s.backwardFill](#sbackwardfill)
- [s.rank](#srank)
- [s.denseRank](#sdenserank)
- [s.percentile_rank](#spercentile_rank)
- [s.normalize](#snormalize)
- [s.round](#sround)
- [s.percent](#spercent)
- [s.unique](#sunique)
- [s.covariance](#scovariance)
- [s.test.t.oneSample](#stesttonesample)
- [s.compare](#scompare)
- [s.dist.normal](#sdistnormal)

---

## s.interpolate

Interpolate null/undefined values in an array using linear or spline interpolation. Requires an x-axis array to define spacing between points. Interpolates missing values by estimating them based on surrounding known values. Unlike forward/backward fill (which copy values), interpolation calculates intermediate values using mathematical methods.

### Signature

```typescript
s.interpolate<T extends number | Date>(values: (T | null | undefined)[], xValues: (number | Date)[], method: 'linear' | 'spline'): T[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of values (may contain nulls) - numbers or Dates
- xValues: Array of numeric or Date values defining x-axis spacing (required)
- method: Interpolation method - 'linear' or 'spline'

### Returns

T[] - Array with interpolated values (same length as input)

### Examples

```typescript
// Linear interpolation with numbers
s.interpolate([100, null, null, 200], [1, 2, 3, 4], 'linear')
// Returns: [100, 133.33, 166.67, 200]
// Spline interpolation
s.interpolate([100, null, null, 200], [1, 2, 3, 4], 'spline')
// With Dates
const dates = [new Date('2023-01-01'), null, null, new Date('2023-01-04')];
s.interpolate(dates, [1, 2, 3, 4], 'linear')
// Use in mutate for DataFrame operations
df.mutate({
  interpolated: s.rolling({ column: 'value', windowSize: 3, fn: (window) => {
    return s.interpolate(window, [1, 2, 3], 'linear')[1];
  } })
})
```

### Best Practices

- ✓ GOOD: Use for time-series data where you want to estimate missing values based on surrounding data
- ✓ GOOD: Linear interpolation is faster and works with fewer points
- ✓ GOOD: Spline interpolation provides smoother curves but requires at least 4 points
- ✓ GOOD: Only interpolates values that have both previous and next non-null values

### Anti-patterns

- ❌ BAD: Expecting leading/trailing nulls to be interpolated - they remain null (no bounds)
- ❌ BAD: Using spline with fewer than 4 points - falls back to linear
- ❌ BAD: Arrays must have same length - values and xValues must match

### Related

`forwardFill`, `backwardFill`, `lag`, `lead`

---

## s.mean

Calculate the arithmetic mean (average) of numeric values. Returns null if no valid values. Can be chained with s.round() without assertions.

### Signature

```typescript
s.mean(values: number[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: A single number or array of numbers
- removeNA: Whether to exclude null/undefined values (when using mixed arrays)

### Returns

number | null - The arithmetic mean of all numeric values

### Examples

```typescript
s.mean(5) // 5
s.mean([1, 2, 3, 4]) // 2.5
s.mean([1, 2, null, 4], true) // 2.33
df.groupBy("region").summarize({ avg: group => s.mean(group.sales) })
// Chain with s.round() - no assertions needed!
df.groupBy("region").summarize({ avg: group => s.round(s.mean(group.sales), 2) })
```

### Best Practices

- ✓ GOOD: s.mean(values) - built-in, faster, handles edge cases
- ✓ GOOD: Use with df.columnName for direct access: s.mean(df.age)
- ✓ GOOD: Chain with s.round() directly: s.round(s.mean(values), 2) - no assertions needed
- ✓ GOOD: s.round() handles null at runtime, so no need for s.round(s.mean(values)!, 2)

### Anti-patterns

- ❌ BAD: values.reduce((a, b) => a + b, 0) / values.length
- ❌ BAD: s.round(s.mean(values)!, 2) // Unnecessary - s.round() handles null at runtime

### Related

`median`, `mode`, `sd`, `round`

---

## s.median

Calculate the median (50th percentile). Returns number for clean arrays, or number | null for arrays with nulls/mixed types (when removeNA=false, the default).

### Signature

```typescript
s.median(values: number[]): number | s.median(values: (number | null)[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers (or array with nulls)
- removeNA: If true, guarantees number return; if false (default), may return null

### Returns

number for clean arrays, number | null for arrays with nulls

### Examples

```typescript
s.median([1, 2, 3, 4, 5]) // 3 (number)
s.median(df.sales) // number (if df.sales is clean)
s.median([1, null, 3, 4]) // 2.5 (number | null - may be null if no valid values)
df.groupBy("region").summarize({ median_price: group => s.median(group.price) })
```

### Best Practices

- ✓ GOOD: s.median(values) - handles even/odd lengths correctly
- ✓ GOOD: For clean arrays, returns number - no assertions needed
- ✓ GOOD: For arrays with nulls, returns number | null - handle null appropriately

### Anti-patterns

- ❌ BAD: [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
- ❌ BAD: s.median(values)! // May be unnecessary - check if array has nulls first

### Related

`mean`, `quantile`

---

## s.sum

Calculate the sum of all values.

### Signature

```typescript
s.sum(values: number[]): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers

### Returns

number

### Examples

```typescript
s.sum([1, 2, 3, 4, 5]) // 15
s.sum(df.revenue)
df.groupBy("region").summarize({ total: group => s.sum(group.sales) })
```

### Best Practices

- ✓ GOOD: s.sum(values) - clearer intent, handles edge cases

### Anti-patterns

- ❌ BAD: values.reduce((a, b) => a + b, 0)

### Related

`mean`, `cumsum`

---

## s.max

Find the maximum value. Returns number for clean arrays, or number | null for arrays with nulls/mixed types (when removeNA=false, the default).

### Signature

```typescript
s.max(values: number[]): number | s.max(values: (number | null)[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers (or array with nulls)
- removeNA: If true, guarantees number return; if false (default), may return null

### Returns

number for clean arrays, number | null for arrays with nulls

### Examples

```typescript
s.max([1, 2, 3, 4, 5]) // 5 (number)
s.max(df.price) // number (if df.price is clean)
s.max([1, null, 3]) // 3 (number | null - may be null if no valid values)
df.groupBy("region").summarize({ max_price: group => s.max(group.price) })
```

### Best Practices

- ✓ GOOD: For clean number arrays, returns number - no assertions needed
- ✓ GOOD: For arrays with nulls, returns number | null - handle null appropriately
- ✓ GOOD: Use removeNA: true if you want guaranteed number return

### Related

`min`, `cummax`

---

## s.min

Find the minimum value. Returns number for clean arrays, or number | null for arrays with nulls/mixed types (when removeNA=false, the default).

### Signature

```typescript
s.min(values: number[]): number | s.min(values: (number | null)[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers (or array with nulls)
- removeNA: If true, guarantees number return; if false (default), may return null

### Returns

number for clean arrays, number | null for arrays with nulls

### Examples

```typescript
s.min([1, 2, 3, 4, 5]) // 1 (number)
s.min(df.price) // number (if df.price is clean)
s.min([1, null, 3]) // 1 (number | null - may be null if no valid values)
df.groupBy("region").summarize({ min_price: group => s.min(group.price) })
```

### Best Practices

- ✓ GOOD: For clean number arrays, returns number - no assertions needed
- ✓ GOOD: For arrays with nulls, returns number | null - handle null appropriately
- ✓ GOOD: Use removeNA: true if you want guaranteed number return

### Related

`max`, `cummin`, `first`, `last`

---

## s.first

Get the first value from an array. Returns the first element, or null if array is empty. Supports single values, dates, and arrays with nulls (when removeNA=true).

### Signature

```typescript
s.first(values: T[] | T, removeNA?: boolean): T | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of values, single value, or Date
- removeNA: If true, returns first non-null value; if false (default), returns first element (may be null)

### Returns

T | null - First value or null if empty

### Examples

```typescript
s.first([1, 2, 3, 4, 5]) // 1
s.first([null, 2, 3], false) // null
s.first([null, 2, 3], true) // 2
s.first(42) // 42
s.first([new Date('2023-01-01'), new Date('2023-01-02')]) // Date('2023-01-01')
df.summarize({ first_price: group => s.first(group.price) })
```

### Best Practices

- ✓ GOOD: Use for time-series data to get opening values (e.g., OHLC pattern)
- ✓ GOOD: Use removeNA=true to skip nulls at the start
- ✓ GOOD: Works with dates, numbers, and other types

### Related

`last`, `min`, `max`

---

## s.last

Get the last value from an array. Returns the last element, or null if array is empty. Supports single values, dates, and arrays with nulls (when removeNA=true).

### Signature

```typescript
s.last(values: T[] | T, removeNA?: boolean): T | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of values, single value, or Date
- removeNA: If true, returns last non-null value; if false (default), returns last element (may be null)

### Returns

T | null - Last value or null if empty

### Examples

```typescript
s.last([1, 2, 3, 4, 5]) // 5
s.last([1, 2, null], false) // null
s.last([1, 2, null], true) // 2
s.last(42) // 42
s.last([new Date('2023-01-01'), new Date('2023-01-02')]) // Date('2023-01-02')
df.summarize({ last_price: group => s.last(group.price) })
```

### Best Practices

- ✓ GOOD: Use for time-series data to get closing values (e.g., OHLC pattern)
- ✓ GOOD: Use removeNA=true to skip nulls at the end
- ✓ GOOD: Works with dates, numbers, and other types

### Related

`first`, `min`, `max`

---

## s.mode

Calculate the mode (most frequent value) of an array. Returns null if no valid values and removeNA=false.

### Signature

```typescript
s.mode(values: number[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers or single number
- removeNA: If true, guarantees a number return (throws if no valid values)

### Returns

number | null

### Examples

```typescript
s.mode(42) // Always returns the single value
s.mode([1, 1, 2, 3, 3, 3]) // 3 (always number for clean array)
s.mode([null, 2, 3], false) // 3 (or null if no valid values)
s.mode([null, 2, 3], true) // 3 (guaranteed number or throws)
```

### Related

`mean`, `median`, `unique`

---

## s.stdev

Calculate the sample standard deviation of an array of values. Returns null if insufficient data or removeNA=false with mixed types. Can be chained with s.round() without assertions.

### Signature

```typescript
s.stdev(values: number[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers or single number
- removeNA: If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays

### Returns

number | null

### Examples

```typescript
s.stdev(42) // Always returns 0 for single value
s.stdev([1, 2, 3, 4, 5]) // sample standard deviation (default)
s.stdev([1, "2", 3], true) // 1.41... (std dev of [1, 3] with removeNA=true)
s.stdev([1, "2", 3], false) // null (mixed types, removeNA=false)
// Chain with s.round() - no assertions needed!
df.groupBy("region").summarize({ std: group => s.round(s.stdev(group.sales), 2) })
```

### Best Practices

- ✓ GOOD: Chain with s.round() directly: s.round(s.stdev(values), 2) - no assertions needed
- ✓ GOOD: s.round() handles null at runtime, so no need for s.round(s.stdev(values)!, 2)

### Anti-patterns

- ❌ BAD: s.round(s.stdev(values)!, 2) // Unnecessary - s.round() handles null at runtime

### Related

`variance`, `mean`, `round`

---

## s.variance

Calculate the sample variance of an array of values (uses N-1 denominator). Returns null if insufficient data.

### Signature

```typescript
s.variance(values: number[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers or single number
- removeNA: If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays

### Returns

number | null

### Examples

```typescript
s.variance(42) // Always returns 0 for single value
s.variance([1, 2, 3, 4, 5]) // sample variance (default)
s.variance([1, "2", 3], true) // 1 (variance of [1, 3] with removeNA=true)
s.variance([1, "2", 3], false) // null (mixed types, removeNA=false)
```

### Related

`sd`, `mean`

---

## s.quantile

Calculate quantiles of an array of values. Uses R's Type 7 algorithm (default). Accepts single probability or array of probabilities.

### Signature

```typescript
s.quantile(data: number[], probs: number | number[], removeNA?: boolean): number | number[] | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- data: Array of numbers or single number
- probs: Probability value(s) between 0 and 1
- removeNA: If true, removes non-numeric values; if false, returns null for mixed types

### Returns

number | number[] | null - Single value or array depending on probs input

### Examples

```typescript
const q50 = s.quantile([1, 2, 3, 4, 5], 0.5) // 3 (median)
const [q25, q75] = s.quantile([1, 2, 3, 4, 5], [0.25, 0.75]) // [2, 4]
```

### Related

`median`, `quartiles`, `iqr`

---

## s.quartiles

Calculate the quartiles (Q25, median/Q50, Q75) of values. Returns null if no valid values.

### Signature

```typescript
s.quartiles(values: number[], removeNA?: boolean): [number, number, number] | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers or values that can contain null/undefined, or single number
- removeNA: If true, removes non-numeric values; if false, returns null for mixed types

### Returns

[Q25, Q50, Q75] tuple or null

### Examples

```typescript
s.quartiles(42) // Always returns [42, 42, 42] for single value
const [q25, q50, q75] = s.quartiles([1, 2, 3, 4, 5]) // [2, 3, 4]
```

### Related

`quantile`, `iqr`, `median`

---

## s.iqr

Calculate the interquartile range (IQR) of values (Q75 - Q25). Returns null if no valid values.

### Signature

```typescript
s.iqr(values: number[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers or single number
- removeNA: If true, removes non-numeric values; if false, returns null for mixed types

### Returns

number | null

### Examples

```typescript
s.iqr(42) // Always returns 0 for single value
const iqr_val = s.iqr([1, 2, 3, 4, 5]) // 2 (4 - 2)
```

### Related

`quartiles`, `quantile`, `range`

---

## s.range

Calculate the range of values (max - min). Returns null if no valid values.

### Signature

```typescript
s.range(values: number[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers, or single number
- removeNA: If true, removes non-numeric values; if false, returns null for mixed types

### Returns

number | null

### Examples

```typescript
s.range(42) // Always returns 0 for single value
const r = s.range([1, 5, 3, 9, 2]) // 8 (9 - 1)
```

### Related

`max`, `min`, `iqr`

---

## s.product

Calculate the product (multiplication) of all values. Returns null if no valid values.

### Signature

```typescript
s.product(values: number[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers or single number
- removeNA: If true, guarantees a number return (throws if no valid values)

### Returns

number | null

### Examples

```typescript
s.product(5) // 5
s.product([1, 2, 3, 4]) // 24
s.product([2, null, 3], false) // null (due to null)
s.product([2, null, 3], true) // 6 (ignoring null)
```

### Related

`sum`, `cumprod`

---

## s.cumsum

Calculate cumulative sums for an array of values. Returns array where each element is the sum of all previous elements.

### Signature

```typescript
s.cumsum(values: number[], removeNA?: boolean): number | number[] | (number | null)[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers
- removeNA: If true, removes non-numeric values; if false, returns null for mixed types

### Returns

number | number[] | (number | null)[]

### Examples

```typescript
s.cumsum([1, 2, 3, 4, 5]) // [1, 3, 6, 10, 15]
s.cumsum([1, null, 3, 4], true) // [1, 1, 4, 8] - removes nulls
```

### Related

`sum`, `cummean`, `cumprod`

---

## s.cummean

Calculate cumulative mean of values. Returns an array where each element is the mean of all values up to that point.

### Signature

```typescript
s.cummean(values: number[], removeNA?: boolean): number | number[] | (number | null)[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers
- removeNA: If true, removes non-numeric values; if false, returns null for mixed types

### Returns

number | number[] | (number | null)[]

### Examples

```typescript
s.cummean([1, 2, 3, 4])  // [1, 1.5, 2, 2.5]
s.cummean([1, null, 3, 4, 5], true)  // [1, 1, 2, 2.5, 3]
```

### Related

`cumsum`, `mean`, `rolling`

---

## s.rolling

Apply a function over a rolling window of values. Supports both array-based usage and DataFrame column usage (for mutate operations). The window includes the current value and the previous (windowSize - 1) values.

### Signature

```typescript
s.rolling({ column: string, windowSize: number, fn: (window: T[]) => R }): (row, index, df) => R OR s.rolling({ values: T[], windowSize: number, fn: (window: T[]) => R }): R[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- options: Configuration object
-   - column: Column name (for DataFrame operations) OR
-   - values: Array of values (for array-based usage)
-   - windowSize: Size of the rolling window (number of values to include)
-   - fn: Function to apply to each window - receives array of window values, returns single value

### Returns

Array of results (array-based) OR function for mutate operations (column-based)

### Examples

```typescript
// DataFrame column usage
df.mutate({ rolling_mean: s.rolling({ column: "price", windowSize: 3, fn: s.mean }) })
df.mutate({ rolling_sum: s.rolling({ column: "value", windowSize: 2, fn: s.sum }) })
// Array-based usage
s.rolling({ values: [1, 2, 3, 4, 5], windowSize: 3, fn: s.mean }) // [1, 1.5, 2, 3, 4]
// Custom function
df.mutate({ rolling_max: s.rolling({ column: "value", windowSize: 2, fn: (window) => Math.max(...window) }) })
```

### Best Practices

- ✓ GOOD: Use for moving averages, rolling sums, and other window-based calculations
- ✓ GOOD: Window size determines how many previous values to include
- ✓ GOOD: First few values use smaller windows (partial windows)
- ✓ GOOD: Works with any aggregation function (s.mean, s.sum, s.max, s.min, etc.)

### Anti-patterns

- ❌ BAD: Manually slicing arrays and applying functions - use s.rolling() instead

### Related

`cumsum`, `cummean`, `lag`, `lead`

---

## s.cumprod

Calculate cumulative product of numeric values. Returns array where each element is the product of all previous elements.

### Signature

```typescript
s.cumprod(values: number[], removeNA?: boolean): number | number[] | (number | null)[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers
- removeNA: If true, removes non-numeric values; if false, returns null for mixed types

### Returns

number | number[] | (number | null)[]

### Examples

```typescript
s.cumprod([1, 2, 3, 4, 5]) // [1, 2, 6, 24, 120]
s.cumprod([1, null, 3, 4], true) // [1, 1, 3, 12] - removes nulls
```

### Related

`cumsum`, `product`

---

## s.cummax

Calculate cumulative maximum of numeric values. Returns array where each element is the max of all previous elements.

### Signature

```typescript
s.cummax(values: number[], removeNA?: boolean): number | number[] | (number | null)[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers
- removeNA: If true, removes non-numeric values; if false, returns null for mixed types

### Returns

number | number[] | (number | null)[]

### Examples

```typescript
s.cummax([1, 2, 3, 4, 5]) // [1, 2, 3, 4, 5]
s.cummax([1, null, 3, 4], true) // [1, 1, 3, 4] - removes nulls
```

### Related

`cummin`, `max`

---

## s.cummin

Calculate cumulative minimum of numeric values. Returns array where each element is the min of all previous elements.

### Signature

```typescript
s.cummin(values: number[], removeNA?: boolean): number | number[] | (number | null)[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers
- removeNA: If true, removes non-numeric values; if false, returns null for mixed types

### Returns

number | number[] | (number | null)[]

### Examples

```typescript
s.cummin([1, 2, 3, 4, 5]) // [1, 1, 1, 1, 1]
s.cummin([1, null, 3, 4], true) // [1, 1, 1, 1] - removes nulls
```

### Related

`cummax`, `min`

---

## s.lag

Lag values by k positions (shift forward, filling with default). Supports two usage patterns: array-based and column-based (for use in mutate).

### Signature

```typescript
s.lag(values: T[], k?: number, defaultValue?: T): (T | undefined)[] OR s.lag(columnName: string, k?: number, defaultValue?: T): (row, index, df) => T | undefined
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- valuesOrColumnName: Array of values to lag OR column name for DataFrame operations
- k: Number of positions to lag (default: 1)
- defaultValue: Value to fill missing positions (default: undefined)

### Returns

Array with values lagged by k positions OR function for mutate operations

### Examples

```typescript
// Array-based usage
s.lag([1, 2, 3, 4, 5])  // [undefined, 1, 2, 3, 4]
s.lag([1, 2, 3, 4, 5], 2)  // [undefined, undefined, 1, 2, 3]
s.lag([1, 2, 3, 4, 5], 1, 0)  // [0, 1, 2, 3, 4]
// Column-based usage in mutate
df.mutate({ prev_sales: s.lag("sales", 1, 0) })
```

### Related

`lead`

---

## s.lead

Lead values by k positions (shift backward, filling with default). Supports two usage patterns: array-based and column-based (for use in mutate).

### Signature

```typescript
s.lead(values: T[], k?: number, defaultValue?: T): (T | undefined)[] OR s.lead(columnName: string, k?: number, defaultValue?: T): (row, index, df) => T | undefined
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- valuesOrColumnName: Array of values to lead OR column name for DataFrame operations
- k: Number of positions to lead (default: 1)
- defaultValue: Value to fill missing positions (default: undefined)

### Returns

Array with values led by k positions OR function for mutate operations

### Examples

```typescript
// Array-based usage
s.lead([1, 2, 3, 4, 5])  // [2, 3, 4, 5, undefined]
s.lead([1, 2, 3, 4, 5], 2)  // [3, 4, 5, undefined, undefined]
s.lead([1, 2, 3, 4, 5], 1, 0)  // [2, 3, 4, 5, 0]
// Column-based usage in mutate
df.mutate({ next_sales: s.lead("sales", 1, 0) })
```

### Related

`lag`, `forwardFill`, `backwardFill`

---

## s.forwardFill

Forward fill null/undefined values in an array. Replaces null/undefined values with the last non-null value before them. Values at the start that are null/undefined remain null/undefined. Returns a new array with filled values.

### Signature

```typescript
s.forwardFill(values: T[]): T[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of values (may contain null/undefined)

### Returns

T[] - Array with forward-filled values

### Examples

```typescript
s.forwardFill([10, null, null, 20, null]) // [10, 10, 10, 20, 20]
s.forwardFill([10, undefined, null, 20]) // [10, 10, 10, 20]
s.forwardFill([null, null, 10, 20]) // [null, null, 10, 20]
// Use in upsample for filling
df.upsample({ timeColumn: "timestamp", frequency: "1H", fillMethod: "forward" })
// Use with wrapper in rolling
df.mutate({ filled: s.rolling({ column: "value", windowSize: 2, fn: (window) => s.forwardFill(window)[window.length - 1] }) })
```

### Best Practices

- ✓ GOOD: Use for time-series data where you want to carry forward the last known value
- ✓ GOOD: Only fills null and undefined values - other values remain unchanged
- ✓ GOOD: Returns a new array - does not modify the original
- ✓ GOOD: Use with upsample() for filling time-series data

### Anti-patterns

- ❌ BAD: Expecting values at the start to be filled - they remain null/undefined

### Related

`backwardFill`, `lag`, `lead`

---

## s.backwardFill

Backward fill null/undefined values in an array. Replaces null/undefined values with the next non-null value after them. Values at the end that are null/undefined remain null/undefined. Returns a new array with filled values.

### Signature

```typescript
s.backwardFill(values: T[]): T[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of values (may contain null/undefined)

### Returns

T[] - Array with backward-filled values

### Examples

```typescript
s.backwardFill([null, null, 10, null, 20]) // [10, 10, 10, 20, 20]
s.backwardFill([null, undefined, 10, 20]) // [10, 10, 10, 20]
s.backwardFill([10, 20, null, null]) // [10, 20, null, null]
// Use in upsample for filling
df.upsample({ timeColumn: "timestamp", frequency: "1H", fillMethod: "backward" })
// Use with wrapper in downsample
df.downsample({ timeColumn: "timestamp", frequency: "1D", aggregations: { price: (values) => s.backwardFill(values)[values.length - 1] } })
```

### Best Practices

- ✓ GOOD: Use when you want to fill missing values from future observations
- ✓ GOOD: Only fills null and undefined values - other values remain unchanged
- ✓ GOOD: Returns a new array - does not modify the original
- ✓ GOOD: Use with upsample() for filling time-series data

### Anti-patterns

- ❌ BAD: Expecting values at the end to be filled - they remain null/undefined

### Related

`forwardFill`, `lag`, `lead`

---

## s.rank

Calculate ranks for an array of values. Supports finding rank of all values or a specific target value. Handles ties using specified method including dense ranking.

### Signature

```typescript
s.rank(values: number[], ties?: "average" | "min" | "max" | "dense", descending?: boolean): number[] | (number | null)[] OR s.rank(values: number[], target: number): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers
- ties: How to handle ties: "average" (default), "min", "max", "dense"
- descending: Whether to rank in descending order (default: false = ascending)
- target: Optional - The value to find the rank for (returns single rank)

### Returns

number[] for all ranks OR number | null for target rank

### Examples

```typescript
s.rank([3, 1, 4, 1, 5]) // [3, 1.5, 4, 1.5, 5] (average)
s.rank([3, 1, 4, 1, 5], "min") // [3, 1, 4, 1, 5]
s.rank([3, 1, 4, 1, 5], "max") // [3, 2, 4, 2, 5]
s.rank([3, 1, 4, 1, 5], "average", true) // descending order
s.rank([3, 1, 4, 1, 5], 3) // 3 (rank of value 3)
```

### Related

`denseRank`, `percentileRank`

---

## s.denseRank

Calculate dense rank of values (no gaps in ranking). Unlike regular rank, has no gaps after tied values. Supports finding rank of all values or a specific target value.

### Signature

```typescript
s.denseRank(values: T[], options?: { desc?: boolean }): number[] OR s.denseRank(values: T[], target: T, options?: { desc?: boolean }): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of values to rank
- options: Ranking options with desc for descending order (default: false)
- target: Optional - The value to find the dense rank for (returns single rank)

### Returns

number[] for all ranks OR number | null for target rank

### Examples

```typescript
s.denseRank([10, 20, 20, 30])  // [1, 2, 2, 3] (no gap after ties)
s.denseRank([5, 3, 8, 3, 1])   // [3, 2, 4, 2, 1]
s.denseRank([10, 20, 20, 30], { desc: true })  // [4, 3, 3, 1]
```

### Related

`rank`, `percentileRank`

---

## s.percentile_rank

Calculate the percentile rank of a value within an array. Returns a value between 0 and 1 representing the percentile rank. If target is not provided, returns percentile ranks for all values.

### Signature

```typescript
s.percentile_rank(values: number[]): number[] | (number | null)[] OR s.percentile_rank(values: number[], target: number): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers
- target: Optional - The value to find the percentile rank for (between 0 and 1)

### Returns

number | null for single target OR number[] | (number | null)[] for all values

### Examples

```typescript
s.percentile_rank([1, 2, 3, 4, 5], 3) // 0.6 (3 is at 60th percentile)
s.percentile_rank([10, 20, 30, 40, 50], 25) // 0.4 (25 is at 40th percentile)
s.percentile_rank([1, 2, 3, 4, 5]) // [0.2, 0.4, 0.6, 0.8, 1.0]
```

### Related

`rank`, `denseRank`, `quantile`

---

## s.normalize

Normalize values to 0-1 range using min-max normalization or z-score standardization. Supports finding normalized value for all values or a specific target value.

### Signature

```typescript
s.normalize(values: number[], method?: "minmax" | "zscore"): number[] | (number | null)[] OR s.normalize(values: number[], target: number, method?: "minmax" | "zscore"): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers
- method: Normalization method: "minmax" (default) or "zscore"
- target: Optional - The value to find the normalized value for

### Returns

number[] for all values OR number | null for target value

### Examples

```typescript
s.normalize([10, 20, 30]) // [0, 0.5, 1] (min-max normalization)
s.normalize([10, 20, 30], "zscore") // z-scores with mean=0, std=1
s.normalize([10, 20, 30], 20) // 0.5 (20 is halfway between 10 and 30)
s.normalize([10, 20, 30], 20, "zscore") // z-score of 20
```

### Related

`sd`, `mean`

---

## s.round

Round a number or all values in an array to a specified number of decimal places. Accepts null values and returns null when given null (useful for chaining with s.mean(), s.stdev(), s.max(), s.min(), or s.median() which return number | null).

### Signature

```typescript
s.round(value: number | null | number[], digits?: number): number | null | number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- value: Number, null, or array of numbers to round
- digits: Number of decimal places (default: 0)

### Returns

number, null, or number[] (returns null if input is null)

### Examples

```typescript
s.round(3.14159) // 3
s.round(3.14159, 2) // 3.14
s.round(123.456, 1) // 123.5
s.round(123.456, -1) // 120
s.round([1.234, 2.567, 3.891], 2) // [1.23, 2.57, 3.89]
s.round(null) // null (returns null when given null)
// Works with nullable stats functions - no assertions needed!
s.round(s.mean([1, 2, 3]), 2) // 2.0
s.round(s.mean([null, null]), 2) // null (mean returns null, round handles it)
s.round(s.stdev([1, 2, 3]), 2) // 1.0
s.round(s.max([1, null, 3]), 2) // 3.0 (or null if max returns null)
df.groupBy("region").summarize({ avg: group => s.round(s.mean(group.sales), 2) })
```

### Best Practices

- ✓ GOOD: No need for non-null assertions (!) - s.round() accepts null and returns null
- ✓ GOOD: Chain directly: s.round(s.mean(values), 2) - no need for s.round(s.mean(values)!, 2)
- ✓ GOOD: Type-safe chaining: s.round() signature includes null, so TypeScript won't complain
- ✓ GOOD: Works seamlessly with s.mean(), s.stdev(), s.max(), s.min(), s.median() which return number | null

### Related

`mean`, `stdev`, `max`, `min`, `median`

---

## s.percent

Calculate a percentage from a numerator and denominator, rounded to a given number of decimals. Returns 0 when denominator is 0 to handle division-by-zero gracefully. Returns null if either numerator or denominator is null/undefined.

### Signature

```typescript
s.percent(numerator: number | null | undefined, denominator: number | null | undefined, decimals?: number): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- numerator: The portion value
- denominator: The total value
- decimals: Number of decimal places to round to (default: 1)

### Returns

number | null - Percentage (0–100 scale), rounded, or null if inputs are null/undefined

### Examples

```typescript
s.percent(25, 100) // 25.0
s.percent(1, 3) // 33.3
s.percent(2, 3, 2) // 66.67
s.percent(5, 0) // 0 (handles division by zero)
s.percent(0, 100) // 0.0
s.percent(null, 100) // null
```

### Related

`round`

---

## s.unique

Get unique values from an array (WASM-optimized version). Returns unique values in order of first appearance.

### Signature

```typescript
s.unique(values: T[]): T[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of values to get unique values from

### Returns

T[] - array with duplicates removed in order of first appearance

### Examples

```typescript
s.unique([1, 2, 1, 3, 2]) // [1, 2, 3]
s.unique(["a", "b", "a", "c"]) // ["a", "b", "c"]
s.unique([true, false, true]) // [true, false]
```

### Related

`distinct`, `mode`

---

## s.covariance

Calculate the sample covariance between two arrays of values. Arrays must have the same length. Returns null if no valid pairs.

### Signature

```typescript
s.covariance(x: number[], y: number[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- x: First array of numbers
- y: Second array of numbers (same length as x)
- removeNA: If true, guarantees a number return (throws if no valid pairs)

### Returns

number | null

### Examples

```typescript
s.covariance([1, 2, 3], [1, 2, 3]) // 1
s.covariance([1, 2, 3], [3, 2, 1]) // -1
s.covariance([1, null, 3], [1, 2, 3], false) // null (due to null)
s.covariance([1, null, 3], [1, 2, 3], true) // 2 (ignoring null pair)
```

### Related

`s.test.correlation.pearson`, `variance`

---

## s.test.t.oneSample

One-sample t-test. Tests if mean differs from a hypothesized value.

### Signature

```typescript
s.test.t.oneSample({ data, mu, alternative?, alpha? }): TestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- data: Array of numbers
- mu: Hypothesized mean
- alternative: "two-sided" (default), "less", or "greater"
- alpha: Significance level (default: 0.05)

### Returns

TestResult with p_value, test_statistic, confidence_interval, etc.

### Examples

```typescript
s.test.t.oneSample({ data: heights, mu: 170, alternative: "two-sided", alpha: 0.05 })
```

### Related

`s.test.t.independent`, `s.test.t.paired`, `s.compare`

---

## s.compare

Intent-driven statistical testing API. Helps you choose the right test based on your comparison goal.

### Signature

```typescript
s.compare.{scenario}.{test}(...)
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- Scenarios: oneGroup, twoGroups, multiGroups
- Tests: centralTendency, proportions, distribution, association
- Options: parametric/nonparametric/auto, comparator type, alpha

### Returns

TestResult

### Examples

```typescript
s.compare.oneGroup.centralTendency.toValue({ data, hypothesizedValue: 100, parametric: "auto" })
s.compare.twoGroups.centralTendency.toEachOther({ x, y, paired: false, parametric: "parametric" })
s.compare.twoGroups.association.toEachOther({ x, y, method: "pearson" })
```

### Related

`s.test`, `s.dist`

---

## s.dist.normal

Normal (Gaussian) distribution functions.

### Signature

```typescript
s.dist.normal.{function}(...)
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- random({ mean, standardDeviation, sampleSize }): Generate random values
- density({ at, mean, standardDeviation }): PDF at x
- probability({ at, mean, standardDeviation }): CDF (cumulative probability)
- quantile({ probability, mean, standardDeviation }): Inverse CDF (critical value)
- data({ mean, standardDeviation, type: "pdf" | "cdf", range, points }): Generate data for plotting

### Returns

number or number[]

### Examples

```typescript
s.dist.normal.random({ mean: 0, standardDeviation: 1, sampleSize: 100 })
s.dist.normal.probability({ at: 1.96, mean: 0, standardDeviation: 1 }) // ~0.975
s.dist.normal.quantile({ probability: 0.975, mean: 0, standardDeviation: 1 }) // ~1.96
```

### Related

`s.dist.t`, `s.dist.chiSquare`, `s.dist.beta`

---
