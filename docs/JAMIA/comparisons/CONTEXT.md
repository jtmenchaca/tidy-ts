# JAMIA Comparison Suite

Glossary for the JAMIA manuscript's evaluation work: the author-designed comparison suite and the external corroboration via the RPython dataset.

## Language

### The comparison suite

**Scenario**:
One of the 65 author-designed error cases. Identified by category-plus-letter IDs (`1a`–`6g`).
_Avoid_: probe, test, test case, error scenario, intentional error.

**Category**:
One of the six groups scenarios are organised into. Defined by the mechanism the type system uses to catch the error.
_Avoid_: bucket, class, group.

**Comparison suite**:
The collection of all 65 scenarios, plus their parallel implementations across every comparator. Lives under `docs/JAMIA/comparisons/cat-*/`. Evidence that Tidy-TS catches errors other libraries do not. Distinct from the [[framework-test-suite]] and the [[type-tracking-demonstration-file]].
_Avoid_: test suite, evaluation suite.

**Framework test suite**:
The ~1,700 unit and integration tests under `packages/dataframe/` and `packages/testing/` that verify Tidy-TS's own correctness (column tracking, statistical accuracy, I/O behavior). Distinct from the [[comparison-suite]] — different artifact, different audience, different claim supported.
_Avoid_: tests (bare), evaluation suite.

**Type-tracking demonstration file**:
A single focused test file (Supplementary A in the manuscript) that exercises the TypeScript compiler against a curated mix of intentional errors and valid operations. Third artifact, distinct from both [[comparison-suite]] and [[framework-test-suite]].
_Avoid_: type test, supplementary test.

### Comparators

**Library**:
A data-analysis library compared in the suite. Five libraries are tested: Tidy-TS, pandas, tidyverse, Polars, Arquero.
_Avoid_: framework, tool, package, ecosystem.

**Primary library**:
Tidy-TS, pandas, tidyverse. These three appear head-to-head in the main results.

**Supplementary library**:
Polars, Arquero. Reported in supplementary material.

**Static code checker**:
An optional tool that examines code before it runs without running it. Two are tested: mypy and pyright (both applied to pandas code with pandas-stubs installed).
_Avoid_: linter, type checker (overlaps with "compiler").

**Compiler**:
The TypeScript compiler. Distinct from a static code checker because TypeScript code is type-checked as a precondition of running — type errors prevent the program from being executable. Python's static code checkers are optional and advisory.

### Detection

**Detection outcome**:
What a comparator does when run on a scenario. Enum: `compile-time error` / `runtime error` / `runtime warning` / `silent continuation` / `not applicable`. One value per (scenario × comparator).
_Avoid_: result, outcome (bare).

**Compile-time error**:
A `detection outcome`. The compiler (TypeScript) or static code checker (mypy/pyright) rejects the code before it runs.

**Runtime error**:
A `detection outcome`. The program runs and stops with an error message.

**Runtime warning**:
A `detection outcome`. The program prints a warning and continues, possibly producing an incorrect result.

**Silent continuation**:
A `detection outcome`. The program continues without error or warning and produces incorrect output. The most consequential outcome.

**Severity**:
How consequential the error would be if it went undetected. Binary: `High` / `Low`. Assigned per scenario, independently of which comparator catches it.

### Severity rubric

The rubric matches the manuscript wording verbatim. Three High criteria, all required (conjunction); three Low signals, any one sufficient (disjunction).

**AV (alters values)**:
A High criterion. The error would change a numeric result, cohort membership, or clinical decision.

**PS (propagates systematically)**:
A High criterion. The error is systematic — affecting every patient or row that meets a certain condition in the same way, rather than introducing random noise.

**PO (produces plausible output)**:
A High criterion. The incorrect output looks plausible and would not be caught by routine inspection.

**OI (obviously implausible output)**:
A Low signal. The error produces obviously wrong output that an analyst would likely identify and fix (zero rows, an entirely missing column, a negative count).

**NA (non-analytic only)**:
A Low signal. The error affects only cosmetic properties such as display formatting or column ordering.

**SC (self-correcting)**:
A Low signal. The error is overwritten or discarded by a later step.

**High severity**:
AV ∧ PS ∧ PO all true.

**Low severity**:
Anything not High. Any one Low signal is sufficient explanation; not all three are required.

**Rationale field guidance**:
The rationale prose for each scenario in OVERVIEW.md should make the three High criteria visible with concrete observations: *what specifically* is altered, *which rows* are affected, *what the analyst would see* in the output. The aim is reader-verifiable classification — a reader can pick any scenario and check the verdict themselves — not a fixed sentence template.

### RPython corroboration

**Corpus**:
The RPython dataset (ESEC/FSE 2023), a third-party-curated collection of real-world StackOverflow bugs in R and Python data-analysis code. The in-scope TM subset lives at `RPython/TM_snippets.json` alongside the reproductions. Out-of-scope subsets (CDA, APIC, SM, IDAP_IB, TM_DFB) remain in `RPython-main/*.json` (gitignored) for reference but are not loaded by the verifier or generator.

**TM (Type Mismatch) subset**:
The 164-snippet subset of RPython curated for bugs whose root cause is a type mismatch. The corpus scope for this work's external corroboration. TM_DFB (110 snippets) is fully contained in TM and adds no new bugs. The other RPython subsets (CDA, APIC, SM, IDAP_IB) are **out of scope** — they cover broader phenomena (e.g., CDA's "Confusing Data Analytics") whose mix of API confusion, data-shape issues, and type-related bugs would dilute the corroboration of a thesis specifically about type-system catches.

**CDA reproductions**:
Three reproductions (`22591174`, `38516481`, `42719749`) exist in `RPython/CDA/` from earlier exploratory work, predating the decision to scope to TM. They are kept as illustrative examples that the same patterns arise outside the type-mismatch-curated subset, but they are NOT part of the inclusion evaluation denominator. The manuscript should describe them as illustrative, not as evidence of CDA-wide claims.

**Snippet**:
One raw entry in the corpus, identified `SO#<id>`. Untouched. The unit of corpus analysis (denominators and category distributions are over snippets).
_Avoid_: bug, sample, case.

**Mapping**:
The act, or the assigned value, of classifying a snippet against the rules in `RPython/rules.md`. A snippet's mapping is either one of the six categories (`included`) or one of the documented exclusion reasons (`excluded`).
_Avoid_: assignment, label.

**Reproduction**:
A single self-contained `.ts` file the authors write per included snippet. The file (a) inlines the original-language (pandas or R) reproduction as a string and runs it via `runForeign` from `RPython/run-foreign.ts`, and (b) demonstrates the Tidy-TS equivalent with a single `@ts-expect-error` on the catch line. Running the file with `deno run -A` emits both signals on stdout — the foreign exit code (`[pandas] exit=N | ...`) and any tidy-ts runtime guard messages — and `deno check` independently verifies the compile-time catch. Every *included* snippet gets one reproduction.
_Avoid_: example, pair, `.py`/`.ts` pair.

**Reproduction frontmatter (canonical)**:
Each reproduction `.ts` file carries a JSDoc header with six fields, in this order: `ID`, `Language`, `Bug class`, `Runtime consequence`, `In study`, `Inclusion rationale`. These are the only fields written by hand. All Tidy-TS-side fields (`Tidy-TS detection outcome`, `Tidy-TS detection mechanism`, `Tidy-TS catch explanation`, `Reproduction status`) are **derived** by the generator from observed behavior — see "Derived fields" below. This separation eliminates `.py`/`.ts` drift: the catch explanation cannot describe an aspirational mechanism because it is computed from the file's actual `@ts-expect-error` comment text.

**Original-language consequence**:
What the snippet's bug does in the language it was originally reported in. Enum: `DC` (silent data corruption) / `IF` (silent incorrect functionality) / `Crash` (program stops). From RPython metadata; distinct from `detection outcome`, which describes the candidate library's behavior on our reproduction.
_Avoid_: effect, behavior, outcome (bare).

**Reproduction status**:
What the reproduction runner observes today. Describes behavior, not cause. Enum:
- `Reproduces` — the reproduction file runs and the bug triggers as originally recorded (original-language consequence matches the frontmatter).
- `No longer reproduces` — the reproduction file runs without the recorded failure (clean exit if it was Crash; correct output if it was DC/IF). No claim is made about *why* it no longer triggers (upstream patch, API change, intentional behavior — not always knowable).
- `Variant` — the reproduction triggers a bug, but of a different class than originally recorded (e.g., recorded as Crash, now silent DC).

Only set on reproduction files. Excluded snippets do not carry this field.

### Derived fields (per reproduction)

These fields appear in generated tables but are NOT written by hand in the reproduction `.ts` file. The generator (`generate-tables.ts`) computes them from observed behavior, eliminating drift between hand-authored prose and actual file content.

**Tidy-TS detection outcome** (derived):
Computed by `verify.ts` from how the reproduction `.ts` behaves under `deno check` and `deno run -A`. Same enum as `detection outcome`.
- `deno check` reports an active `@ts-expect-error` → `compile-time error`
- No `@ts-expect-error` and tidy-ts runtime prints a `[tidy-ts]` guard message → `runtime error`
- No catch of any kind observed → `silent continuation`
- Bug class structurally cannot occur in TS/JS → `not applicable`

**Tidy-TS detection mechanism** (derived):
Enum: `compiler` / `zod schema validation` / `runtime API guard` / `none — language structural absence` / `none — library API design` / `none — bug still exists`. The three "none" sub-values capture meaningfully different non-catches; do not collapse them.
- `@ts-expect-error` present and effective → `compiler`
- `readCSV` + Zod schema in the file → `zod schema validation`
- tidy-ts runtime guard fires (e.g., `[tidy-ts]` prefix in stdout) → `runtime API guard`
- File documents the bug class as impossible in TS/JS → `none — language structural absence`
- File documents the bug class as avoided by tidy-ts API design → `none — library API design`
- File reproduces the failure without catching it → `none — bug still exists`

**Tidy-TS catch explanation** (derived):
The verbatim text of the `@ts-expect-error` comment, if present. For non-catches, derived from the mechanism per the format rules below. Because this is extracted from the file's actual catch line, the explanation cannot describe an aspirational mechanism the file does not exercise.

Format by mechanism:
- `compiler` / `zod schema validation` / `runtime API guard` → "[type or runtime rule] rejects [bad operation]"; example: `` `number` rejects `number | null` ``.
- `language structural absence` → "Language has no [feature]; bug class cannot occur."
- `library API design` → "tidy-ts API uses [different design]; bug class avoided by API choice."
- `bug still exists` → "tidy-ts reproduces [failure]; not caught."

**Language structural absence**:
A `Tidy-TS detection mechanism` value. The bug class requires a language feature TS/JS does not have (e.g., R's int/double distinction, R NSE-based scoping). The bug *cannot occur regardless of library*. Genuine credit, but recorded distinctly because it is not a type-system catch — there was nothing to catch. Outcome enum should be `not applicable`.

**Library API design**:
A `Tidy-TS detection mechanism` value. The bug class exists in the language but tidy-ts chose a different API design (e.g., `.replaceAll()` is unambiguously substring-based; no operator overloading on arrays/booleans). Credit, but acknowledge replicability — another TS library could make the same mistake the original library did. Outcome enum should be `not applicable`.

**Bug still exists**:
A `Tidy-TS detection mechanism` value. Tidy-TS reproduces the same failure mode and does not catch it. Outcome enum is `silent continuation` (or `runtime error` if it genuinely throws). Honest record for the limitations discussion; counts as a non-catch for coverage statistics.

### Equivalence rule for comparator implementations

A scenario is **equivalence-fair** across libraries when all six conditions hold:

1. **Common fixture** — every library reads the same input data from the shared `fixtures/` directory.
2. **Explicit intent** — the scenario carries a plain-English **intent statement** describing the task as a clinical analyst would phrase it (e.g., scenario 3b: "Compute the difference between each lab result value and the upper reference range"). Implementations are translations of this intent into each library's idioms.
3. **Idiomatic implementation** — each library's probe uses the API a competent practitioner would write first from the intent. Prefer the idiom most commonly taught in the library's own documentation. If a non-default API would materially change the detection outcome, note both alternatives in the scenario.
4. **Corruption verified** — every `silent continuation` outcome MUST programmatically assert what is corrupted in the output (NaN appears in a derived column, row count decreased, dtype changed, etc.), not just that no exception was raised. "Silent" without a corruption assertion is unverified silence.
5. **Versions pinned** — each library is pinned to a specific version (lockfile, `requirements.txt ==`, `renv.lock`, `deno.lock`). The harness records resolved versions in run output.
6. **Inequivalence acknowledged** — when a library has no equivalent operation, record `not applicable — no equivalent` rather than contriving an implementation. Note the asymmetry on the scenario.

**Intent statement**:
A one-sentence plain-English description of the analytic task a scenario exercises. Sits separately from any implementation. Allows reviewers to verify that all library probes implement the same task.

## Two contributions

The work makes two distinct contributions answering two distinct reviewer concerns. **Their headline numbers are not directly comparable** and must be presented disjointly.

| | Contribution A: Comparison suite | Contribution B: RPython corroboration |
|---|---|---|
| **Question** | When the same analytic operation is written in each library, which catches the error before silent corruption? | Do the categories of errors we designed scenarios for actually arise in real-world data-analysis code? Would Tidy-TS catch them? |
| **Unit of analysis** | Scenario | Snippet |
| **Source** | Authors designed from published taxonomies + Utah deployment | Third-party-curated StackOverflow corpus (RPython, ESEC/FSE 2023) |
| **Reviewer concern answered** | "Is the type-system approach better than the alternatives?" | "Did you cherry-pick errors your library handles?" |
| **Headline reporting** | Detection counts across libraries (e.g., 62/65 at compile time) | Distribution of mappings across the six categories; per-category catch rates with mechanism breakdown; excluded-bugs distribution. **Not** a single aggregate percentage. |

**Manuscript structure** (issue 07 implements this):
- Results section reports Contribution A.
- New "External validation" section (between Results and Discussion) reports Contribution B.
- Contribution B opens with an explicit non-comparability disclaimer: *"These results answer a different question than the comparison suite above; the per-category catch rates here are not directly comparable as numerical improvements or regressions against the comparison suite."*
- Discussion bridges both contributions explicitly: A's finding (the silent-continuation gap), B's finding (the categories generalize; here is what does not map and why), and a connecting paragraph that explains why A's design choices are defensible *because* B shows the categories are real.

## Categories

The six categories are the unit of organization for scenarios and the dimension along which RPython snippets are mapped.

| # | n | Name | Mechanism |
|---|---|---|---|
| 1 | 16 | **Column reference** | Property key not present on the row type |
| 2 | 14 | **Value type** | Operation not valid for the column's type |
| 3 | 17 | **Missing value** | Nullable type blocks operations that assume non-null |
| 4 | 8 | **Join** | Join introduces nullability or schema changes that the type system tracks |
| 5 | 3 | **Data loading** | Runtime validation (Zod) at the I/O boundary |
| 6 | 7 | **Schema composition** | Compile-time tracking through `bindRows`, `append`, and other composition operations |

Total: 65 scenarios.

**Note on directory structure:** scenarios live in five physical directories under `local/` (`local/cat-1-*` through `local/cat-5-*`) reflecting the historical five-category split. The six-category logical structure is applied at the reporting layer; specifically, scenarios `5a`/`5b`/`5c` remain Data Loading and scenarios `5d`–`5j` are reported under Schema Composition (and may be referred to as `6a`–`6g` in tables). Directory layout is not restructured — the renumbering is purely a reporting concern. The `local/` sibling of `RPython/` marks the author-designed comparison-suite reproductions; `RPython/` holds the external-corroboration reproductions.

## Reproducibility metadata

Every generated table (comparison-suite results and RPython corroboration tables) must record the following provenance so the numbers can be reproduced:

- **Corpus vintage** — RPython dataset version + retrieval date (the JSON files in `RPython-main/`).
- **Library versions** — every comparator pinned: Tidy-TS, pandas, tidyverse, Polars, Arquero, mypy, pyright, plus Python and R runtimes. Recorded from the lockfiles / pinned requirements files.
- **Evaluation date** — when the runner produced the table.
- **Runner script + commit** — path + git commit hash of the generator script.

Generated tables include this as a header block. The `corroboration-summary.json` (issue 05c) carries it as a top-level metadata object. A reader running the same scripts on the same pinned versions at a later date should produce identical tables, or a clearly different table whose differences can be attributed to a specific upstream change.

## Relationships

- A **scenario** belongs to exactly one **category**.
- A **scenario** has one **severity** (assigned independently of detection).
- A **scenario** × **comparator** produces one **detection outcome**.
- A **snippet** has one **mapping** (a category, or an exclusion reason).
- An *included* **snippet** has exactly one **reproduction**.
- A **reproduction** records both an **original-language consequence** (from the corpus) and a **Tidy-TS detection outcome** + **mechanism** + **catch explanation** (measured by the authors).

## Example dialogue

> **Reviewer:** "You designed the **scenarios** yourselves — isn't there selection bias?"
> **Author:** "Yes, which is why the corroboration uses the RPython **corpus** — a third-party-curated set of real **snippets** predating Tidy-TS. We **map** each snippet against pre-registered rules and report the distribution across our six **categories** plus the excluded set."
> **Reviewer:** "And how do you know Tidy-TS would catch the included ones?"
> **Author:** "For every included snippet we have a **reproduction** — a `.py` and `.ts` pair you can run. Each carries a frontmatter line for **Tidy-TS detection outcome**, **detection mechanism**, and a one-phrase **catch explanation**."
> **Reviewer:** "What about bugs that don't have a TypeScript equivalent?"
> **Author:** "Those are recorded in the **mechanism** field as either **language structural absence** (the failure mode requires a language feature TS/JS doesn't have, like R's int/double distinction) or **library API design** (TS could in principle have the bug, but tidy-ts's API made a different design choice). Neither counts as a catch. Separately, **bug still exists** means tidy-ts reproduces the same failure — an honest non-catch we record explicitly."

## Flagged ambiguities

- **"outcome"** was used for both detection outcomes and original-language consequences. Resolved: **detection outcome** (the candidate library's behavior on a scenario or reproduction, 4-valued) is distinct from **original-language consequence** (DC/IF/Crash, from corpus metadata). Never use "outcome" bare.
- **"probe" / "test" / "scenario"** were used interchangeably for the same unit. Resolved: **scenario** is canonical. "Test case" and "intentional error" from the manuscript draft also refer to a scenario.
- **"framework" / "library" / "package" / "tool"** all appeared for the comparators. Resolved: **library**. Distinct from **static code checker**, which describes mypy/pyright specifically.
- **Category 5** was named "Data loading" in the manuscript draft but covered both I/O-boundary errors and `bindRows`/`append` composition. Resolved: split into **Data loading** (3 scenarios, Zod at load) and **Schema composition** (7 scenarios, `bindRows`/`append`/duplicate keys). Total stays 65.
- **Scenario 1p** description in `OVERVIEW.md` ("residual grouping after summarize") did not match the test, which exercises "access non-summarized column after summarize." Resolved: docs follow the test (column reference after summarize); 1p stays in cat 1. Residual-grouping behavior, if added later, would be a new cat 6 scenario.
- **"Type system catch"** frontmatter field collapsed three distinct concepts (whether, how, narrative). Resolved: split into three fields — `Tidy-TS detection outcome` (whether), `Tidy-TS detection mechanism` (how), `Tidy-TS catch explanation` (one-phrase prose).
- **"Structurally absent"** collapsed three distinct non-catches (language feature missing / library API design / partial-but-not-total absence). Resolved: split into `language structural absence`, `library API design`, and `bug still exists`. The first two have outcome `not applicable`; the third has outcome `silent continuation` or `runtime error` and counts as a non-catch.
- **AV/PS/PO** — an earlier grilling pass proposed reframing AV as a gate and adding "operational tests" for PS and PO. Rolled back: the manuscript wording is plain English a clinical informaticist can read directly; my reformulations were vaguer and risked tightening the rubric beyond what the existing 65 scenarios were rated against. The leverage point is the rationale field's prose, not the rubric definitions.
- **"test suite"** could mean either the [[comparison-suite]] or the [[framework-test-suite]] (the framework's ~1,700 correctness tests under `packages/`). A third artifact, the [[type-tracking-demonstration-file]] (Supplementary A), is also separate. Resolved: three distinct glossary terms; never use "test suite" bare.
- **The two contributions' headline numbers** (A's 62/65, B's per-category rates) risk conflation. Resolved: disjoint sections, explicit non-comparability disclaimer at the top of section B, distribution-led reporting in B rather than a single aggregate percentage.

## Decisions recorded

- **No inter-rater check for RPython mappings.** No second clinical analyst available. Limitations section concedes this and leans on the corpus's independence (different research group, predates Tidy-TS) as the credibility argument.
- **Reproductions are comprehensive, not sampled.** Every included snippet receives a reproduction. Justification: under reviewer pressure on selection bias, more verifiable evidence per included snippet is worth the cost.
- **Arquero promoted to supplementary library.** Probe files already exist in the repo; the supplementary table gains a column and the prose gains a one-line introduction.
- **Severity rubric stays as the manuscript draft has it.** Three High criteria (AV ∧ PS ∧ PO), three Low signals (any one sufficient). Rationale field is the leverage point: prose should make the three criteria visible with concrete observations, but no fixed template is imposed.
- **Methods section adds one credibility sentence about severity rating.** The manuscript records that severity was assigned by the first author and reviewed against each criterion individually, with the per-scenario rationale recorded in the public table to allow re-rating by readers. This is the credibility move that replaces inter-rater agreement.
- **Equivalence-fair rule with six conditions** governs all comparator implementations. The most load-bearing condition is #4 (silent outcomes must programmatically assert what is corrupted, not merely the absence of error).
- **Two-contributions framing with disjoint manuscript sections.** Section B (External Validation) opens with an explicit non-comparability disclaimer and reports distribution + per-category breakdown rather than a single headline percentage.
- **Reproductions are single self-contained `.ts` files.** Originally each snippet had a paired `.py`/`.R` + `.ts`; sample audits found systematic drift where the catch explanation described an aspirational mechanism the `.ts` did not actually exercise (e.g., claiming `` `Temporal` rejects `string` `` when the file caught at `s.mean` on `string[]`). Resolved by collapsing to one self-contained `.ts` per snippet that inlines the original-language reproduction via `runForeign` from `RPython/run-foreign.ts`. The Tidy-TS detection fields are derived from observed file behavior, not hand-written, so drift between claimed and demonstrated catch is structurally impossible.
