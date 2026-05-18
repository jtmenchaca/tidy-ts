# Plan: restructure `local/cat-*` to the self-contained scenario design (Option B)

This plan converts the 65 author-designed comparison-suite scenarios from the current per-category harness layout to the single-file-per-scenario shape used in `RPython/`. Goal: full uniformity. Each scenario becomes one self-contained `.ts` file that inlines every comparator and demonstrates the Tidy-TS catch in the same file. No shared harness; the verifier walks the scenario files and derives all per-comparator detection outcomes from observed runtime/compile signals.

## Target shape

```
local/cat-1-column-schema-reference/
  scenarios/
    1a_misspelled_column_in_expression.ts
    1b_nonexistent_column_in_predicate.ts
    ...
    1p_access_non_summarized_column_after_summarize.ts
  data.ts                                  ← shared typed Tidy-TS DataFrame constants
local/cat-2-type-safety/
  scenarios/
    2a_arithmetic_on_string_column.ts
    ...
  data.ts
local/cat-3-null-missing-data/
  scenarios/
    3a_method_call_on_nullable_column.ts
    ...
  data.ts
local/cat-4-join-safety/
  scenarios/
    4a_join_on_key_not_in_left_table.ts
    ...
  data.ts
local/cat-5-schema-composition/
  scenarios/                               ← Note: contains both cat-5 (a/b/c) and cat-6 (d–j) scenarios per the directory-vs-reporting split
    5a_non_numeric_value_in_numeric_column_at_load.ts
    ...
    5j_string_operation_on_duplicate_column_name.ts
  data.ts
```

The per-category `cat-N-*.test.ts` harness file, `probe.py`, `probe.R`, `probe-polars.py`, `probe-arquero.ts`, `probe-mypy.py`, and `probe-pyright.py` are **all deleted** at the end. Their content moves into the per-scenario files.

## File template (canonical shape)

Each scenario `.ts` file follows this structure exactly:

```typescript
/**
 * ID: 3b
 * Category: Missing value
 * Label: arithmetic on nullable column
 * Intent: Compute the difference between each lab result value and the upper reference range.
 * Severity: High
 * Severity criteria: AV=Y PS=Y PO=Y
 * Rationale: result_value - reference_high produces NaN for every null-bearing row. Alters the derived column (AV), affects every row where reference_high is null (PS), and the column contains a mix of valid numbers and NaN that looks plausible in a lab-value context (PO).
 */
import { stats as s } from "@tidy-ts/dataframe";
import { labs05 } from "../data.ts";
import { runForeign, printForeignResult } from "../../runners.ts";
import { runStaticChecker, printStaticCheckerResult } from "../../runners.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
labs = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "result_value": [100, 200],
    "reference_high": [120, None],
})
labs["deviation"] = labs["result_value"] - labs["reference_high"]
`;
printForeignResult("python", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(tidyverse))
labs <- tibble(
  patient_id = c("P001", "P002"),
  result_value = c(100, 200),
  reference_high = c(120, NA)
)
labs <- labs %>% mutate(deviation = result_value - reference_high)
`;
printForeignResult("r", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
labs = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "result_value": [100, 200],
    "reference_high": [120, None],
})
labs = labs.with_columns((pl.col("result_value") - pl.col("reference_high")).alias("deviation"))
`;
printForeignResult("polars", runForeign("python", polarsScript));

// mypy / pyright (static checkers on pandas code) ───────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
import * as aq from "npm:arquero";
const arqueroTable = aq.table({
  patient_id: ["P001", "P002"],
  result_value: [100, 200],
  reference_high: [120, null],
});
const arqueroResult = arqueroTable.derive({ deviation: (d: { result_value: number; reference_high: number | null }) => d.result_value - d.reference_high });
console.log(`[Arquero] exit=0 | rows=${arqueroResult.numRows()}`);
// NOTE: Arquero accepts the operation silently. The result column will contain
// NaN where reference_high is null. The verifier classifies this as
// `silent continuation` for Arquero.

// Tidy-TS ────────────────────────────────────────────────────────────────────
// @ts-expect-error — Argument of type '(number | null)[]' is not assignable to parameter of type 'number[]'
labs05.mutate({ deviation: (r) => r.result_value - r.reference_high });
```

### Strict rules for the JSDoc header

Exactly 7 fields, in this order:
- `ID` — `1a` through `5j` (scenarios `5d`–`5j` may also be referred to as `6a`–`6g` in tables, but the directory keeps the historical 5-letter form).
- `Category` — one of: `Column reference`, `Value type`, `Missing value`, `Join`, `Data loading`, `Schema composition`.
- `Label` — short bug description, lifted from the existing `LABELS` array in the corresponding `cat-N-*.test.ts` harness.
- `Intent` — plain-English task, lifted from the existing `INTENTS` array (or from OVERVIEW.md's Intent statements section if the harness `INTENTS` array is missing).
- `Severity` — `High` or `Low`, lifted from OVERVIEW.md's per-scenario classification table.
- `Severity criteria` — `AV=<Y/N> PS=<Y/N> PO=<Y/N>` (and `OI`/`NA`/`SC` if applicable for Low scenarios), lifted from OVERVIEW.md.
- `Rationale` — the verbatim rationale text from OVERVIEW.md's per-scenario classification table.

### Strict rules for the comparator blocks

- Each block is preceded by a section divider comment using `─` characters, matching the RPython template style.
- Foreign scripts are written as template literals using minimal data inlined as Python/R literals. Do not import data from `../data.ts` for the foreign side — that's impossible (foreign runtimes can't read TS modules). The Tidy-TS side imports from `../data.ts`.
- Foreign scripts perform exactly the operation that triggers the bug. No fix demonstrations, no commentary, no `print` calls beyond what triggers the bug.
- Static-checker blocks reuse the `pandasScript` string. They run mypy/pyright on a temp file derived from that string.
- Arquero is imported via `npm:arquero` and called inline as TS code, not via `runForeign`. The Arquero block emits a `[Arquero] exit=N | <message>` line itself via `console.log`.
- The Tidy-TS block has exactly one `@ts-expect-error` line. Its comment is the verbatim TypeScript error message that `deno check` produces.

## Shared data module per category

`local/cat-N-*/data.ts` exports typed `createDataFrame(...)` constants. The cat-3 file would look like:

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";

export const labs05 = createDataFrame([
  { patient_id: "P001", result_value: 100, reference_high: 120 as number | null },
  { patient_id: "P002", result_value: 200, reference_high: null },
]);

export const labs11 = createDataFrame([
  { lab_id: "L1", result_value: 100, reference_high: 120 as number | null },
  { lab_id: "L2", result_value: 200, reference_high: null },
]);

// ... etc, lifted verbatim from the current cat-3-null-missing-data.test.ts file
```

The constants are lifted verbatim from the current `cat-N-*.test.ts` "Shared data" section. Constants used by exactly one scenario can be inlined into that scenario's `.ts` file instead of `data.ts`.

## New runner module: `local/runners.ts`

This file is created once. It exports three helpers, all of which print uniform `[<comparator>] exit=N | <last stderr line>` lines:

```typescript
export function runForeign(runtime: "python" | "r", script: string): ForeignRunResult;
export function printForeignResult(comparator: "python" | "r" | "polars", result: ForeignRunResult): void;

export function runStaticChecker(checker: "mypy" | "pyright", pythonScript: string): StaticCheckerResult;
export function printStaticCheckerResult(checker: "mypy" | "pyright", result: StaticCheckerResult): void;
```

`runStaticChecker` writes the Python script to a temp file under `Deno.makeTempFile({ suffix: ".py" })`, runs `mypy --strict <tmp>` or `pyright --outputjson <tmp>`, and captures the exit code + error count. The temp file is deleted after the run.

`printForeignResult("polars", ...)` is identical to `runForeign("python", ...)` plus a `[Polars]` label so the verifier can attribute the signal correctly.

These helpers live in `local/` (sibling of `cat-*` directories) so the per-scenario files import them via `../../runners.ts`. They are conceptually a superset of the existing `RPython/run-foreign.ts` helpers; once written, the RPython files can import from `local/runners.ts` too (single source of truth).

## New verifier: `local/verify-local.ts`

Sibling of `RPython/verify.ts`. Walks every `local/cat-N-*/scenarios/*.ts`. For each:
1. Reads the JSDoc header to capture the 7 frontmatter fields.
2. Runs `deno check` against the file (Tidy-TS compile signal — the `@ts-expect-error` line).
3. Runs `deno run -A` against the file. Parses stdout for `[pandas] exit=N | ...`, `[r] exit=N | ...`, `[Polars] exit=N | ...`, `[mypy] exit=N | ...`, `[pyright] exit=N | ...`, `[Arquero] exit=N | ...`, and `[tidy-ts]` runtime-guard lines.
4. Derives per-comparator `Detection outcome` enum values from these signals using the same rules as RPython's verifier:
   - exit non-zero → `runtime error`
   - exit 0 with structured warning (`UserWarning:`, `Warning message:`) → `runtime warning`
   - exit 0 with no warning → `silent continuation`
   - Tidy-TS `@ts-expect-error` honored → `compile-time error`
5. Writes `local-verification-report.{json,md}` with per-scenario × per-comparator detection outcomes.

## New generator: extend `generate-tables.ts` (or add `generate-local-tables.ts`)

Reads `local-verification-report.json` and emits the comparison-suite tables that currently live in OVERVIEW.md and Table 2 / Table 3 of the manuscript. The tables are inserted between `<!-- BEGIN GENERATED -->` / `<!-- END GENERATED -->` markers in OVERVIEW.md.

The headline counts (the 62/65 number, severity breakdown, per-category counts across comparators) all come from this generated output.

## Agent rollout

Five parallel agents, each handling one category. Plus one prep agent that builds the new infrastructure (runners, data.ts modules) before the scenario agents start.

### Phase 1 (single prep agent, sequential)

Run **before** the scenario agents. This agent:
1. Creates `local/runners.ts` with `runForeign`, `printForeignResult`, `runStaticChecker`, `printStaticCheckerResult`. The first two can be lifted from `RPython/run-foreign.ts`. The static-checker helpers are new — they must (a) write the script to a temp `.py`, (b) invoke `mypy --strict --no-incremental --hide-error-context --no-error-summary <tmp>` and `pyright --outputjson <tmp>`, (c) parse the exit code and error count, (d) clean up the temp file.
2. Creates per-category `data.ts` files lifted verbatim from each `cat-N-*.test.ts` harness's "Shared data" section. One per category. The agent reads each harness's shared-fixtures block and writes the exports.
3. Decides whether `RPython/run-foreign.ts` should re-export from `local/runners.ts` or vice versa. Picks one source-of-truth location and updates the other to re-export. (Recommendation: move helpers into a neutral location like `comparisons/runners.ts` so both `local/` and `RPython/` can import from it. Pick whichever ergonomics works.)
4. Type-checks the new infrastructure files with `deno check`.

### Phase 2 (five parallel agents, one per category)

Each agent owns one category directory. Per agent:

1. Read the current `cat-N-*.test.ts` harness to get the LABELS, INTENTS, shared data, and the `Deno.test(...)` blocks for each comparator (Tidy-TS compile, Tidy-TS runtime, Pyright, Mypy, Python/pandas, Polars, R, sometimes Arquero).
2. Read OVERVIEW.md's per-scenario classification table for this category to get Severity, Severity criteria, and Rationale.
3. For each scenario in the category (typically 8–17 scenarios), create `local/cat-N-*/scenarios/<id>_<slug>.ts` following the template above. The file must:
   - Carry the 7-field JSDoc header.
   - Inline minimal pandas code for the scenario's specific bug, lifted from `probe.py`.
   - Inline minimal R code, lifted from `probe.R`.
   - Inline minimal Polars code, lifted from `probe-polars.py`.
   - Inline minimal Arquero code, lifted from `probe-arquero.ts` if it exists in this category; otherwise omit the Arquero block and document that Arquero has no scenario for this category in the file's docstring.
   - Pull mypy and pyright invocations against the same pandas script.
   - Demonstrate the Tidy-TS catch with the same operation as the existing harness's Tidy-TS compile-time `Deno.test` block — verbatim, including the `@ts-expect-error` comment.
4. Type-check each new scenario file with `deno check`. Adjust the `@ts-expect-error` comment to match the actual TypeScript error message produced.
5. Run each new scenario file with `deno run -A` and confirm it emits the expected `[pandas] exit=N | ...`, `[r] exit=N | ...`, `[Polars] exit=N | ...`, `[mypy] exit=N | ...`, `[pyright] exit=N | ...`, and `[Arquero] exit=N | ...` lines.
6. Delete the harness file `cat-N-*.test.ts` and the per-comparator probe files (`probe.py`, `probe.R`, `probe-polars.py`, `probe-mypy.py`, `probe-pyright.py`, `probe-arquero.ts`).

### Phase 3 (single integration agent, after phase 2)

1. Create `local/verify-local.ts` (or extend `RPython/verify.ts` to walk both trees). Implements the verifier described above.
2. Extend `generate-tables.ts` (or add a sibling) to consume `local-verification-report.json` and emit the comparison-suite tables into OVERVIEW.md between BEGIN/END markers.
3. Run the full pipeline: `verify-local` then `generate-tables` and confirm the per-scenario × per-comparator detection outcomes match what's reported in OVERVIEW.md today.
4. Compare the headline counts (62/65 at compile time in Tidy-TS, 24 runtime errors in pandas, etc.) to confirm no regression.

## Agent prompt template (for phase 2 — adapt per category)

```
**Context.** We are restructuring the JAMIA comparison suite's category-N tests from a single per-category harness to per-scenario self-contained `.ts` files (matching the design used in RPython/). Each scenario file inlines every comparator: pandas, tidyverse, Polars, mypy, pyright, Arquero, and the Tidy-TS catch. The verifier walks scenario files and derives detection outcomes from observed runtime/compile signals.

The canonical template is `RPython/TM/25416955_string_dates_plot.ts` extended to multiple comparators per the plan at `.scratch/jamia-glossary-followups/cat-restructure-plan.md`. The shared runners helper is `local/runners.ts`. The shared typed Tidy-TS data is `local/cat-N-*/data.ts`.

**Scope.** Convert all scenarios in `local/cat-N-*/` to per-scenario `.ts` files under `local/cat-N-*/scenarios/`. After conversion, delete the harness `cat-N-*.test.ts` and all `probe.*` files in the category directory.

**REQUIRED reads before writing any file:**
1. `local/cat-N-*/cat-N-*.test.ts` — the current harness. Extract LABELS, INTENTS, shared data, and the Deno.test blocks for each comparator.
2. `docs/JAMIA/comparisons/OVERVIEW.md` — find the per-scenario classification table for category N. Extract Severity, Severity criteria, and Rationale for each scenario.
3. `local/runners.ts` — the helpers `runForeign`, `printForeignResult`, `runStaticChecker`, `printStaticCheckerResult`.
4. `local/cat-N-*/data.ts` — the shared typed DataFrame constants.
5. `RPython/TM/25416955_string_dates_plot.ts` — the simplest example of the self-contained design.
6. `RPython/TM_snippets.json` — NOT applicable to local/ cat scenarios (those are author-designed, not RPython snippets).

**Per-scenario workflow:**

1. For each scenario in the harness (one per LABELS array entry, typically 8–17 scenarios per category):
   a. Create `local/cat-N-*/scenarios/<id>_<slug>.ts`.
   b. Write the 7-field JSDoc header with values lifted verbatim from OVERVIEW.md.
   c. Write the pandas block: lift the minimal scenario code from `probe.py`, place it in a template literal, run via `runForeign("python", ...)`.
   d. Write the tidyverse block: same approach with `probe.R`.
   e. Write the Polars block: same with `probe-polars.py`.
   f. Write the mypy block: pass the pandas script to `runStaticChecker("mypy", ...)`.
   g. Write the pyright block: same with pyright.
   h. Write the Arquero block: lift from `probe-arquero.ts` if present; emit `[Arquero] exit=N | <message>` via console.log. If Arquero has no equivalent for this scenario, write a brief comment explaining why and skip the block.
   i. Write the Tidy-TS block: lift the `@ts-expect-error` line and the bug-triggering operation from the harness's Tidy-TS compile-time Deno.test block. Use the shared data import from `../data.ts`.
2. Run `deno check <new file>` and confirm pass. If the `@ts-expect-error` comment doesn't match the actual TypeScript error, update it to the verbatim message.
3. Run `deno run -A <new file>` and confirm:
   - `[pandas] exit=N | ...` line printed
   - `[r] exit=N | ...` line printed
   - `[Polars] exit=N | ...` line printed
   - `[mypy] exit=N | ...` line printed
   - `[pyright] exit=N | ...` line printed
   - `[Arquero] exit=N | ...` line printed (if Arquero block included)
   - File exits 0 overall (the `@ts-expect-error` silences the compile error; all foreign signals are captured non-fatally).

**Strict rules:**
- The JSDoc header has exactly 7 fields in fixed order. No design commentary paragraphs.
- The 6 comparator blocks (pandas, tidyverse, Polars, mypy, pyright, Arquero) appear in fixed order. The Tidy-TS block is last.
- Exactly one `@ts-expect-error`. Its comment is the verbatim TypeScript error.
- No "correct path" demos, no console.log of working code, no bridging prose.
- Shared data is imported from `../data.ts`; foreign scripts duplicate the data inline (foreign runtimes can't read TS modules).
- If Arquero has no equivalent operation, that's documented but does not block the conversion.
- The new scenarios directory is `local/cat-N-*/scenarios/`; the old harness and probes are deleted after the per-scenario files are verified passing.

**Report back** when finished. For each scenario:
- Scenario ID
- File path
- `deno check` result (passes / fails)
- `deno run -A` result (exit code + which comparator lines were printed)
- Any anomalies (e.g., Arquero block omitted with reason; scenario data not in `data.ts` so inlined per-file; etc.)

Summary line: `converted: N / total: M / arquero-skipped: K / anomalies: J`.

**Your assigned category:** `local/cat-N-*` (substitute N).
```

## Order of operations (recommended)

1. **Phase 1 prep agent first**, sequentially. Builds runners + data modules. Type-checks everything.
2. **Pause and review** the prep output. The runners module is the foundation; confirm `runStaticChecker` works against mypy/pyright before launching scenario agents.
3. **Phase 2 — five scenario agents in parallel.** One per category. Each ~16 files of work.
4. **Pause and review** scenario output. Spot-check a sample of files for shape compliance.
5. **Phase 3 integration agent.** Builds the verifier and table generator. Runs the full pipeline. Confirms headline numbers match what OVERVIEW.md currently reports (no regression).

## Open risks

- **Static checker speed.** mypy and pyright per-scenario means ~130 invocations (65 scenarios × 2 checkers). The current design runs each checker once per category (5 × 2 = 10 invocations). Restructure cost: ~13× more checker invocations. Each invocation is ~1–3 seconds. Total verifier run could take 5–10 minutes vs. seconds today. Acceptable for full uniformity but worth flagging in the manuscript Discussion section.
- **Arquero gaps.** Not every scenario has an Arquero analog (Arquero doesn't have a `pivot_wider` exact analog, for instance). Each agent will encounter scenarios where Arquero must be skipped. Documenting these honestly is part of the deliverable.
- **The `@ts-expect-error` flake** observed in RPython (occasional false `deno check` failures on rapid back-to-back invocations) will affect this pipeline too. The retry logic in `RPython/verify.ts` should be ported to `local/verify-local.ts`.
- **Severity-criteria field format.** The plan above uses `AV=Y PS=Y PO=Y`. Confirm this is parseable for downstream tooling, or pick another shape (e.g., separate `AV`, `PS`, `PO` fields).

## Out of scope for the restructure

- Adding new comparators not currently in the suite.
- Changing any scenario's `@ts-expect-error` operation. The Tidy-TS catch site stays exactly what it is today.
- Modifying the headline numbers reported in OVERVIEW.md (those should come out identical to today's harness output, modulo any genuine bugs in the current harness that the restructure surfaces).
- Renumbering scenarios (`1a`–`5j` stays; `6a`–`6g` aliases stay as documentation only).
- Touching `RPython/` — that tree is already in the canonical shape.
