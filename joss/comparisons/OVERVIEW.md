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

## Related work

Several strands of prior work address individual aspects of what this suite measures. The contribution here is the specific combination: a mechanism-based error taxonomy, detection-stage classification (compile vs runtime vs silent), and executable probes comparing a statically-typed DataFrame API against pandas and tidyverse. Each ingredient has prior art; what follows organizes it.

### Typed table benchmarks and schema-evolution systems

**B2T2 (Brown Benchmark for Table Types).** Lu, Greenman, and Krishnamurthi ([arXiv 2111.10412](https://arxiv.org/abs/2111.10412)) explicitly study "rich types" for tabular operations, providing a suite of erroneous programs and evaluating whether typed table systems catch them. B2T2 also notes that lack of a standard table-operation library makes cross-system comparison difficult. This is the closest prior work to the comparison suite's goals. The key differences: B2T2 evaluates type systems against a benchmark of correct/incorrect programs in isolation; this suite classifies errors by the type-system mechanism involved, measures detection stage (compile, runtime error, runtime warning, silent), and compares the same errors across three production ecosystems (TypeScript, Python, R) using executable probes. B2T2 does not include pandas or tidyverse as comparison targets.

**Idris2-Table.** Builds a dependently typed table library and evaluates it against B2T2, demonstrating that incorrect B2T2 programs fail to type-check while corrected versions succeed ([TyDe 2022](https://tydeworkshop.org/2022-abstracts/paper6.pdf)). This is a strong prior example of compile-time schema/type enforcement in a research language but does not compare against dynamically-typed alternatives in production use.

**PDChecker.** Uses abstract interpretation to track column labels and types in pandas code, catching column-existence and type-compatibility errors statically ([ResearchGate](https://www.researchgate.net/publication/358094534_Enabling_Type_Checking_on_Columns_in_Data_Frame_Libraries_by_Abstract_Interpretation)). This is the closest "static checker for dataframe columns" source and supports the claim that Categories 1 and 2 are known pain points. The distinction for Tidy-TS is that these guarantees arise from ordinary TypeScript library types rather than an external static analyzer.

**F# Data / type providers.** Derives types from external structured data, introducing the concept of *relative safety*: generated types are safe only if actual inputs satisfy assumptions inferred from samples ([paper](https://doi.org/10.1145/2984511.2984516)). Directly relevant to Category 4 — static dataframe typing is only as sound as the input schema boundary; Zod validation closes that boundary at runtime.

**The Gamma.** Uses type providers to generate object members from external data sources for live data exploration ([arXiv 2002.06190](https://arxiv.org/pdf/2002.06190)). Part of the broader lineage of typed, editor-assisted data exploration; differs from Tidy-TS in being a simplified DSL rather than a general-purpose TypeScript library API.

**Schema evolution.** "Schema Evolution in Interactive Programming Systems" ([arXiv 2412.06269](https://arxiv.org/pdf/2412.06269)) argues that schema evolution is a feedback-loop problem: when data shape changes, existing data must migrate and code must be updated. This provides a higher-level theoretical frame for Categories 1 and 3 — `select`, `rename`, `summarize`, `pivot`, joins, and `bindRows` are all local schema-evolution events that Tidy-TS makes explicit in the type.

**Dataframe semantics.** Petersohn's dissertation ("Dataframe Systems: Theory, Architecture, and Implementation") notes that dataframe APIs are widely used but dataframe semantics remain ambiguous compared to relational systems. Tidy-TS can be framed as one answer: make the postcondition of each operation visible in the return type.

### Typed DataFrame libraries

**Frameless** (Scala/Spark) uses shadow types and Shapeless to catch column reference errors and type mismatches at compile time ([TypedDataset docs](https://typelevel.org/frameless/TypedDatasetVsSparkDataset.html)). The Haskell `dataframe` library ([Hackage](https://hackage.haskell.org/package/dataframe)) ships a Typed API with phantom-type schema tracking and compile-time column validation. Both address Categories 1 and 2 — column existence and type compatibility — but neither formalizes an error taxonomy or compares detection behavior against untyped alternatives. We have not found a comparable treatment in either library that uses nullability-through-transform behavior (Category 3) as a central design axis, though both have nontrivial type-level machinery that may address some nullable cases.

**Guyot et al.** "Preventing Technical Errors in Data Lake Analyses with Type Theory" (DaWaK 2023, [Springer](https://link.springer.com/chapter/10.1007/978-3-031-39831-5_2)) use type-theoretic restrictions on operator composition to transform schema/model transformation errors into type errors. Their scope is data lake analytical workflows, not DataFrame APIs, and the treatment is formal rather than empirical.

### Runtime validation and Python dataframe typing

**StaticFrame** supports generic dataframe specifications with column-level component types, static analysis via pyright, runtime interface validation, and additional runtime validators through `Annotated`/`Require` ([docs](https://static-frame.readthedocs.io/en/latest/articles/ftyping.html)). Its docs explicitly contrast this with pandas-stubs, noting that pandas-stubs does not permit specifying dataframe component types. StaticFrame is an alternative Python dataframe library with immutable containers and explicit generic annotations; Tidy-TS focuses on inferred schema evolution through tidy-style transformation chains.

**`strictly-typed-pandas`** ([docs](https://strictly-typed-pandas.readthedocs.io/en/latest/getting_started.html)) validates DataFrame schema at `DataSet[Schema]` creation and makes the dataset immutable so schema cannot change through in-place mutations; it positions mypy compatibility as a way to catch errors during linting. Neither `strictly-typed-pandas` nor StaticFrame tracks schema evolution through chained transforms the way a typed API with per-verb return types does.

**Pandera** ([docs](https://pandera.readthedocs.io/en/stable/dtype_validation.html)) classifies errors into DATA errors (values failing checks) and SCHEMA errors (extra columns, null values) — a two-category split focused on runtime validation (Category 4 only). Pandera also offers experimental mypy integration for `DataFrame[Schema]` ([mypy docs](https://pandera.readthedocs.io/en/stable/mypy_integration.html)), but because pandas DataFrames are mutable, mypy cannot know whether a mutated DataFrame still has the correct contents — Pandera relies on runtime `check_types()` at function boundaries. The Pandera SciPy paper notes the project started by asking whether pandas DataFrames could be statically typed, then evolved toward validating statistical properties through runtime validation. A 2025 survey of Polars validation libraries ([Pointblank blog](https://posit-dev.github.io/pointblank/blog/validation-libs-2025/)) examines Pandera, Dataframely, and Patito — all runtime, none doing compile-time schema tracking.

**pandas-stubs** ([VirtusLab](https://medium.com/virtuslab/pandas-stubs-how-we-enhanced-pandas-with-type-annotations-1f69ecf1519e)) adds type annotations to the pandas API. Pandas officially recommends pandas-stubs for user-facing type declarations ([pandas docs](https://pandas.pydata.org/docs/reference/aliases.html)), but these are API-level types, not dataframe schema-level guarantees — they type the *API*, not the *data*. They do not track schema evolution or nullability through pipelines.

**Great Expectations** ([docs](https://docs.greatexpectations.io/docs/reference/learn/data_quality_use_cases/schema)) explicitly warns against relying only on schema validation: structural integrity is not the same as semantic correctness, and data quality also needs missingness checks, range constraints, distribution tests, and relationship validations. This distinction is important for preventing overclaiming — Tidy-TS catches programming mistakes and schema/type/nullability contract violations; it does not replace semantic data-quality testing.

**Deequ** ([DEEM 2018](https://deem.berlin/pdf/p1993-schelter.pdf)) provides a declarative API for unit tests over data at production scale. Deequ validates datasets and distributions at runtime; Tidy-TS validates programmer assumptions earlier in the local development loop. They are complementary.

**dbt contracts** ([docs](https://docs.getdbt.com/reference/resource-configs/contract)) enforce that a model's returned dataset matches YAML-declared column names and data types at the warehouse/model boundary. Tidy-TS moves some of this contract checking into the in-memory analysis pipeline.

### Data quality and bug taxonomies

**"Wrangling Data Issues to be Wrangled"** (arXiv 2405.16033, [paper](https://arxiv.org/abs/2405.16033)) proposes a taxonomy of data quality issues along attribute and outcome dimensions. Their categories describe what is wrong with the data (duplicates, missing values, inconsistencies), not what the programming language does about it — a different axis from what this suite measures.

**"Bug Analysis in Jupyter Notebook Projects"** ([UCI](https://stairs.ics.uci.edu/papers/2022/Bug_Analysis_in_Jupyter_Notebook_Projects.pdf)) mines notebook commits, Stack Overflow posts, and interviews with data scientists, proposing a bug taxonomy for notebook projects. This supports the broader claim that data-science programming environments have recurring reliability problems, but its taxonomy is notebook/project-oriented rather than dataframe-type-mechanism-oriented.

**"From Logic to Toolchains: An Empirical Study of Bugs in the TypeScript Ecosystem"** (arXiv 2601.21186, [paper](https://arxiv.org/html/2601.21186v1)) found that static typing in TypeScript has reduced traditional runtime and type errors but shifted fragility toward build systems and toolchains. This empirically validates the premise that TypeScript's type system reduces a class of bugs, though it does not address DataFrame-specific error classes.

### JavaScript/TypeScript dataframe libraries

The natural ecosystem comparison for Tidy-TS as a *library* is other JS/TS dataframe tools: **Arquero**, **Danfo.js**, and **tidy.js**. Arquero ([UW IDL](https://idl.uw.edu/arquero/)) provides a fluent, dplyr-inspired JavaScript API for filtering, aggregation, joins, windows, and reshaping over column-oriented tables. Danfo.js is a pandas-inspired JavaScript dataframe library. tidy.js is dplyr/tidyverse-inspired and says its primary goals are readability, standard verbs, and working with plain JS objects. All three are JavaScript-first; none track dataframe schema evolution through the type system.

Tidy-TS sits in this same practical ecosystem but its distinguishing claim is not speed or API familiarity — Arquero already provides a fluent dplyr-style API, Danfo.js already provides a pandas-style interface. Tidy-TS is more interesting because it tries to make **the shape of the dataframe part of the program's static semantics**: `select` returns a row type equivalent to `Pick` over selected columns, `mutate` computes a new row type from column assignments, `summarize` computes output rows from summary formulas and grouping keys, and joins produce suffix-aware result types with `undefined` introduced where join semantics require it.

### Positioning

Tidy-TS is best understood as a research-grade TypeScript data analysis system. It is broader than "typed dataframes" — the library is a framework for statistical computing, transformation, multi-format I/O, and WASM-accelerated hot paths — but its academically interesting property is that it turns ordinary dataframe verbs into **type-level schema transformers**.

That places it in a real PL/data-systems research niche: dataframes are library-level abstractions, but users expect them to behave like typed relational objects. PDChecker makes this exact point for pandas: because dataframes are implemented as libraries rather than language-level constructs, errors involving missing column labels or inconsistent column types are left to runtime. Tidy-TS attacks the same problem from a different angle: instead of building an external analyzer for a dynamic dataframe library, it designs the dataframe API so TypeScript's normal checker can carry the schema forward.

The nullability design is especially distinctive. Most dataframe systems treat missingness primarily as a runtime data condition. Tidy-TS treats it as a static obligation: `mean` has overloads that return `number` for clean inputs, `number | null` for nullable inputs, and `number` only when removal options explicitly justify narrowing. Left, right, outer, and as-of joins model missingness with `undefined` in the result type. Runtime behavior distinguishes `null`, `undefined`, and `NaN` rather than silently collapsing all missingness into one ambient "bad value" category.

The related work falls into two distinct peer sets:

**As a library**, Tidy-TS compares against Arquero, Danfo.js, and tidy.js — JS/TS dataframe tools serving the same practical purpose. The differentiator is that Tidy-TS propagates row schema, column types, renamed/suffixed fields, grouping/summarization shape, and null/undefined effects through ordinary fluent pipelines.

**As typed-table prior art**, the relevant set is Frameless, StaticFrame, strictly-typed-pandas, Pandera, PDChecker, B2T2, and Idris2-Table. These are prior art for specific mechanisms — column existence checking, type compatibility, schema validation, benchmark programs — but are mostly research prototypes, external analyzers, or boundary-validation systems rather than direct ecosystem substitutes. Notably, strictly-typed-pandas' schema-changing operations return a normal `pd.DataFrame` that must be cast back to `DataSet[SchemaB]`; Pandera's mypy integration requires runtime `check_types()` because pandas mutability prevents static guarantees through pipelines.

The work is relevant to at least five academic conversations:

1. **Type systems for tabular programming.** B2T2 argues that rich types for table operations should be evaluated for both expressive power and diagnostic quality. Tidy-TS is a concrete, user-facing implementation that could be evaluated along exactly those lines.

2. **Schema evolution in interactive data workflows.** Every `select`, `drop`, `rename`, `summarize`, `pivot`, `bindRows`, or join is a local schema-evolution event. Tidy-TS makes those events visible to the compiler — academically cleaner than treating a dataframe as a single opaque `DataFrame` value whose contents are known only by convention.

3. **Data-quality and validation theory.** Boundary validation asks "does this dataset satisfy a declared schema?" Tidy-TS also asks "after this program transformation, what schema does the program now have?" The first is data validation. The second is program semantics.

4. **Research software engineering.** Scientific and clinical data workflows often fail because of small mismatches: stale column names, silent joins, missingness propagation, accidental coercion, inconsistent boundary assumptions. Tidy-TS directly targets those error classes in a language used to build many web, API, dashboard, and data-application systems.

5. **TypeScript as a scientific-computing substrate.** TypeScript is usually treated as an application-development language, not a statistical-computing environment. Tidy-TS challenges that division by combining dataframe operations, statistical tests, I/O, async workflows, and cross-runtime execution. The academic interest is partly sociotechnical: it reduces the boundary between application code and analysis code.

### Limitations

TypeScript is a structural, gradually unsound language with escape hatches: `any`, casts, unchecked external data, dynamic keys, and generic complexity all apply. The library exposes a `no_types` option for creating `DataFrame<any>`, which is practical but creates a defined safety escape hatch. This does not weaken the contribution; it makes the research question more precise: **what safety guarantees survive in idiomatic TypeScript under real-world pressure?**

Static schema correctness is not statistical correctness. Tidy-TS can tell you that a column exists, is numeric, and may be nullable. It cannot tell you that the model is appropriate, the causal estimand is valid, the cohort definition is unbiased, or the missingness mechanism is ignorable. Its safety boundary is programming errors and representational assumptions, not scientific validity.

### Contribution claim

The strongest claim is not "typed dataframes are new." They are not. The distinctive contribution is: **Tidy-TS is a practical TypeScript dataframe and statistical-computing framework whose fluent API tracks schema evolution, column types, and nullability through common data-analysis verbs. Its academic interest is as a practical experiment in typed tabular programming — it operationalizes ideas from typed dataframe research in a mainstream application language and evaluates their effect against common pandas/tidyverse failure modes through an executable comparison suite classified by detection phase.**

That claim is defensible because it does not depend on the absence of prior typed-table work. It claims something more precise and more interesting: Tidy-TS brings typed dataframe semantics into the TypeScript data-application ecosystem, where the absence of such a system is practically consequential.

## Severity and detection analysis

### Motivation

Table 3 in the manuscript treats all 65 probes equally — a misspelled column name and silently propagated NaN in an aggregation both count as one probe. This flattens the clinical significance of different error types. A two-axis classification separates **potential severity** (intrinsic to the error, independent of detection) from **detection phase** (ecosystem-dependent), avoiding the circularity of conflating "caught early" with "unimportant."

### Two-axis framework

**Axis 1 — Potential severity** classifies each error by its worst-case consequence *if undetected*, independent of whether any ecosystem actually catches it. This follows the FMEA principle that severity is scored independent of occurrence and detectability [FMEA refs], and operationalizes O'Kane's P-score ("the worst case possible outcome that might have resulted") for laboratory errors [O'Kane 2008, 2009].

**Axis 2 — Detection phase** records how each ecosystem actually handles the error: compile-time error, runtime error, runtime warning, or silent continuation. This is an empirical observation, not a severity judgment.

The dangerous quadrant is **High severity × Silent continuation** — errors that would be outcome-altering AND are not caught. The framework's contribution is that it moves high-severity errors out of the silent-continuation column into the compile-time column.

### Potential severity definitions

**High potential severity (all three required — AND):**

1. **Alters computed values** — the error changes a numeric result, cohort membership, or categorical assignment that would enter an analytic endpoint, quality measure, or decision rule
2. **Propagates systematically** — the alteration affects every row meeting a structurally defined condition (e.g., every row with a null in a given column, every row from the right side of a left join) in the same direction, OR it systematically excludes/includes patients from a cohort. This maps directly to the Buyse et al. [ref 17] finding that systematic errors bias treatment effects even at small prevalence, while random errors require substantial prevalence.
3. **Produces plausible output** — the corrupted result is within a range that would not be flagged by routine inspection absent domain-specific validation (e.g., a mean that is wrong but not absurd, a cohort count that is smaller than expected but not zero)

All three are required because: an error that alters values but randomly (not High — it adds noise, not bias); or that alters values systematically but produces obviously wrong output (not High — it will be caught on inspection); does not carry the same consequence.

**Moderate potential severity (both required — AND):**

1. **Corrupts an intermediate representation** — the error changes a column value, table structure, or derived variable that feeds into downstream operations
2. **Does NOT meet all three High criteria** — either the corruption does not propagate systematically, OR it does not reach an analytic endpoint in the current pipeline, OR it produces output that would likely be flagged on inspection

Moderate errors are dangerous through composition — they create a corrupted intermediate that becomes High severity if the pipeline is extended or reused.

**Low potential severity (any one sufficient — OR):**

1. **Produces obviously implausible output** — zero rows, all-NaN column, negative patient count, or other results outside any plausible range
2. **Affects only non-analytic properties** — display formatting, column ordering, sort stability, error message quality
3. **Is self-correcting** — the error would be overwritten or discarded by a subsequent mandatory step

### Addressing the circularity concern

A single-tier system that combines severity and detection creates a circularity: errors caught at runtime appear "less important" (Tier 3), but the reason they are caught is often that language designers recognized their potential severity and made them hard failures. A misspelled column name raises a `KeyError` in pandas not because it is trivial, but because accessing a nonexistent attribute is dangerous enough to warrant halting execution. If pandas had silently returned an empty column instead, the same error would be High severity × Silent continuation — the error's intrinsic severity did not change, only its detectability.

O'Kane's A-score/P-score system provides the direct precedent: most laboratory errors have high P-scores (potentially severe) but low A-scores (actually caught before reaching the patient). The gap between P and A is precisely what justifies ongoing vigilance [O'Kane 2008, 2009]. The two-axis framework preserves this distinction: silent NaN propagation through a `mean()` call on a nullable lab-value column is **High potential severity** (it alters the aggregate, affects every null-bearing row identically, and produces a plausible but wrong number) regardless of whether any ecosystem catches it. A misspelled column name is **Low potential severity** (it would produce an all-undefined column — obviously implausible output) AND a **runtime error** in pandas (it is caught). These are independent assessments.

### Grounding

- **FMEA**: Severity scored independent of occurrence and detectability, based solely on consequence if the failure reaches the output [ASTRO 2019; Huq et al. 2016]
- **O'Kane A-score/P-score**: Actual impact vs potential impact scored independently; most laboratory errors have high P-scores and low A-scores [O'Kane 2008, 2009]
- **Buyse et al.**: Systematic errors bias treatment-effect estimates even at low prevalence; random errors attenuate effects without reversing them [ref 17]
- **Shun-Shin and Francis**: Reclassification of 2.5% of patients can flip a study conclusion [ref 18]

### Criteria columns and evaluation rules

Each per-probe table below includes seven criteria columns. The criteria are scored Y (yes) or N (no) for each probe, and the severity determination follows mechanically from the evaluation rules.

**High criteria (all three required — AND):**

| Column | Criterion | Definition |
|--------|-----------|------------|
| **AV** | Alters computed values | The error changes a numeric result, cohort membership, or categorical assignment that would enter an analytic endpoint, quality measure, or decision rule |
| **PS** | Propagates systematically | The alteration affects every row meeting a structurally defined condition in the same direction, OR it systematically excludes/includes patients from a cohort |
| **PO** | Produces plausible output | The corrupted result is within a range that would not be flagged by routine inspection absent domain-specific validation |

**Moderate criterion (required, plus failure of ≥1 High criterion):**

| Column | Criterion | Definition |
|--------|-----------|------------|
| **CI** | Corrupts an intermediate | The error changes a column value, table structure, or derived variable that is not itself a final analytic endpoint but feeds into downstream operations |

**Low criteria (any one sufficient — OR):**

| Column | Criterion | Definition |
|--------|-----------|------------|
| **OI** | Obviously implausible output | The result is outside any plausible range (zero rows, all-NaN column, negative count, table with no columns) such that no analyst would proceed without investigation |
| **NA** | Non-analytic only | The error changes display formatting, column ordering, sort stability, or error message quality with no effect on computed values |
| **SC** | Self-correcting | The error would be overwritten or discarded by a subsequent mandatory step in the pipeline |

**Evaluation rules:**

1. If AV=Y ∧ PS=Y ∧ PO=Y → **High**
2. If CI=Y ∧ ¬(AV=Y ∧ PS=Y ∧ PO=Y) → **Moderate**
3. If OI=Y ∨ NA=Y ∨ SC=Y → **Low**

A probe classified as Low may also have CI=Y (it corrupts an intermediate), but the Low criteria take precedence because the corruption is self-limiting — it produces obviously wrong output, affects only non-analytic properties, or would be overwritten. The key distinction between Low and Moderate is that Low errors do not create intermediates that could become consequential through pipeline evolution.

### Per-probe classification

#### Category 1: Column & Schema Reference (16 probes)

| Probe | AV | PS | PO | CI | OI | NA | SC | Severity | Rationale |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|----------|-----------|
| 1a: misspelled column name in expression | Y | Y | N | — | Y | — | — | Low | If undetected, every row gets `undefined` for the misspelled column — but the resulting all-undefined/NaN column is obviously implausible. All three ecosystems error at runtime. |
| 1b: nonexistent column in predicate | Y | Y | N | — | Y | — | — | Low | Same as 1a — predicate on nonexistent column would produce all-false or all-undefined, yielding zero rows or a visibly broken filter. All three error. |
| 1c: misspelled column name in sort | N | N | N | — | Y | — | — | Low | Sort on nonexistent column halts execution; if it silently ignored the column, the table would be unsorted — obviously wrong order visible on inspection. All three error. |
| 1d: column dropped by selection still referenced | Y | Y | N | — | Y | — | — | Low | Accessing a dropped column yields undefined for every row — all-undefined column is obviously implausible. All three error. |
| 1e: original column referenced after aggregation | Y | Y | N | — | Y | — | — | Low | After summarize, the original column no longer exists — accessing it yields undefined for every summary row. All three error. |
| 1f: dropped column used in sort | N | N | N | — | Y | — | — | Low | Same as 1c — sort on dropped column halts or silently produces unsorted output. All three error. |
| 1g: old column name used after rename | Y | Y | N | — | Y | — | — | Low | Old name yields undefined for every row — all-undefined column is obviously implausible. All three error. |
| 1h: pre-aggregation column referenced after summarize | N | N | N | Y | — | — | — | Moderate | All three error at access, but the summarize silently removes columns the analyst may have expected to survive. The schema change is an intermediate corruption — whether it reaches an endpoint depends on whether the stale column is referenced downstream. |
| 1i: undeclared column after pivot | N | N | N | Y | — | — | — | Moderate | All three error at access, but the pivot silently determines which columns exist based on data values. The schema is data-dependent — an intermediate structural change that only surfaces if the wrong column is accessed. |
| 1j: consumed column referenced after pivot | N | N | N | Y | — | — | — | Moderate | All three error at access. The pivot consumes the column silently; error only surfaces if the consumed column is referenced later. Intermediate schema corruption. |
| 1k: unselected column referenced after distinct | Y | Y | Y | — | — | — | — | High | **Py/R silent.** pandas `drop_duplicates` keeps all columns with arbitrary row choices; R `distinct` keeps unselected columns with arbitrary values. The retained columns have values selected from duplicated groups — this alters downstream joins/group-bys (AV), affects every duplicated group identically (PS), and produces a valid-looking table with plausible values (PO). |
| 1l: narrowed schema after distinct without keep-all | Y | Y | Y | — | — | — | — | High | **Py/R silent.** Same mechanism as 1k — retained columns have arbitrarily selected values from duplicated groups. Alters cohort characteristics (AV), affects every duplicated group (PS), produces a table that looks structurally correct (PO). |
| 1m: unselected column referenced after select | Y | Y | Y | — | — | — | — | High | **Py/R silent.** `select(a, b)` silently drops other columns. If downstream code assumes dropped columns exist, the narrower table silently enters analysis — alters derived values that depend on the missing columns (AV), affects every row (PS), and the table with fewer columns looks structurally valid (PO). |
| 1n: error message lists available columns | N | N | N | — | — | Y | — | Low | Diagnostic quality only — affects debuggability, not analytical correctness. No computed values are changed. |
| 1o: error message on invalid column access | N | N | N | — | — | Y | — | Low | Same as 1n — error message content affects developer experience, not analytic output. |
| 1p: residual grouping after summarize | Y | Y | Y | — | — | — | — | High | A subsequent aggregation on still-grouped data operates on groups the analyst didn't expect — Py produces MultiIndex, R gives 2 rows instead of 1. Alters the aggregate result (AV), affects every group in the still-grouped DataFrame (PS), and the per-group result looks like a valid summary table — just at the wrong granularity (PO). |

**Summary:** 4 High, 3 Moderate, 9 Low.

#### Category 2: Type Safety (14 probes)

| Probe | AV | PS | PO | CI | OI | NA | SC | Severity | Rationale |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|----------|-----------|
| 2a: arithmetic on string column | Y | Y | N | Y | — | — | — | Moderate | `test_name * 10` produces NaN for every string row (PS), which alters computed values (AV), but an all-NaN numeric column is visibly wrong on inspection (PO=N). Corrupts the intermediate column (CI). |
| 2b: numeric aggregation on string column | Y | Y | N | Y | — | — | — | Moderate | `s.mean(test_name)` returns null/NA for the entire group — a null aggregate is visible on inspection (PO=N). Corrupts the summary row (CI). |
| 2c: number compared to string literal | Y | Y | Y | — | — | — | — | High | `result_value === "high"` returns 0 rows — silently drops an entire cohort. Alters cohort membership (AV), affects every row identically (PS), and an empty result is plausible as "no patients matched this filter" in a multi-step pipeline (PO). |
| 2d: unparseable string silently becomes null/NaN | Y | Y | Y | — | — | — | — | High | `Number("pending")` produces NaN for every unparseable row. Alters the converted column (AV), affects every structurally unparseable value (PS), and the column contains a mix of valid numbers and NaN that looks plausible (PO). |
| 2e: arithmetic on nullable after conversion | Y | Y | Y | — | — | — | — | High | `null * 2` produces 0 (JS) or NaN propagation. Alters derived values (AV), affects every null-bearing row (PS), and numeric output interspersed with 0 or NaN is plausible (PO). |
| 2f: aggregation skips null/NaN after conversion | Y | Y | Y | — | — | — | — | High | Mean silently excludes NaN rows, computing over fewer observations. Alters the aggregate (AV), systematically excludes the same rows (PS), and the resulting mean is a valid number within range (PO). |
| 2g: arithmetic on mixed-type return column | Y | Y | N | Y | — | — | — | Moderate | `"HIGH" * 2` produces NaN (JS) or `"HIGHHIGH"` (Py string repetition). Alters values (AV) for every row where the mixed return is a string (PS), but the output is visibly wrong — "HIGHHIGH" or NaN in a numeric column is obviously implausible (PO=N). Corrupts the intermediate (CI). |
| 2h: invalid date string parse | Y | N | N | Y | — | — | — | Moderate | Invalid date string produces NaT/NA for one specific row, not a structurally defined class (PS=N). The missing date is visible on inspection as a null in a date column (PO=N). Corrupts the intermediate (CI). |
| 2i: date compared to number | Y | Y | N | — | Y | — | — | Low | `date > 100` compares dates to an integer — R silently uses internal integer representation, returning nonsensical results. The output (all rows pass or fail based on epoch days) is obviously wrong on inspection (OI). |
| 2j: date + number arithmetic | Y | Y | N | — | Y | — | — | Low | `date + 7` in R adds 7 days instead of failing — semantically wrong but the shifted dates are obviously different from expected values on inspection (OI). |
| 2k: numeric function applied to string column | Y | Y | N | Y | — | — | — | Moderate | `Math.log("Medicare")` produces NaN; Py repeats strings. Alters values (AV) for every string row (PS), but an all-NaN column or repeated strings are visibly wrong on inspection (PO=N). Corrupts the intermediate (CI). |
| 2l: arithmetic on transposed mixed-type column | Y | Y | Y | — | — | — | — | High | After transpose, `row_0 * 2` produces `"systolicsystolic"` instead of a number. Alters the derived value (AV), affects every row with string-typed cells (PS), and in a wider table the string value may not be inspected before entering further calculations (PO). |
| 2m: pre-transpose column name after transpose | Y | Y | N | — | Y | — | — | Low | Accessing `P001` after transpose yields undefined for every row — all-undefined column is obviously implausible (OI). All three ecosystems error. |
| 2n: filter on invalid enum value | Y | Y | N | — | Y | — | — | Low | `status === "unknown"` returns 0 rows. The empty result is obviously implausible in context — the analyst is filtering on a known status enum and gets no matches (OI). |

**Summary:** 5 High, 5 Moderate, 4 Low.

#### Category 3: Null & Missing Data (17 probes)

| Probe | AV | PS | PO | CI | OI | NA | SC | Severity | Rationale |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|----------|-----------|
| 3a: method call on nullable column | Y | Y | N | Y | — | — | — | Moderate | `.toFixed()` on null throws or produces NaN for every null-bearing row (AV, PS), but an all-NaN formatted column is visibly wrong on inspection (PO=N). Corrupts the intermediate (CI). |
| 3b: arithmetic on nullable column | Y | Y | Y | — | — | — | — | High | `result_value - reference_high` produces NaN for every null-bearing row. Alters the derived column (AV), affects every row where `reference_high` is null (PS), and the column contains a mix of valid numbers and NaN that looks plausible in a lab-value context (PO). |
| 3c: comparison on nullable column | Y | Y | Y | — | — | — | — | High | `reference_high > 100` silently excludes null rows from the filter. Alters cohort membership (AV), systematically excludes every patient with a missing reference range (PS), and the smaller cohort is a plausible subset (PO). |
| 3d: arithmetic on nullable before narrowing | Y | Y | Y | — | — | — | — | High | `result_value / reference_high` produces Infinity/NaN for null rows. Alters derived values (AV), affects every null-bearing row (PS), and Infinity values interspersed with valid ratios may not be caught without range checks (PO). |
| 3e: arithmetic after re-introducing null | Y | Y | Y | — | — | — | — | High | After `replaceNull` and re-introduction via mutate, division again produces Infinity/NaN. Alters values (AV), affects every re-nullified row (PS), and the analyst may assume nulls were already handled, making the corrupted output less likely to be inspected (PO). |
| 3f: mean on nullable column then arithmetic | Y | Y | Y | — | — | — | — | High | Mean silently skips NaN (Py) or returns NA (R), then `avg * 2` uses the biased/missing aggregate. Alters the aggregate (AV), systematically excludes the same null-bearing observations (PS), and the resulting mean is a valid number within the expected range (PO). |
| 3g: sum on nullable column then arithmetic | Y | Y | Y | — | — | — | — | High | Sum silently skips NaN (Py) or returns NA (R). Alters the total (AV), excludes the same null-bearing rows (PS), and the sum is a valid number — just biased low (PO). |
| 3h: min on nullable column then arithmetic | Y | Y | Y | — | — | — | — | High | Min silently skips NaN (Py) or returns NA (R). Alters the min (AV), excludes null-bearing rows (PS), and the min is a valid number from the non-null subset (PO). |
| 3i: groupby mean on nullable column then arithmetic | Y | Y | Y | — | — | — | — | High | Grouped mean skips NaN per group (Py) or returns NA per group (R). Alters per-group averages (AV), introduces differential bias across groups with different missingness rates (PS), and per-group means are valid numbers within range (PO). |
| 3j: sum silently skips or returns null | Y | Y | Y | — | — | — | — | High | Py skips NaN and returns a number (biased low); R returns NA. Alters the aggregate (AV), systematically under-counts the same null-bearing observations (PS), and the sum is a plausible number (PO). |
| 3k: arithmetic on null-skipped aggregation result | Y | Y | Y | — | — | — | — | High | `total / 2` on a biased sum produces a biased derived value. Alters the endpoint (AV), the bias propagates from the same systematic exclusion (PS), and the derived value is numerically plausible (PO). |
| 3l: shift/lag introduces null at boundary | Y | N | N | — | Y | — | — | Low | `lag()` introduces NaN/NA at position 0 — this is inherent to the operation (no prior value exists). The null at the boundary is a single fixed position, not a structurally defined condition (PS=N), and a NaN in the first row of a lagged column is obviously visible on inspection (OI). |
| 3m: arithmetic on lagged null propagates | Y | Y | Y | — | — | — | — | High | `value - lag(value)` produces NaN at the boundary. Alters the derived change column (AV), affects every time series at its first observation (PS), and in a column of inter-visit changes, one NaN among valid differences is plausible — it may be silently excluded from downstream aggregation (PO). |
| 3n: sort silently places null at end | Y | Y | Y | — | — | — | — | High | Null values sorted to end without warning. Alters which records appear in top-N/bottom-N selections (AV), systematically excludes patients with missing values from the selected subset (PS), and the selected records are valid — the analyst sees real lab values, just from a biased subset (PO). |
| 3o: arithmetic on null from missing pivot combination | Y | Y | N | Y | — | — | — | Moderate | Pivot produces NaN for missing combinations, then `systolic - diastolic` produces NaN. Alters derived values (AV), affects every patient missing a vital sign (PS), but the NaN cells in the pivoted table are visible upon inspection before downstream arithmetic — the missing combinations are apparent in the pivot output (PO=N). Corrupts the intermediate (CI). |
| 3p: null vs missing conflated | Y | Y | Y | — | — | — | — | High | Py/R collapse null and missing to NaN/NA. Alters downstream operations that depend on the distinction (AV) — e.g., "lab result was null" vs "lab was not ordered" receive identical treatment. Affects every row with either null or missing values (PS), and the conflated values produce valid-looking output — the loss of semantic distinction is not visible in the data itself (PO). |
| 3q: conditional fill on null vs missing | Y | Y | Y | — | — | — | — | High | `fillna()` fills both null and missing identically. Alters fill logic that should distinguish the two cases (AV), affects every row with either null or absent values (PS), and the filled column contains plausible values — the analyst cannot tell from the output that absent fields were incorrectly filled (PO). |

**Summary:** 14 High (3b–3k, 3m, 3n, 3p, 3q), 2 Moderate (3a, 3o), 1 Low (3l).

#### Category 4: Join Safety (8 probes)

| Probe | AV | PS | PO | CI | OI | NA | SC | Severity | Rationale |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|----------|-----------|
| 4a: join on key not in left table | N | N | N | — | Y | — | — | Low | Join on nonexistent key halts execution; if it silently produced a cross join or empty result, the output would be obviously wrong (OI). All three error. |
| 4b: join on misspelled key | N | N | N | — | Y | — | — | Low | Same as 4a — misspelled key halts or produces obviously wrong join output (OI). All three error. |
| 4c: access missing column post-join | N | N | N | Y | — | — | — | Moderate | All three error at access, but the join itself succeeds and the schema change is silent — the error only surfaces if the missing column is referenced. Whether this reaches an endpoint depends on downstream use (CI). |
| 4d: string method on join-introduced null | Y | Y | Y | — | — | — | — | High | `.toUpperCase()` on join-introduced undefined/NaN produces NaN for every unmatched row. Alters derived string values used as downstream keys or labels (AV), affects every unmatched patient from the left join (PS), and the NaN values are interspersed with valid strings in a column that otherwise looks correct (PO). |
| 4e: arithmetic on join-introduced null | Y | Y | Y | — | — | — | — | High | `los_days / 7` produces NaN for every unmatched row. Alters derived numeric values (AV), affects every patient without a matching encounter (PS), and the column contains a mix of valid weeks and NaN that is plausible in clinical data with expected missingness (PO). |
| 4f: comparison silently excludes null rows | Y | Y | Y | — | — | — | — | High | `los_days > 2` silently evaluates to false for undefined rows, excluding all unmatched patients. Alters cohort membership (AV), systematically excludes every unmatched patient (PS), and the resulting cohort is a valid-looking subset — just silently narrowed to only patients with matches (PO). |
| 4g: explicit suffix then access original name | N | N | N | Y | — | — | — | Moderate | All three error at access. The suffix renaming is expected behavior; accessing the original name is a coding error. The schema change is an intermediate corruption that only surfaces if the stale name is referenced (CI). |
| 4h: default suffix then access original name | N | N | N | Y | — | — | — | Moderate | All three error at access. The default suffix silently renames colliding columns, changing the schema without warning. The error surfaces at the point of reference — does not reach an analytic endpoint silently (CI). |

**Summary:** 3 High (4d, 4e, 4f), 3 Moderate (4c, 4g, 4h), 2 Low (4a, 4b).

#### Category 5: Schema Composition (10 probes)

| Probe | AV | PS | PO | CI | OI | NA | SC | Severity | Rationale |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|----------|-----------|
| 5a: non-numeric value in numeric column at load time | Y | Y | Y | — | — | — | — | High | A "pending" string in a numeric column silently becomes object dtype (Py) or NA (R). Alters every downstream numeric operation on that column (AV), affects every row with the non-numeric value (PS), and the column looks like a valid numeric column with a few missing values — dtype changes are not visible without explicit inspection (PO). |
| 5b: accessing nonexistent column after schema-validated load | Y | Y | N | — | Y | — | — | Low | Accessing a column not in the Zod schema yields undefined for every row — all-undefined column is obviously implausible (OI). All three error. |
| 5c: empty cell in non-null column at load time | Y | Y | Y | — | — | — | — | High | Empty cells silently become NaN/NA in a column declared non-nullable. Alters joins and group-bys that use the column as a key (AV), affects every row with an empty cell (PS), and the NaN values are interspersed with valid data — the column looks mostly complete (PO). |
| 5d: accessing optional column after mismatched row bind | Y | Y | Y | — | — | — | — | High | Missing columns filled with NaN/NA after `bindRows`. Alters derived values for every row from the table lacking the column (AV), systematically affects all rows from one source (PS), and the column contains a mix of valid values and NaN that looks like expected clinical missingness (PO). |
| 5e: string operation on NaN/NA column after row bind | Y | Y | N | Y | — | — | — | Moderate | `.toUpperCase()` on NaN produces "NaN" string or NA for every row from the table lacking the column (AV, PS), but "NaN" appearing as a string value is visibly wrong on inspection (PO=N). Corrupts the intermediate (CI). |
| 5f: implicit type coercion when binding rows with different column types | Y | Y | N | Y | — | — | — | Moderate | `bindRows` with number + string columns silently coerces to object dtype (Py). Alters the column type for every row (AV, PS), but the dtype change is visible via `.dtypes` inspection — the column showing "object" instead of "float64" is a detectable anomaly (PO=N). Corrupts the intermediate (CI). |
| 5g: arithmetic on mixed-type column after coerced row bind | Y | Y | Y | — | — | — | — | High | `dose * 2` on a coerced column produces string repetition (Py: `"sliding scale" * 2` → repeats) or logical-to-numeric coercion (R). Alters computed values (AV), affects every row with the wrong type (PS), and numeric output interspersed with wrong values (e.g., `650` next to a repeated string) may not be caught without row-level inspection (PO). |
| 5h: appending row with missing column | Y | N | N | Y | — | — | — | Moderate | Missing column in appended row filled with NaN/NA — affects a single row, not a structurally defined condition (PS=N). The NaN is visible if the column is inspected (PO=N). Corrupts the intermediate (CI). |
| 5i: appending row with wrong column type | Y | N | N | — | Y | — | — | Low | Wrong type in one appended row silently coerced (Py) or errors (R). Affects a single row (PS=N), and the dtype change is visible on inspection (OI). |
| 5j: string operation on duplicate column name | N | N | N | — | Y | — | — | Low | Duplicate column names cause ambiguous operations — all ecosystems error or produce obviously broken output (OI). |

**Summary:** 4 High (5a, 5c, 5d, 5g), 3 Moderate (5e, 5f, 5h), 3 Low (5b, 5i, 5j).

*Note:* Two probes from the original suite — arithmetic on empty sum and arithmetic on empty mean — were removed. These test edge-case semantics of empty-dataframe aggregation (design choices about identity values), not errors that a framework should catch. All three ecosystems handle them, just differently.

### Severity × detection cross-tabulation

The two-axis framework separates potential severity (rows) from detection phase (columns). Each cell shows the count of probes at that intersection. The dangerous quadrant — High severity × Silent continuation — is where errors would alter clinical outcomes and are not caught.

<table>
  <thead>
    <tr>
      <th rowspan="2">Potential severity</th>
      <th rowspan="2"><em>n</em></th>
      <th colspan="3" style="text-align:center">Tidy-TS</th>
      <th colspan="2" style="text-align:center">Python / pandas</th>
      <th colspan="3" style="text-align:center">R / tidyverse</th>
    </tr>
    <tr>
      <th>compile</th>
      <th>runtime</th>
      <th>silent</th>
      <th>error</th>
      <th>silent</th>
      <th>error</th>
      <th>warn</th>
      <th>silent</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>High</strong></td>
      <td>30</td>
      <td>28 (93%)</td>
      <td>2 (7%)</td>
      <td>0 (0%)</td>
      <td>0 (0%)</td>
      <td>30 (100%)</td>
      <td>1 (3%)</td>
      <td>2 (7%)</td>
      <td>27 (90%)</td>
    </tr>
    <tr>
      <td><strong>Moderate</strong></td>
      <td>16</td>
      <td>15 (94%)</td>
      <td>1 (6%)</td>
      <td>0 (0%)</td>
      <td>8 (50%)</td>
      <td>8 (50%)</td>
      <td>9 (56%)</td>
      <td>2 (13%)</td>
      <td>5 (31%)</td>
    </tr>
    <tr>
      <td><strong>Low</strong></td>
      <td>19</td>
      <td>19 (100%)</td>
      <td>0 (0%)</td>
      <td>0 (0%)</td>
      <td>16 (84%)</td>
      <td>3 (16%)</td>
      <td>15 (79%)</td>
      <td>0 (0%)</td>
      <td>4 (21%)</td>
    </tr>
    <tr>
      <td><strong>Total</strong></td>
      <td><strong>65</strong></td>
      <td><strong>62 (95%)</strong></td>
      <td><strong>3 (5%)</strong></td>
      <td><strong>0 (0%)</strong></td>
      <td><strong>24 (37%)</strong></td>
      <td><strong>41 (63%)</strong></td>
      <td><strong>25 (38%)</strong></td>
      <td><strong>4 (6%)</strong></td>
      <td><strong>36 (55%)</strong></td>
    </tr>
  </tbody>
</table>

### Key findings

1. **All 30 High-severity probes continue silently in pandas.** Every probe classified as potentially outcome-altering — alters computed values, propagates systematically, produces plausible output — is undetected in pandas. In tidyverse, 27 of 30 continue silently; the 3 caught are ecosystem-specific (1 error, 2 warnings). This is not a sample of errors that happen to be silent — it is a near-complete mapping of the High × Silent quadrant.

2. **Tidy-TS catches 28 of 30 High-severity probes at compile time.** The remaining 2 (5a, 5c) are boundary-validation cases at data ingestion, handled by Zod runtime schemas. No High-severity probes continue silently in Tidy-TS (TS silent = 0 for High).

3. **Null and missing data dominates the High-severity row.** 14 of 30 High-severity probes (47%) are in the null/missing category. All 14 continue silently in both pandas and tidyverse. This concentration reflects the fundamental gap: dynamic dataframe systems do not track nullability as a type-level property, so silent NaN/NA propagation through aggregation, comparison, and arithmetic is the default behavior.

4. **Low-severity probes are disproportionately caught by dynamic ecosystems.** 16 of 19 Low-severity probes raise errors in pandas; 15 of 19 raise errors in tidyverse. These are errors that language designers correctly identified as dangerous enough to halt execution (misspelled column names, type mismatches on obviously incompatible operations). The two-axis framework avoids the circularity of treating "caught at runtime" as evidence of low importance — these errors have low *potential* severity precisely because they are caught, but their potential severity is assessed independently of detection.

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
