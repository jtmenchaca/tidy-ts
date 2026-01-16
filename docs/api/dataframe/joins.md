# Joins

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [innerJoin](#innerjoin)
- [leftJoin](#leftjoin)
- [rightJoin](#rightjoin)
- [outerJoin](#outerjoin)
- [asofJoin](#asofjoin)

---

## innerJoin

Inner join with another DataFrame. Only keeps matching rows.

### Signature

```typescript
innerJoin<U>(other: DataFrame<U>, on: string | string[], options?: { suffixes?: { left?: string; right?: string } }): DataFrame<T & U>
innerJoin<U>(other: DataFrame<U>, options: { keys: string | string[] | { left: string | string[], right: string | string[] }, suffixes?: { left?: string; right?: string } }): DataFrame<T & U>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- other: DataFrame to join with
- Overload 1 - Simple API:
-   on: string | string[] - Column name(s) that exist in both DataFrames
-     - string: Single column, e.g., 'id'
-     - string[]: Multiple columns, e.g., ['region', 'product']
-   options?: { suffixes?: { left?: string; right?: string } }
- Overload 2 - Advanced API:
-   options: {
-     keys: string | string[] | { left: string | string[], right: string | string[] }
-       - string: Single column name (must exist in both DataFrames)
-       - string[]: Multiple column names (must exist in both DataFrames)
-       - { left: string | string[], right: string | string[] }: Different column names in each DataFrame
-     suffixes?: { left?: string; right?: string }
-   }

### Returns

DataFrame<T & U> - Only matching rows from both DataFrames

### Examples

```typescript
df.innerJoin(other, "id")
df.innerJoin(other, ["region", "product"])
df.innerJoin(other, { keys: { left: "user_id", right: "id" } })
```

### Related

`leftJoin`, `rightJoin`, `outerJoin`

---

## leftJoin

Left join with another DataFrame. Keeps all rows from the left DataFrame, filling nulls for columns from right where no match exists. This is the most common join type for preserving all records from a primary table while enriching with optional data.

### Signature

```typescript
leftJoin<U>(other: DataFrame<U>, on: string | string[], options?: { suffixes?: { left?: string; right?: string } }): DataFrame<T & Partial<U>>
leftJoin<U>(other: DataFrame<U>, options: { keys: string | string[] | { left: string | string[], right: string | string[] }, suffixes?: { left?: string; right?: string } }): DataFrame<T & Partial<U>>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- other: DataFrame to join with
- Overload 1 - Simple API:
-   on: string | string[] - Column name(s) that exist in both DataFrames
-     - string: Single column, e.g., 'id'
-     - string[]: Multiple columns, e.g., ['region', 'date']
-   options?: { suffixes?: { left?: string; right?: string } } - Optional suffix configuration
- Overload 2 - Advanced API:
-   options: {
-     keys: string | string[] | { left: string | string[], right: string | string[] }
-       - string: Single column name (must exist in both DataFrames)
-       - string[]: Multiple column names (must exist in both DataFrames)
-       - { left: string | string[], right: string | string[] }: Different column names in each DataFrame
-     suffixes?: { left?: string; right?: string } - Optional suffix configuration
-   }

### Returns

DataFrame<T & Partial<U>> - All left rows with matched right columns (null if no match)

### Examples

```typescript
// Overload 1: Simple API - single column
const users = createDataFrame([
  { user_id: 1, name: "Alice" },
  { user_id: 2, name: "Bob" },
]);
const orders = createDataFrame([
  { user_id: 1, product: "Widget", amount: 100 },
]);

const result = users.leftJoin(orders, "user_id");
// All users kept, Bob has null for product/amount
// Overload 1: Simple API - multiple columns
const sales = createDataFrame([
  { region: "North", date: "2023-01", revenue: 1000 },
]);
const targets = createDataFrame([
  { region: "North", date: "2023-01", target: 1200 },
]);

sales.leftJoin(targets, ["region", "date"])
// Overload 2: Advanced API - different column names
const customers = createDataFrame([
  { customer_id: 1, name: "Alice" },
]);
const purchases = createDataFrame([
  { buyer_id: 1, item: "Widget" },
]);

customers.leftJoin(purchases, {
  keys: { left: "customer_id", right: "buyer_id" },
})
// Overload 2: Advanced API - multiple different column names
const df1 = createDataFrame([
  { emp_id: 1, dept: "Sales", year: 2023 },
]);
const df2 = createDataFrame([
  { employee_id: 1, department: "Sales", year: 2023, bonus: 1000 },
]);

df1.leftJoin(df2, {
  keys: {
    left: ["emp_id", "dept"],
    right: ["employee_id", "department"],
  },
})
// Overload 1: With suffixes option
users.leftJoin(orders, "user_id", {
  suffixes: { left: "_user", right: "_order" },
})
```

### Best Practices

- ✓ GOOD: Use Overload 1 (simple API) when column names match between DataFrames
- ✓ GOOD: Use Overload 2 (advanced API) when column names differ or you need explicit control
- ✓ GOOD: Check for nulls in result columns from the right DataFrame
- ✓ GOOD: Use suffixes when both DataFrames have overlapping non-key column names

### Related

`innerJoin`, `rightJoin`, `outerJoin`

---

## rightJoin

Right join with another DataFrame. Keeps all rows from right, fills nulls for non-matches.

### Signature

```typescript
rightJoin<U>(other: DataFrame<U>, on: string | string[], options?: { suffixes?: { left?: string; right?: string } }): DataFrame<Partial<T> & U>
rightJoin<U>(other: DataFrame<U>, options: { keys: string | string[] | { left: string | string[], right: string | string[] }, suffixes?: { left?: string; right?: string } }): DataFrame<Partial<T> & U>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- other: DataFrame to join with
- Overload 1 - Simple API:
-   on: string | string[] - Column name(s) that exist in both DataFrames
-   options?: { suffixes?: { left?: string; right?: string } }
- Overload 2 - Advanced API:
-   options: {
-     keys: string | string[] | { left: string | string[], right: string | string[] }
-     suffixes?: { left?: string; right?: string }
-   }

### Returns

DataFrame<Partial<T> & U> - All right rows with matched left columns (null if no match)

### Examples

```typescript
df.rightJoin(other, "id")
df.rightJoin(other, ["region", "year"])
df.rightJoin(other, { keys: { left: "user_id", right: "id" } })
```

### Related

`innerJoin`, `leftJoin`, `outerJoin`

---

## outerJoin

Full outer join. Keeps all rows from both DataFrames, fills nulls for non-matches.

### Signature

```typescript
outerJoin<U>(other: DataFrame<U>, on: string | string[], options?: { suffixes?: { left?: string; right?: string } }): DataFrame<Partial<T> & Partial<U>>
outerJoin<U>(other: DataFrame<U>, options: { keys: string | string[] | { left: string | string[], right: string | string[] }, suffixes?: { left?: string; right?: string } }): DataFrame<Partial<T> & Partial<U>>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- other: DataFrame to join with
- Overload 1 - Simple API:
-   on: string | string[] - Column name(s) that exist in both DataFrames
-   options?: { suffixes?: { left?: string; right?: string } }
- Overload 2 - Advanced API:
-   options: {
-     keys: string | string[] | { left: string | string[], right: string | string[] }
-     suffixes?: { left?: string; right?: string }
-   }

### Returns

DataFrame<Partial<T> & Partial<U>> - All rows from both DataFrames

### Examples

```typescript
df.outerJoin(other, "id")
df.outerJoin(other, ["region", "year"])
df.outerJoin(other, { keys: { left: "user_id", right: "id" } })
```

### Related

`innerJoin`, `leftJoin`, `rightJoin`, `asofJoin`

---

## asofJoin

Join DataFrames by nearest key match (as-of join). Joins on a sorted column (typically timestamps), matching each left row with the 'nearest' right row based on direction. Useful for time-series data where exact matches aren't required.

### Signature

```typescript
asofJoin<OtherRow extends object, K extends keyof T & keyof OtherRow>(other: DataFrame<OtherRow>, by: K, options?: { direction?: 'backward' | 'forward' | 'nearest', tolerance?: number, group_by?: (keyof T & keyof OtherRow)[] }): DataFrame<...>
```

### Import

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- other: DataFrame to join with
- by: Column name to join on (must exist in both DataFrames)
- options.direction: 'backward' (default) - match prior value, 'forward' - match next value, 'nearest' - closest value
- options.tolerance: Optional maximum time difference allowed (in milliseconds for Dates)
- options.group_by: Optional columns to group by before matching (e.g., by symbol)

### Returns

DataFrame with columns from both DataFrames

### Examples

```typescript
// Join trades to nearest prior quotes (backward)
const trades = createDataFrame([
  { time: 1, symbol: "AAPL", quantity: 100 },
  { time: 3, symbol: "AAPL", quantity: 200 },
]);
const quotes = createDataFrame([
  { time: 0, symbol: "AAPL", price: 150.0 },
  { time: 2, symbol: "AAPL", price: 151.0 },
]);
trades.asofJoin(quotes, "time", { direction: "backward" })
// Matches trade at time 1 to quote at time 0, trade at time 3 to quote at time 2
// Forward-looking join
const events = createDataFrame([
  { timestamp: 1, event: "start" },
]);
const logs = createDataFrame([
  { timestamp: 2, log: "processing" },
]);
events.asofJoin(logs, "timestamp", { direction: "forward" })
// Join with tolerance (within 1000ms)
trades.asofJoin(quotes, "time", {
  direction: "nearest",
  tolerance: 1000
})
// Group by symbol before matching
trades.asofJoin(quotes, "time", {
  direction: "backward",
  group_by: ["symbol"]
})
```

### Best Practices

- ✓ GOOD: Use for time-series data where exact timestamp matches aren't required
- ✓ GOOD: Backward direction (default) is most common - matches to prior observations
- ✓ GOOD: Use tolerance to limit how far back/forward to look
- ✓ GOOD: Use group_by when joining multiple time series (e.g., multiple stocks)

### Anti-patterns

- ❌ BAD: Using on unsorted data - asofJoin requires sorted by column
- ❌ BAD: Expecting exact matches - this is for nearest matches

### Related

`innerJoin`, `leftJoin`, `downsample`, `upsample`

---
