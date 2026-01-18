# Cumulative

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.cumsum](#scumsum)
- [s.cummean](#scummean)
- [s.cumprod](#scumprod)
- [s.cummax](#scummax)
- [s.cummin](#scummin)

---

## s.cumsum

Calculate cumulative sums for an array of values. Returns array where each element is the sum of all previous elements. Type inference narrows return type based on input array type and removal options.

### Signature

```typescript
s.cumsum(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers (or array with nulls/undefined)
- options.removeNull: If true, skips null values in accumulation
- options.removeUndefined: If true, skips undefined values in accumulation
- options.removeNaN: If true, skips NaN values (otherwise NaN propagates)

### Returns

number[] for clean arrays; (number | null)[] for nullable arrays without removal flags

### Examples

```typescript
s.cumsum([1, 2, 3, 4, 5]) // [1, 3, 6, 10, 15]
s.cumsum([1, null, 3, 4]) // [null, null, null, null] - null propagates
s.cumsum([1, null, 3, 4], { removeNull: true }) // [1, 1, 4, 8]
s.cumsum([1, NaN, 3], { removeNaN: true }) // [1, 1, 4]
```

### Related

`sum`, `cummean`, `cumprod`

---

## s.cummean

Calculate cumulative mean of values. Returns an array where each element is the mean of all values up to that point.

### Signature

```typescript
s.cummean(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers (or array with nulls/undefined)
- options.removeNull: If true, skips null values in mean calculation
- options.removeUndefined: If true, skips undefined values
- options.removeNaN: If true, skips NaN values

### Returns

number[] for clean arrays; (number | null)[] for nullable arrays without removal flags

### Examples

```typescript
s.cummean([1, 2, 3, 4])  // [1, 1.5, 2, 2.5]
s.cummean([1, null, 3, 4, 5], { removeNull: true })  // [1, 1, 2, 2.67, 3.25]
```

### Related

`cumsum`, `mean`, `rolling`

---

## s.cumprod

Calculate cumulative product of numeric values. Returns array where each element is the product of all previous elements.

### Signature

```typescript
s.cumprod(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers (or array with nulls/undefined)
- options.removeNull: If true, skips null values in product calculation
- options.removeUndefined: If true, skips undefined values
- options.removeNaN: If true, skips NaN values

### Returns

number[] for clean arrays; (number | null)[] for nullable arrays without removal flags

### Examples

```typescript
s.cumprod([1, 2, 3, 4, 5]) // [1, 2, 6, 24, 120]
s.cumprod([1, null, 3, 4], { removeNull: true }) // [1, 1, 3, 12]
```

### Related

`cumsum`, `product`

---

## s.cummax

Calculate cumulative maximum of numeric values. Returns array where each element is the max of all previous elements.

### Signature

```typescript
s.cummax(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers (or array with nulls/undefined)
- options.removeNull: If true, skips null values
- options.removeUndefined: If true, skips undefined values
- options.removeNaN: If true, skips NaN values

### Returns

number[] for clean arrays; (number | null)[] for nullable arrays without removal flags

### Examples

```typescript
s.cummax([1, 3, 2, 5, 4]) // [1, 3, 3, 5, 5]
s.cummax([1, null, 3, 4], { removeNull: true }) // [1, 1, 3, 4]
```

### Related

`cummin`, `max`

---

## s.cummin

Calculate cumulative minimum of numeric values. Returns array where each element is the min of all previous elements.

### Signature

```typescript
s.cummin(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of numbers (or array with nulls/undefined)
- options.removeNull: If true, skips null values
- options.removeUndefined: If true, skips undefined values
- options.removeNaN: If true, skips NaN values

### Returns

number[] for clean arrays; (number | null)[] for nullable arrays without removal flags

### Examples

```typescript
s.cummin([5, 3, 4, 1, 2]) // [5, 3, 3, 1, 1]
s.cummin([3, null, 1, 4], { removeNull: true }) // [3, 3, 1, 1]
```

### Related

`cummax`, `min`

---
