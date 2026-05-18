# RPython Snippet Evaluation Rules

Rules for classifying **snippets** from the RPython dataset (ESEC/FSE 2023, arxiv 2306.08632) as external corroboration of the error taxonomy in the JAMIA **comparison suite**.

> Canonical glossary: `docs/JAMIA/comparisons/CONTEXT.md`. Key terms: **snippet** (raw RPython entry), **mapping** (the act or value of classifying a snippet against these rules), **reproduction** (the `.py`/`.R` + `.ts` pair the authors write for an included snippet). The six categories are **Column reference**, **Value type**, **Missing value**, **Join**, **Data loading**, **Schema composition**.

## Purpose

The comparison suite contains 65 author-designed **scenarios**. The RPython corpus provides an independently curated set of real-world StackOverflow bugs in R and Python data-analysis code. We use the RPython **TM (Type Mismatch) subset** — 164 snippets — to assess whether the error categories in the comparison suite reflect real-world bug patterns, and to show the scope honestly (what maps and what doesn't). Other RPython subsets (CDA, APIC, SM, IDAP_IB) are **out of scope** — their broader topics dilute the corroboration of a thesis specifically about type-system catches.

## Primary question

**Is this snippet relevant to the paper's thesis that common data-processing errors go undetected and produce incorrect output?**

## Inclusion criteria (all must be met)

1. **Data-processing context** — The bug occurs during data-analysis work: loading, selecting, joining, grouping, summarizing, filtering, mutating, or otherwise transforming tabular data. Not visualization rendering, not FFI/interop, not IDE/tooling.

2. **Silent or misleading outcome** — The bug either:
   - Produces incorrect output with no error or warning (silent continuation), OR
   - Produces an error that is confusing/misleading enough that the root cause is non-obvious.

   Snippets where the program immediately crashes with a clear error message are less relevant — the existing language already caught it.

3. **Systematic, not incidental** — The error would affect every dataset or group that meets the condition, not a one-off edge case tied to a specific API version, platform, or environment.

4. **Cross-library evaluable** — The underlying operation (aggregation, join, column selection, type conversion, null handling, etc.) exists in all primary libraries (tidy-ts, pandas, tidyverse). The bug can't be purely about R metaprogramming (NSE), numpy memory layout, or a library with no equivalent.

## Classification (for included snippets)

Map each included snippet to one of the six categories:

| Category | Description | Examples |
|----------|-------------|----------|
| **Column reference** | Column doesn't exist, was removed by a prior step, is misspelled, or is silently dropped | Referencing a column after summarize removed it; groupby silently dropping a column |
| **Value type** | Wrong type for an operation: string where number expected, int/double confusion, wrong accessor for column type, silent coercion | Object dtype failing numeric aggregation; int/double return inconsistency causing downstream corruption |
| **Missing value** | NA/NaN/null introduced or carried through without handling; changes behavior of aggregation, comparison, or arithmetic | NaN propagating through calculations; missing values silently excluded from comparisons |
| **Join** | Key type mismatch, missing values introduced by join, schema changes after join | Joining on int vs string keys; columns becoming nullable after left join |
| **Data loading** | Schema inference errors, wrong types inferred from file, mixed types in column | CSV reader inferring string column as numeric; scientific notation strings parsed as float |
| **Schema composition** | Errors when datasets are combined (`bindRows`, `append`, duplicate keys); column-type unions and shape mismatches | Binding rows with different column types coerces to object dtype; appending a row with a missing column |

If a snippet meets all inclusion criteria but doesn't fit these six categories, flag it as a potential new category in the PR description.

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

## What to record for each snippet

Every snippet's classification is recorded in the frontmatter of its reproduction file (for included snippets) or in `INCLUSION_EVALUATION.md`'s exclusion table (for excluded snippets). See the Column Schema section of `INCLUSION_EVALUATION.md` for full field definitions; summary:

| Field | When required | Description |
|-------|---|---|
| `ID` | always | StackOverflow question ID, `SO#<n>` |
| `Language` | always | `R` or `Python` |
| `Bug class` | always | One of the bug-class enum values (see INCLUSION_EVALUATION.md) |
| `Runtime consequence` | always | What happens in the original language: `DC` / `IF` / `Crash` |
| `In study` | always | `Yes` or `No` |
| `Inclusion rationale` | always | One sentence — if Yes, which of the six categories and the type error involved; if No, the exclusion reason |
| `Reproduction status` | included only | `Reproduces` / `No longer reproduces` / `Variant` — what the verification runner observes |
| `Tidy-TS detection outcome` | included only | `compile-time error` / `runtime error` / `runtime warning` / `silent continuation` / `not applicable` |
| `Tidy-TS detection mechanism` | included only | `compiler` / `zod schema validation` / `runtime API guard` / `none — language structural absence` / `none — library API design` / `none — bug still exists` |
| `Tidy-TS catch explanation` | included only | One phrase; format depends on mechanism (see INCLUSION_EVALUATION.md) |

Excluded snippets do not carry the four `Tidy-TS …` fields or `Reproduction status` — there is no reproduction file and no measurement to record.

## Reporting

The corroboration tables (issue 05c) are generated programmatically from the frontmatter. They report the full distribution transparently:

- Total snippets examined (164 in the TM subset)
- Inclusion funnel: in-scope → included / excluded, with exclusion reasons broken down
- Distribution of included snippets across the six categories
- Per-category Tidy-TS catch breakdown by mechanism (`compiler` / `zod schema validation` / `runtime API guard` / `none — language structural absence` / `none — library API design` / `none — bug still exists`)
- Reproduction-status breakdown (`Reproduces` / `No longer reproduces` / `Variant`)
- Any novel patterns not represented in the existing 65-scenario comparison suite (flagged in the PR description)

The value is in showing that the same error categories that dominate the comparison suite also appear organically in real-world StackOverflow questions, as identified by an independent research group. The snippets that don't map are equally informative — they show the boundaries of what compile-time checking addresses, consistent with the paper's limitations section.
