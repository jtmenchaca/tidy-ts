# Spread

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.stdev](#sstdev)
- [s.variance](#svariance)
- [s.range](#srange)
- [s.iqr](#siqr)

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
