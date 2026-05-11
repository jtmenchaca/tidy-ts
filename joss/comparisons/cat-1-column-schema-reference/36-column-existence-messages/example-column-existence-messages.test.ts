/**
 * Error Class 36: Column Existence Error Messages
 *
 * Tidy-TS's runtime errors include the full list of available columns
 * when a nonexistent column is referenced, enabling quick diagnosis.
 * Python's KeyError just shows the missing name.
 * R's dplyr shows "Column `x` doesn't exist" but no column list.
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
  "36a: error with col list",
  "36b: dot access error msg",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const patients = createDataFrame([
  { patient_id: "P001", first_name: "Alice", last_name: "Smith" },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("36 — Column Existence Messages: Tidy-TS compile-time", () => {
  // 36a: Misspelled column — compile error, runtime throws with column list
  // @ts-expect-error: patientId is not a column
  expect(() => patients.mutate({ x: (r) => r.patientId })).toThrow();

  // 36b: select with wrong column — compile error
  // @ts-expect-error: patientId is not a valid column name
  expect(() => patients.select("patientId")).toThrow();
});

Deno.test("36 — Column Existence Messages: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const p = patients as any;

  tsResults = [
    // 36a: Error message includes available columns
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => p.mutate({ x: (r: any) => r.patientId })),
    // 36b: dot access on nonexistent column — error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => p.select("patientId" as any)),
  ];
  expect(tsResults[0].outcome).toBe("error" as Outcome);
  // Verify the error message includes available column names
  expect(tsResults[0].message).toMatch(/Available columns/i);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("36 — Column Existence Messages: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 36a: KeyError — just shows column name, no context
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  // 36b: AttributeError on dot access — minimal message
  expect(pyResults[1].outcome).toBe("error" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("36 — Column Existence Messages: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 36a: dplyr error — shows column name but no available columns
  expect(rResults[0].outcome).toBe("error" as Outcome);
  // 36b: select with wrong column — error
  expect(rResults[1].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("36 — Column Existence Messages: Summary", () => {
  printComparisonTable({
    title: "Error Class 36: Column Existence Error Messages",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
