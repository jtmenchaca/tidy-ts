# Grouping

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [groupBy](#groupby)
- [summarize](#summarize)
- [count](#count)
- [ungroup](#ungroup)

---

## groupBy

Group rows by one or more columns.

### Signature

```typescript
groupBy<K extends keyof T>(...columns: K[]): GroupedDataFrame<T, K>
```

### Import

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- ...columns: Column names to group by

### Returns

GroupedDataFrame (use with summarize)

### Examples

```typescript
df.groupBy("region")
df.groupBy("region", "product")
```

### Related

`summarize`, `count`, `ungroup`

---

## summarize

Aggregate grouped data. Use after groupBy().

### Signature

```typescript
summarize<NewCols>(columns: SummarizeSpec<T, NewCols>): DataFrame<Pick<T, GroupKeys> & NewCols>
```

### Import

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- columns: Object mapping new column names to aggregation functions
- Aggregation function receives the grouped DataFrame

### Returns

DataFrame with group keys + new columns

### Examples

```typescript
df.groupBy("region").summarize({ total: group => s.sum(group.revenue) })
df.groupBy("region").summarize({ count: group => group.nrows(), avg: group => s.mean(group.price) })
```

### Best Practices

- ✓ GOOD: Use s.mean(group.column) instead of manual reduce for averages
- ✓ GOOD: Use s.sum(group.column) instead of reduce for sums
- ✓ GOOD: Use s.median(group.column) instead of manual sorting
- ✓ GOOD: Use s.max(), s.min(), s.stdev() for other aggregations
- Access columns directly: group.revenue not group.extract('revenue')

### Anti-patterns

- ❌ BAD: group.column.reduce((a, b) => a + b, 0) / group.nrows()
- ❌ BAD: group.column.reduce((a, b) => a + b, 0)
- ❌ BAD: [...group.column].sort((a,b) => a - b)[Math.floor(group.nrows()/2)]

### Related

`groupBy`, `count`, `mutate`

---

## count

Count rows, optionally grouped by columns. Shorthand for groupBy().summarize().

### Signature

```typescript
count<K extends keyof T>(...columns: K[]): DataFrame<Pick<T, K> & { count: number }>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- ...columns: Columns to group by (optional)

### Returns

DataFrame with group keys + count column

### Examples

```typescript
df.count() // Total row count
df.count("region") // Count by region
df.count("region", "product") // Count by region and product
```

### Related

`groupBy`, `summarize`

---

## ungroup

Remove grouping from a grouped DataFrame, returning a regular DataFrame.

### Signature

```typescript
ungroup(): DataFrame<T>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Returns

DataFrame<T>

### Examples

```typescript
df.groupBy("region").summarize({ total: g => s.sum(g.sales) }).ungroup()
```

### Related

`groupBy`

---
