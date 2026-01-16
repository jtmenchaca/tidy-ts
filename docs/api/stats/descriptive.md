# Descriptive

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.mean](#smean)
- [s.median](#smedian)
- [s.sum](#ssum)
- [s.max](#smax)
- [s.min](#smin)
- [s.first](#sfirst)
- [s.last](#slast)
- [s.mode](#smode)
- [s.product](#sproduct)

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
