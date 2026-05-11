/**
 * Error Class 21: Aggregation Return Type Narrowing
 *
 * Tidy-TS's s.sum/s.mean on nullable columns returns number | null.
 * The compiler forces null handling before downstream arithmetic.
 * Python's sum() silently skips NaN. R's sum() silently returns NA.
 */
import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
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
  "21a: sum skips/returns NA",
  "21b: arithmetic on NA result",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const labs = createDataFrame([
  { patient_id: "P001", result_value: 1250 as number | null },
  { patient_id: "P001", result_value: null },
  { patient_id: "P002", result_value: 450 },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("21 — Aggregation Return Type: Tidy-TS compile-time", () => {
  // s.sum on nullable column returns number | null
  const totals = labs.groupBy("patient_id").summarize({
    total: (g) => s.sum(g.result_value),
  });

  // 21a: Arithmetic on nullable aggregation — compile error
  // @ts-expect-error: number | null can't be divided
  totals.mutate({ per_patient: (r) => r.total / 2 });

  // 21b: Same — downstream arithmetic on nullable sum is also blocked
  // @ts-expect-error: number | null can't be multiplied
  totals.mutate({ doubled: (r) => r.total * 2 });

  // Correct: handle null first
  totals.mutate({ per_patient: (r) => (r.total !== null ? r.total / 2 : null) });
});

Deno.test("21 — Aggregation Return Type: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;

  tsResults = [
    // 21a: s.sum on nullable column — silent (skips nulls, returns number)
    captureOutcome(() => {
      l.groupBy("patient_id").summarize({ total: (g: any) => s.sum(g.result_value) });
      return "Skipped null, returned number";
    }),
    // 21b: arithmetic on sum result — silent (null / 2 = 0 in JS)
    captureOutcome(() => {
      l.groupBy("patient_id").summarize({ total: (g: any) => s.sum(g.result_value) }).mutate({ half: (r: any) => r.total / 2 });
      return "Divided null-skipped sum by 2";
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("21 — Aggregation Return Type: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 21a: sum() silently skips NaN
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 21b: Arithmetic on NaN-skipped result — silent
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("21 — Aggregation Return Type: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 21a: sum() returns NA silently
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 21b: Arithmetic on NA propagates silently
  expect(rResults[1].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("21 — Aggregation Return Type: Summary", () => {
  printComparisonTable({
    title: "Error Class 21: Aggregation Return Type Narrowing",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
