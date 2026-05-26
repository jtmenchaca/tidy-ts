# JAMIA Manuscript

Glossary, style commitments, flagged ambiguities, and recorded decisions for the manuscript "Detecting Clinical Data Errors Before the Code Runs: Design and Evaluation of a TypeScript Data Analysis Framework". This file governs the body prose of the manuscript and its submission package. For terminology specific to the evaluation work (scenarios, categories, comparators, detection outcomes, the Ahmed et al. corroboration), see [`comparisons/CONTEXT.md`](./comparisons/CONTEXT.md).

## Audience

**Reader**:
A non-technical but engaged JAMIA reviewer. The reviewer has clinical informatics expertise; they may not have computer science training. They are willing to learn a new term if the manuscript introduces it in plain English first. Every paragraph in the body prose is calibrated against this reader.

**First-mention pattern**:
The manuscript introduces a jargon term by giving the plain-English meaning first and then naming the term. Element `7C270251` is the template: "some programming languages include a program called a compiler that checks for certain categories of errors before the code runs, using what is called a static type system. This is called compile-time checking." New terms added to the manuscript should follow this pattern.

## Language

### Manuscript artifacts

**Manuscript**:
The `.docx` at `docs/JAMIA/Detecting-Clinical-Data-Errors-Before-the-Code-Runs-20260513.docx`. The body prose, tables, and figures.
_Avoid_: paper (informal), draft, document.

**Submission package**:
The files under `docs/JAMIA/submission/` that accompany the manuscript: cover letter, title page, disclosures, alt text.

**Tidy-TS**:
The TypeScript framework being evaluated. The first reference in each section uses "Tidy-TS". Subsequent references in the same section may use "the framework" if locally unambiguous.
_Avoid_: tidy-ts (lowercase, except in code), Tidy TS (no hyphen), the library, the package.

**The framework**:
A permitted in-section alias for Tidy-TS after first mention. Never plural ("TypeScript data analysis frameworks") and never standalone without an antecedent.

**Comparison suite**:
The 65 author-designed test scenarios with parallel implementations across Tidy-TS, pandas, tidyverse, Polars, Arquero, mypy, and pyright. Reported in Tables 2 and 3 of the manuscript.
_Avoid_: test suite, evaluation suite, suite (bare).

**Framework test suite**:
The approximately 1,700 internal correctness tests under `packages/`. Mentioned once in the Methods to establish that the framework itself is tested. Distinct from the **comparison suite**.

**External validation**:
The evaluation of Tidy-TS against the 79 reproductions derived from the Ahmed et al. (2023) Type Mismatch collection. Reported as a subsection within Results.
_Avoid_: external corroboration, secondary evaluation.

**Independent bug collection**:
The phrase used in the External Validation subsection heading. Refers to the Ahmed et al. dataset of Python and R data analytics bugs. Chosen over "RPython dataset" (internal slug) and "real-world bugs" (reviewer-defense filler).

### Audience-facing terms

**Clinical analyst**:
The professional doing data analysis on clinical data. Used on first reference in a section. Subsequent references in the same section may use "analyst".
_Avoid_: researcher (overlaps but excludes operational use), user (too vague), data scientist (overlaps but emphasizes a different role).

**Analyst**:
A permitted in-section alias for clinical analyst.

**Developer** / **Programmer**:
The Limitations paragraph uses "developer" once ("designing the expected data structure remains the developer's responsibility") and "programmer" once ("Programmers can bypass the compiler"). These are deliberate. They mark a task that falls outside the clinical analyst's normal scope, signalling who is responsible for that boundary. Elsewhere in the manuscript, the actor is the **analyst**.

**Downstream analysis**:
Any step in the data analysis workflow that consumes the output of an earlier step. A join, a summarization, a model fit, a chart, or a report. Used throughout Background and Discussion when arguing the consequence of silent errors.

**Workflow**:
The sequence of processing steps in a data analysis. Matches Figure 1's label "Tidy-TS Clinical Data Workflow".
_Avoid_: pipeline (used informally elsewhere but not canonical; "pipeline" is acceptable only when citing literature that uses it).

**Tracked columns**:
The mechanism by which the Tidy-TS compiler knows which columns exist at each step. Introduced in Methods element `4367DD6C`.
_Avoid_: column tracking (verb form is fine; the noun is "tracked columns").

**Validation**:
The runtime check Tidy-TS performs when external data first enters the program. Introduced in Methods element `42308838`. Distinct from **compile-time checking**, which the compiler performs without running the code. "Validation" is runtime and at the boundary; "checking" is compile-time and across the rest of the workflow.

**Compile-time checking**:
The compiler examines the code before it runs and rejects code that violates type rules. Introduced in Background element `7C270251`.

**Runtime checking**:
The program runs and either stops with an error or emits a warning when the error is reached. Introduced in Background element `7DE165F6`.

**Catch** (verb), **caught** (past tense):
The canonical verb for any detection outcome (compile-time error, runtime error, or warning) that prevents incorrect output. "Tidy-TS catches the error at compile time." "Pandas caught 26 of 65 at runtime."
_Avoid_: detect, spot, flag, notice, intercept as substitutes for "catch". "Detection" is fine as the noun phrase (e.g., "detection outcome", "Detection Rates by Error Category").

**Silent continuation**:
The canonical noun phrase for an error that produces incorrect output without any signal. Defined in Table 1.

**Continued silently**:
The canonical verb phrase. "All 28 continued silently in pandas."
_Avoid_: silent error (implies an error was raised, which is the opposite), missed (acceptable but reserves a narrower meaning).

**Missed**:
A library missed an error if the error continued silently. Acceptable in body prose. "Pandas caught 26 at runtime and missed 39."

**Error**:
The thing the comparison suite is testing. The canonical word on the comparison-suite side of the manuscript (Methods, Results, Discussion of Contribution A).
_Avoid_: mistake (informal), failure (acceptable but reserves a specific meaning of "the failure mode").

**Bug**:
The canonical word on the Ahmed et al. external-validation side. Matches their study's nomenclature. "Of the 164 Type Mismatch bugs from Ahmed et al., 79 met the inclusion rules."

**Plausible but incorrect output**:
The phrase that anchors the central argument. Used in the Abstract, Results, and Discussion.

### Clinical data terms

**Clinical data**:
The canonical umbrella term for the data the framework processes. Patients, encounters, laboratory results, medications, vital signs, claims, etc.

**EHR data**:
A specific subset of clinical data that came from an Electronic Health Record. Used when distinguishing source matters.
_Avoid_: patient data (informal), EMR data (use EHR consistently).

**Clinical Decision Support (CDS)**:
The downstream application where silent data errors do real damage. Used in Background and Discussion as a recurring example of why detection matters.

### Style commitments specific to this manuscript

The generic style rules live in the [`audit-prose` skill](file:///Users/jtmenchaca/personal/.claude/skills/audit-prose/SKILL.md). The manuscript-specific commitments below extend or override the defaults.

- **First-mention pattern is enforced.** Jargon (compiler, compile-time checking, runtime checking, static type system, validation, tracked columns) is introduced with a plain-language gloss in the same sentence or the immediately preceding one.
- **Never reach for "framework" without "Tidy-TS" preceding it in the section.** Never plural, never bare.
- **"Clinical analyst" on first mention in a section, "analyst" thereafter.** Never "researcher".
- **The three detection verbs are "caught", "missed", "continued silently".** Synonyms introduce noise into the comparison vocabulary.
- **"Compile-time" hyphenated as an adjective, two words ("at compile time") as a noun.** Same pattern for "runtime".
- **Numbers in body prose match the tables exactly.** If a table cell changes, the corresponding number in the body must change in the same edit.
- **The framework name is Tidy-TS** with that exact casing. Code references use `@tidy-ts/dataframe` etc.
- **Citation style** is JAMIA numeric: `[1]`, `[1,2]`, `[1-3,4]`, `[1,5,7]`, with the References list numbered at the end in order of first appearance. Author-year placeholders (`[Kahn 2016]`, `[Razzaghi 2026]`, etc.) are temporary and will be converted to numbers in a final pass.
- **No triplets-by-example, whether in one sentence or stacked across sentences.** A single comma-separated list of three near-synonymous clauses ("X, Y, and Z") and three short sentences each illustrating the same point have the same problem. If three or more examples are doing the same work, keep the strongest one and cut the rest. Same logic for four or five.
- **No victory-lap closers.** A sentence that ends by restating a finding already shown in Results (e.g. "which in this evaluation were also the most consequential") adds no information. Cut it. Watch for "also" and "as well" pointing back at something the reader already has.
- **No source scaffolding when citing.** When a sentence cites a study, the beat is the finding. Methodological detail about the source ("in a survey across 14 US sites", "in a multicenter study") is scaffolding that does not carry the beat. The citation contracts the reader to the source; the prose does not have to re-narrate the source's design. Drop scaffolding unless the design feature itself is the point (e.g. "an independent research group", "predates Tidy-TS"). Hedged quantifiers ("nearly all", "most", "many") usually stand in for a specific statistic; use the statistic if you have it, or drop the quantifier rather than hedge.
- **Fetch citations before editing.** When auditing a passage that cites a study, and the prose contains a hedged quantifier or a claim that needs verification, pull the article with the pmc-fetch tool and read the relevant section before proposing an edit. The audit's job is to know what the cited paper actually says so the prose can use the right specific number or drop the unhedged claim. Working from "I think this is what the paper says" produces the same hedges we are auditing for. Fetch first, edit second.
- **An audit is a pass, not a sanity check.** When auditing a passage, treat every phrase as a candidate for improvement rather than looking for things "wrong enough" to flag. If a phrase has a real issue (a doublet, a wordy modifier, grammatical ambiguity, restatement, an unnecessary noun phrase), state it and propose a fix even if the issue is small. The bar is not "is this sentence broken" — the bar is "would a careful reader of the next draft want this changed". Default to proposing a change. The audit only finds the issues that get named.
- **Coverage scan before phrase scan.** Before auditing prose phrase by phrase, check that both contributions of this manuscript (the comparison suite AND the external validation against Ahmed et al.) are reachable from each summary-level section: the Abstract Methods, the Abstract Results, the Conclusion, the cover letter, the tweet. A reviewer who reads only the Abstract should not miss a contribution. Coverage failures are not visible during a phrase-by-phrase pass and have to be checked at a higher altitude first.
- **Beats are not just counted, they are checked.** A "beat" is one unit of argument the writer is making. For each beat in a paragraph the audit asks three things, not one. (1) Distinct work — is this beat saying something the prior sentence did not say? (2) Concept reachability — does the beat introduce or rely on a concept (e.g. "downstream analysis", "side effects of a halted program", "non-standard evaluation"), and if so, can a non-technical JAMIA reviewer hold that concept here? (3) Concrete enough to ground — if the concept is abstract, does the beat give at least one concrete instance the reader can attach to? A beat that fails (2) or (3) is a candidate for expanding or anchoring, not for cutting. The padding rule applies only to (1).

## Relationships

- The **manuscript** reports two contributions: the **comparison suite** (65 author-designed errors) and the **external validation** (79 bugs from the **independent bug collection**).
- Each scenario in the **comparison suite** is run across the libraries in the comparisons glossary. Outcomes are reported by error **category** rather than by severity rating.
- The **manuscript** is the artifact submitted to JAMIA. The **submission package** at `docs/JAMIA/submission/` accompanies it.
- For evaluation-side terms (scenario, category, comparator, detection outcome, catch signals), the **manuscript** defers to the [comparisons glossary](./comparisons/CONTEXT.md). The manuscript's body prose uses the audience-facing vocabulary above; the comparisons glossary uses the evaluation-side vocabulary.

## Example dialogue

> **Reviewer:** "The Abstract says 'Tidy-TS caught 62 of 65 errors before the code ran.' Is that the same as 'compile-time error' in Table 1?"
> **Author:** "Yes. The Abstract uses the plain-language phrase 'before the code ran' for accessibility; Table 1 introduces the formal term 'compile-time error'. The manuscript follows a first-mention pattern of plain English in the Abstract and Background, with the formal term defined in Methods and Table 1."
> **Reviewer:** "The Discussion talks about 'the analyst'. Is that the same person Limitations calls 'the developer'?"
> **Author:** "Not quite. The body of the manuscript argues for the **clinical analyst** as the primary user. Limitations names the **developer** at one boundary (designing the expected data structure) because that task falls outside the analyst's typical scope. The distinction is intentional and is recorded in this glossary."

## Flagged ambiguities

- **"compile-time checking" vs "static type checking" vs "static type system"** — the manuscript uses several variants. Resolved: **"compile-time checking"** is canonical in the manuscript's argument. **"Static type checking"** appears only when citing external literature that used that term (e.g., Gao et al. 2017 JavaScript study, Khan et al. 2021 Python study — refs [20][21]). **"Static type system"** is dropped from the manuscript's voice in favor of "compile-time type checking" or "the compiler checks types before the code runs." **"Static type checker"** is retained as the proper-noun category name for Python's mypy and pyright (Supplemental Table 1 title, body references to mypy/pyright), since Python's ecosystem calls them that.
- **"missing value" vs "null" / "NA"** — resolved: "missing value" is the canonical phrase in body prose. References to null, NaN, or NA appear only inside code examples and table cells.
- **"clinical analyst" vs "researcher"** — resolved: "clinical analyst" is canonical. Tidy-TS is also used in operational (quality improvement) contexts, not just research; "researcher" would understate the audience.
- **"comparison suite" vs "test suite"** — resolved: "comparison suite" for the 65 scenarios; "framework test suite" for the framework's own internal tests.
- **"bug" vs "error"** — resolved: "error" on the comparison-suite side, "bug" on the Ahmed et al. side. The body prose mirrors this.
- **"framework"** — resolved: never plural, never standalone, always after first mention in a section.
- **"production data" vs "real data"** — resolved: avoid "production data" (clinical informatics readers may parse it as the live clinical system, not as "data the analyst did not select"). Use "real data" or describe specifically.
- **"real-world bugs" as a heading** — resolved: avoid. Replaced earlier with "an independent bug collection" because "real-world" is reviewer-defense filler.
- **"workflow" vs "pipeline"** — resolved: "workflow" is canonical. "Pipeline" is acceptable only when citing literature that uses it.
- **"Used at" vs "deployed at" the University of Utah** — resolved: "used at" is preferred. The framework is in active use for quality improvement and research analyses at Utah, not "deployed" in the production-software sense.
- **"At compile time" / "before the code runs" / "before the code is run"** — these are all canonical and interchangeable. No need to force one phrasing.
- **"Data analysis" vs "data analytics"** — resolved: "data analysis" in the manuscript's voice. "Data analytics" is preserved only inside citations and quoted titles (e.g., the Ahmed et al. study title).

## Decisions recorded

These are structural choices about how the paper is constructed. Future revisions should not undo them without revisiting the rationale.

- **The five-category split (Column reference, Value type, Missing value, Join, Data loading) is used in the manuscript** instead of the six-category logical split used in the comparisons glossary. Data loading and Schema composition are collapsed into one category ("Data loading", 10 scenarios) to keep Table 2 compact and the prose readable.
- **Severity ratings are not used.** Earlier drafts classified each scenario as High or Low using an AV/PS/PO rubric inspired by FMEA. The rubric depended on rater assumptions about downstream code that the verifier could not measure, and the AV/PS/PO conjunction was decorative for a fundamentally subjective judgment. Outcomes are reported by error category instead. Future revisions should not reintroduce a binary or numeric severity scale.
- **Compile and runtime are independent boolean signals per (scenario × library), not a single mutually-exclusive enum.** A scenario can fire both compile-time and runtime catches. Table 2 reflects this. Future revisions proposing a single-valued cell per scenario should know why we rejected that.
- **The two contributions are reported disjointly.** The comparison suite (Contribution A) and the external validation (Contribution B) live in separate Results subsections with an explicit non-comparability sentence in the External Validation subsection. Future revisions should not aggregate them into a single headline percentage.
- **`@tidy-ts/graph` is mentioned in the Methods of the External Validation subsection but is not given its own section.** Graphing is supplementary, not headline. Future revisions should not promote it to a primary contribution.
- **The Discussion does not have an External Validation subsection.** The external validation is reported in Results and its limitation appears in Limitations. The Discussion stays focused on the comparison-suite finding.
- **mypy and pyright appear in Supplemental Table 1, not Table 2.** They are static checkers, structurally different from the runtime libraries that anchor Table 2. Polars and Arquero also appear in Supplemental Table 1 as supplementary libraries.
- **Counts and percentages are reported together** ("62 of 65 (95%)") rather than separately.
- **AI-assisted tools are acknowledged explicitly** in the Acknowledgements and in the cover letter's AI Disclosure section.
- **The framework was built in TypeScript** rather than as a Python or R package because the goal was to add a static type system to clinical data analysis, and TypeScript's type system tracks column-level shape in a way that Python's optional `mypy`/`pyright` and R's optional packages do not. This is the recorded rationale for the language choice and a likely reviewer question. Methods element `7C270251` and the Discussion paragraph `1182C234` together carry the argument.

## Open items

These are known incomplete tasks. They are not glossary entries but are listed here so the next pass can find them.

- **Citation conversion** — author-year placeholders in body prose (`[Kahn 2016]`, `[Blacketer 2021]`, `[Razzaghi 2026]`, `[Wang 2026]`, `[Trisovic 2022]`, `[Song 2026]`, `[Sauer 2022]`, `[Kohane 2021]`) need to be converted to JAMIA numeric citations matching the References list at the end. The Ahmed et al. (2023) reference also needs to be added to the References list and converted to numeric.
- **Word count** — hard target 3,750 total (Abstract + body, excluding Acknowledgements and References). JAMIA allows up to 4,000 in the body and 250 in the Abstract, but we hold a 250-word safety margin below JAMIA's combined cap because the forcing function reliably surfaces real bloat. Per-section budgets sum to 3,750. The current text is ~4,300; cuts come from Discussion + Limitations and from Methods.

  | Section | Budget | Current |
  |---|---:|---:|
  | Abstract | 250 | 247 |
  | Background and Significance | 500 | ~600 |
  | Objective | 75 | ~76 |
  | Materials and Methods | 900 | ~1,100 |
  | Results | 650 | ~785 |
  | Discussion (including Limitations) | 1,000 | ~1,400 |
  | Conclusion | 75 | 100 |
  | Headings + transitions | ~300 | ~300 |
  | **Total** | **3,750** | **~4,300** |

  Tables are counted separately and outside this number. Per the JAMIA checklist, Limitations is a subsection of Discussion, not its own section. Anything that does not fit gets cut on the audit pass, not deferred.
- **Submission date** — target: 2026-05-29.

## Provenance

This file was written on 2026-05-18 from the current state of `Detecting-Clinical-Data-Errors-Before-the-Code-Runs-20260513.docx` and the submission package at `submission/`. It cross-references [`comparisons/CONTEXT.md`](./comparisons/CONTEXT.md) for evaluation-side terms.
