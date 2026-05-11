/**
 * Error Class 1: Column Reference Errors
 *
 * Scenario: Referencing a misspelled or nonexistent column name
 * in mutate, filter, or arrange operations.
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

const patients = createDataFrame([
  { patient_id: "P001", first_name: "Alice", last_name: "Smith" },
]);
const labs = createDataFrame([
  { lab_id: "L001", patient_id: "P001", result_value: 7.2 },
]);

const LABELS = [
  "1a: mutate(r.patientId)",
  "1b: filter(r.diagnosis)",
  "1c: arrange('result_values')",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("01 — Column Reference: Tidy-TS compile-time", () => {
  // 1a: Misspelled column name in mutate — compile error, runtime throws
  // @ts-expect-error: 'patientId' is not a column on this DataFrame
  expect(() => patients.mutate({ full_name: (r) => r.patientId + " " + r.last_name }))
    .toThrow();

  // 1b: Nonexistent column in filter — compile error
  // @ts-expect-error: 'diagnosis' is not a column on this DataFrame
  expect(() => patients.filter((r) => r.diagnosis === "I50.9"))
    .toThrow();

  // 1c: Misspelled column in arrange — compile error
  // @ts-expect-error: 'result_values' is not a column on this DataFrame
  expect(() => labs.arrange("result_values", "desc"))
    .toThrow();
});

Deno.test("01 — Column Reference: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const p = patients as any;
  // deno-lint-ignore no-explicit-any
  const l = labs as any;

  tsResults = [
    // 1a: Misspelled column in mutate — should throw (row proxy knows the schema)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => p.mutate({ full_name: (r: any) => r.patientId + " " + r.last_name })),
    // 1b: Nonexistent column in filter — runtime error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => p.filter((r: any) => r.diagnosis === "I50.9")),
    // 1c: Misspelled column in arrange — runtime error
    captureOutcome(() => l.arrange("result_values", "desc")),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
  expect(tsResults[2].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("01 — Column Reference: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(3);
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  expect(pyResults[1].outcome).toBe("error" as Outcome);
  expect(pyResults[2].outcome).toBe("error" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("01 — Column Reference: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(3);
  expect(rResults[0].outcome).toBe("error" as Outcome);
  expect(rResults[1].outcome).toBe("error" as Outcome);
  expect(rResults[2].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("01 — Column Reference: Summary", () => {
  printComparisonTable({
    title: "Error Class 01: Column Reference Errors",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
