/**
 * Error Class 15: Distinct Column Narrowing
 *
 * Tidy-TS's distinct() with column arguments narrows the result schema
 * to only the specified columns. Accessing non-specified columns after
 * distinct is a compile error.
 * Python keeps all columns. R drops non-specified columns but has no type tracking.
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
  "15a: access dropped col",
  "15b: distinct .keep_all",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const encounters = createDataFrame([
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Patel" },
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Lee" },
  { patient_id: "P2", dept: "ED", physician: "Dr. Martinez" },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("15 — Distinct Narrowing: Tidy-TS compile-time", () => {
  // 15a: Accessing column not in distinct result — compile error
  const unique = encounters.distinct("patient_id", "dept");
  // @ts-expect-error: physician not in distinct result
  expect(() => unique.mutate({ doc: (r) => r.physician })).toThrow();

  // 15b: No keep_all — distinct("patient_id") narrows to only patient_id
  const byPatient = encounters.distinct("patient_id");
  // @ts-expect-error: physician not in distinct result (no keep_all foot gun)
  expect(() => byPatient.mutate({ doc: (r) => r.physician })).toThrow();
});

Deno.test("15 — Distinct Narrowing: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const e = encounters as any;

  tsResults = [
    // 15a: Accessing column not in distinct result — error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => e.distinct("patient_id", "dept").mutate({ doc: (r: any) => r.physician })),
    // 15b: .keep_all equivalent — TS has no keep_all, distinct drops non-key cols, access errors
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => e.distinct("patient_id").mutate({ doc: (r: any) => r.physician })),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("15 — Distinct Narrowing: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 15a: drop_duplicates keeps all columns — silent (no schema narrowing)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 15b: drop_duplicates with keep='first' — silent
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("15 — Distinct Narrowing: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 15a: distinct drops non-specified columns — silent (no type tracking)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 15b: distinct with .keep_all keeps arbitrary values — silent
  expect(rResults[1].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("15 — Distinct Narrowing: Summary", () => {
  printComparisonTable({
    title: "Error Class 15: Distinct Column Narrowing",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
