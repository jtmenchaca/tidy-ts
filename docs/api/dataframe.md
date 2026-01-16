# DataFrame Operations

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [print](#print)
- [toString](#tostring)
- [createDataFrame](#createdataframe)
- [select](#select)
- [drop](#drop)
- [filter](#filter)
- [slice](#slice)
- [mutate](#mutate)
- [arrange](#arrange)
- [distinct](#distinct)
- [groupBy](#groupby)
- [summarize](#summarize)
- [count](#count)
- [ungroup](#ungroup)
- [sliceHead](#slicehead)
- [sliceTail](#slicetail)
- [sliceMax](#slicemax)
- [sliceMin](#slicemin)
- [sliceSample](#slicesample)
- [extract](#extract)
- [extractHead](#extracthead)
- [extractTail](#extracttail)
- [extractNth](#extractnth)
- [extractSample](#extractsample)
- [extractUnique](#extractunique)
- [innerJoin](#innerjoin)
- [leftJoin](#leftjoin)
- [rightJoin](#rightjoin)
- [outerJoin](#outerjoin)
- [asofJoin](#asofjoin)
- [pivotLonger](#pivotlonger)
- [pivotWider](#pivotwider)
- [transpose](#transpose)
- [unnest](#unnest)
- [bindRows](#bindrows)
- [concatDataFrames](#concatdataframes)
- [downsample](#downsample)
- [upsample](#upsample)
- [replaceNA](#replacena)
- [removeNA](#removena)
- [removeNull](#removenull)
- [removeUndefined](#removeundefined)
- [fillForward](#fillforward)
- [fillBackward](#fillbackward)
- [profile](#profile)
- [graph](#graph)

---

## print

Display the DataFrame in a formatted table. Use this instead of console.log().

### Signature

```typescript
print(title?: string): void
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- title: Optional title to display above the table

### Returns

void

### Examples

```typescript
df.print()
df.print("Sales Analysis:")
result.groupBy("region").summarize({ total: g => s.sum(g.sales) }).print("Regional Totals:")
```

### Best Practices

- ✓ GOOD: df.print() - formatted table output
- ✓ GOOD: df.print('Title') - with descriptive title

### Anti-patterns

- ❌ BAD: console.log(df.toArray())
- ❌ BAD: console.log(df)

### Related

`toString`, `toArray`, `columns`, `nrows`

---

## toString

Get a string representation of the DataFrame in table format. Returns the same formatted output as print() but as a string.

### Signature

```typescript
toString(title?: string): string
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- title: Optional title to display above the table

### Returns

string - formatted table representation

### Examples

```typescript
const tableStr = df.toString()
const tableStr = df.toString("Sales Data")
console.log(df.toString()) // Manual printing
```

### Best Practices

- ✓ GOOD: Use toString() when you need the string for logging or file output
- ✓ GOOD: Use print() for direct console output (more convenient)

### Related

`print`, `toArray`

---

## createDataFrame

Create a DataFrame from an array of row objects or from column arrays. Use the no_types option to return DataFrame<any> when type safety is not needed.

### Signature

```typescript
createDataFrame<T>(data: T[] | { columns: Record<string, unknown[]> }, options?: DataFrameOptions): DataFrame<T> | DataFrame<any>
```

### Import

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- data: Array of row objects OR { columns: { columnName: values[] } }
- options: Optional DataFrameOptions object with:
-   - schema: Zod schema for validation
-   - no_types: boolean (default: false) - when true, returns DataFrame<any>
-   - trace: boolean - enable operation tracing
-   - concurrency: number - concurrency limit for async operations

### Returns

DataFrame<T> (default) or DataFrame<any> (when no_types: true)

### Examples

```typescript
const df = createDataFrame([{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }])
const df = createDataFrame({ columns: { name: ["Alice", "Bob"], age: [30, 25] } })
// With Zod schema validation (schema as second parameter)
import { z } from "zod";
const schema = z.object({ name: z.string(), age: z.number() });
const df = createDataFrame([{ name: "Alice", age: 30 }], schema)
// Use no_types for dynamic/unknown schema
const dfAny = createDataFrame(userData, { no_types: true })
```

### Best Practices

- Always import stats: import { createDataFrame, stats as s } from "@tidy-ts/dataframe"
- Use df.print() to display DataFrames, not console.log(df.toArray())
- Access columns with df.columnName property (e.g., df.age) instead of manual extraction
- Use no_types: true when:
-   • Working with dynamic/unknown schema (user-provided data, API responses)
-   • Rapid prototyping (follow up with typed implementation)
-   • Building generic utilities for arbitrary DataFrame structures
- Prefer typed DataFrames when possible - no_types loses compile-time safety

### Anti-patterns

- ❌ BAD: Using no_types when you have not exhausted all other options
- ❌ BAD: Using no_types when schema is known at compile time

### Related

`readCSV`, `readXLSX`, `readJSON`

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

## downsample

Downsample time-series data by aggregating high-frequency data to lower frequency (e.g., hourly → daily). Groups rows by time buckets and applies aggregation functions. The time column must be of type Date (or Date | null).

### Signature

```typescript
downsample({ timeColumn, frequency, aggregations, startDate?, endDate? }): DataFrame<...>
```

### Import

```typescript
import { createDataFrame, stats } from "@tidy-ts/dataframe";
```

### Parameters

- timeColumn: Name of the Date column to use for downsampling
- frequency: Target frequency string or object:
-   - Seconds: '1S', '5S', '15S', '30S'
-   - Minutes: '1min', '5min', '15min', '30min'
-   - Hours: '1H', '6H', '12H'
-   - Days: '1D', '7D'
-   - Weeks: '1W'
-   - Months: '1M'
-   - Quarters: '1Q'
-   - Years: '1Y'
-   - Custom: number (milliseconds) or { value: number, unit: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'Y' }
- aggregations: Object mapping column names to aggregation functions:
-   - Use stats.mean, stats.sum, stats.max, stats.min, stats.first, stats.last
-   - Can create new columns (e.g., { open: stats.first, high: stats.max, low: stats.min, close: stats.last })
- startDate: Optional start date for downsampling period
- endDate: Optional end date for downsampling period

### Returns

DataFrame with downsampled data

### Examples

```typescript
// Downsample hourly to daily
const hourly = createDataFrame([
  { timestamp: new Date("2023-01-01T10:00:00"), price: 100, volume: 10 },
  { timestamp: new Date("2023-01-01T11:00:00"), price: 110, volume: 20 },
  { timestamp: new Date("2023-01-01T12:00:00"), price: 120, volume: 30 },
  { timestamp: new Date("2023-01-02T10:00:00"), price: 130, volume: 40 },
]);
const daily = hourly.downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: {
    price: stats.mean,
    volume: stats.sum
  }
})
// Result: 2 rows (one per day)
// Day 1: price = 110 (mean of 100, 110, 120), volume = 60 (sum of 10, 20, 30)
// Day 2: price = 130, volume = 40
// Downsample with OHLC pattern (Open, High, Low, Close)
const ohlc = df.downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: {
    open: stats.first,  // First price in period
    high: stats.max,    // Highest price
    low: stats.min,     // Lowest price
    close: stats.last   // Last price
  }
})
// Works with grouped DataFrames
const result = df.groupBy("symbol").downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: {
    price: stats.mean
  }
})
// With date range
const result = df.downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: { price: stats.mean },
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-01-31")
})
// Grouping behavior: without startDate, each group starts from its own first data point
const df = createDataFrame([
  { symbol: "AAPL", timestamp: new Date("2023-01-05T10:00:00"), price: 100 },
  { symbol: "GOOG", timestamp: new Date("2023-01-01T10:00:00"), price: 200 },
]);
const result = df.groupBy("symbol").downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: { price: stats.mean }
});
// AAPL starts from 2023-01-05, GOOG starts from 2023-01-01
// Grouping behavior: with startDate, all groups align to same startDate
// Groups that start after startDate will have null/NaN for empty buckets
const result = df.groupBy("symbol").downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: { price: stats.mean },
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-01-10")
});
// Both AAPL and GOOG will have buckets starting from 2023-01-01
// AAPL will have null/NaN for 2023-01-01 through 2023-01-04
```

### Best Practices

- ✓ GOOD: Use for converting from higher to lower frequency (e.g., hourly → daily)
- ✓ GOOD: The time column must be of type Date (or Date | null) - TypeScript enforces this
- ✓ GOOD: Use aggregation functions like stats.mean, stats.sum, stats.max, stats.min, stats.first, stats.last
- ✓ GOOD: Preserves grouping when called on grouped DataFrames
- ✓ GOOD: Can create new columns during downsampling (e.g., OHLC pattern)
- ✓ GOOD: Use startDate/endDate to define explicit time ranges
- ✓ GROUPING BEHAVIOR - without startDate: Each group starts from its own first data point
- ✓ GROUPING BEHAVIOR - with startDate: All groups align to the same startDate. Buckets before a group's first data point will have empty arrays [] which aggregate to null/NaN
- ✓ EMPTY BUCKETS: Buckets with no data receive empty arrays [] passed to aggregation functions, which typically return null/NaN. This is NOT forward-filled automatically
- ✓ CUSTOM AGGREGATION: Can use custom functions like (values: unknown[]) => { return values.length > 0 ? stats.mean(values) : 0 } to handle empty buckets

### Anti-patterns

- ❌ BAD: Using non-Date column for timeColumn - TypeScript will error
- ❌ BAD: Using for upsampling - use upsample() instead

### Related

`upsample`, `groupBy`, `summarize`, `fillForward`, `fillBackward`

---

## upsample

Upsample time-series data by filling low-frequency data to higher frequency (e.g., daily → hourly). Generates a complete time sequence and fills missing values using forward or backward fill.

### Signature

```typescript
upsample({ timeColumn, frequency, fillMethod, startDate?, endDate? }): DataFrame<...>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- timeColumn: Name of the Date column to use for upsampling
- frequency: Target frequency string or object:
-   - Seconds: '1S', '5S', '15S', '30S'
-   - Minutes: '1min', '5min', '15min', '30min'
-   - Hours: '1H', '6H', '12H'
-   - Days: '1D', '7D'
-   - Weeks: '1W'
-   - Months: '1M'
-   - Quarters: '1Q'
-   - Years: '1Y'
-   - Custom: number (milliseconds) or { value: number, unit: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'Y' }
- fillMethod: Fill strategy for missing values:
-   - 'forward': Carry forward the last known value (forward fill)
-   - 'backward': Use the next known value (backward fill)
- startDate: Optional start date for upsampling period
- endDate: Optional end date for upsampling period

### Returns

DataFrame with upsampled data

### Examples

```typescript
// Upsample daily to hourly with forward fill
const daily = createDataFrame([
  { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },
  { timestamp: new Date("2023-01-01T12:00:00"), value: 200 },
]);
const hourly = daily.upsample({
  timeColumn: "timestamp",
  frequency: "1H",
  fillMethod: "forward"
})
// Result: 3 rows (10:00, 11:00, 12:00)
// 10:00: value = 100
// 11:00: value = 100 (forward filled)
// 12:00: value = 200
// Upsample with backward fill
const hourly = daily.upsample({
  timeColumn: "timestamp",
  frequency: "1H",
  fillMethod: "backward"
})
// With date range
const result = df.upsample({
  timeColumn: "timestamp",
  frequency: "6H",
  fillMethod: "forward",
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-01-31")
})
// Grouping behavior: without startDate, each group starts from its own first data point
const df = createDataFrame([
  { symbol: "AAPL", timestamp: new Date("2023-01-05T00:00:00"), price: 100 },
  { symbol: "GOOG", timestamp: new Date("2023-01-01T00:00:00"), price: 200 },
]);
const result = df.groupBy("symbol").upsample({
  timeColumn: "timestamp",
  frequency: "1D",
  fillMethod: "forward"
});
// AAPL starts from 2023-01-05, GOOG starts from 2023-01-01
// Grouping behavior: with startDate, all groups align to same startDate
// Missing values before first data point will be null (not filled)
const result = df.groupBy("symbol").upsample({
  timeColumn: "timestamp",
  frequency: "1D",
  fillMethod: "forward",
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-01-10")
});
// Both AAPL and GOOG will have buckets starting from 2023-01-01
// AAPL will have null for 2023-01-01 through 2023-01-04 (no value to fill from)
```

### Best Practices

- ✓ GOOD: Use for converting from lower to higher frequency (e.g., daily → hourly)
- ✓ GOOD: The time column must be of type Date (or Date | null) - TypeScript enforces this
- ✓ GOOD: Forward fill is most common - carries last known value forward
- ✓ GOOD: Backward fill uses next known value - useful for looking ahead
- ✓ GOOD: Use startDate/endDate to define explicit time ranges
- ✓ GROUPING BEHAVIOR - without startDate: Each group starts from its own first data point
- ✓ GROUPING BEHAVIOR - with startDate: All groups align to the same startDate. Values before a group's first data point will be null (cannot fill from non-existent data)
- ✓ FILL LIMITATIONS: Forward fill cannot fill values that come before the first data point. Backward fill cannot fill values after the last data point

### Anti-patterns

- ❌ BAD: Using non-Date column for timeColumn - TypeScript will error
- ❌ BAD: Using for downsampling - use downsample() instead

### Related

`downsample`, `fillForward`, `fillBackward`

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

## profile

Profile a DataFrame by computing comprehensive statistics for each column. Returns a DataFrame with one row per column.

### Signature

```typescript
profile(): DataFrame<ColumnProfile>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Returns

DataFrame with columns: column, type, count, nulls, null_pct, mean, median, min, max, sd, q1, q3, iqr, variance (numeric), unique, top_values (categorical)

### Examples

```typescript
df.profile().print()
const stats = penguins.profile()
df.profile().filter(p => p.type === 'numeric')
```

### Best Practices

- Use profile() for quick exploratory data analysis
- Filter the profile result to focus on numeric or categorical columns
- Combine with .print() for immediate visual inspection

### Related

`summarize`, `mean`, `median`, `stdev`

---

## graph

Create an interactive Vega-Lite visualization from the DataFrame. Supports scatter plots, line charts, bar charts, and area charts. The widget can be displayed in Jupyter notebooks, web applications, or saved as SVG/PNG. Automatically infers axis types (temporal for Date, quantitative for numbers, ordinal otherwise).

### Signature

```typescript
graph(spec: GraphOptions<T>): TidyGraphWidget
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- spec: Graph specification object with:
-   - type: Chart type - 'scatter', 'line', 'bar', or 'area'
-   - mappings: Column mappings - { x, y, color?, series?, size?, shape? }
-     * x: Column name, accessor function, or array for X-axis (required)
-     * y: Column name, accessor function, or array for Y-axis (required)
-     * color: Optional column/accessor/array for color encoding (categorical or continuous)
-       - If not specified but series is provided, series is used for color
-     * series: Optional column/accessor/array for grouping multiple lines/bars/areas
-     * size: Optional column/accessor/array for point size encoding (scatter only, numeric)
-     * shape: Optional column/accessor/array for point shape encoding (scatter only, categorical)
-   - config: Optional styling configuration:
-     * layout: { title?, description?, width?: number | 'container', height?: number }
-       - width defaults to 'container' (fills parent), height defaults to 400
-     * xAxis/yAxis: { label?, domain?: [min, max]?, tickFormat?, hide? }
-       - domain filters data to only show points within range and enables clipping
-       - For Date axes, tickFormat defaults to '%b %Y'
-       - Non-quantitative x-axes get -45° label angle automatically
-     * grid: { show?: boolean (default: true), vertical?, horizontal? }
-     * color: { scheme?, colors?: string[] }
-       - schemes: 'default', 'blue', 'green', 'red', 'purple', 'orange', 'vibrant', 'professional', 'high_contrast'
-       - colors: Custom array of hex/rgb/hsl color strings
-     * legend: { show?: boolean (default: true when color/series used), position?, fontSize?, titleFontSize? }
-       - positions: 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
-       - fontSize defaults to 12, titleFontSize defaults to 13
-     * tooltip: { show?: boolean (default: true) }
-     * interactivity: { zoom?: boolean, pan?: boolean }
-       - Enables zoom/pan via interval selection bound to scales
-     * accessibility: { layer?: boolean } - Adds accessibility layer for screen readers
-     * animation: { duration?: number } - Animation duration in milliseconds
-     * scatter: { pointSize?: number (default: 60), pointOpacity?: number (default: 0.8) }
-     * line: { style?: 'monotone'|'linear'|'step'|'basis'|'cardinal' (default: 'linear'), dots?: boolean (default: false), strokeWidth?: number (default: 2), connectNulls?: boolean (default: false) }
-     * bar: { stacked?: boolean (default: false), radius?: number (default: 4) }
-     * area: { stacked?: boolean (default: false), style?: 'monotone'|'linear'|'step'|'basis'|'cardinal' (default: 'linear'), strokeWidth?: number (default: 1), opacity?: number (default: 0.7) }
-   - tooltip: Optional tooltip customization - { fields?: string[], format?: Record<string, (v: unknown) => string> }
-     - fields: Array of column names to show in tooltip (default: all columns)
-     - format: Custom formatter functions for specific fields

### Returns

TidyGraphWidget with display() and save methods:
  - savePNG({ filename, width?, height?, background?, scale? }): Promise<void>
    - scale: Resolution multiplier 1-4 (default: 1, clamped to 1-4)
  - saveSVG({ filename, width?, height?, background? }): Promise<void>
    - width/height default to 700x400 if not specified in layout or save options

### Examples

```typescript
// Scatter plot with color encoding
df.graph({
  type: "scatter",
  mappings: { x: "age", y: "income", color: "category" }
})
// Using accessor functions
const chart = df.graph({
  type: "scatter",
  mappings: {
    x: (row) => row.age,
    y: (row) => row.income * 1.1,
    color: "category"
  }
})
// Line chart with custom styling and domain filtering
df.graph({
  type: "line",
  mappings: { x: "date", y: "value", series: "category" },
  config: {
    layout: { title: "Sales Over Time", width: 800, height: 400 },
    line: { style: "monotone", strokeWidth: 3, dots: true },
    yAxis: { domain: [0, 1000], label: "Sales ($)" }
  }
})
// Bar chart with stacking
const chart = df.graph({
  type: "bar",
  mappings: { x: "category", y: "count", series: "region" },
  config: {
    color: { scheme: "vibrant" },
    bar: { stacked: true, radius: 8 }
  }
})
// Area chart with custom tooltip fields
df.graph({
  type: "area",
  mappings: { x: "date", y: "value", series: "region" },
  config: { area: { stacked: true, opacity: 0.7 } },
  tooltip: { fields: ["date", "value", "region"] }
})
// Save as PNG with high resolution
const chart = df.graph({ type: "scatter", mappings: { x: "x", y: "y" } })
await chart.savePNG({ filename: "chart.png", width: 800, height: 600, scale: 2 })
await chart.saveSVG({ filename: "chart.svg", width: 800, height: 600 })
// Scatter plot with multiple aesthetics and custom tooltip formatting
salesData
  .mutate({
    revenue: (r) => r.quantity * r.price,
    profit: (r) => r.quantity * r.price * 0.2,
  })
  .graph({
    type: "scatter",
    mappings: {
      x: "revenue",
      y: "quantity",
      color: "region",
      size: "profit",
    },
    config: {
      layout: { title: "Sales Analysis", width: 700, height: 400 },
      scatter: { pointSize: 100, pointOpacity: 0.8 },
      color: { scheme: "professional" },
      legend: { show: true, position: "right" },
      xAxis: { domain: [0, 5000], label: "Revenue ($)" },
    },
    tooltip: {
      fields: ["revenue", "quantity", "region", "profit"],
      format: { revenue: (v) => `$${Number(v).toFixed(2)}` }
    }
  })
// Date axis with automatic temporal formatting
df.graph({
  type: "line",
  mappings: { x: "date", y: "value" },
  config: {
    layout: { title: "Time Series" },
    // Date axis automatically gets "%b %Y" format
  }
})
```

### Best Practices

- ✓ GOOD: Use scatter plots for correlation analysis and multi-dimensional data
- ✓ GOOD: Use line charts for trends and time series data
- ✓ GOOD: Use bar charts for categorical comparisons
- ✓ GOOD: Use area charts for cumulative data and part-to-whole relationships
- ✓ GOOD: Chain with mutate() to create derived columns for visualization
- ✓ GOOD: Use color schemes like 'professional' or 'vibrant' for better aesthetics
- ✓ GOOD: Export charts as PNG/SVG for reports and presentations
- ✓ GOOD: Use series mapping for multiple lines/bars/areas
- ✓ GOOD: Configure tooltip.fields to show only relevant columns
- ✓ GOOD: Use domain filtering to focus on specific data ranges
- ✓ GOOD: Use scale: 2-4 for high-resolution PNG exports
- ✓ GOOD: All row fields are automatically available in tooltips unless filtered
- ✓ GOOD: Date columns are automatically detected and formatted as temporal axes
- Charts are interactive in Jupyter notebooks with hover tooltips
- Backed by Vega-Lite for high-quality visualizations
- When domain is specified, data is filtered and chart is clipped to that range

### Anti-patterns

- ❌ BAD: Using scatter plots for time series (use line charts instead)
- ❌ BAD: Using bar charts for continuous numeric data (use line charts)
- ❌ BAD: Not specifying mappings.x and mappings.y (required)
- ❌ BAD: Using 'container' width in savePNG/saveSVG (use numeric width)
- ❌ BAD: Using scale > 4 (will be clamped to 4)

### Related

`mutate`, `filter`, `groupBy`

---
