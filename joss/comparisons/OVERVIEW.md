# Error Class Overview

34 error classes organized into 6 categories. Each class tests a specific failure mode across TypeScript (compile-time + runtime), Python/pandas, and R/tidyverse.

## Overlap and consolidation notes

Several classes test variations of the same underlying pattern. These are kept separate because they exercise different transforms and have different outcomes across languages, but readers should understand the shared theme.

**"Column disappeared after transform" cluster (Cat 1):** Classes 04, 07, 14, 15, 28 all test access to a column that no longer exists after a schema-narrowing operation. They differ in *which* transform causes the narrowing:
- 04: select / summarize
- 07: rename / summarize
- 14: pivot (column set changes entirely)
- 15: distinct (Python/R keep all columns; TS drops non-specified)
- 28: select-as-reorder (user intends reorder but drops columns)

All three languages catch these at runtime (the column simply isn't there). The differentiator is that TS catches them at compile time — the return type of each transform accurately reflects which columns survive.

**"Aggregation on nullable data" cluster (Cat 3):** Classes 12 and 21 both test what happens when you aggregate a column with missing values and then do arithmetic on the result. 12 tests four aggregation functions (mean, sum, min, groupby mean); 21 focuses on sum's return type and downstream division. The shared finding: TS types the aggregation result as `number | null`, blocking naive arithmetic; Python silently skips NaN; R propagates NA.

**"Row binding schema mismatch" cluster (Cat 5):** Classes 13, 20, 27 all test combining rows from sources with different schemas:
- 13: bindRows with different column sets (missing columns become optional)
- 20: bindRows with same column names but different types (type coercion)
- 27: append single row with wrong shape or type

The shared finding: TS validates schema compatibility at compile time; Python/R silently fill missing columns with NaN/NA or coerce types.

**Class 31 placement:** Nullable vs Optional (31) could fit in Category 3 (Null/Missing) or Category 5 (Schema Composition). It's placed in Category 6 because it tests a *semantic distinction* — null means "value explicitly absent" vs undefined means "field not present" — that Python/R cannot express at all (both collapse to NaN/NA). This is more of a type-system design feature than a null-propagation bug.

## Category 1: Column & Schema Reference

Does the column exist? Is it spelled correctly? Is it still available after a transform?

| Class | Name | Cases | Key finding |
|-------|------|-------|-------------|
| 01 | Column Reference Errors | 3 | All three catch misspelled columns at runtime; TS also at compile time |
| 04 | Schema Evolution Through Pipelines | 3 | All three catch access to dropped columns; TS tracks schema through select/summarize |
| 07 | Pipeline Composition Errors | 2 | All three catch stale column names after rename/summarize |
| 14 | Pivot Type Safety | 2 | All three catch nonexistent pivot columns and missing pre-pivot columns |
| 15 | Distinct Column Narrowing | 2 | TS narrows schema after distinct; Python/R keep all columns silently |
| 28 | Reorder vs Select Schema Preservation | 1 | TS tracks dropped columns after select; Python/R silently drop |
| 36 | Column Existence Error Messages | 2 | All three throw on wrong column; TS includes available column list in error |

## Category 2: Type Safety

Is the operation valid for this column's type?

| Class | Name | Cases | Key finding |
|-------|------|-------|-------------|
| 02 | Type Mismatch Errors | 3 | TS blocks string*number and string===number at compile time; Python/R catch some at runtime |
| 10 | Type Conversion and Narrowing | 3 | TS tracks nullable types through conversion; Python/R silently propagate NaN/NA |
| 16 | Return Type Consistency in Mutate | 1 | TS blocks arithmetic on union column; Python repeats strings, R coerces to NA |
| 22 | Temporal Type Safety | 3 | TS blocks date>number and date+number at compile time; R silently allows (Date is integer internally) |
| 25 | Column Type Constraint in Specialized Verbs | 1 | TS blocks numeric ops on string columns; Python repeats strings silently |
| 30 | Row Label Transpose Type Safety | 2 | TS tracks type changes through transpose; Python/R silently coerce |
| 34 | Enum Validation | 1 | TS blocks comparison to values outside the union type (TS2367 no overlap) |

## Category 3: Null / Missing Data Propagation

Does null/NaN/NA silently corrupt downstream operations?

| Class | Name | Cases | Key finding |
|-------|------|-------|-------------|
| 05 | Null Safety Errors | 3 | TS makes nullability explicit in types; Python/R silently propagate NaN/NA |
| 11 | Null Narrowing via replaceNull/removeNull | 2 | TS narrows types after null handling; Python/R allow re-introduction silently |
| 12 | Aggregation on Columns with Missing Data | 4 | TS types aggregation results as nullable; Python skips NaN, R propagates NA |
| 21 | Aggregation Return Type Narrowing | 2 | TS tracks nullable through aggregation + arithmetic; Python/R silently skip or propagate |
| 24 | Window Function Output Type | 2 | TS types lag/shift output as nullable; Python/R silently introduce NaN/NA |
| 26 | Sorting on Nullable Columns | 2 | TS blocks arithmetic on nullable sort results; Python/R silently place NaN/NA at end |
| 35 | Pivot Column Mismatch | 1 | TS types missing pivot combinations as undefined; Python/R silently produce NaN/NA |

## Category 4: Join Safety

Key mismatches, nullability from unmatched rows, column name collisions.

| Class | Name | Cases | Key finding |
|-------|------|-------|-------------|
| 03 | Join Key Errors | 3 | All three catch missing/misspelled join keys |
| 17 | Join Nullability | 3 | TS types unmatched rows as nullable; Python/R silently produce NaN/NA |
| 18 | Column Name Collision in Joins | 2 | All three rename colliding columns; TS tracks new names in types |

## Category 5: Schema Composition

Combining data from multiple sources — row binding, appending, validation at I/O boundaries.

| Class | Name | Cases | Key finding |
|-------|------|-------|-------------|
| 06 | Schema Validation at Data Boundaries | 3 | TS validates via Zod schema at I/O; Python/R silently accept bad data |
| 13 | Bind Rows Schema Mismatch | 2 | TS types missing columns as optional; Python/R silently fill with NaN/NA |
| 20 | Implicit Type Coercion in Row Binding | 2 | TS preserves column types through binding; Python coerces to object, R errors or coerces |
| 27 | Append Row Type Mismatch | 2 | TS validates row shape at compile time; Python silently fills/coerces |
| 33 | Duplicate Column Names | 1 | TS blocks duplicate keys in object literals (TS1117); Python/R error at runtime |

## Category 6: Contextual & Runtime Safety

Grouping state, async/sync confusion, API escape hatches, edge cases.

| Class | Name | Cases | Key finding |
|-------|------|-------|-------------|
| 08 | Async/Sync Confusion | 1 | TS preserves Promise type, blocks comparison; Python silently stores coroutines |
| 09 | Forbidden Array Methods / API Escape | 3 | TS blocks .map()/.push()/.reduce() on DataFrame; Python/R allow direct mutation |
| 19 | GroupBy State Tracking | 1 | TS separates grouped/ungrouped types; Python silently produces MultiIndex |
| 29 | Empty DataFrame Operations | 2 | All three silently fabricate values (0 for sum, NaN for mean) — inherent limitation |
| 31 | Nullable vs Optional Distinction | 2 | TS distinguishes null (value absent) from undefined (field missing); Python/R conflate both as NaN/NA |
