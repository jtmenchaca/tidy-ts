/**
 * Error Class 26: Sorting on Nullable Columns
 *
 * Tidy-TS's arrange() on nullable columns sorts null/undefined to
 * the end. The type system tracks that the column is nullable,
 * so downstream code must handle nulls.
 * Python/R silently sort NaN/NA to the end with no warning.
 */
import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import {
  captureOutcome,
  deriveCompileOutcomes,
  type Outcome,
  printComparisonTable,
  type ProbeResult,
  probePath,
  runPythonProbe,
  runRProbe,
} from "../../test-helpers.ts";

const BASE = import.meta.url;

const LABELS = [
  "26a: sort places null at end",
  "26b: rank with null",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const labs = createDataFrame([
  { patient_id: "P001", result_value: 100 as number | null },
  { patient_id: "P002", result_value: null },
  { patient_id: "P003", result_value: 50 },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("26 — Sort Nullable: Tidy-TS compile-time", () => {
  // arrange on nullable column works — result type preserves nullability
  const sorted = labs.arrange("result_value", "asc");

  // 26a: Arithmetic on nullable sorted column — compile error
  // @ts-expect-error: number | null can't be multiplied
  sorted.mutate({ doubled: (r) => r.result_value * 2 });

  // 26b: Arithmetic on nullable after sort — same compile error
  // @ts-expect-error: number | null can't be multiplied
  sorted.mutate({ ranked_doubled: (r) => r.result_value * 2 });

  // Correct: handle null
  sorted.mutate({
    doubled: (r) => (r.result_value !== null ? r.result_value * 2 : null),
  });
});

Deno.test("26 — Sort Nullable: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;

  tsResults = [
    // 26a: arrange on nullable column — silent (nulls sorted to end)
    captureOutcome(() => {
      l.arrange("result_value", "asc");
      return "Nulls sorted to end";
    }),
    // 26b: arithmetic on nullable after sort — silent (null * 2 = 0 in JS)
    captureOutcome(() => {
      l.arrange("result_value", "asc").mutate({ doubled: (r: any) => r.result_value * 2 });
      return "null * 2 coerced to 0";
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("26 — Sort Nullable: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 26a: sort_values silently puts NaN at end
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 26b: rank() silently handles NaN
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("26 — Sort Nullable: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 26a: arrange silently puts NA at end
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 26b: min_rank silently produces NA ranks
  expect(rResults[1].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("26 — Sort Nullable: Summary", () => {
  printComparisonTable({
    title: "Error Class 26: Sorting on Nullable Columns",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
