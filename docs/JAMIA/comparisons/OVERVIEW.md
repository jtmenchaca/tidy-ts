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

The 65 test cases are organized into 4 categories, each defined by the **type system mechanism** that catches the error:

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


### Criteria columns and evaluation rules

Each per-probe table below includes six criteria columns. The criteria are scored Y (yes) or N (no) for each probe, and the severity determination follows mechanically from the evaluation rules.

**High criteria (all three required — AND):**

| Column | Criterion | Definition |
|--------|-----------|------------|
| **AV** | Alters computed values | The error changes a numeric result, cohort membership, or categorical assignment that would enter an analytic endpoint, quality measure, or decision rule |
| **PS** | Propagates systematically | The alteration affects every row meeting a structurally defined condition in the same direction, OR it systematically excludes/includes patients from a cohort |
| **PO** | Produces plausible output | The corrupted result is within a range that would not be flagged by routine inspection absent domain-specific validation |

**Low criteria (any one sufficient — OR):**

| Column | Criterion | Definition |
|--------|-----------|------------|
| **OI** | Obviously implausible output | The result is outside any plausible range (zero rows, all-NaN column, negative count, table with no columns) such that no analyst would proceed without investigation |
| **NA** | Non-analytic only | The error changes display formatting, column ordering, sort stability, or error message quality with no effect on computed values |
| **SC** | Self-correcting | The error would be overwritten or discarded by a subsequent mandatory step in the pipeline |

**Evaluation rules:**

1. If AV=Y ∧ PS=Y ∧ PO=Y → **High**
2. Otherwise → **Low**

An error is Low if it does not meet all three High criteria. Low errors either produce obviously wrong output, affect only non-analytic properties, would be overwritten, or fail to meet the systematic-and-plausible threshold required for High.

### Per-probe classification

#### Category 1: Column & Schema Reference (16 probes)

| Probe | AV | PS | PO | OI | NA | SC | Severity | Rationale |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|----------|-----------|
| 1a: misspelled column name in expression | Y | Y | N | Y | — | — | Low | If undetected, every row gets `undefined` for the misspelled column — but the resulting all-undefined/NaN column is obviously implausible. All three ecosystems error at runtime. |
| 1b: nonexistent column in predicate | Y | Y | N | Y | — | — | Low | Same as 1a — predicate on nonexistent column would produce all-false or all-undefined, yielding zero rows or a visibly broken filter. All three error. |
| 1c: misspelled column name in sort | N | N | N | Y | — | — | Low | Sort on nonexistent column halts execution; if it silently ignored the column, the table would be unsorted — obviously wrong order visible on inspection. All three error. |
| 1d: column dropped by selection still referenced | Y | Y | N | Y | — | — | Low | Accessing a dropped column yields undefined for every row — all-undefined column is obviously implausible. All three error. |
| 1e: original column referenced after aggregation | Y | Y | N | Y | — | — | Low | After summarize, the original column no longer exists — accessing it yields undefined for every summary row. All three error. |
| 1f: dropped column used in sort | N | N | N | Y | — | — | Low | Same as 1c — sort on dropped column halts or silently produces unsorted output. All three error. |
| 1g: old column name used after rename | Y | Y | N | Y | — | — | Low | Old name yields undefined for every row — all-undefined column is obviously implausible. All three error. |
| 1h: pre-aggregation column referenced after summarize | N | N | N | Y | — | — | Low | All three error at access. The summarize silently removes columns the analyst may have expected to survive, but accessing the missing column produces an obviously wrong result (OI). |
| 1i: undeclared column after pivot | N | N | N | Y | — | — | Low | All three error at access. The pivot silently determines which columns exist based on data values, but accessing a nonexistent column produces an obviously wrong result (OI). |
| 1j: consumed column referenced after pivot | N | N | N | Y | — | — | Low | All three error at access. The pivot consumes the column silently, but accessing the consumed column produces an obviously wrong result (OI). |
| 1k: unselected column referenced after distinct | Y | Y | Y | — | — | — | High | **Py/R silent.** pandas `drop_duplicates` keeps all columns with arbitrary row choices; R `distinct` keeps unselected columns with arbitrary values. The retained columns have values selected from duplicated groups — this alters downstream joins/group-bys (AV), affects every duplicated group identically (PS), and produces a valid-looking table with plausible values (PO). |
| 1l: narrowed schema after distinct without keep-all | Y | Y | Y | — | — | — | High | **Py/R silent.** Same mechanism as 1k — retained columns have arbitrarily selected values from duplicated groups. Alters cohort characteristics (AV), affects every duplicated group (PS), produces a table that looks structurally correct (PO). |
| 1m: unselected column referenced after select | Y | Y | Y | — | — | — | High | **Py/R silent.** `select(a, b)` silently drops other columns. If downstream code assumes dropped columns exist, the narrower table silently enters analysis — alters derived values that depend on the missing columns (AV), affects every row (PS), and the table with fewer columns looks structurally valid (PO). |
| 1n: error message lists available columns | N | N | N | — | Y | — | Low | Diagnostic quality only — affects debuggability, not analytical correctness. No computed values are changed. |
| 1o: error message on invalid column access | N | N | N | — | Y | — | Low | Same as 1n — error message content affects developer experience, not analytic output. |
| 1p: residual grouping after summarize | Y | Y | Y | — | — | — | High | A subsequent aggregation on still-grouped data operates on groups the analyst didn't expect — Py produces MultiIndex, R gives 2 rows instead of 1. Alters the aggregate result (AV), affects every group in the still-grouped DataFrame (PS), and the per-group result looks like a valid summary table — just at the wrong granularity (PO). |

**Summary:** 4 High, 12 Low.

#### Category 2: Type Safety (14 probes)

| Probe | AV | PS | PO | OI | NA | SC | Severity | Rationale |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|----------|-----------|
| 2a: arithmetic on string column | Y | Y | N | Y | — | — | Low | `test_name * 10` produces NaN for every string row (PS), which alters computed values (AV), but an all-NaN numeric column is visibly wrong on inspection (PO=N, OI). |
| 2b: numeric aggregation on string column | Y | Y | N | Y | — | — | Low | `s.mean(test_name)` returns null/NA for the entire group — a null aggregate is visible on inspection (PO=N, OI). |
| 2c: number compared to string literal | Y | Y | Y | — | — | — | High | `result_value === "high"` returns 0 rows — silently drops an entire cohort. Alters cohort membership (AV), affects every row identically (PS), and an empty result is plausible as "no patients matched this filter" in a multi-step pipeline (PO). |
| 2d: unparseable string silently becomes null/NaN | Y | Y | Y | — | — | — | High | `Number("pending")` produces NaN for every unparseable row. Alters the converted column (AV), affects every structurally unparseable value (PS), and the column contains a mix of valid numbers and NaN that looks plausible (PO). |
| 2e: arithmetic on nullable after conversion | Y | Y | Y | — | — | — | High | `null * 2` produces 0 (JS) or NaN propagation. Alters derived values (AV), affects every null-bearing row (PS), and numeric output interspersed with 0 or NaN is plausible (PO). |
| 2f: aggregation skips null/NaN after conversion | Y | Y | Y | — | — | — | High | Mean silently excludes NaN rows, computing over fewer observations. Alters the aggregate (AV), systematically excludes the same rows (PS), and the resulting mean is a valid number within range (PO). |
| 2g: arithmetic on mixed-type return column | Y | Y | N | Y | — | — | Low | `"HIGH" * 2` produces NaN (JS) or `"HIGHHIGH"` (Py string repetition). Alters values (AV) for every row where the mixed return is a string (PS), but the output is visibly wrong — "HIGHHIGH" or NaN in a numeric column is obviously implausible (PO=N, OI). |
| 2h: invalid date string parse | Y | N | N | Y | — | — | Low | Invalid date string produces NaT/NA for one specific row, not a structurally defined class (PS=N). The missing date is visible on inspection as a null in a date column (PO=N, OI). |
| 2i: date compared to number | Y | Y | N | Y | — | — | Low | `date > 100` compares dates to an integer — R silently uses internal integer representation, returning nonsensical results. The output (all rows pass or fail based on epoch days) is obviously wrong on inspection (OI). |
| 2j: date + number arithmetic | Y | Y | N | Y | — | — | Low | `date + 7` in R adds 7 days instead of failing — semantically wrong but the shifted dates are obviously different from expected values on inspection (OI). |
| 2k: numeric function applied to string column | Y | Y | N | Y | — | — | Low | `Math.log("Medicare")` produces NaN; Py repeats strings. Alters values (AV) for every string row (PS), but an all-NaN column or repeated strings are visibly wrong on inspection (PO=N, OI). |
| 2l: arithmetic on transposed mixed-type column | Y | Y | Y | — | — | — | High | After transpose, `row_0 * 2` produces `"systolicsystolic"` instead of a number. Alters the derived value (AV), affects every row with string-typed cells (PS), and in a wider table the string value may not be inspected before entering further calculations (PO). |
| 2m: pre-transpose column name after transpose | Y | Y | N | Y | — | — | Low | Accessing `P001` after transpose yields undefined for every row — all-undefined column is obviously implausible (OI). All three ecosystems error. |
| 2n: filter on invalid enum value | Y | Y | N | Y | — | — | Low | `status === "unknown"` returns 0 rows. The empty result is obviously implausible in context — the analyst is filtering on a known status enum and gets no matches (OI). |

**Summary:** 5 High, 9 Low.

#### Category 3: Null & Missing Data (17 probes)

| Probe | AV | PS | PO | OI | NA | SC | Severity | Rationale |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|----------|-----------|
| 3a: method call on nullable column | Y | Y | N | Y | — | — | Low | `.toFixed()` on null throws or produces NaN for every null-bearing row (AV, PS), but an all-NaN formatted column is visibly wrong on inspection (PO=N, OI). |
| 3b: arithmetic on nullable column | Y | Y | Y | — | — | — | High | `result_value - reference_high` produces NaN for every null-bearing row. Alters the derived column (AV), affects every row where `reference_high` is null (PS), and the column contains a mix of valid numbers and NaN that looks plausible in a lab-value context (PO). |
| 3c: comparison on nullable column | Y | Y | Y | — | — | — | High | `reference_high > 100` silently excludes null rows from the filter. Alters cohort membership (AV), systematically excludes every patient with a missing reference range (PS), and the smaller cohort is a plausible subset (PO). |
| 3d: arithmetic on nullable before narrowing | Y | Y | Y | — | — | — | High | `result_value / reference_high` produces Infinity/NaN for null rows. Alters derived values (AV), affects every null-bearing row (PS), and Infinity values interspersed with valid ratios may not be caught without range checks (PO). |
| 3e: arithmetic after re-introducing null | Y | Y | Y | — | — | — | High | After `replaceNull` and re-introduction via mutate, division again produces Infinity/NaN. Alters values (AV), affects every re-nullified row (PS), and the analyst may assume nulls were already handled, making the corrupted output less likely to be inspected (PO). |
| 3f: mean on nullable column then arithmetic | Y | Y | Y | — | — | — | High | Mean silently skips NaN (Py) or returns NA (R), then `avg * 2` uses the biased/missing aggregate. Alters the aggregate (AV), systematically excludes the same null-bearing observations (PS), and the resulting mean is a valid number within the expected range (PO). |
| 3g: sum on nullable column then arithmetic | Y | Y | Y | — | — | — | High | Sum silently skips NaN (Py) or returns NA (R). Alters the total (AV), excludes the same null-bearing rows (PS), and the sum is a valid number — just biased low (PO). |
| 3h: min on nullable column then arithmetic | Y | Y | Y | — | — | — | High | Min silently skips NaN (Py) or returns NA (R). Alters the min (AV), excludes null-bearing rows (PS), and the min is a valid number from the non-null subset (PO). |
| 3i: groupby mean on nullable column then arithmetic | Y | Y | Y | — | — | — | High | Grouped mean skips NaN per group (Py) or returns NA per group (R). Alters per-group averages (AV), introduces differential bias across groups with different missingness rates (PS), and per-group means are valid numbers within range (PO). |
| 3j: sum silently skips or returns null | Y | Y | Y | — | — | — | High | Py skips NaN and returns a number (biased low); R returns NA. Alters the aggregate (AV), systematically under-counts the same null-bearing observations (PS), and the sum is a plausible number (PO). |
| 3k: arithmetic on null-skipped aggregation result | Y | Y | Y | — | — | — | High | `total / 2` on a biased sum produces a biased derived value. Alters the endpoint (AV), the bias propagates from the same systematic exclusion (PS), and the derived value is numerically plausible (PO). |
| 3l: shift/lag introduces null at boundary | Y | N | N | Y | — | — | Low | `lag()` introduces NaN/NA at position 0 — this is inherent to the operation (no prior value exists). The null at the boundary is a single fixed position, not a structurally defined condition (PS=N), and a NaN in the first row of a lagged column is obviously visible on inspection (OI). |
| 3m: arithmetic on lagged null propagates | Y | Y | Y | — | — | — | High | `value - lag(value)` produces NaN at the boundary. Alters the derived change column (AV), affects every time series at its first observation (PS), and in a column of inter-visit changes, one NaN among valid differences is plausible — it may be silently excluded from downstream aggregation (PO). |
| 3n: sort silently places null at end | Y | Y | Y | — | — | — | High | Null values sorted to end without warning. Alters which records appear in top-N/bottom-N selections (AV), systematically excludes patients with missing values from the selected subset (PS), and the selected records are valid — the analyst sees real lab values, just from a biased subset (PO). |
| 3o: arithmetic on null from missing pivot combination | Y | Y | N | Y | — | — | Low | Pivot produces NaN for missing combinations, then `systolic - diastolic` produces NaN. Alters derived values (AV), affects every patient missing a vital sign (PS), but the NaN cells in the pivoted table are visible upon inspection before downstream arithmetic — the missing combinations are apparent in the pivot output (PO=N, OI). |
| 3p: null vs missing conflated | Y | Y | Y | — | — | — | High | Py/R collapse null and missing to NaN/NA. Alters downstream operations that depend on the distinction (AV) — e.g., "lab result was null" vs "lab was not ordered" receive identical treatment. Affects every row with either null or missing values (PS), and the conflated values produce valid-looking output — the loss of semantic distinction is not visible in the data itself (PO). |
| 3q: conditional fill on null vs missing | Y | Y | Y | — | — | — | High | `fillna()` fills both null and missing identically. Alters fill logic that should distinguish the two cases (AV), affects every row with either null or absent values (PS), and the filled column contains plausible values — the analyst cannot tell from the output that absent fields were incorrectly filled (PO). |

**Summary:** 14 High (3b–3k, 3m, 3n, 3p, 3q), 3 Low (3a, 3l, 3o).

#### Category 4: Join Safety (8 probes)

| Probe | AV | PS | PO | OI | NA | SC | Severity | Rationale |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|----------|-----------|
| 4a: join on key not in left table | N | N | N | Y | — | — | Low | Join on nonexistent key halts execution; if it silently produced a cross join or empty result, the output would be obviously wrong (OI). All three error. |
| 4b: join on misspelled key | N | N | N | Y | — | — | Low | Same as 4a — misspelled key halts or produces obviously wrong join output (OI). All three error. |
| 4c: access missing column post-join | N | N | N | Y | — | — | Low | All three error at access. The join itself succeeds and the schema change is silent, but accessing the missing column produces an obviously wrong result (OI). |
| 4d: string method on join-introduced null | Y | Y | Y | — | — | — | High | `.toUpperCase()` on join-introduced undefined/NaN produces NaN for every unmatched row. Alters derived string values used as downstream keys or labels (AV), affects every unmatched patient from the left join (PS), and the NaN values are interspersed with valid strings in a column that otherwise looks correct (PO). |
| 4e: arithmetic on join-introduced null | Y | Y | Y | — | — | — | High | `los_days / 7` produces NaN for every unmatched row. Alters derived numeric values (AV), affects every patient without a matching encounter (PS), and the column contains a mix of valid weeks and NaN that is plausible in clinical data with expected missingness (PO). |
| 4f: comparison silently excludes null rows | Y | Y | Y | — | — | — | High | `los_days > 2` silently evaluates to false for undefined rows, excluding all unmatched patients. Alters cohort membership (AV), systematically excludes every unmatched patient (PS), and the resulting cohort is a valid-looking subset — just silently narrowed to only patients with matches (PO). |
| 4g: explicit suffix then access original name | N | N | N | Y | — | — | Low | All three error at access. The suffix renaming is expected behavior; accessing the original name produces an obviously wrong result (OI). |
| 4h: default suffix then access original name | N | N | N | Y | — | — | Low | All three error at access. The default suffix silently renames colliding columns, but accessing the original name produces an obviously wrong result (OI). |

**Summary:** 3 High (4d, 4e, 4f), 5 Low.

#### Category 5: Schema Composition (10 probes)

| Probe | AV | PS | PO | OI | NA | SC | Severity | Rationale |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|----------|-----------|
| 5a: non-numeric value in numeric column at load time | Y | Y | Y | — | — | — | High | A "pending" string in a numeric column silently becomes object dtype (Py) or NA (R). Alters every downstream numeric operation on that column (AV), affects every row with the non-numeric value (PS), and the column looks like a valid numeric column with a few missing values — dtype changes are not visible without explicit inspection (PO). |
| 5b: accessing nonexistent column after schema-validated load | Y | Y | N | Y | — | — | Low | Accessing a column not in the Zod schema yields undefined for every row — all-undefined column is obviously implausible (OI). All three error. |
| 5c: empty cell in non-null column at load time | Y | Y | Y | — | — | — | High | Empty cells silently become NaN/NA in a column declared non-nullable. Alters joins and group-bys that use the column as a key (AV), affects every row with an empty cell (PS), and the NaN values are interspersed with valid data — the column looks mostly complete (PO). |
| 5d: accessing optional column after mismatched row bind | Y | Y | Y | — | — | — | High | Missing columns filled with NaN/NA after `bindRows`. Alters derived values for every row from the table lacking the column (AV), systematically affects all rows from one source (PS), and the column contains a mix of valid values and NaN that looks like expected clinical missingness (PO). |
| 5e: string operation on NaN/NA column after row bind | Y | Y | N | Y | — | — | Low | `.toUpperCase()` on NaN produces "NaN" string or NA for every row from the table lacking the column (AV, PS), but "NaN" appearing as a string value is visibly wrong on inspection (PO=N, OI). |
| 5f: implicit type coercion when binding rows with different column types | Y | Y | N | Y | — | — | Low | `bindRows` with number + string columns silently coerces to object dtype (Py). Alters the column type for every row (AV, PS), but the dtype change is visible via `.dtypes` inspection — the column showing "object" instead of "float64" is a detectable anomaly (PO=N, OI). |
| 5g: arithmetic on mixed-type column after coerced row bind | Y | Y | Y | — | — | — | High | `dose * 2` on a coerced column produces string repetition (Py: `"sliding scale" * 2` → repeats) or logical-to-numeric coercion (R). Alters computed values (AV), affects every row with the wrong type (PS), and numeric output interspersed with wrong values (e.g., `650` next to a repeated string) may not be caught without row-level inspection (PO). |
| 5h: appending row with missing column | Y | N | N | Y | — | — | Low | Missing column in appended row filled with NaN/NA — affects a single row, not a structurally defined condition (PS=N). The NaN is visible if the column is inspected (PO=N, OI). |
| 5i: appending row with wrong column type | Y | N | N | Y | — | — | Low | Wrong type in one appended row silently coerced (Py) or errors (R). Affects a single row (PS=N), and the dtype change is visible on inspection (OI). |
| 5j: string operation on duplicate column name | N | N | N | Y | — | — | Low | Duplicate column names cause ambiguous operations — all ecosystems error or produce obviously broken output (OI). |

**Summary:** 4 High (5a, 5c, 5d, 5g), 6 Low.
