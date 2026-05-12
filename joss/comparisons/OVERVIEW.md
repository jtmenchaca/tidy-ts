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
