# Selection

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [select](#select)
- [drop](#drop)
- [filter](#filter)
- [slice](#slice)

---

## select

Select specific columns from the DataFrame.

### Signature

```typescript
select<K extends keyof T>(...columns: K[]): DataFrame<Pick<T, K>>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- ...columns: Column names to keep

### Returns

DataFrame with only selected columns

### Examples

```typescript
df.select("name", "age")
df.select("region", "revenue")
```

### Related

`drop`, `mutate`

---

## drop

Remove specific columns from the DataFrame.

### Signature

```typescript
drop<K extends keyof T>(...columns: K[]): DataFrame<Omit<T, K>>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- ...columns: Column names to remove

### Returns

DataFrame without dropped columns

### Examples

```typescript
df.drop("id", "temp_field")
```

### Related

`select`, `mutate`

---

## filter

Filter rows based on a condition. Supports both sync and async predicates.

### Signature

```typescript
filter(predicate: (row: T, index: number) => boolean | Promise<boolean>): DataFrame<T> | PromisedDataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- predicate: Function that returns true to keep the row, false to remove it
- predicate receives: (row, index)

### Returns

DataFrame (sync) or PromisedDataFrame (async)

### Examples

```typescript
df.filter(row => row.age > 25)
df.filter(row => row.region === "North" && row.quantity > 10)
await df.filter(async row => await isValid(row.id))
// Filter and select chained together
const sales = createDataFrame([
  { region: "North", revenue: 1000, cost: 800, profit: 200 },
  { region: "South", revenue: 1500, cost: 1200, profit: 300 },
  { region: "North", revenue: 800, cost: 900, profit: -100 },
]);

// Filter to profitable rows, then select only region and profit
const profitable = sales
  .filter(row => row.profit > 0)
  .select("region", "profit");
// Result: Only profitable rows with region and profit columns
// Filter numeric column condition, then select two columns
const data = createDataFrame([
  { id: 1, age: 25, score: 85, status: "active" },
  { id: 2, age: 30, score: 92, status: "active" },
  { id: 3, age: 20, score: 78, status: "inactive" },
]);

const highScorers = data
  .filter(row => row.score >= 85)
  .select("id", "score");
// Result: Rows with score >= 85, only id and score columns
```

### Related

`slice`, `distinct`, `select`

---

## slice

Select rows by position (similar to Array.slice).

### Signature

```typescript
slice({ start?: number; end?: number; step?: number }): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- start: Starting index (default: 0)
- end: Ending index (default: nrows)
- step: Step size (default: 1)

### Returns

DataFrame<T>

### Examples

```typescript
df.slice({ start: 0, end: 10 }) // First 10 rows
df.slice({ start: 10 }) // Skip first 10 rows
df.slice({ step: 2 }) // Every other row
```

### Related

`filter`, `extractHead`, `extractTail`

---
