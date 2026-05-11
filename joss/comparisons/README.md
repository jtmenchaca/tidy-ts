# Type Safety Comparisons: Tidy-TS vs Python (pandas) vs R (tidyverse)

This directory contains side-by-side comparisons demonstrating how Tidy-TS catches common data analysis errors at **compile time**, while Python and R catch them at **runtime** — or, more dangerously, produce **silently wrong results**.

All outcomes below are **empirically verified** by probe scripts and Tidy-TS tests executed via `runner.test.ts` (77 tests, all passing).

## Detection Categories

Each error is classified by **when and how** it is detected:

| Category | Symbol | Meaning |
|----------|--------|---------|
| **Compile** | `C` | Caught by the TypeScript compiler before execution — red squiggle in IDE |
| **Runtime Error** | `RE` | Program crashes with an exception when the line executes |
| **Runtime Warning** | `RW` | Warning message printed, but execution continues with potentially wrong results |
| **Silent** | `S` | No error, no warning — wrong result produced without any indication |

## Fixture Data

All examples use the same clinical dataset in `fixtures/`:

| File | Description |
|------|-------------|
| `patients.csv` | Patient demographics (ID, name, DOB, sex, race, insurance) |
| `encounters.csv` | Clinical encounters (ED, inpatient, outpatient) with diagnoses |
| `medications.csv` | Medication prescriptions with dose, route, frequency |
| `lab_results.csv` | Lab results with values, reference ranges, abnormal flags |

## Error Classes

Each error class has a subdirectory containing:
- `example-*.ts` — Tidy-TS code showing compile-time catches
- `example-*.py` — Python/pandas equivalent
- `example-*.R` — R/tidyverse equivalent
- `probe.py` / `probe.R` — Structured scripts that empirically test each error and emit JSON with `{ outcome, message, result }`
- Results are validated in `runner.test.ts`

### 01 — Column Reference Errors
Misspelled or nonexistent column names in mutate, filter, arrange.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Misspelled column in mutate | `C` | `RE` | `RE` |
| Nonexistent column in filter | `C` | `RE` | `RE` |
| Misspelled column in arrange/sort | `C` | `RE` | `RE` |

### 02 — Type Mismatch Errors
Arithmetic on strings, wrong types in aggregation, comparing incompatible types.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Arithmetic on string column | `C` | `RE` | `RE` |
| Numeric aggregation on string column | `C` | `RE` | `RW` returns NA |
| Comparing number to string literal | `C` | **`S`** returns 0 rows | **`S`** returns 0 rows |

### 03 — Join Key Errors
Joining on keys that don't exist in one table, misspelled keys, accessing wrong-side columns.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Join key not in left table | `C` | `RE` | `RE` |
| Misspelled join key | `C` | `RE` | `RE` |
| Accessing column from wrong table post-join | `C` | `RE` | `RE` |

### 04 — Schema Evolution Through Pipelines
Accessing columns that were dropped, selected away, or removed by summarize.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Accessing dropped column | `C` | `RE` | `RE` |
| Accessing original columns after summarize | `C` | `RE` | `RE` |
| Sorting by dropped column | `C` | `RE` | `RE` |

### 05 — Null Safety Errors
Operating on nullable columns without handling nulls; NaN/NA propagation.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| String method on nullable column | `C` | **`S`** NaN propagates | **`S`** NA propagates |
| Arithmetic on nullable column | `C` | **`S`** NaN propagates | **`S`** NA propagates |
| Comparison with nullable values | `C` | **`S`** NaN rows excluded | **`S`** NA rows excluded |

### 06 — Schema Validation at Data Boundaries
Malformed CSV data, unexpected types, missing columns at data ingestion.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Non-numeric value in numeric column | `RE` Zod rejects | **`S`** column becomes object/str | `RW` value becomes NA |
| Missing column in CSV | `RE` Zod rejects | `RE` when accessed | `RE` when accessed |
| Empty cell in non-null column | `RE` Zod rejects | **`S`** becomes NaN | **`S`** becomes NA |

### 07 — Pipeline Composition Errors
Multi-step pipelines where errors compound across transformations.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Using old name after rename | `C` | `RE` | `RE` |
| Accessing column removed by earlier step | `C` | `RE` | `RE` |

### 08 — Async/Sync Confusion
Mixing async functions into sync DataFrame operations.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Async function in sync mutate/apply | `C` | **`S`** stores coroutine objects | N/A |

### 09 — Forbidden Array Methods / API Escape
Using raw array methods on DataFrames, direct mutation, untyped access.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Direct mutation (invalid values) | `C` immutable | **`S`** allows any value | **`S`** allows any value |
| Mixed return types from apply | `C` union inferred | **`S`** column becomes object | **`S`** column coerced |
| $ access with typo (R) | N/A | N/A | `RW` uninitialised column |

### 10 — Type Conversion and Narrowing
Type conversions that may fail, and tracking the result type after conversion.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Unparseable value in conversion | `C` result typed `T \| null` | **`S`** becomes NaN (coerce) | `RW` becomes NA |
| Downstream arithmetic on converted nullable | `C` | **`S`** NaN propagates | **`S`** NA propagates |
| Aggregation after conversion | `C` | **`S`** skips NaN | **`S`** returns NA |

### 11 — Null Narrowing via replaceNA / dropNA
Type narrowing after explicitly handling null values.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Type after fillna/replace_na | `C` narrowed to non-null | **`S`** no type change | **`S`** no type change |
| Re-introducing null after cleanup | `C` immutable | **`S`** NaN re-added | **`S`** NA re-added |
| Type after dropna/drop_na | `C` narrowed to non-null | **`S`** no type change | **`S`** no type change |

### 12 — Aggregation on Columns with Missing Data
The `na.rm` trap: aggregation functions behaving differently with missing values.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| mean() on column with nulls | `C` | **`S`** skips NaN | **`S`** returns NA, **NO warning** |
| sum() on column with nulls | `C` | **`S`** skips NaN | **`S`** returns NA, **NO warning** |
| min() on column with nulls | `C` | **`S`** skips NaN | **`S`** returns NA |
| groupby mean with null groups | `C` | **`S`** NaN groups present | **`S`** groups get NA |

### 13 — Bind Rows Schema Mismatch
Combining DataFrames with different column sets.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Missing columns filled silently | `C` union type inferred | **`S`** NaN fill, no warning | **`S`** NA fill, no warning |
| String op on filled null column | `C` nullable type enforced | **`S`** NaN propagates | **`S`** NA propagates |

### 14 — Pivot Type Safety
Columns created from data values; referencing pre-pivot or non-existent pivot columns.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Non-existent pivot column | `C` | `RE` | `RE` |
| Pre-pivot column gone after pivot | `C` | `RE` | `RE` |

### 15 — Distinct Column Narrowing
distinct() with column arguments narrows the result schema.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Non-specified columns after distinct | `C` removed from type | **`S`** all cols kept, arbitrary values | **`S`** (with .keep_all) |

### 16 — Mixed Return Types
Mutate/apply returning different types depending on conditions.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Mixed type return from transform | `C` union type inferred | **`S`** column becomes object | **`S`** coerced to character |
| String method on mixed-type column | `C` must handle union | **`S`** NaN for non-strings | `RW` NAs introduced |

### 17 — Join Nullability
After left/outer joins, right-side columns become nullable. Python/R silently let you use them.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| String method on nullable join column | `C` | **`S`** NaN propagates | **`S`** NA propagates |
| Arithmetic on nullable join column | `C` | **`S`** NaN propagates | **`S`** NA propagates |
| Comparison silently excludes nullable rows | `C` | **`S`** NaN excluded | **`S`** NA excluded |

### 18 — Column Name Collision in Joins
Shared non-key columns get silently renamed with suffixes; original name vanishes.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Silent column rename with suffixes | `C` tracks suffixed names | **`S`** _x/_y applied silently | **`S`** .x/.y applied silently |
| Accessing original column name post-join | `C` | `RE` KeyError | `RE` |

### 19 — GroupBy State Tracking
Grouped vs ungrouped DataFrames have different available operations.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| DataFrame method on grouped object | `C` | `RE` | N/A (verbs still work) |
| Multi-level groupby retains hidden state | `C` | **`S`** MultiIndex | **`S`** grouped output |

### 20 — Implicit Type Coercion in Row Binding
Binding rows with incompatible column types across DataFrames.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Binding numeric + string columns | `C` union type | **`S`** coerced to object | `RE` type error |
| Arithmetic on coerced column | `C` | **`S`** string repetition | `RE` |
| Binding logical + numeric columns | `C` | **`S`** | **`S`** TRUE→1 |

### 21 — Aggregation Return Type Narrowing
Aggregation on nullable data returns nullable type unless removal flags are set.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| sum() on nullable without removeNull | `C` returns `T \| null` | **`S`** skips NaN silently | **`S`** returns NA |
| Arithmetic on nullable aggregation result | `C` | **`S`** no type indication | **`S`** NA propagates |

### 22 — Temporal Type Safety
Date parsing, arithmetic, and type tracking through temporal operations.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Invalid date string in parsing | `C` + `RE` Zod rejects | **`S`** becomes NaT (coerce) | **`S`** becomes NA |
| Arithmetic on invalid date result | `C` | **`S`** NaT propagates | **`S`** NA propagates |

### 23 — Grouped Operation Context
Operations on grouped DataFrames silently change semantics.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| apply() return type changes result shape | `C` | **`S`** Series vs MultiIndex | **`S`** different result |
| Same verb gives different results grouped vs ungrouped | `C` | **`S`** | **`S`** |

### 24 — Window Function Output Type
lag/lead/shift introduce undefined/NaN/NA where none existed.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Window function introduces nullable values | `C` returns `(T \| undefined)[]` | **`S`** NaN introduced | **`S`** NA introduced |
| Arithmetic on windowed result | `C` must narrow undefined | **`S`** NaN propagates | **`S`** NA propagates |

### 25 — Column Type Constraint in Specialized Verbs
mutateColumns requires colType to match selected columns.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Numeric function on string column (manual) | `C` | **`S`** string repetition | `RE` |
| log() on wrong column type | `C` | `RE` | `RE` |

### 26 — Sorting on Nullable Columns
Sort behavior with null/NaN/NA values is implicit and undocumented at point of use.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| sort_values/arrange implicit NaN/NA placement | `C` nullable visible | **`S`** NaN at end | **`S`** NA at end |
| rank() on nullable column | `C` | **`S`** NaN rank | **`S`** NA rank |

### 27 — Append/Prepend Row Type Mismatch
Individual row addition must match DataFrame schema.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Missing column in appended row | `C` | **`S`** NaN fill | **`S`** NA fill |
| Wrong type in appended row | `C` | **`S`** coerced to object | `RE` type error |

### 28 — Reorder vs Select Schema Preservation
reorder() keeps all columns; select() in Python/R drops unmentioned columns.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Unmentioned columns silently dropped | `C` reorder preserves all | **`S`** columns lost | **`S`** columns lost |

### 29 — Empty DataFrame Operations
Operations on empty DataFrames produce surprising results.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| sum() on empty column | `C` restricted on empty | **`S`** returns 0 | **`S`** returns 0 |
| mean() on empty column | `C` | **`S`** returns NaN | **`S`** returns NaN |

### 30 — Transpose Type Safety
After transpose, column names are only known at runtime.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Column names after transpose | `C` tracked from row labels | **`S`** runtime only | **`S`** matrix, not tibble |
| Accessing wrong column post-transpose | `C` | `RE` KeyError | **`S`** |

## Runtime Safety (Classes 31–36)

Beyond compile-time type safety, Tidy-TS provides **runtime guards** that catch errors Python and R miss entirely.

### 31 — Nullable vs Optional Distinction
Tidy-TS distinguishes `null` (explicit missing) from `undefined` (field absent). Python/R collapse both into NaN/NA.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| null vs undefined distinction | `RE` type-level + runtime | **`S`** both become NaN | **`S`** both become NA |
| Collapsed representation hides data semantics | Preserved | **`S`** indistinguishable | **`S`** indistinguishable |

### 32 — NaN/Null Explicit Handling
Tidy-TS requires explicit opt-in (`removeNaN`, `removeNull`) to skip missing values in aggregation. Python silently skips NaN; R silently returns NA. All three propagate Infinity.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| mean() with NaN in data | Returns NaN (explicit `removeNaN` required) | **`S`** silently skips NaN | **`S`** returns NA |
| mean() with null in data | Returns null (explicit `removeNull` required) | **`S`** silently skips NaN | **`S`** returns NA |
| mean() with Infinity | **`S`** returns Inf (same as Python/R) | **`S`** returns Inf | **`S`** returns Inf |

### 33 — Duplicate Column Names
Tidy-TS detects when a rename maps two columns to the same new name. Python silently accepts duplicate columns; R depends on the constructor.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Rename two cols to same name | `RE` rejects | **`S`** silently accepted | `RE` tibble / **`S`** data.frame |
| Rename to existing column name | **`S`** silently overwrites | **`S`** silently accepted | **`S`** (data.frame) |

### 34 — Enum Validation
Tidy-TS uses Zod `z.enum()` to reject invalid categorical values at data boundaries. Python/R accept anything.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Invalid enum value in string column | `RE` Zod rejects | **`S`** silently accepted | **`S`** silently accepted |
| Invalid value in categorical/factor | `RE` Zod rejects | **`S`** added to levels | **`S`** becomes NA |

### 35 — Pivot Column Mismatch
Tidy-TS provides detailed errors for pivot operations. Python/R silently fill missing combinations with NaN/NA.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Missing value combinations in pivot | `RE` detailed error | **`S`** NaN fill | **`S`** NA fill |
| Expected column absent after pivot | `RE` lists available | **`S`** column missing | **`S`** column missing |

### 36 — Descriptive Column Existence Messages
Tidy-TS error messages include available columns. Python/R give minimal context.

| Error | Tidy-TS | Python | R |
|-------|---------|--------|---|
| Wrong column in groupBy | `RE` + available cols | `RE` just column name | `RE` better msg, no col list |
| Wrong column in select | `RE` + available cols | `RE` just column name | `RE` no col list |

## Summary Matrix (Empirically Verified)

### Compile-Time Safety (Classes 01–30)

| # | Error Class | Tidy-TS | Python | R |
|---|------------|---------|--------|---|
| 01 | Column references | `C` | `RE` | `RE` |
| 02 | Type mismatches | `C` | `RE` / **`S`** | `RE` / `RW` / **`S`** |
| 03 | Join keys | `C` | `RE` | `RE` |
| 04 | Schema evolution | `C` | `RE` | `RE` |
| 05 | Null safety | `C` | **`S`** | **`S`** |
| 06 | Schema validation | `C` + `RE` | `RE` / **`S`** | `RE` / `RW` / **`S`** |
| 07 | Pipeline composition | `C` | `RE` | `RE` |
| 08 | Async/sync confusion | `C` | **`S`** | N/A |
| 09 | API escape / mutation | `C` | **`S`** | `RW` / **`S`** |
| 10 | Conversion narrowing | `C` | **`S`** | `RW` / **`S`** |
| 11 | Null narrowing | `C` | **`S`** | **`S`** |
| 12 | Aggregation on missing | `C` | **`S`** | **`S`** |
| 13 | Bind rows schema | `C` | **`S`** | **`S`** |
| 14 | Pivot schema | `C` | `RE` | `RE` |
| 15 | Distinct narrowing | `C` | **`S`** | **`S`** |
| 16 | Mixed return types | `C` | **`S`** | **`S`** / `RW` |
| 17 | Join nullability | `C` | **`S`** | **`S`** |
| 18 | Column name collision | `C` | **`S`** / `RE` | **`S`** / `RE` |
| 19 | GroupBy state | `C` | `RE` / **`S`** | **`S`** |
| 20 | Implicit type coercion | `C` | **`S`** | `RE` / **`S`** |
| 21 | Aggregation return type | `C` | **`S`** | **`S`** |
| 22 | Temporal type safety | `C` | **`S`** | **`S`** |
| 23 | Grouped operation context | `C` | **`S`** | **`S`** |
| 24 | Window function output | `C` | **`S`** | **`S`** |
| 25 | Column type constraint | `C` | **`S`** / `RE` | `RE` / **`S`** |
| 26 | Sort nullable columns | `C` | **`S`** | **`S`** |
| 27 | Append row type | `C` | **`S`** | **`S`** / `RE` |
| 28 | Reorder schema | `C` | **`S`** | **`S`** |
| 29 | Empty DataFrame ops | `C` | **`S`** | **`S`** |
| 30 | Transpose type safety | `C` | **`S`** / `RE` | **`S`** |

### Runtime Safety (Classes 31–36)

| # | Error Class | Tidy-TS | Python | R |
|---|------------|---------|--------|---|
| 31 | Nullable vs optional | `RE` | **`S`** | **`S`** |
| 32 | NaN/null explicit handling | `RE` (NaN/null) / **`S`** (Inf) | **`S`** / `RW` | **`S`** |
| 33 | Duplicate column names | `RE` (mapping) / **`S`** (overwrite) | **`S`** | `RE` (tibble) / **`S`** (data.frame) |
| 34 | Enum validation | `RE` | **`S`** | **`S`** |
| 35 | Pivot column mismatch | `RE` | **`S`** | **`S`** |
| 36 | Column existence messages | `RE` (available cols) | `RE` (minimal) | `RE` (partial) |

### Key Observations

- **Tidy-TS catches 34 of 36 error classes fully** — 30 at compile time (`C`) and 4 with complete runtime guards (`RE`). Classes 32 and 33 have partial coverage (NaN/null but not Infinity; mapping duplicates but not overwrites).
- **Silent failures dominate both Python and R** across the majority of error classes. Of the 36 classes, **Python has silent failures in 30** and **R has silent failures in 31**.
- **R's `mean()`, `sum()`, and `min()` return NA with NO warning** when any value is NA. The `na.rm = TRUE` requirement is pure developer discipline.
- **Python's pandas 3.x improved** some behaviors (arithmetic on strings now errors instead of silently coercing), but NaN propagation, silent aggregation skipping, and coroutine storage remain silent.
- **Python's `*` operator on mixed-type columns performs string repetition** instead of multiplication — producing plausible-looking but completely wrong results (20b, 25a).
- **Window functions (24) silently introduce missing values** in both languages — `shift()`/`lag()` insert NaN/NA with no type-level indication.
- **Grouped operations (19, 23) silently change semantics** — the same code produces different results on grouped vs ungrouped DataFrames with no warning.
- **Empty DataFrames (29) produce surprising edge-case results** — `sum()` returns 0 and `mean()` returns NaN, both silently.
- **Runtime safety (31–36) fills gaps** where compile-time types can't help: nullable vs optional semantics, explicit NaN/null handling, enum validation, pivot column validation, and descriptive error messages. Infinity propagation and rename-to-existing-column are known gaps.
- **Runtime errors (`RE`) are the best case** for Python and R — at least the program stops. The bold **`S`** entries are the dangerous ones: plausible-looking but incorrect results.
