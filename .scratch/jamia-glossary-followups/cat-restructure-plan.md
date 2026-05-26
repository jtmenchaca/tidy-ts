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
import * as aq from "npm:arquero";
import { stats as s } from "@tidy-ts/dataframe";
import { labs05 } from "../data.ts";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../runners.ts";

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
printForeignResult("pandas", runForeign("python", pandasScript));

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
printForeignResult("tidyverse", runForeign("r", rScript));

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
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright (static checkers on pandas code) ───────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => aq.table({
    patient_id: ["P001", "P002"],
    result_value: [100, 200],
    reference_high: [120, null],
  }).derive({
    deviation: (d: { result_value: number; reference_high: number | null }) =>
      d.result_value - d.reference_high,
  }),
  (table) => `rows=${table.numRows()}`,
);

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

## Runner module: `comparisons/runners.ts` (already built)

The shared module exists at `docs/JAMIA/comparisons/runners.ts`. Both `local/` and `RPython/` scenarios import from it. Existing RPython files keep working via a thin re-export in `RPython/run-foreign.ts`. The eight comparator labels (`pandas`, `tidyverse`, `Polars`, `mypy`, `pyright`, `Arquero`, `Tidy-TS`, plus any others added later) are exported as a `ComparatorLabel` union type.

Public surface:

```typescript
// Foreign subprocess (python3 or Rscript)
runForeign(runtime: "python" | "r", script: string): ForeignRunResult
printForeignResult(label: ComparatorLabel, result: ForeignRunResult): void

// Static checkers on a Python script (writes temp .py, invokes mypy/pyright, cleans up)
runStaticChecker(checker: "mypy" | "pyright", pythonScript: string): StaticCheckerResult
printStaticCheckerResult(checker: "mypy" | "pyright", result: StaticCheckerResult): void

// In-process comparators (Arquero, Tidy-TS runtime guards)
printRuntimeOutcome(label: ComparatorLabel, ok: boolean, message: string, kind?: "clean" | "warning"): void
runInProcess<T>(label: ComparatorLabel, fn: () => T, messageFn: (value: T) => string): void
```

Uniform stdout line shape from every helper: `[<label>] exit=<N> | <message>`.

### Notes for agents using the helpers

- **Polars uses `runForeign("python", ...)`** but is labelled `Polars` via `printForeignResult("Polars", result)`. The runtime is `python`; the label is `Polars`. Don't conflate them.
- **Static checker installation.** `runStaticChecker` checks whether `mypy` / `pyright` is on `PATH`. If absent, it returns `exit=127` and a `<checker> not installed` summary line. Scenarios must not require checkers to be installed; the verifier classifies `not installed` as inconclusive and records it as such.
- **mypy strict mode.** Invoked as `mypy --strict --no-error-summary <tmp>`. The strict flag is required because the manuscript reports mypy results in strict mode.
- **pyright JSON output.** Invoked as `pyright --outputjson <tmp>`. The error count is parsed from the JSON summary.
- **Arquero blocks use `runInProcess`** since Arquero runs in the same Deno process. The scenario imports Arquero via `npm:arquero` and uses `runInProcess` to wrap the operation that exercises the bug.

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

## Pitfalls discovered while writing the demonstration scenarios (READ THIS BEFORE WRITING ANY SCENARIO FILE)

Four demonstration scenarios are already on disk and passing end-to-end. They cover the patterns each new scenario will need:

- `local/cat-1-column-schema-reference/scenarios/1a_misspelled_column_in_expression.ts` — Low severity, all comparators crash. Simplest sync template.
- `local/cat-1-column-schema-reference/scenarios/1e_original_column_after_aggregation.ts` — Low severity, multi-step pipeline (groupBy + summarize + access). Sync.
- `local/cat-1-column-schema-reference/scenarios/1k_unselected_column_after_distinct.ts` — **High severity**: six comparators silently accept the bug, only Tidy-TS catches. Sync. This is the manuscript's headline-result shape.
- `local/cat-5-schema-composition/scenarios/5a_non_numeric_value_in_numeric_column_at_load.ts` — **Async** (Tidy-TS uses `readCSV` with a Zod schema). Demonstrates `runInProcessAsync` and `aq.fromCSV` for the Arquero block. tidyverse emits a warning (visible in the signal line as `Warning: One or more parsing issues...`).

These are the **canonical templates**. Every new scenario must match the shape of whichever template best fits its kind (sync vs async, Low vs High severity). The pitfalls below were all hit (and resolved) writing these four. Future agents must avoid each one.

### Pitfall 1: Arquero import path and column-type annotations

**Wrong:**
```typescript
import * as aq from "npm:arquero";
// ...
.derive({ full_name: (d: { patientId: string; last_name: string }) => d.patientId + " " + d.last_name })
```

**Right:**
```typescript
import * as aq from "arquero";
// ...
.derive({ full_name: (d) => d.patientId + " " + d.last_name })
```

Two issues here:

- **Use `from "arquero"`, never `from "npm:arquero"`.** Arquero is declared in this repo's root `package.json` (per the workspace setup in `repo-setup.md`); the bare specifier resolves correctly through the pnpm workspace. The `npm:` prefix is wrong here.
- **Do not annotate callback parameters in Arquero `derive`, `filter`, etc.** Arquero is column-untyped by design — `d` is effectively `any`, and the library compiles the function source at runtime. Adding `(d: { patientId: string })` is *fabricating* a type the table doesn't have, and worse, it tricks the reader into thinking Arquero offered type safety it never had. Idiomatic Arquero code in TypeScript is `(d) => d.col_name`, full stop. No type cast (`as any`, `as ColumnTable`), no type annotation. Let Deno infer; Arquero's TS types are loose enough that `d.unknown_column` compiles.

### Pitfall 2: tidy-ts runtime guard kills the process

**Wrong:**
```typescript
// @ts-expect-error — Property 'patientId' does not exist on type
patients.mutate({ full_name: (r) => r.patientId + " " + r.last_name });
```

This compiles fine (the `@ts-expect-error` is honored), but tidy-ts has a **runtime proxy guard** that throws when you access an undeclared column. The line then propagates an `Error` out of the top-level script, the Deno process exits non-zero, and any subsequent code in the file never runs. The verifier sees a partial-run signal at best, and the Tidy-TS layer gets misrecorded.

**Right:**
```typescript
runInProcess(
  "Tidy-TS",
  () =>
    patients.mutate({
      // @ts-expect-error — Property 'patientId' does not exist on type
      full_name: (r) => r.patientId + " " + r.last_name,
    }),
  (df) => `rows=${df.nrows()}`,
);
```

Wrap the tidy-ts catch in `runInProcess("Tidy-TS", ...)`. This:
- Preserves the `@ts-expect-error` (still verified by `deno check`).
- Captures the runtime guard's `Error` into a `[Tidy-TS] exit=1 | <message>` line.
- Lets the file exit 0 overall so the verifier can read all comparator signals.

This is the **only correct shape for the Tidy-TS block**. Always use `runInProcess`. Always.

### Pitfall 3: The `@ts-expect-error` must be on the line that actually fails

**Wrong:**
```typescript
runInProcess(
  "Tidy-TS",
  // @ts-expect-error — physician not in distinct result
  () => unique.mutate({ doc: (r) => r.physician }),
  (df) => `rows=${df.nrows()}`,
);
```

The `@ts-expect-error` here annotates the arrow-function expression, not the actual `r.physician` access. `deno check` may report it as "unused expect-error" because the error is generated *inside* the callback, not on this line.

**Right:**
```typescript
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — physician not in distinct result
    unique.mutate({ doc: (r) => r.physician }),
  (df) => `rows=${df.nrows()}`,
);
```

Place `@ts-expect-error` immediately above the line that produces the type error — usually the line where the offending `.mutate(...)` or `.filter(...)` call sits. Verify by running `deno check`; if it reports `Unused '@ts-expect-error' directive`, move the directive.

### Pitfall 4: Foreign script literals must include their own setup data

**Wrong:** assume the foreign script can read `../data.ts` or any TS module:
```typescript
const pandasScript = `
import pandas as pd
df = <use the patients constant from ../data.ts somehow>
`;
```

This is impossible. Python and R subprocesses have no access to the host Deno process's modules.

**Right:** every foreign script literal duplicates the data inline:
```typescript
const pandasScript = `
import pandas as pd
patients = pd.DataFrame({
    "patient_id": ["P001"],
    "first_name": ["Alice"],
    "last_name": ["Smith"],
})
patients["full_name"] = patients["patientId"] + " " + patients["last_name"]
`;
```

The Tidy-TS side of the same scenario *can* import from `../data.ts` for typed shared constants, but the foreign scripts inline their own data verbatim. This is duplication-by-design (the cost of full-uniformity per the Option B decision).

### Pitfall 5: Polars uses `runForeign("python", ...)` but is labelled `"Polars"`

**Wrong:**
```typescript
printForeignResult("python", runForeign("polars", polarsScript));
```

There is no `"polars"` runtime — Polars is a Python library that runs via `python3`.

**Right:**
```typescript
printForeignResult("Polars", runForeign("python", polarsScript));
```

The first argument to `runForeign` is the **runtime** (`"python"` or `"r"`). The first argument to `printForeignResult` is the **comparator label** (`"pandas"` | `"tidyverse"` | `"Polars"` | etc.). Different concepts; don't conflate. Same applies to `"tidyverse"` label with `"r"` runtime.

### Pitfall 6: mypy and pyright "no errors" is the expected result for almost every scenario

The supplementary checkers (mypy, pyright) lack column-level type information for pandas DataFrames. They will report `[mypy] exit=0 | no errors` and `[pyright] exit=0 | no errors` on essentially every scenario in this suite, because the bug is at the column/value level and the stubs don't track that. This is **not a bug in the scenario file**; it is exactly the headline finding of Supplemental Table 1 in the manuscript ("Neither tool caught any of the 65 errors at compile time").

Do not "fix" this by adding type annotations to the pandas script that would help mypy/pyright. The whole point is that *real pandas code does not carry those annotations* and the checkers miss the bug. Faking annotations would invalidate the comparison.

### Pitfall 7: `runInProcess` must wrap any tidy-ts call that touches non-existent columns OR has runtime guards

Tidy-ts is the only library in the suite with both compile-time AND runtime defenses. The compile-time `@ts-expect-error` is necessary for the verifier to detect the catch via `deno check`. The runtime guard fires when the code runs anyway (with the `@ts-expect-error` silencing the compiler, the runtime is left as the second-line defense). If the tidy-ts block is not wrapped in `runInProcess`, the runtime guard's thrown `Error` will kill the script before subsequent comparators' signals can be emitted.

If the catch is *purely* compile-time (no runtime guard fires — rare; most tidy-ts catches have both), `runInProcess` is still required because the verifier needs a `[Tidy-TS]` line to attribute the compile-time catch to the right comparator column.

### Pitfall 8: Do not use `find` over the user's home directory

If you need to locate a package, a config, or a fixture, read the project's manifests (`package.json`, `pnpm-workspace.yaml`, `deno.jsonc`) directly. Do not run `find /Users/...` or `find ~` — these scans take minutes and traverse unrelated trees. Per `repo-setup.md`, this repo is a pnpm-workspace monorepo; all dependency versions live in the root `package.json` and package paths are predictable from the workspace layout.

### Pitfall 9: Scenarios with no Arquero analog should *omit* the Arquero block honestly

Not every category has an obvious Arquero equivalent — Arquero doesn't expose `pivot_wider` in the same shape, for example. If you cannot write a faithful Arquero analog for the scenario's intent, omit the Arquero block entirely and add a one-line comment under the section divider explaining why. Do not write a contrived block that doesn't exercise the same task. The verifier handles missing Arquero blocks correctly — the comparator row will read "no signal" for Arquero on that scenario, which is the honest record.

### Pitfall 10: Section dividers and comment style — copy from the demonstrations

The three demonstration scenarios use exact unicode box-drawing dividers (`────────…`) and a fixed comment style. Copy them verbatim. Do not invent new divider characters, do not omit them, do not add prose between sections. The verifier and any future static linter on these files relies on the predictable shape.

### Pitfall 11: Async Tidy-TS blocks need `runInProcessAsync`, not `runInProcess`

**Wrong:**
```typescript
try {
  await readCSV(csv, schema);
  printRuntimeOutcome("Tidy-TS", true, "loaded without error");
} catch (e) {
  const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
  printRuntimeOutcome("Tidy-TS", false, msg);
}
```

This works but reinvents the wheel — and the hand-rolled `split("\n")[0]` truncates multi-line errors (like a Zod issues array) mid-bracket, producing a malformed signal line like `Row 2 validation failed: [` that the verifier can't parse cleanly.

**Right:**
```typescript
await runInProcessAsync(
  "Tidy-TS",
  () => readCSV(csv, schema),
  (df) => `rows=${df.nrows()}`,
);
```

`runInProcessAsync` handles the try/catch, flattens multi-line error messages to a single space-separated line, and caps the message at 200 chars so the signal stays grep-able. Use it whenever the Tidy-TS or Arquero block needs `await`.

### Pitfall 12: Arquero blocks must exercise the same intent as the scenario

The scenario's intent (from the JSDoc header) is what the comparator block must demonstrate. For a "Load a CSV where a numeric column contains 'pending'" scenario, the Arquero block must *parse a CSV*, not construct a pre-built table.

**Wrong:** for a CSV-loading scenario, building a literal table:
```typescript
aq.table({ lab_id: ["L1", "L2", "L3"], result_value: [100, "pending", 200] });
```
This bypasses the actual bug (which is parsing-time type inference). It records a "row count" message that doesn't reflect the type-inference behavior at all.

**Right:** use the Arquero API that mirrors the scenario's intent. For CSV loading:
```typescript
aq.fromCSV("lab_id,result_value\nL1,100\nL2,pending\nL3,200\n")
```
And expose the corruption in the message:
```typescript
(table) => `rows=${table.numRows()} dtype=${typeof table.get("result_value", 0)}`
```
The signal becomes `[Arquero] exit=0 | rows=3 dtype=string`, showing the silent string-coercion that is the actual bug.

Key Arquero APIs to reach for, by intent:
- "Load from CSV" → `aq.fromCSV(...)` (sync, string input) or `aq.loadCSV(...)` (async, URL/path)
- "Construct a literal table" → `aq.table({ ... })`
- "Group, then aggregate" → `.groupby(...).rollup({ ... })` or `.count()`
- "Filter / mutate (= derive)" → `.filter(d => ...)` / `.derive({ x: d => ... })`
- "Sort" → `.orderby(...)`
- "Distinct" → `.dedupe(...)`
- "Concat / row-bind" → `.concat(otherTable)`

Pick the API that matches the scenario's task. Don't substitute a different API just because it's easier.

### Pitfall 13: Warning signals must surface, not be buried under hint lines

The runners detect structured runtime warnings (Python `UserWarning:`, R `Warning message:`) anywhere in stderr — but earlier the helper only emitted the *literal last* stderr line, which for R is the hint `  problems(dat)` rather than the warning header. The fixed helper (`pickSignalLine`) now:

1. Searches all of stderr for `Warning:` / `Warning message:` / `UserWarning:` markers, and emits the warning text when found.
2. Falls back to the actual Python error class line (`TypeError: ...`, `KeyError: ...`).
3. Falls back to `Execution halted` for R.
4. Finally falls back to the literal last non-empty line.

Scenario authors don't have to do anything special — the helper is already updated. But: if you see a signal line like `[tidyverse] exit=0 |   problems(dat)` (just whitespace + a hint), the helper has regressed and the fix needs to be revisited. Report it instead of working around it in the scenario file.

### Pitfall 14: For CSV-loading scenarios, Tidy-TS uses `readCSV` (async) with a Zod schema

The Tidy-TS block for CSV-loading scenarios (cat 5: Data loading) is:

```typescript
await runInProcessAsync(
  "Tidy-TS",
  () => readCSV("csv,content,here\nrow1,a,b", LabSchema),
  (df) => `rows=${df.nrows()}`,
);
```

The Zod schema lives in `local/cat-5-*/data.ts` as `export const LabSchema = z.object({ ... })`. When the CSV row violates the schema, `readCSV` throws — `runInProcessAsync` catches, flattens, emits `[Tidy-TS] exit=1 | <flattened message>`. Do not write the try/catch by hand.

### Pitfall 15: Severity criteria field format

The `Severity criteria` JSDoc field uses space-separated `KEY=Y/N` pairs from OVERVIEW.md:

```
 * Severity criteria: AV=Y PS=Y PO=Y
```

For Low scenarios, include the triggering Low signal (`OI`, `NA`, or `SC`):

```
 * Severity criteria: AV=Y PS=Y PO=N OI=Y
```

Lift this verbatim from OVERVIEW.md's per-scenario classification table. Do not invent values.

---

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
**Context.** We are restructuring the JAMIA comparison suite's category-N tests from a single per-category harness to per-scenario self-contained `.ts` files. Each scenario file inlines every comparator (pandas, tidyverse, Polars, mypy, pyright, Arquero) and demonstrates the Tidy-TS catch in the same file. The verifier walks scenario files and derives detection outcomes from observed runtime/compile signals.

**MANDATORY READS BEFORE WRITING A SINGLE LINE OF CODE.** Reading these three references is not optional — they encode pitfalls already discovered. Skipping them will produce broken files.

1. `.scratch/jamia-glossary-followups/cat-restructure-plan.md` — this plan in full. The "Pitfalls discovered while writing the demonstration scenarios" section enumerates 11 specific traps; you must avoid each.
2. `docs/JAMIA/comparisons/local/cat-1-column-schema-reference/scenarios/1a_misspelled_column_in_expression.ts` — canonical template for a Low-severity, all-comparators-crash scenario.
3. `docs/JAMIA/comparisons/local/cat-1-column-schema-reference/scenarios/1k_unselected_column_after_distinct.ts` — canonical template for a High-severity, comparators-silent scenario where only Tidy-TS catches.

These three files are passing end-to-end. Copy their shape exactly.

**Additional required reads** (extract specific content from each):

4. `docs/JAMIA/comparisons/local/cat-N-*/cat-N-*.test.ts` — the existing harness for your category. Extract LABELS, INTENTS, shared data, and each comparator's per-scenario logic.
5. `docs/JAMIA/comparisons/OVERVIEW.md` — find the per-scenario classification table for category N. Extract Severity, Severity criteria, and Rationale for each scenario.
6. `docs/JAMIA/comparisons/runners.ts` — the helpers `runForeign`, `printForeignResult`, `runStaticChecker`, `printStaticCheckerResult`, `runInProcess`, `runInProcessAsync`. The exports are `ComparatorLabel`-typed; do not invent labels.
7. `docs/JAMIA/comparisons/local/cat-N-*/probe.py`, `probe.R`, `probe-polars.py`, `probe-arquero.ts`, `probe-mypy.py`, `probe-pyright.py` — the source code for each per-scenario block. Lift verbatim.

**Scope.** Convert all scenarios in `local/cat-N-*/` to per-scenario `.ts` files under `local/cat-N-*/scenarios/`. After conversion is verified end-to-end, delete the harness `cat-N-*.test.ts` and all `probe.*` files in the category directory. Do NOT delete the probes until all scenarios in the category are converted, verified passing, and you have run the new files in sequence to confirm no regressions.

**Per-scenario workflow:**

For each scenario in the harness (one per LABELS array entry, typically 8–17 scenarios per category):

1. **Create `local/cat-N-*/scenarios/<id>_<slug>.ts`.** Slug is short, snake_case, lifted from the LABELS entry. Example: `1k_unselected_column_after_distinct.ts`.

2. **Write the 7-field JSDoc header.** Lift values verbatim from OVERVIEW.md:
   ```typescript
   /**
    * ID: 1k
    * Category: Column reference
    * Label: unselected column referenced after distinct
    * Intent: Deduplicate encounters by patient and access columns not specified in the deduplication keys.
    * Severity: High
    * Severity criteria: AV=Y PS=Y PO=Y
    * Rationale: <verbatim rationale text from OVERVIEW.md>
    */
   ```

3. **Imports — exactly four lines, in this order**:
   ```typescript
   import * as aq from "arquero";  // NOT "npm:arquero" — see Pitfall 1
   import { createDataFrame } from "@tidy-ts/dataframe";
   import {
     printForeignResult,
     printStaticCheckerResult,
     runForeign,
     runInProcess,         // sync Arquero / Tidy-TS blocks
     runInProcessAsync,    // async blocks (e.g. readCSV) — Pitfall 11
     runStaticChecker,
   } from "../../../runners.ts";
   ```
   For most scenarios you'll use `runInProcess` only — omit `runInProcessAsync` from the import list if no block needs `await`. For cat-5 Data Loading scenarios that use `await readCSV(...)`, import `runInProcessAsync` and follow Pitfall 14.

4. **Write the pandas block** (a divider comment, then a template literal, then `printForeignResult("pandas", runForeign("python", ...))`). Lift the minimal triggering pandas code from `probe.py`.

5. **Write the tidyverse block.** Same shape: `printForeignResult("tidyverse", runForeign("r", rScript))`.

6. **Write the Polars block.** Same shape: `printForeignResult("Polars", runForeign("python", polarsScript))`. Note: Polars uses the `"python"` runtime — see Pitfall 5.

7. **Write the mypy/pyright blocks.** Pass the pandas script (the same string already declared) to `runStaticChecker`. Two lines each:
   ```typescript
   printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
   printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));
   ```

8. **Write the Arquero block.** Use `runInProcess("Arquero", () => …, table => `rows=${table.numRows()}`)`. The Arquero call **must exercise the same intent as the scenario** — for a CSV-loading scenario use `aq.fromCSV(...)`, not `aq.table(...)`. See Pitfall 12 for an intent→API map. No type annotations on `(d) => d.col` callbacks — see Pitfall 1. Do NOT cast (no `as any`, no `as ColumnTable`). If Arquero has no faithful analog for this scenario's intent, omit the block entirely and write a one-line comment explaining why — see Pitfall 9.

9. **Write the Tidy-TS block** — **MUST be wrapped in `runInProcess("Tidy-TS", ...)` (or `runInProcessAsync` for async calls like `readCSV`)**. See Pitfalls 2 and 11. The `@ts-expect-error` directive goes immediately above the line where the type error appears — see Pitfall 3. Use the shared typed data from `../data.ts` if present, or create the DataFrame inline if not.

   ```typescript
   const myData = createDataFrame([…]);
   runInProcess(
     "Tidy-TS",
     () =>
       // @ts-expect-error — <verbatim TypeScript error message from `deno check`>
       myData.mutate({ … }),
     (df) => `rows=${df.nrows()}`,
   );
   ```

**After writing the file, verify in this order:**

1. `deno check <new file>` — must report `Check <path>` with no errors. If it reports `Unused '@ts-expect-error' directive`, the directive is on the wrong line — move it to the line that actually produces the type error (Pitfall 3).
2. `deno run -A <new file>` — must complete with exit code 0 and emit one signal line per comparator in this order:
   - `[pandas] exit=N | …`
   - `[tidyverse] exit=N | …`
   - `[Polars] exit=N | …`
   - `[mypy] exit=N | …`
   - `[pyright] exit=N | …`
   - `[Arquero] exit=N | …` (omit if Arquero block omitted)
   - `[Tidy-TS] exit=N | …`

   If the file does NOT exit 0, you have not wrapped the Tidy-TS block correctly. Re-read Pitfall 2.

**Strict rules:**

- 7-field JSDoc header in fixed order. No design commentary paragraph.
- 4 imports as shown. No others.
- 6 comparator blocks (pandas, tidyverse, Polars, mypy, pyright, Arquero) in fixed order. Tidy-TS block last.
- Section dividers are exactly `// <Name> ──────────…` with unicode box-drawing characters lifted from the canonical templates (1a, 1k). Copy them verbatim.
- Exactly one `@ts-expect-error` per file, on the line that produces the actual type error.
- Tidy-TS block always uses `runInProcess` (or `runInProcessAsync` for async calls — Pitfall 11). No exceptions; never write try/catch by hand.
- Arquero block uses `runInProcess` and zero type annotations / zero type casts on callback parameters. The Arquero API used must match the scenario intent (Pitfall 12).
- mypy / pyright report "no errors" on essentially every scenario — this is correct and is the headline finding (Pitfall 6). Do not "fix" this by adding annotations to the pandas script.
- Shared data is imported from `../data.ts` (Tidy-TS side only). Foreign scripts duplicate data inline as Python/R literals — Pitfall 4.
- Don't use `find` over wide trees. Read project manifests directly — Pitfall 8.

**Do not delete probes until all scenarios are verified.** Sequence: write all scenarios → run each → confirm all 7 signal lines emit cleanly → THEN delete the harness and probe files in one final cleanup commit.

**Report back** when finished. For each scenario:
- Scenario ID and file path
- `deno check` result (passes / fails)
- `deno run -A` exit code and the comparator lines emitted
- Arquero block included / omitted (with reason if omitted)
- Any anomalies — flag explicitly; do not hide them

Summary line: `converted: N / total: M / arquero-omitted: K / anomalies: J`.

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
