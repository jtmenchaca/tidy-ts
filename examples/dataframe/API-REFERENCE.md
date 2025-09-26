# 📘 tidy-ts API Reference

---

## 1. Creation & Basics

| **Method**          | **Signature**        | **Purpose**                                     | **New Name?** | **Updated?** |
| ------------------- | -------------------- | ----------------------------------------------- | ------------- | ------------ |
| `createDataFrame`   | `(rows: object[])`   | Create a new DataFrame from an array of objects | `create` | ✓ |
| `nrows`             | `()`                 | Return number of rows                           | ✓ | |
| `ncols`             | `()`                 | Return number of columns                        | ✓ | ✓ |
| `print`             | `()`                 | Pretty-print the DataFrame                      | ✓ | |
| `columns`           | `()`                 | List of column names                            | ✓ | |
| `dtypes`            | `()`                 | Column type information                         | ✓ | ✓ |
| `[column]` accessor | `df.colName`         | Return column as typed array                    | ✓ | |
| `isEmpty`           | `()`                 | Check if frame has zero rows                    | ✓ | ✓ |

---

## 2. Column Management

| **Method** | **Signature**                      | **Purpose**                        | **New Name?** | **Updated?** |
| ---------- | ---------------------------------- | ---------------------------------- | ------------- | ------------ |
| `select`   | `(...cols: string[])`              | Keep only specified columns        | ✓ | |
| `drop`     | `(...cols: string[])`              | Remove specified columns           | ✓ | |
| `rename`   | `(mapping: Record<string,string>)` | Rename columns                     | ✓ | |
| `reorder`  | `(cols: string[])`                 | Reorder columns explicitly         | ✓ | ✓ |
| `distinct` | `(cols?: string[])`                | Unique rows (or by subset of cols) | ✓ | |

---

## 3. Row Filtering & Slicing

| **Method** | **Signature**                                     | **Purpose**                  | **New Name?** | **Updated?** |
| ---------- | ------------------------------------------------- | ---------------------------- | ------------- | ------------ |
| `filter` | `(...predicates: (row => boolean) \| boolean[])` | Keep rows matching conditions | ✓ | ✓ |
| `slice` | `(start: number, end?: number)`                  | Slice by index range         | ✓ | ✓ |
| `head` | `(n: number)`                                    | First *n* rows               | ✓ | ✓ |
| `tail` | `(n: number)`                                    | Last *n* rows                | ✓ | ✓ |
| `sample` | `(n: number)`                                  | Random sample of rows        | ✓ | ✓ |

---

## 4. Mutation / Derivation

| **Method**    | **Signature**                       | **Purpose**                   | **New Name?** | **Updated?** |
| ------------- | ----------------------------------- | ----------------------------- | ------------- | ------------ |
| `mutate`      | `(spec: Record<string,(row)=>any>)` | Add or transform columns      | ✓ | |
| `normalize`   | `(col: string, method?: "minmax" \| "zscore")` | Normalize values | ✓ | ✓ |
| `standardize` | `(col: string)`                     | Standardize to z-score        | ✓ | ✓ |
| *in stats*    | `(col: string, { desc?: boolean })` | Rank rows by column           | `rank` | |
| *in stats*    | `(col: string)`                     | Cumulative sum                | `cumsum` | |
| `cummean`     | `(col: string)`                     | Cumulative mean               | ✓ | ✓ |
| `mutate_columns` | `(cols: string[], fn: (col) => any)` | Apply function to columns    | `mutateColumns` | |
| `arrange`     | `({ by: string, desc?: boolean })`  | Sort rows by column          | ✓ | |

---

## 5. Type Conversions

| **Method**    | **Signature**                    | **Purpose**                | **New Name?** | **Updated?** |
| ------------- | -------------------------------- | -------------------------- | ------------- | ------------ |
| `as_string`   | `(col: string)`                  | Convert column to string   | `asString` | |
| `as_number`   | `(col: string)`                  | Convert column to number   | `asNumber` | |
| `as_integer`  | `(col: string)`                  | Convert column to integer  | `asInteger` | |
| `as_logical`  | `(col: string)`                  | Convert column to boolean  | `asBoolean` | |
| `as_date`     | `(col: string, format?: string)` | Convert column to date     | `asDate` | |

---

## 6. Grouping & Aggregation

| **Method**  | **Signature**                                 | **Purpose**                         | **New Name?** | **Updated?** |
| ----------- | --------------------------------------------- | ----------------------------------- | ------------- | ------------ |
| `group_by`  | `(...cols: string[])`                         | Group by one or more columns        | `groupBy` | |
| `summarise` | `(aggregations: Record<string,(group)=>any>)` | Summarize each group                | ✓ | |
| *in stats*  | `(col?: string)`                              | Count rows (optionally by category) | `count` | |
| `summarise_columns` | `(cols: string[], fns: Record<string, Function>)` | Summarize specific columns      | `summarizeColumns` | |
| `ungroup`   | `()`                                          | Remove grouping                     | ✓ | |
| `cross_tabulate` | `(rowVar: string, colVar: string)`           | Cross tabulation                    | `crossTabulate` | |

---

## 7. Reshaping

| **Method**    | **Signature**                                     | **Purpose**            | **New Name?** | **Updated?** |
| ------------- | ------------------------------------------------- | ---------------------- | ------------- | ------------ |
| `pivot_longer` | `({ cols, names_to, values_to })`                | Wide → long format     | `pivotLonger` | |
| `pivot_wider`  | `({ names_from, values_from, expected_columns })` | Long → wide format     | `pivotWider` | |
| *missing*     | `(col: string, into: string[], sep: string \| RegExp)` | Split column into multiple | `separate` | |
| *missing*     | `(newCol: string, cols: string[], sep?: string)`  | Merge columns into one | `unite` | |
| `bind_rows`   | `(...dfs: DataFrame[])`                           | Concatenate vertically | `bindRows` | |

---

## 8. Joins & Set Ops

| **Method**   | **Signature**           | **Purpose**                      | **New Name?** | **Updated?** |
| ------------ | ----------------------- | -------------------------------- | ------------- | ------------ |
| `inner_join` | `(other, key: string \| string[])` | Only matches | `innerJoin` | |
| `left_join`  | `(other, key)`          | Keep all from left                        | `leftJoin` | |
| `right_join` | `(other, key)`          | Keep all from right                       | `rightJoin` | |
| `outer_join` | `(other, key)`          | Keep all from both                  | `outerJoin` | |
| `cross_join` | `(other)`               | Cartesian product                | `crossJoin` | |
| `join_asof`  | `(other, key, ordered_col)`  | Match on key and nearest preceding in ordered column (time-series) | `asofJoin` | |
| `bind_rows`  | `(...dfs: DataFrame[])` | Concatenate vertically           | `bindRows` | |
| *missing*    | `(other)`               | Combine side by side             | `bindCols` | |
| *missing*    | `(other)`               | Rows present in both             | `intersect` | |
| *missing*    | `(other)`               | Rows in this frame but not other | `difference` | |

---

## 9. Missing Data

| **Method**   | **Signature**           | **Purpose**                      | **New Name?** | **Updated?** |
| ------------ | ----------------------- | -------------------------------- | ------------- | ------------ |
| *missing*    | `(mapping: Record<string, any>)` | Replace null/undefined with fixed values | `replaceNA` | |
| *missing*    | `(values: any[], replacement: any)` | Generic replace null/undefined values | `replace` | |

---

## 10. Convenience Verbs

| **Method**   | **Signature**           | **Purpose**                      | **New Name?** | **Updated?** |
| ------------ | ----------------------- | -------------------------------- | ------------- | ------------ |
| *missing*    | `(...rows: T[])`        | Add rows to bottom               | `append` | |
| *missing*    | `(...rows: T[])`        | Add rows to top                  | `prepend` | |
| *missing*    | `()`                    | Randomize row order              | `shuffle` | |
| `ungroup`    | `()`                    | Drop grouping context            | ✓ | |
| `extract`    | `<ColName>(column: ColName)` | Pull a column as a raw array (chainable) | ✓ | ✓ |
| `extract_head` | `<ColName>(column: ColName, n: 1): T \| undefined` | First value from column | ✓ | ✓ |
| `extract_head` | `<ColName>(column: ColName, n: number): T[]` | First n values from column | ✓ | ✓ |
| `extract_tail` | `<ColName>(column: ColName, n: 1): T \| undefined` | Last value from column | ✓ | ✓ |
| `extract_tail` | `<ColName>(column: ColName, n: number): T[]` | Last n values from column | ✓ | ✓ |
| `extract_nth` | `<ColName>(column: ColName, index: number): T \| undefined` | Value at specific index | ✓ | ✓ |
| `extract_sample` | `<ColName>(column: ColName, n: number): T[]` | Random n values from column | ✓ | ✓ |

---

## 11. Encoding & Transformation

| **Method**   | **Signature**                                                             | **Purpose**             | **New Name?** | **Updated?** |
| ------------ | ------------------------------------------------------------------------- | ----------------------- | ------------- | ------------ |
| `dummy_col`  | `(col: string, opts?: { includeNA?, prefix?, dropOriginal?, expected? })` | One-hot encoding        | `dummy` | |
| *in str module* | `(col: string)`                                                        | Lowercase strings       | `strLower` | |
| *in str module* | `(col: string)`                                                        | Uppercase strings       | `strUpper` | |
| *in str module* | `(col: string, start: number, end?: number)`                           | Extract substring       | `strSlice` | |
| `str.replace` | `(col: string, pattern: string \| RegExp, repl: string)`                | Regex/text replace      | `strReplace` | |
| `str.detect` | `(values: string[], pattern: string \| RegExp)`                          | Detect pattern match    | `strDetect` | |
| `str.extract` | `(values: string[], pattern: string \| RegExp)`                         | Extract pattern match   | `strExtract` | |
| `str.length` | `(values: string[])`                                                      | String length           | `strLength` | |
| `str.split`  | `(values: string[], separator: string \| RegExp)`                        | Split strings           | `strSplit` | |

---

## 10. Dates & Times

| **Method**  | **Signature**                  | **Purpose**              | **New Name?** | **Updated?** |
| ----------- | ------------------------------ | ------------------------ | ------------- | ------------ |
| `year`      | `(col: string)`                | Extract year             | ✓ | ✓ |
| `month`     | `(col: string)`                | Extract month            | ✓ | ✓ |
| `day`       | `(col: string)`                | Extract day              | ✓ | ✓ |

---

## 11. Export & I/O

| **Method** | **Signature**    | **Purpose**       | **New Name?** | **Updated?** |
| ---------- | ---------------- | ----------------- | ------------- | ------------ |
| `toCSV`     | `()`            | Serialize to CSV  | ✓ | ✓ |
| `toJSON`    | `()`            | Serialize to JSON | ✓ | ✓ |
| `readCSV`  | `(csv: string)` | Parse from CSV    | `fromCSV` | |
| `readJSON` | `(json: string)` | Parse from JSON   | `fromJSON` | |

---

## 12. Validation

| **Method** | **Signature** | **Purpose**                          | **New Name?** | **Updated?** |
| ---------- | ------------- | ------------------------------------ | ------------- | ------------ |
| *missing*  | `(schema)`    | Validate against a schema (e.g. zod) | `validate` | |

---

## 13. Side Effects & Iteration

| **Method**      | **Signature**                    | **Purpose**                      | **New Name?** | **Updated?** |
| --------------- | -------------------------------- | -------------------------------- | ------------- | ------------ |
| `for_each_row`  | `(fn: (row) => void)`            | Apply function to each row       | `forEach` | |
| `for_each_col`  | `(fn: (col, name) => void)`      | Apply function to each column    | `forEachCol` | |

---

## 14. Data Profiling & Quality

| **Method**       | **Signature**  | **Purpose**                    | **New Name?** | **Updated?** |
| ---------------- | -------------- | ------------------------------ | ------------- | ------------ |
| `profile_data`   | `()`           | Generate data quality profile  | `describe` | |
| `remove_rows_with_na` | `(cols?: string[])` | Remove rows with missing values | `dropNA` | |

---

## 15. Visualization

| **Method** | **Signature**                           | **Purpose**        | **New Name?** | **Updated?** |
| ---------- | --------------------------------------- | ------------------ | ------------- | ------------ |
| `graph`    | `(spec: GraphSpec)`                     | Create graph/chart | ✓ | |

---

## 16. Stats Helpers (standalone `stats`)

### Basic Statistics
| **Function**  | **Purpose**         | **New Name?** | **Updated?** |
| ------------- | ------------------- | ------------- | ------------ |
| `unique`      | Unique values       | ✓ | |
| `sum`         | Sum                 | ✓ | |
| `mean`        | Mean                | ✓ | |
| `sd`          | Standard deviation  | ✓ | |
| `min` / `max` | Min / max           | ✓ | |
| `mode`        | Most frequent       | ✓ | |
| `median`      | Median              | ✓ | |
| `quantile`    | Percentiles         | ✓ | |
| `floor`       | Floor function      | ✓ | ✓ |
| `ceiling`     | Ceiling function    | ✓ | ✓ |
| `round`       | Rounding            | ✓ | |
| `countRows`   | Count rows in group | ✓ | |
| `product`     | Product of values   | ✓ | |

### Spread Statistics
| **Function**  | **Purpose**                  | **New Name?** | **Updated?** |
| ------------- | ---------------------------- | ------------- | ------------ |
| `variance`    | Sample variance              | ✓ | |
| `range`       | Range (max - min)            | ✓ | |
| `iqr`         | Interquartile range          | ✓ | |
| `quartiles`   | First and third quartiles    | ✓ | |

### Bivariate Statistics
| **Function**   | **Purpose**                    | **New Name?** | **Updated?** |
| -------------- | ------------------------------ | ------------- | ------------ |
| `covariance`   | Sample covariance              | ✓ | |
| `corr`         | Pearson correlation            | ✓ | |

### Count & Frequency
| **Function**       | **Purpose**                | **New Name?** | **Updated?** |
| ------------------ | -------------------------- | ------------- | ------------ |
| `uniqueCount`      | Count of unique values     | ✓ | |
| `countValue`       | Count specific value       | ✓ | |

### Distribution & Ranking
| **Function**       | **Purpose**                | **New Name?** | **Updated?** |
| ------------------ | -------------------------- | ------------- | ------------ |
| `rank`             | Rank values                | ✓ | |
| `percentileRank`   | Percentile ranks           | ✓ | |
| `cumsum`           | Cumulative sum             | ✓ | |

### Utility
| **Function**       | **Purpose**                     | **New Name?** | **Updated?** |
| ------------------ | ------------------------------- | ------------- | ------------ |
| `descriptiveStats` | Comprehensive statistics        | ✓ | |

---

## 17. Stats Functions (for use inside mutate)

### Lag/Lead
| **Function** | **Signature**                          | **Purpose**              | **New Name?** | **Updated?** |
| ------------ | -------------------------------------- | ------------------------ | ------------- | ------------ |
| *missing*    | `(value: T[], k?: number, default?: T)` | Lag values by k positions | `lag` | |
| *missing*    | `(value: T[], k?: number, default?: T)` | Lead values by k positions | `lead` | |

### Cumulative
| **Function** | **Signature**       | **Purpose**                   | **New Name?** | **Updated?** |
| ------------ | ------------------- | ----------------------------- | ------------- | ------------ |
| `cumsum`     | `(value: number[])` | Cumulative sum                | ✓ | ✓ |
| *missing*    | `(value: number[])` | Cumulative product            | `cumprod` | |
| *missing*    | `(value: number[])` | Cumulative minimum            | `cummin` | |
| *missing*    | `(value: number[])` | Cumulative maximum            | `cummax` | |
| `cummean`    | `(value: number[])` | Cumulative mean               | ✓ | ✓ |

### Ranking
| **Function** | **Signature**                        | **Purpose**                   | **New Name?** | **Updated?** |
| ------------ | ------------------------------------ | ----------------------------- | ------------- | ------------ |
| `rank`       | `(value: number[], { desc?, ties? })` | Rank values                   | ✓ | ✓ |
| *missing*    | `(value: number[])`                  | Dense ranking (no gaps)       | `denseRank` | |
| `percentileRank` | `(value: number[])`              | Percentile ranks              | ✓ | ✓ |

### Rolling (Window Functions)
| **Function** | **Signature**                           | **Purpose**                      | **New Name?** | **Updated?** |
| ------------ | --------------------------------------- | -------------------------------- | ------------- | ------------ |
| *missing*    | `(reducer: (window: T[]) => R, k: number)` | Apply custom reducer over sliding window | `rolling` | |

---

## Type System

All functions are fully typed with TypeScript generics to preserve column types through transformations:

```typescript
// Type-safe column selection
df.select("name", "age") // DataFrame<{ name: string, age: number }>

// Type-safe mutations
df.mutate({ 
  adult: row => row.age >= 18 // boolean type inferred
})

// Type-safe aggregations
df.groupBy("category")
  .summarise({
    avg_score: group => stats.mean(group.score) // number type preserved
  })
```

---

## Method Chaining

All DataFrame methods return new DataFrame instances enabling fluent chaining:

```typescript
df
  .filter(row => row.active)
  .groupBy("department")
  .summarise({ 
    total_sales: group => stats.sum(group.sales),
    avg_rating: group => stats.mean(group.rating)
  })
  .arrange({ by: "total_sales", desc: true })
  .head(10)
  .print()
```