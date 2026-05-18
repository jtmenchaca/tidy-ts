# Manuscript: rename categories, swap framework→library, add Arquero

Status: ready-for-human

## What to build

Revise `docs/JAMIA/Detecting-Clinical-Data-Errors-Before-the-Code-Runs-*.docx` (the manuscript) to adopt the canonical glossary from `docs/JAMIA/comparisons/CONTEXT.md`. Three coordinated changes:

1. **Six categories, not five.** Split the current "Data loading" category (10 scenarios) into:
   - **Data loading** (3 scenarios): only the readCSV+Zod boundary cases.
   - **Schema composition** (7 scenarios): bindRows, append, duplicate-key cases.

   Update the abstract, methods, results, Table 2, Table 3, Figure 2, and Supplementary Table 1 to reflect six categories. Recompute and re-render any per-category figures.

2. **"Library" replaces "framework"; introduce the compiler vs static code checker distinction.** Replace "framework" (when referring to Tidy-TS, pandas, tidyverse, Polars, Arquero) with **library** throughout. In the Background or Methods section, add a paragraph (or sentence) introducing the distinction:

   > The TypeScript compiler is part of how the code runs — every TypeScript program is type-checked before it runs, and incorrect types prevent the program from being executable. Static code checkers like mypy and pyright are optional tools layered on top of Python — the Python program runs whether or not mypy approves of it.

   This pre-empts the reviewer question "isn't mypy/pyright the same thing?" and motivates the supplementary table's zero-catch result.

3. **Add Arquero to the supplementary library set.** Arquero probe files already exist under `cat-*/probe-arquero.ts`. Promote it from repo-only to supplementary. Add an Arquero column to Supplementary Table 1 with its detection counts, and add one sentence introducing it: "Arquero is a JavaScript dataframe library with a column-oriented API but without compile-time column tracking."

4. **Distinguish the comparison suite from Tidy-TS's framework test suite at first mention.** When the manuscript first refers to Tidy-TS's own correctness tests (currently in the Compile-Time Checking section, "approximately 1,700 tests"), spell out the distinction with one sentence — e.g., "Tidy-TS includes approximately 1,700 unit and integration tests covering dataset operations, statistical functions, and I/O — distinct from the comparison suite reported here, which evaluates detection outcomes across libraries." Never use "test suite" bare; always qualify as "the framework's test suite" or "the comparison suite."

5. **Introduce the focused type-tracking test file (Supplementary A) by its role, not just by its existence.** Current prose says "a focused test file containing a series of intentional errors alongside valid operations." Slightly sharpen to clarify it is a third artifact, distinct from both the comparison suite and the framework test suite: "a focused test file that exercises the TypeScript compiler against a curated mix of intentional errors and valid operations."

6. **Add a credibility sentence to the Methods section on severity rating.** The Limitations paragraph already concedes "Severity was assigned by the study team rather than independent raters, though criteria are defined explicitly to support reproducibility." Strengthen this with a Methods-section sentence pointing readers at the public per-scenario rationale table: e.g., "Severity was assigned by the first author and reviewed against each criterion individually. The per-scenario rationale is recorded in the public comparison-suite table to allow re-rating by readers." This is the credibility move that replaces the inter-rater check we declined to do.

## Acceptance criteria

- [ ] Abstract, methods, results, and discussion all reference six categories.
- [ ] Tables 2, 3, and Supplementary Table 1 have six category rows.
- [ ] Figure 2 has six category cells.
- [ ] "Framework" → "library" replacement is consistent throughout, except where the word refers to non-comparator concepts (e.g., "data quality framework" from Kahn et al.).
- [ ] One paragraph or sentence in Methods or Background introduces compiler vs static code checker.
- [ ] Supplementary Table 1 has an Arquero column populated from the existing `probe-arquero.ts` runs.
- [ ] One-line introduction to Arquero is added wherever the supplementary libraries are first listed.
- [ ] At first mention of the framework's correctness tests, prose distinguishes them from the comparison suite. No bare uses of "test suite" remain.
- [ ] The Supplementary A test file is introduced with role-clarifying language as a third distinct artifact.
- [ ] Methods section includes a sentence on the severity-rating process pointing readers at the public per-scenario rationale table.

## Blocked by

- None — vocabulary is established in CONTEXT.md.
