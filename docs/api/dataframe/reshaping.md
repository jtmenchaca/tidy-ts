# Reshaping

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [pivotLonger](#pivotlonger)
- [pivotWider](#pivotwider)
- [transpose](#transpose)
- [unnest](#unnest)
- [bindRows](#bindrows)
- [concatDataFrames](#concatdataframes)

---

## pivotLonger

Convert wide data to long format.

### Signature

```typescript
pivotLonger<Cols>({ cols, names_to, values_to }: PivotLongerSpec): DataFrame<...>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- cols: Column names to pivot
- names_to: Name for new column containing old column names
- values_to: Name for new column containing values

### Returns

DataFrame in long format

### Examples

```typescript
df.pivotLonger({ cols: ["math", "science", "english"], names_to: "subject", values_to: "score" })
```

### Related

`pivotWider`, `transpose`

---

## pivotWider

Convert long data to wide format.

### Signature

```typescript
pivotWider<T>({ names_from, values_from, expected_columns }: PivotWiderSpec): DataFrame<...>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- names_from: Column containing new column names
- values_from: Column containing values to spread
- expected_columns: Array of expected column names (for type safety)

### Returns

DataFrame in wide format

### Examples

```typescript
df.pivotWider({ names_from: "product", values_from: "sales", expected_columns: ["Widget A", "Widget B"] })
```

### Related

`pivotLonger`, `transpose`

---

## transpose

Transpose rows and columns. Rows become columns and columns become rows.

### Signature

```typescript
transpose(expectedRows: number): DataFrame<...>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- expectedRows: Number of expected rows after transpose

### Returns

Transposed DataFrame

### Examples

```typescript
df.transpose(3) // Transpose with 3 expected rows
```

### Related

`pivotWider`, `pivotLonger`

---

## unnest

Unnest array columns into individual rows. Each array element becomes its own row, with other columns duplicated. Empty arrays become rows with null for the unnested column. Type-safe - only accepts columns containing arrays.

### Signature

```typescript
unnest<Col extends ArrayColumns<T>>(column: Col): DataFrame<T with Col: ElementType | null>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column: Name of array column to unnest (type-checked at compile time)

### Returns

DataFrame where array elements are spread into individual rows, array column type becomes ElementType | null

### Examples

```typescript
// Basic usage
const df = createDataFrame([
  { id: 1, tags: ["admin", "user"] },
  { id: 2, tags: ["user"] },
  { id: 3, tags: [] }
]);

df.unnest("tags")
// Result:
// { id: 1, tags: "admin" }
// { id: 1, tags: "user" }
// { id: 2, tags: "user" }
// { id: 3, tags: null }
// Unnest with preserved columns
df.unnest("vitamins")
// All other columns are duplicated for each array element
// Sequential unnesting (flatten nested arrays)
const nested = createDataFrame([{ id: 1, matrix: [[1, 2], [3, 4]] }]);
nested.unnest("matrix").unnest("matrix")
// First: { id: 1, matrix: [1, 2] }, { id: 1, matrix: [3, 4] }
// Then:  { id: 1, matrix: 1 }, { id: 1, matrix: 2 }, ...
// Type safety - compile error on non-array columns
df.unnest("name") // ❌ TypeScript error: name is not an array column
```

### Best Practices

- ✓ GOOD: Only works on array columns - TypeScript enforces this at compile time
- ✓ GOOD: Empty arrays preserve the row with null value (matches R's tidyr behavior)
- ✓ GOOD: Chain unnest() calls to flatten nested arrays (e.g., number[][])
- ✓ GOOD: Other columns are automatically duplicated for each array element
- ✓ GOOD: Return type correctly shows Column: ElementType | null
- ✓ GOOD: Use mutate first if you need to extract nested arrays from objects

### Anti-patterns

- ❌ BAD: Trying to unnest non-array columns - use mutate to extract first
- ❌ BAD: Unnesting object columns directly - objects aren't arrays

### Related

`pivotLonger`, `mutate`, `filter`

---

## bindRows

Bind multiple DataFrames by rows (vertical stacking). Handles different column sets gracefully.

### Signature

```typescript
bindRows(...dataframes: DataFrame<any>[]): DataFrame<...>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- ...dataframes: DataFrames to stack vertically

### Returns

Combined DataFrame

### Examples

```typescript
df1.bindRows(df2, df3) // Stack 3 DataFrames
df1.bindRows(df2) // Combine two DataFrames
```

### Best Practices

- ✓ GOOD: Automatically handles missing columns - fills with undefined
- ✓ GOOD: Preserves all columns from all DataFrames

### Related

`concatDataFrames`, `append`, `prepend`

---

## concatDataFrames

Standalone function to concatenate an array of DataFrames by rows (vertical binding). Similar to pandas concat or tidyverse's bind_rows.

### Signature

```typescript
concatDataFrames(dataframes: DataFrame<any>[]): DataFrame<...>
```

### Import

```typescript
import { concatDataFrames } from "@tidy-ts/dataframe";
```

### Parameters

- dataframes: Array of DataFrames to combine

### Returns

Combined DataFrame with all rows stacked vertically

### Examples

```typescript
const combined = concatDataFrames([df1, df2, df3])
const dataFrames = [df1, df2, df3]; const result = concatDataFrames(dataFrames)
```

### Best Practices

- ✓ GOOD: Use when you have an array of DataFrames to combine
- ✓ GOOD: Automatically handles different column sets - fills with undefined
- ✓ GOOD: More convenient than df1.bindRows(...rest) when working with arrays

### Related

`bindRows`

---
