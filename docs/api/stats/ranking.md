# Ranking

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.rank](#srank)
- [s.denseRank](#sdenserank)
- [s.percentile_rank](#spercentile_rank)

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
