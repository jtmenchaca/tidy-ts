# Extraction

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [extract](#extract)
- [extractHead](#extracthead)
- [extractTail](#extracttail)
- [extractNth](#extractnth)
- [extractSample](#extractsample)
- [extractUnique](#extractunique)
- [sliceHead](#slicehead)
- [sliceTail](#slicetail)
- [sliceMax](#slicemax)
- [sliceMin](#slicemin)
- [sliceSample](#slicesample)

---

## extract

Extract a single column as an array. Similar to R's pull() function.

### Signature

```typescript
extract<K extends keyof T>(column: K): T[K][]
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column: Column name to extract

### Returns

Array of values from the specified column

### Examples

```typescript
const ages = df.extract('age') // [25, 30, 35]
const names = df.extract('name')
```

### Best Practices

- ✓ GOOD: Use df.columnName for direct property access in most cases
- ✓ GOOD: Use extract() when you need the values as a standalone array

### Related

`extractHead`, `extractTail`, `extractNth`, `select`

---

## extractHead

Extract first value(s) from a column. Returns single value if n=1, array if n>1.

### Signature

```typescript
extractHead<K extends keyof T>(column: K, n: number): T[K] | T[K][]
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column: Column name to extract from
- n: Number of values (1 returns single value, >1 returns array)

### Returns

Single value (n=1) or array (n>1)

### Examples

```typescript
const topName = df.sliceMax("score", 1).extractHead("name", 1) // "Alice"
const topNames = df.arrange("score", "desc").extractHead("name", 3) // ["Alice", "Bob", "Carol"]
```

### Related

`extractTail`, `extract`, `sliceHead`

---

## extractTail

Extract last value(s) from a column. Returns single value if n=1, array if n>1.

### Signature

```typescript
extractTail<K extends keyof T>(column: K, n: number): T[K] | T[K][]
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column: Column name to extract from
- n: Number of values (1 returns single value, >1 returns array)

### Returns

Single value (n=1) or array (n>1)

### Examples

```typescript
const lastName = df.arrange("date").extractTail("name", 1) // "Eve"
const recentNames = df.arrange("date").extractTail("name", 2) // ["David", "Eve"]
```

### Related

`extractHead`, `extract`, `sliceTail`

---

## extractNth

Extract value at specific index from a column (0-based). Returns undefined if out of bounds.

### Signature

```typescript
extractNth<K extends keyof T>(column: K, index: number): T[K] | undefined
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column: Column name to extract from
- index: 0-based index

### Returns

Value at index or undefined

### Examples

```typescript
const topScore = df.sliceMax("score", 1).extractNth("name", 0) // "Alice"
```

### Related

`extract`, `extractHead`

---

## extractSample

Extract n random values from a column. Sampling without replacement.

### Signature

```typescript
extractSample<K extends keyof T>(column: K, n: number): T[K][]
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column: Column name to extract from
- n: Number of random values to extract

### Returns

Array of n random values

### Examples

```typescript
const randomNames = df.extractSample("name", 3) // ["Bob", "Alice", "David"]
```

### Related

`sliceSample`, `extract`

---

## extractUnique

Extract unique values from a column. Equivalent to [...new Set(df.extract(column))].

### Signature

```typescript
extractUnique<K extends keyof T>(column: K): T[K][]
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column: Column name to extract unique values from

### Returns

Array of unique values

### Examples

```typescript
const uniqueCategories = df.extractUnique("category") // ["A", "B", "C"]
const uniqueAges = df.extractUnique("age") // [25, 30, 35]
```

### Related

`extract`, `distinct`

---

## sliceHead

Select first n rows. For grouped data, selects first n rows from each group.

### Signature

```typescript
sliceHead(n: number): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- n: Number of rows to select from the beginning

### Returns

DataFrame<T>

### Examples

```typescript
df.sliceHead(3) // First 3 rows
df.groupBy("cyl").sliceHead(2) // First 2 rows per group
```

### Related

`sliceTail`, `slice`, `sliceMax`, `sliceMin`

---

## sliceTail

Select last n rows. For grouped data, selects last n rows from each group.

### Signature

```typescript
sliceTail(n: number): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- n: Number of rows to select from the end

### Returns

DataFrame<T>

### Examples

```typescript
df.sliceTail(2) // Last 2 rows
df.groupBy("cyl").sliceTail(1) // Last row per group
```

### Related

`sliceHead`, `slice`, `sliceMax`, `sliceMin`

---

## sliceMax

Select n rows with highest values in specified column. Sorts descending by column.

### Signature

```typescript
sliceMax(column: keyof T, n: number): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column: Column to sort by
- n: Number of rows to select

### Returns

DataFrame<T>

### Examples

```typescript
df.sliceMax("hp", 3) // 3 rows with highest hp
df.groupBy("cyl").sliceMax("hp", 1) // Highest hp per group
```

### Related

`sliceMin`, `sliceHead`, `arrange`

---

## sliceMin

Select n rows with lowest values in specified column. Sorts ascending by column.

### Signature

```typescript
sliceMin(column: keyof T, n: number): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column: Column to sort by
- n: Number of rows to select

### Returns

DataFrame<T>

### Examples

```typescript
df.sliceMin("mpg", 2) // 2 rows with lowest mpg
df.groupBy("cyl").sliceMin("mpg", 1) // Lowest mpg per group
```

### Related

`sliceMax`, `sliceHead`, `arrange`

---

## sliceSample

Select n random rows. Uses Fisher-Yates shuffle. For grouped data, samples within each group.

### Signature

```typescript
sliceSample(n: number, seed?: number): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- n: Number of random rows to select
- seed: Optional seed for reproducibility

### Returns

DataFrame<T>

### Examples

```typescript
df.sliceSample(3) // 3 random rows
df.sliceSample(5, 42) // 5 random rows with seed
df.groupBy("cyl").sliceSample(2) // 2 random rows per group
```

### Related

`sliceHead`, `shuffle`

---
