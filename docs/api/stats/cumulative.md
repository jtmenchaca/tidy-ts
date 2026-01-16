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
