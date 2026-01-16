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
```

### Related

`slice`, `distinct`

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
