/**
 * Error Class 29: Empty DataFrame Operations
 *
 * Tidy-TS preserves the schema of empty DataFrames. Operations on
 * empty DataFrames return typed results (not untyped empties).
 * Python's sum() of empty returns 0. R's mean() of empty returns NaN.
 * Both silently produce misleading results.
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
  "29a: arithmetic on empty sum",
  "29b: arithmetic on empty mean",
];

// Collected results for the summary table
let tsResults: ProbeResult[] = [];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const labs = createDataFrame([
  { patient_id: "P001", result_value: 100 },
  { patient_id: "P002", result_value: 200 },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("29 — Empty DataFrame Ops: Tidy-TS compile-time", () => {
  // 29a: sum on empty → arithmetic — compile: N/A (type system doesn't track emptiness)
  const empty = labs.filter(() => false);
  const sumResult = empty.groupBy("patient_id").summarize({
    total: (g) => s.sum(g.result_value),
  });
  sumResult.mutate({ doubled: (r) => r.total * 2 });

  // 29b: mean on empty → arithmetic — compile: N/A (same)
  const meanResult = empty.groupBy("patient_id").summarize({
    avg: (g) => s.mean(g.result_value),
  });
  meanResult.mutate({ doubled: (r) => r.avg * 2 });
});

Deno.test("29 — Empty DataFrame Ops: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;

  tsResults = [
    // 29a: sum on empty → arithmetic — no rows to corrupt
    captureOutcome(() => {
      const empty = l.filter(() => false);
      // deno-lint-ignore no-explicit-any
      const result = empty.groupBy("patient_id").summarize({ total: (g: any) => s.sum(g.result_value) });
      // deno-lint-ignore no-explicit-any
      result.mutate({ doubled: (r: any) => r.total * 2 });
      return `[] (0 rows)`;
    }),
    // 29b: mean on empty → arithmetic — no rows to corrupt
    captureOutcome(() => {
      const empty = l.filter(() => false);
      // deno-lint-ignore no-explicit-any
      const result = empty.groupBy("patient_id").summarize({ avg: (g: any) => s.mean(g.result_value) });
      // deno-lint-ignore no-explicit-any
      result.mutate({ doubled: (r: any) => r.avg * 2 });
      return `[] (0 rows)`;
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("29 — Empty DataFrame Ops: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 29a: sum() of empty column returns 0 — silent
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 29b: mean() of empty column returns NaN — silent
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("29 — Empty DataFrame Ops: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 29a: sum() of empty returns 0 — silent
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 29b: mean() of empty returns NaN — silent
  expect(rResults[1].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("29 — Empty DataFrame Ops: Summary", () => {
  printComparisonTable({
    title: "Error Class 29: Empty DataFrame Operations",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
