# Spread

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.sd](#ssd)
- [s.variance](#svariance)
- [s.range](#srange)
- [s.iqr](#siqr)

---

## s.sd

Calculate the sample standard deviation of an array of values. Returns null if insufficient data. Type inference narrows return type based on removal options.

### Signature

```typescript
s.sd(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers or single number
- options.removeNull: If true, skips null values
- options.removeUndefined: If true, skips undefined values
- options.removeNaN: If true, skips NaN values

### Returns

number | null

### Examples

```typescript
s.sd(42) // 0 (single value)
s.sd([1, 2, 3, 4, 5]) // sample standard deviation
s.sd([1, null, 3], { removeNull: true }) // std dev of [1, 3]
s.sd([1, NaN, 3], { removeNaN: true }) // std dev of [1, 3]
df.groupBy("region").summarize({ std: group => s.sd(group.sales) })
```

### Related

`variance`, `mean`, `round`

---

## s.variance

Calculate the sample variance of an array of values (uses N-1 denominator). Returns null if insufficient data. Type inference narrows return type based on removal options.

### Signature

```typescript
s.variance(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers or single number
- options.removeNull: If true, skips null values
- options.removeUndefined: If true, skips undefined values
- options.removeNaN: If true, skips NaN values

### Returns

number | null

### Examples

```typescript
s.variance(42) // 0 (single value)
s.variance([1, 2, 3, 4, 5]) // sample variance
s.variance([1, null, 3], { removeNull: true }) // variance of [1, 3]
s.variance([1, NaN, 3], { removeNaN: true }) // variance of [1, 3]
```

### Related

`sd`, `mean`

---

## s.range

Calculate the range of values (max - min). Returns null if no valid values. Type inference narrows return type based on removal options.

### Signature

```typescript
s.range(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers, or single number
- options.removeNull: If true, skips null values
- options.removeUndefined: If true, skips undefined values
- options.removeNaN: If true, skips NaN values

### Returns

number | null

### Examples

```typescript
s.range(42) // 0 (single value)
s.range([1, 5, 3, 9, 2]) // 8 (9 - 1)
s.range([1, null, 9], { removeNull: true }) // 8
```

### Related

`max`, `min`, `iqr`

---

## s.iqr

Calculate the interquartile range (IQR) of values (Q75 - Q25). Returns null if no valid values. Type inference narrows return type based on removal options.

### Signature

```typescript
s.iqr(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers or single number
- options.removeNull: If true, skips null values
- options.removeUndefined: If true, skips undefined values
- options.removeNaN: If true, skips NaN values

### Returns

number | null

### Examples

```typescript
s.iqr(42) // 0 (single value)
s.iqr([1, 2, 3, 4, 5]) // 2 (Q75 - Q25 = 4 - 2)
s.iqr([1, null, 5], { removeNull: true }) // IQR of [1, 5]
s.iqr([1, NaN, 5], { removeNaN: true }) // IQR of [1, 5]
```

### Related

`quartiles`, `quantile`, `range`

---
