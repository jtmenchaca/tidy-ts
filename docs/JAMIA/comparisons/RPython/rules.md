# RPython Bug Evaluation Rules

Rules for classifying bugs from the RPython dataset (ESEC/FSE 2023, arxiv 2306.08632) for use as external validation of the error taxonomy in the JAMIA comparison suite.

## Purpose

The JAMIA paper's comparison suite contains 65 author-designed error scenarios. The RPython dataset provides an independently curated corpus of ~1,400 real-world StackOverflow bugs in R and Python data analytics code. We use it to assess whether the error categories in our comparison suite reflect real-world bug patterns, and to show that scope honestly — what maps and what doesn't.

## Primary question

**Is this bug relevant to the paper's thesis that common data processing errors go undetected and produce incorrect output?**

## Inclusion criteria (all must be met)

1. **Data processing context** — The bug occurs during data analysis work: loading, selecting, joining, grouping, summarizing, filtering, mutating, or otherwise transforming tabular data. Not visualization rendering, not FFI/interop, not IDE/tooling.

2. **Silent or misleading outcome** — The bug either:
   - Produces incorrect output with no error or warning (silent continuation), OR
   - Produces an error that is confusing/misleading enough that the root cause is non-obvious

   Bugs where the program immediately crashes with a clear error message are less relevant — the existing language already caught it.

3. **Systematic, not incidental** — The error would affect every dataset or group that meets the condition, not a one-off edge case tied to a specific API version, platform, or environment.

4. **Cross-language evaluable** — The underlying operation (aggregation, join, column selection, type conversion, null handling, etc.) exists in all three ecosystems (TypeScript/tidy-ts, Python/pandas, R/tidyverse). The bug can't be purely about R metaprogramming (NSE), numpy memory layout, or a library with no equivalent.

## Classification (for included bugs)

Map each included bug to the paper's 5 error categories:

| Category | Description | Examples |
|----------|-------------|----------|
| **Column reference** | Column doesn't exist, was removed by a prior step, is misspelled, or is silently dropped | Referencing a column after summarize removed it; groupby silently dropping a column |
| **Value type** | Wrong type for an operation: string where number expected, int/double confusion, wrong accessor for column type, silent coercion | Object dtype failing numeric aggregation; int/double return inconsistency causing downstream corruption |
| **Missing value** | NA/NaN/null introduced or carried through without handling; changes behavior of aggregation, comparison, or arithmetic | NaN propagating through calculations; missing values silently excluded from comparisons |
| **Join** | Key type mismatch, missing values introduced by join, schema changes after join | Joining on int vs string keys; columns becoming nullable after left join |
| **Data loading** | Schema inference errors, wrong types inferred from file, mixed types in column | CSV reader inferring string column as numeric; scientific notation strings parsed as float |

If a bug meets all inclusion criteria but doesn't fit these 5 categories, flag it as a potential new category.

## Exclusion reasons (any one is sufficient)

- **Visualization-specific** — ggplot2 scale/aesthetic errors, matplotlib rendering, plot formatting. The operation has no non-visual equivalent.
- **Language plumbing** — Python 2-to-3 migration, R NSE/tidy evaluation, namespace collisions, lazy evaluation in loops.
- **External library interop** — ctypes/FFI, pygame, PIL, audio processing, Spark/Dask-specific APIs with no pandas/R equivalent.
- **API syntax confusion** — Calling the wrong method, wrong argument order, wrong wrapper. The user's mental model of the API was wrong, not the data.
- **Environment/platform** — 32-bit vs 64-bit, file encoding, binary mode, version-specific behavior changes.

## Edge cases

These patterns require careful judgment:

- **R int/double distinction** — Include if the bug causes silent wrong output (e.g., data corruption, wrong aggregation result). Exclude if it just causes a clear error message.
- **numpy type wrappers** (int64 not JSON serializable) — Include if it's about data leaving a DataFrame and silently changing meaning. Exclude if it's pure numpy array manipulation outside a data analysis context.
- **Accessor confusion** (.str on datetime, .dt on string) — Include if the column type was wrong due to a prior processing step. Exclude if the user just didn't know the API.
- **Return type inconsistency** (median returns int sometimes, double other times) — Include if it causes silent downstream errors. The inconsistency itself isn't the issue; the silent downstream consequence is.
- **Schema loss** (empty DataFrame loses types, groupby drops columns) — Include. This is directly about data processing producing unexpected structure.

## What to record for each bug

| Field | Description |
|-------|-------------|
| **SO ID** | StackOverflow question ID |
| **Language** | Python or R |
| **Description** | One-line description of the bug |
| **Included** | Yes or No |
| **Reason** | If excluded: which exclusion reason. If included: which of the 5 categories. |
| **Outcome** | In the original language: silent continuation, runtime error, or runtime warning |
| **Novel** | Whether the pattern is already represented in the 65-test comparison suite or is a novel pattern |

## Reporting

Report the full distribution transparently:

- Total bugs examined
- Number and percentage that map to each of the 5 categories
- Number and percentage excluded, broken down by exclusion reason
- For included bugs: breakdown of outcome type (silent vs error vs warning)
- Any novel patterns not represented in the existing 65-test suite

The value is in showing that the same error categories that dominate the comparison suite also appear organically in real-world StackOverflow questions, as identified by an independent research group. The bugs that don't map are equally informative — they show the boundaries of what compile-time checking addresses, consistent with the paper's limitations section.
