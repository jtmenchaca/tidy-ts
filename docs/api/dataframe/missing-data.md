# Missing Data

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [replaceNA](#replacena)
- [removeNA](#removena)
- [removeNull](#removenull)
- [removeUndefined](#removeundefined)
- [fillForward](#fillforward)
- [fillBackward](#fillbackward)
- [interpolate](#interpolate)

---

## replaceNA

Replace null/undefined values with fixed values in specified columns.

### Signature

```typescript
replaceNA(mapping: Partial<{ [K in keyof T]: T[K] }>): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- mapping: Object mapping column names to replacement values

### Returns

DataFrame with replaced values

### Examples

```typescript
df.replaceNA({ name: "Unknown", age: 0, score: -1 })
df.replaceNA({ salary: 0 }) // Only replace salary nulls
```

### Best Practices

- ✓ GOOD: Only replaces null and undefined, not other falsy values like 0 or ''
- ✓ GOOD: Can specify different replacements for different columns

### Related

`removeNA`, `removeNull`, `removeUndefined`

---

## removeNA

Remove rows where specified field(s) are null or undefined. Automatically narrows types.

### Signature

```typescript
removeNA(field: keyof T, ...fields: (keyof T)[]): DataFrame<...>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- field: First field to check
- ...fields: Additional fields to check (all must be non-null)

### Returns

DataFrame with narrowed types excluding null/undefined

### Examples

```typescript
df.removeNA("age") // Remove rows with null/undefined age
df.removeNA("age", "name") // Remove rows with null/undefined in either field
```

### Best Practices

- ✓ GOOD: Type-safe - automatically narrows the type to exclude null/undefined
- ✓ GOOD: Can check multiple fields at once

### Related

`removeNull`, `removeUndefined`, `replaceNA`, `filter`

---

## removeNull

Remove rows where specified field(s) are null. Automatically narrows types to exclude null.

### Signature

```typescript
removeNull(field: keyof T, ...fields: (keyof T)[]): DataFrame<...>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- field: First field to check
- ...fields: Additional fields to check

### Returns

DataFrame with type narrowed to exclude null

### Examples

```typescript
df.removeNull("score") // Remove rows with null score
```

### Related

`removeNA`, `removeUndefined`, `replaceNA`

---

## removeUndefined

Remove rows where specified field(s) are undefined. Automatically narrows types to exclude undefined.

### Signature

```typescript
removeUndefined(field: keyof T, ...fields: (keyof T)[]): DataFrame<...>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- field: First field to check
- ...fields: Additional fields to check

### Returns

DataFrame with type narrowed to exclude undefined

### Examples

```typescript
df.removeUndefined("email") // Remove rows with undefined email
```

### Related

`removeNA`, `removeNull`, `replaceNA`

---

## fillForward

Forward fill null/undefined values in specified columns. Replaces null/undefined values with the last non-null value before them. Values at the start that are null/undefined remain null/undefined.

### Signature

```typescript
fillForward(...columnNames: (keyof T & string)[]): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- ...columnNames: Column name(s) to forward fill

### Returns

DataFrame with forward-filled values

### Examples

```typescript
// Forward fill a single column
const df = createDataFrame([
  { value: 10 },
  { value: null },
  { value: null },
  { value: 20 },
  { value: null },
]);
const filled = df.fillForward("value")
// Result:
// { value: 10 }
// { value: 10 }  // filled from previous
// { value: 10 }  // filled from previous
// { value: 20 }
// { value: 20 }  // filled from previous
// Forward fill multiple columns
df.fillForward("price", "volume")
// Common use case: time series with missing values
const timeSeries = createDataFrame([
  { timestamp: new Date("2023-01-01"), price: 100 },
  { timestamp: new Date("2023-01-02"), price: null },
  { timestamp: new Date("2023-01-03"), price: null },
  { timestamp: new Date("2023-01-04"), price: 110 },
]);
timeSeries.fillForward("price")
```

### Best Practices

- ✓ GOOD: Use for time-series data where you want to carry forward the last known value
- ✓ GOOD: Only fills null and undefined values - other values remain unchanged
- ✓ GOOD: Creates a new DataFrame without modifying the original

### Anti-patterns

- ❌ BAD: Expecting values at the start to be filled - they remain null/undefined
- ❌ BAD: Using on non-time-series data where backward fill might be more appropriate

### Related

`fillBackward`, `replaceNA`, `removeNA`

---

## fillBackward

Backward fill null/undefined values in specified columns. Replaces null/undefined values with the next non-null value after them. Values at the end that are null/undefined remain null/undefined.

### Signature

```typescript
fillBackward(...columnNames: (keyof T & string)[]): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- ...columnNames: Column name(s) to backward fill

### Returns

DataFrame with backward-filled values

### Examples

```typescript
// Backward fill a single column
const df = createDataFrame([
  { value: null },
  { value: null },
  { value: 10 },
  { value: null },
  { value: 20 },
]);
const filled = df.fillBackward("value")
// Result:
// { value: 10 }  // filled from next
// { value: 10 }  // filled from next
// { value: 10 }
// { value: 20 }  // filled from next
// { value: 20 }
// Backward fill multiple columns
df.fillBackward("price", "volume")
// Common use case: time series with missing values
const timeSeries = createDataFrame([
  { timestamp: new Date("2023-01-01"), price: null },
  { timestamp: new Date("2023-01-02"), price: null },
  { timestamp: new Date("2023-01-03"), price: 100 },
  { timestamp: new Date("2023-01-04"), price: null },
]);
timeSeries.fillBackward("price")
```

### Best Practices

- ✓ GOOD: Use when you want to fill missing values from future observations
- ✓ GOOD: Only fills null and undefined values - other values remain unchanged
- ✓ GOOD: Creates a new DataFrame without modifying the original

### Anti-patterns

- ❌ BAD: Expecting values at the end to be filled - they remain null/undefined
- ❌ BAD: Using on non-time-series data where forward fill might be more appropriate

### Related

`fillForward`, `replaceNA`, `removeNA`

---

## interpolate

Interpolate null/undefined values in a column using linear or spline interpolation. Requires an x-axis column to define spacing between points. Interpolates missing values by estimating them based on surrounding known values.

### Signature

```typescript
interpolate<ValueCol extends keyof T & string, XCol extends keyof T & string>(valueColumn: ValueCol, xColumn: XCol, method: 'linear' | 'spline'): DataFrame<T>
```

### Import

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- valueColumn: Column name containing values to interpolate (numbers or Dates)
- xColumn: Column name containing x-axis values (numeric or Date, required)
- method: Interpolation method - 'linear' or 'spline'

### Returns

DataFrame with interpolated values replacing nulls

### Examples

```typescript
// Linear interpolation with numeric x-axis
const df = createDataFrame([
  { timestamp: 1, value: 100 },
  { timestamp: 2, value: null },
  { timestamp: 3, value: null },
  { timestamp: 4, value: 200 },
]);
df.interpolate("value", "timestamp", "linear")
// Results in interpolated values for the null entries
// Linear interpolation with Date x-axis
df.interpolate("price", "date", "linear")
// Spline interpolation
df.interpolate("temperature", "timestamp", "spline")
// Common use case: time series with missing values
const timeSeries = createDataFrame([
  { timestamp: new Date("2023-01-01"), price: 100 },
  { timestamp: new Date("2023-01-02"), price: null },
  { timestamp: new Date("2023-01-03"), price: null },
  { timestamp: new Date("2023-01-04"), price: 110 },
]);
timeSeries.interpolate("price", "timestamp", "linear")
```

### Best Practices

- ✓ GOOD: Use for time-series data where you want to estimate missing values based on surrounding data
- ✓ GOOD: Linear interpolation is faster and works with fewer points
- ✓ GOOD: Spline interpolation provides smoother curves but requires at least 4 points
- ✓ GOOD: Only interpolates values that have both previous and next non-null values

### Anti-patterns

- ❌ BAD: Expecting leading/trailing nulls to be interpolated - they remain null (no bounds)
- ❌ BAD: Using spline with fewer than 4 points - falls back to linear

### Related

`fillForward`, `fillBackward`, `upsample`

---
