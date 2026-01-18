# Correlation

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.covariance](#scovariance)
- [s.pearson](#spearson)
- [s.spearman](#sspearman)

---

## s.covariance

Calculate the sample covariance between two arrays of values. Arrays must have the same length. Returns null if no valid pairs. Type inference narrows return type based on removal options.

### Signature

```typescript
s.covariance(x: number[], y: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- x: First array of numbers
- y: Second array of numbers (same length as x)
- options.removeNull: If true, skips pairs where either value is null
- options.removeUndefined: If true, skips pairs where either value is undefined
- options.removeNaN: If true, skips pairs where either value is NaN

### Returns

number | null

### Examples

```typescript
s.covariance([1, 2, 3], [1, 2, 3]) // 1
s.covariance([1, 2, 3], [3, 2, 1]) // -1
s.covariance([1, null, 3], [1, 2, 3]) // null (null present)
s.covariance([1, null, 3], [1, 2, 3], { removeNull: true }) // covariance of pairs (1,1) and (3,3)
s.covariance([1, NaN, 3], [1, 2, 3], { removeNaN: true }) // covariance of pairs (1,1) and (3,3)
// From DataFrame columns
const df = createDataFrame([
  { height: 170, weight: 70 },
  { height: 180, weight: 85 },
  { height: 165, weight: 60 },
]);
const cov = s.covariance(
  df.extract("height"),
  df.extract("weight")
);
```

### Related

`s.test.correlation.pearson`, `variance`, `extract`

---

## s.pearson

Calculate the Pearson correlation coefficient between two numeric arrays. Returns a value between -1 (perfect negative correlation) and 1 (perfect positive correlation). Returns null if calculation is not possible.

### Signature

```typescript
s.pearson(x: number[], y: number[]): number | null
```

### Import

```typescript
import { stats as s, createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- x: First array of numbers
- y: Second array of numbers (same length as x)

### Returns

number | null - Pearson correlation coefficient

### Examples

```typescript
// Perfect positive correlation
s.pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]) // 1.0
// Perfect negative correlation
s.pearson([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]) // -1.0
// No correlation
s.pearson([1, 2, 3, 4, 5], [3, 1, 4, 1, 5]) // ~0
// From DataFrame columns - COMMON PATTERN
const df = createDataFrame([
  { height: 170, weight: 70, age: 25 },
  { height: 180, weight: 85, age: 30 },
  { height: 165, weight: 60, age: 22 },
  { height: 175, weight: 75, age: 28 },
  { height: 185, weight: 90, age: 35 },
]);

// Extract columns and calculate correlation
const r = s.pearson(
  df.extract("height"),
  df.extract("weight")
);
console.log(`Height-Weight correlation: ${r}`); // ~0.98
// Multiple correlations from same DataFrame
const heightWeight = s.pearson(df.extract("height"), df.extract("weight"));
const heightAge = s.pearson(df.extract("height"), df.extract("age"));
const weightAge = s.pearson(df.extract("weight"), df.extract("age"));
```

### Best Practices

- ✓ GOOD: Use df.extract('column') to get numeric arrays from DataFrame
- ✓ GOOD: Use s.pearson for quick correlation coefficient only
- ✓ GOOD: Use s.test.correlation.pearson for full hypothesis test with p-value
- ✓ GOOD: Check for at least 3 observations

### Anti-patterns

- ❌ BAD: Using Pearson on non-linear relationships
- ❌ BAD: Interpreting correlation as causation
- ❌ BAD: Using on ranked/ordinal data (use Spearman instead)

### Related

`s.test.correlation.pearson`, `s.spearman`, `s.covariance`, `extract`

---

## s.spearman

Calculate Spearman's rank correlation coefficient. Measures monotonic (not necessarily linear) relationships. More robust to outliers than Pearson.

### Signature

```typescript
s.spearman(x: number[], y: number[]): number | null
```

### Import

```typescript
import { stats as s, createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- x: First array of numbers
- y: Second array of numbers (same length as x)

### Returns

number | null - Spearman's rho

### Examples

```typescript
s.spearman([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]) // 1.0
// From DataFrame columns
const rho = s.spearman(
  df.extract("satisfaction_rank"),
  df.extract("loyalty_score")
);
```

### Best Practices

- ✓ GOOD: Use for monotonic relationships
- ✓ GOOD: Use when data has outliers
- ✓ GOOD: Use for ordinal data

### Related

`s.test.correlation.spearman`, `s.pearson`, `extract`

---
