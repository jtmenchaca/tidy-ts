# Quantiles

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.quantile](#squantile)
- [s.quartiles](#squartiles)

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
