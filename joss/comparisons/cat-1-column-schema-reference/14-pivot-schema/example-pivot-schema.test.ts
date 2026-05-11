/**
 * Error Class 14: Pivot Type Safety
 *
 * pivotWider creates new columns from data values. With expectedColumns,
 * Tidy-TS types the result schema. Accessing undeclared pivot columns
 * or pre-pivot columns is a compile error.
 * Python/R discover missing columns only at runtime.
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
  "14a: undeclared pivot col",
  "14b: pre-pivot col gone",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const vitals = createDataFrame([
  { patient_id: "P001", metric: "systolic", value: 130 },
  { patient_id: "P001", metric: "diastolic", value: 85 },
  { patient_id: "P002", metric: "systolic", value: 145 },
  { patient_id: "P002", metric: "diastolic", value: 92 },
]);

const wide = vitals.pivotWider({
  namesFrom: "metric",
  valuesFrom: "value",
  expectedColumns: ["systolic", "diastolic"] as const,
});

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("14 — Pivot Schema: Tidy-TS compile-time", () => {
  // 14a: Accessing undeclared pivot column — compile error, runtime throws
  // @ts-expect-error: temperature not in expectedColumns
  expect(() => wide.mutate({ fever: (r) => r.temperature > 100 })).toThrow();

  // 14b: Pre-pivot column gone — compile error, runtime throws
  // @ts-expect-error: metric no longer exists after pivot
  expect(() => wide.filter((r) => r.metric === "systolic")).toThrow();
});

Deno.test("14 — Pivot Schema: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const w = wide as any;

  tsResults = [
    // 14a: Accessing undeclared pivot column
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => w.mutate({ fever: (r: any) => r.temperature > 100 })),
    // 14b: Pre-pivot column gone
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => w.filter((r: any) => r.metric === "systolic")),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("14 — Pivot Schema: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 14a: Accessing non-existent pivot column — runtime error
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  // 14b: Pre-pivot column gone — runtime error
  expect(pyResults[1].outcome).toBe("error" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("14 — Pivot Schema: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 14a: Accessing non-existent pivot column — runtime error
  expect(rResults[0].outcome).toBe("error" as Outcome);
  // 14b: Pre-pivot column gone — runtime error
  expect(rResults[1].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("14 — Pivot Schema: Summary", () => {
  printComparisonTable({
    title: "Error Class 14: Pivot Type Safety",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
