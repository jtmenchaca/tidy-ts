# Transformation

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [mutate](#mutate)
- [arrange](#arrange)
- [distinct](#distinct)
- [rename](#rename)

---

## mutate

Add or transform columns. Supports functions, arrays, and scalars. Can be async.

### Signature

```typescript
mutate<NewCols>(columns: MutateSpec<T, NewCols>, opts?: { concurrency?: number }): DataFrame<T & NewCols> | PromisedDataFrame<T & NewCols>
```

### Import

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- columns: Object mapping column names to values
-   - Function: (row, index, df) => value
-   - Array: Direct values (must match row count)
-   - Scalar: Repeated for all rows (wrap in function for type inference)
- opts.concurrency: Limit concurrent async operations

### Returns

DataFrame (sync) or PromisedDataFrame (async)

### Examples

```typescript
df.mutate({ revenue: row => row.price * row.quantity })
df.mutate({ status: ["Active", "Pending", "Active"] })
df.mutate({ tax_rate: () => 0.08 })
await df.mutate({ data: async row => await fetch(row.url) }, { concurrency: 3 })
```

### Related

`select`, `drop`, `transmute`

---

## arrange

Sort DataFrame by a column.

### Signature

```typescript
arrange<K extends keyof T>(column: K, direction?: "asc" | "desc"): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column: Column name to sort by
- direction: "asc" (default) or "desc"

### Returns

DataFrame<T>

### Examples

```typescript
df.arrange("age")
df.arrange("revenue", "desc")
```

### Related

`filter`, `slice`

---

## distinct

Get unique combinations of specified columns (SQL DISTINCT). Returns only the specified columns with unique combinations.

### Signature

```typescript
distinct<K extends keyof T>(column1: K, ...moreColumns: K[]): DataFrame<Pick<T, K>>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- column1: First column to check for uniqueness (required)
- ...moreColumns: Additional columns to include in uniqueness check

### Returns

DataFrame with only the specified columns containing unique combinations

### Examples

```typescript
df.distinct("region") // Get unique regions (returns only region column)
df.distinct("region", "product") // Get unique region+product combinations
df.groupBy("year").distinct("product") // Unique products within each year
```

### Related

`filter`, `groupBy`, `select`

---

## rename

Rename columns. Mapping format: { oldName: newName }. Pure rename - old column is removed.

### Signature

```typescript
rename<RenameMap>(mapping: RenameMap): DataFrame<RenamedColumns<T, RenameMap>>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- mapping: Object mapping old column names to new column names { oldName: newName }

### Returns

DataFrame with renamed columns

### Examples

```typescript
df.rename({ mass: "weight" }) // Rename mass to weight
df.rename({ name: "character_name", mass: "weight" })
```

### Related

`select`, `drop`, `mutate`

---
