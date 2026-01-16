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
innerJoin<U>(other: DataFrame<U>, { on }: { on: JoinKeys }): DataFrame<T & U>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- other: DataFrame to join with
- on: Join key(s) - string, array, or { left: ..., right: ... }

### Returns

DataFrame with columns from both DataFrames

### Examples

```typescript
df.innerJoin(other, { on: "id" })
df.innerJoin(other, { on: ["region", "product"] })
df.innerJoin(other, { on: { left: "user_id", right: "id" } })
```

### Related

`leftJoin`, `rightJoin`, `outerJoin`

---

## leftJoin

Left join with another DataFrame. Keeps all rows from left, fills nulls for non-matches.

### Signature

```typescript
leftJoin<U>(other: DataFrame<U>, { on }: { on: JoinKeys }): DataFrame<T & Partial<U>>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- other: DataFrame to join with
- on: Join key(s)

### Returns

DataFrame with all left rows + matched right rows

### Examples

```typescript
df.leftJoin(other, { on: "id" })
```

### Related

`innerJoin`, `rightJoin`, `outerJoin`

---

## rightJoin

Right join with another DataFrame. Keeps all rows from right, fills nulls for non-matches.

### Signature

```typescript
rightJoin<U>(other: DataFrame<U>, { on }: { on: JoinKeys }): DataFrame<Partial<T> & U>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- other: DataFrame to join with
- on: Join key(s)

### Returns

DataFrame with matched left rows + all right rows

### Examples

```typescript
df.rightJoin(other, { on: "id" })
```

### Related

`innerJoin`, `leftJoin`, `outerJoin`

---

## outerJoin

Full outer join. Keeps all rows from both DataFrames, fills nulls for non-matches.

### Signature

```typescript
outerJoin<U>(other: DataFrame<U>, { on }: { on: JoinKeys }): DataFrame<Partial<T> & Partial<U>>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- other: DataFrame to join with
- on: Join key(s)

### Returns

DataFrame with all rows from both sides

### Examples

```typescript
df.outerJoin(other, { on: "id" })
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
