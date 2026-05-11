# Comparison Suite Overview

## What this suite measures

Each test case poses the same question across three ecosystems (TypeScript/Tidy-TS, Python/pandas, R/tidyverse): **when a common data analysis mistake is made, does the framework catch it — and when?**

Outcomes are classified by detection stage:

| Symbol | Meaning |
|--------|---------|
| `C` | Caught at compile time (TypeScript type checker) |
| `RE` | Caught at runtime (exception thrown) |
| `RW` | Runtime warning (execution continues) |
| `S` | Silent — wrong result produced with no indication |

## Categories

The 67 test cases are organized into 4 categories, each defined by the **type system mechanism** that catches the error:

### Category 1: Column Existence (23 cases)

**Mechanism:** Property key not present on the row type.

The type system tracks which columns exist at each point in a pipeline. When a column is misspelled, dropped by `select`, consumed by `pivot`, renamed, removed by `summarize`, or disambiguated by a join suffix — the row type no longer includes that key, and access is a compile error.

This category covers:
- Misspelled or nonexistent column names (in mutate, filter, arrange)
- Columns removed by select, drop, summarize, distinct, pivot
- Stale column names after rename
- Columns consumed or created by pivot
- Column names changed by join suffix disambiguation
- Column names changed by transpose
- Error message quality (available column lists)
- Residual grouping state (summarize narrows available columns)

All three languages catch most of these at runtime (the column simply isn't there). The differentiator is that TypeScript catches them at compile time — the return type of each transform accurately reflects which columns survive.

### Category 2: Type Compatibility (15 cases)

**Mechanism:** Operation not valid for the column's type.

The type system knows each column's type and rejects operations that don't make sense: arithmetic on strings, comparison between incompatible types (date vs number), method calls not available on union types, filtering by values outside a literal union.

This category covers:
- Arithmetic on string columns (`test_name * 10`)
- Numeric aggregation on string columns (`s.mean(test_name)`)
- Cross-type comparison (`result_value === "high"`)
- Operations on union-typed columns from mixed returns (`(number | "HIGH") * 2`)
- Date compared to number, date + number arithmetic
- Numeric functions applied to string columns (`Math.log(insurance)`)
- Arithmetic on transposed mixed-type columns
- Enum literal narrowing (`status === "unknown"` when Status is a union)
- Type coercion in bindRows (union type blocks `.toFixed()` and `* 2`)
- Duplicate property detection in object literals (TS1117)
- Empty DataFrame operations (type system doesn't track emptiness — all three silent)

Python and R catch some of these at runtime (pandas 3.x rejects string arithmetic; R errors on `across` with wrong type). Others are silent — Python's `*` operator on mixed-type columns performs string repetition instead of multiplication; R silently treats Date as integer internally.

### Category 3: Null Safety (25 cases)

**Mechanism:** Nullable type (`T | null`, `T | undefined`) blocks operations that assume non-null.

The type system tracks nullability through every transform. When a column is declared nullable, introduced as nullable by a left join, made nullable by a conversion that can fail, returned as nullable by aggregation on nullable data, or has undefined injected by `lag()`/bindRows — the type includes `null` or `undefined`, and arithmetic, method calls, and comparisons are compile errors until the developer explicitly narrows.

This category covers:
- Method calls on nullable columns (`.toFixed()`, `.toUpperCase()`)
- Arithmetic on nullable columns (`result_value - reference_high`)
- Comparison on nullable columns (`reference_high > 100`)
- Arithmetic before and after null narrowing (`replaceNull` then re-introduction)
- Aggregation on nullable data (mean, sum, min, groupby mean) then downstream arithmetic
- Aggregation return type tracking (`s.sum()` returns `number | null` on nullable input)
- Window functions introducing null (`s.lag()` returns `(T | undefined)[]`)
- Sort preserving nullability (arithmetic on sorted nullable column blocked)
- Pivot missing combinations typed as nullable
- Join-introduced nullability (left join right-side columns become `T | undefined`)
- Conversion-introduced nullability (string-to-number producing `number | null`)
- Null vs undefined distinction (TypeScript preserves the semantic difference; Python/R collapse both to NaN/NA)
- bindRows-introduced optionality (columns unique to one side become `T | undefined`)

This is the largest category because it's where the gap between static and dynamic typing is widest. Python silently skips NaN in aggregation, silently propagates NaN through arithmetic, and silently excludes NaN rows from comparisons. R silently returns NA from aggregation (requiring `na.rm = TRUE` by developer discipline) and silently propagates NA. In both cases, the result looks plausible but is wrong.

### Category 4: Data Boundary Validation (4 cases)

**Mechanism:** Runtime guards reject invalid input at I/O and composition boundaries.

These are not compile-time type checks — they're runtime validation that fires when data enters the system. Tidy-TS uses Zod schemas with `readCSV` to reject rows that don't match the declared types, and validates row shape on `append`.

This category covers:
- Non-numeric value in a numeric column rejected by Zod at CSV load
- Empty cell in a non-null column rejected by Zod at CSV load
- Missing column in appended row rejected at runtime
- Wrong type in appended row rejected at runtime

Python and R either silently accept the bad data (pandas coerces to object dtype, empty cells become NaN) or produce a warning (R's `as.numeric` coercion warning). The bad data enters the pipeline and corrupts downstream operations silently.

This category is intentionally small — it represents a different *kind* of safety (runtime validation, not compile-time types) and shows the library contributes beyond leaning on the TypeScript compiler.

## Related work

Several strands of prior work address individual aspects of what this suite measures. No single prior work combines a mechanism-based error taxonomy, detection-stage classification (compile vs runtime vs silent), and executable probes comparing statically-typed and dynamically-typed DataFrame ecosystems.

**Typed DataFrame libraries.** Frameless (Scala/Spark) uses shadow types and Shapeless to catch column reference errors and type mismatches at compile time ([TypedDataset docs](https://typelevel.org/frameless/TypedDatasetVsSparkDataset.html)). The Haskell `dataframe` library ([Hackage](https://hackage.haskell.org/package/dataframe)) ships a Typed API with phantom-type schema tracking and compile-time column validation. Both address Categories 1 and 2 — column existence and type compatibility — but neither formalizes an error taxonomy or compares detection behavior against untyped alternatives with executable probes. We have not found a comparable treatment in either library that uses nullability-through-transform behavior (Category 3) as a central design axis, though both have nontrivial type-level machinery that may address some nullable cases.

**Static typing for Python DataFrames.** `strictly-typed-pandas` ([docs](https://strictly-typed-pandas.readthedocs.io/en/latest/getting_started.html)) validates DataFrame schema at `DataSet[Schema]` creation and makes the dataset immutable so schema cannot change through in-place mutations; it positions mypy compatibility as a way to catch errors during linting. Pandera also offers experimental mypy integration for static DataFrame type-linting ([docs](https://pandera.readthedocs.io/en/stable/mypy_integration.html)). Both are pandas-only and neither tracks schema evolution through chained transforms the way a typed API with per-verb return types does.

**Type theory for data pipelines.** Guyot et al., "Preventing Technical Errors in Data Lake Analyses with Type Theory" (DaWaK 2023, [Springer](https://link.springer.com/chapter/10.1007/978-3-031-39831-5_2)) use type-theoretic restrictions on operator composition to transform schema/model transformation errors into type errors. Their scope is data lake analytical workflows, not DataFrame APIs, and the treatment is formal rather than empirical.

**Runtime validation frameworks.** Pandera ([docs](https://pandera.readthedocs.io/en/stable/dtype_validation.html)) classifies errors into DATA errors (values failing checks) and SCHEMA errors (extra columns, null values) — a two-category split focused on runtime validation (Category 4 only). A 2025 survey of Polars validation libraries ([Pointblank blog](https://posit-dev.github.io/pointblank/blog/validation-libs-2025/)) examines Pandera, Dataframely, and Patito — all runtime, none doing compile-time schema tracking. The pandas-stubs project ([VirtusLab](https://medium.com/virtuslab/pandas-stubs-how-we-enhanced-pandas-with-type-annotations-1f69ecf1519e)) adds type annotations to pandas addressing column reference and type compatibility but does not track schema evolution or nullability through pipelines.

**Data quality taxonomies.** "Wrangling Data Issues to be Wrangled" (arXiv 2405.16033, [paper](https://arxiv.org/abs/2405.16033)) proposes a taxonomy of data quality issues along attribute and outcome dimensions. Their categories describe what is wrong with the data (duplicates, missing values, inconsistencies), not what the programming language does about it — a different axis from what this suite measures.

**TypeScript ecosystem studies.** "From Logic to Toolchains: An Empirical Study of Bugs in the TypeScript Ecosystem" (arXiv 2601.21186, [paper](https://arxiv.org/html/2601.21186v1)) found that static typing in TypeScript has reduced traditional runtime and type errors but shifted fragility toward build systems and toolchains. This empirically validates the premise that TypeScript's type system reduces a class of bugs, though it does not address DataFrame-specific error classes.

The novelty of this suite is in the specific combination: a mechanism-based taxonomy (Column Existence, Type Compatibility, Null Safety, Data Boundary Validation), detection-stage classification (compile-time, runtime error, runtime warning, silent), and empirical cross-ecosystem comparison using executable probes across TypeScript/Tidy-TS, Python/pandas, and R/tidyverse. Each individual ingredient has prior art; the composition and measurement design do not, to our knowledge.

## Case mapping

For reference, here is how the original error class numbers map to the new categories:

| Original class | Category |
|----------------|----------|
| 01 (column reference) | 1 — Column Existence |
| 02a–c, 02g (type mismatch) | 2 — Type Compatibility |
| 02d–f (conversion narrowing) | 3 — Null Safety |
| 02h–l (temporal, transpose) | 2 — Type Compatibility |
| 02m (pre-transpose column) | 1 — Column Existence |
| 02n (enum filtering) | 2 — Type Compatibility |
| 03 (join keys) | 1 — Column Existence |
| 04 (schema evolution) | 1 — Column Existence |
| 05 (null safety) | 3 — Null Safety |
| 06a, 06c (schema validation) | 4 — Data Boundary Validation |
| 06b (missing column after load) | 1 — Column Existence |
| 07 (pipeline composition) | 1 — Column Existence |
| 08 (async/sync) | *removed* |
| 09 (forbidden methods) | *removed* |
| 10 (conversion narrowing) | 3 — Null Safety |
| 11 (null narrowing) | 3 — Null Safety |
| 12 (aggregation on missing) | 3 — Null Safety |
| 13 (bind rows schema) | 3 — Null Safety |
| 14 (pivot schema) | 1 — Column Existence |
| 15 (distinct narrowing) | 1 — Column Existence |
| 16 (mixed return types) | 2 — Type Compatibility |
| 17 (join nullability) | 3 — Null Safety |
| 18 (column name collision) | 1 — Column Existence |
| 19 (groupby state) | 1 — Column Existence |
| 20 (implicit type coercion) | 2 — Type Compatibility |
| 21 (aggregation return type) | 3 — Null Safety |
| 22 (temporal type safety) | 2 — Type Compatibility |
| 24 (window function output) | 3 — Null Safety |
| 25 (column type constraint) | 2 — Type Compatibility |
| 26 (sort nullable columns) | 3 — Null Safety |
| 27 (append row type) | 4 — Data Boundary Validation |
| 28 (reorder schema) | 1 — Column Existence |
| 29 (empty DataFrame ops) | 2 — Type Compatibility |
| 30 (transpose type safety) | 2 — Type Compatibility |
| 31 (nullable vs optional) | 3 — Null Safety |
| 33 (duplicate column names) | 2 — Type Compatibility |
| 34 (enum validation) | 2 — Type Compatibility |
| 35 (pivot column mismatch) | 3 — Null Safety |
| 36 (column existence messages) | 1 — Column Existence |
