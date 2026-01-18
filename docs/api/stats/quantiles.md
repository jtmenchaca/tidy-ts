# Quantiles

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.quantile](#squantile)
- [s.quartiles](#squartiles)

---

## s.quantile

Calculate quantiles of an array of values. Uses R's Type 7 algorithm (default). Accepts single probability or array of probabilities. Type inference narrows return type based on removal options.

### Signature

```typescript
s.quantile(data: number[], probs: number | number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | number[] | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- data: Array of numbers or single number
- probs: Probability value(s) between 0 and 1
- options.removeNull: If true, skips null values
- options.removeUndefined: If true, skips undefined values
- options.removeNaN: If true, skips NaN values

### Returns

number | number[] | null - Single value or array depending on probs input

### Examples

```typescript
s.quantile([1, 2, 3, 4, 5], 0.5) // 3 (median)
s.quantile([1, 2, 3, 4, 5], [0.25, 0.75]) // [2, 4]
s.quantile([1, null, 5], 0.5) // null (null present)
s.quantile([1, null, 5], 0.5, { removeNull: true }) // 3
s.quantile([1, NaN, 5], 0.5, { removeNaN: true }) // 3
```

### Related

`median`, `quartiles`, `iqr`

---

## s.quartiles

Calculate the quartiles (Q25, median/Q50, Q75) of values. Returns null if no valid values. Type inference narrows return type based on removal options.

### Signature

```typescript
s.quartiles(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): [number, number, number] | null
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

[Q25, Q50, Q75] tuple or null

### Examples

```typescript
s.quartiles(42) // [42, 42, 42] (single value)
s.quartiles([1, 2, 3, 4, 5]) // [2, 3, 4]
s.quartiles([1, null, 5]) // null (null present)
s.quartiles([1, null, 5], { removeNull: true }) // quartiles of [1, 5]
s.quartiles([1, NaN, 5], { removeNaN: true }) // quartiles of [1, 5]
```

### Related

`quantile`, `iqr`, `median`

---
