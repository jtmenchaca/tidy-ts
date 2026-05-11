/**
 * Error Class 3: Join Key Errors
 *
 * Scenario: Joining two tables on a key that doesn't exist in one table,
 * using a misspelled key, or accessing a column not present in the
 * joined result.
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
  { patient_id: "P001", name: "Alice" },
]);
const encounters = createDataFrame([
  { encounter_id: "E001", patient_id: "P001", department: "ED" },
]);
const labs = createDataFrame([
  { lab_id: "L001", encounter_id: "E001", patient_id: "P001", result_value: 7.2 },
]);

const LABELS = [
  "3a: join on missing key",
  "3b: join on misspelled key",
  "3c: access missing col post-join",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("03 — Join Key: Tidy-TS compile-time", () => {
  // 3a: Join key doesn't exist in left table — compile error
  // @ts-expect-error: 'encounter_id' is not a key of patients
  expect(() => patients.leftJoin(labs, "encounter_id")).toThrow();

  // 3b: Misspelled join key — compile error
  // @ts-expect-error: 'patient_ID' does not exist on either table
  expect(() => patients.leftJoin(encounters, "patient_ID")).toThrow();

  // 3c: Accessing column not in joined result — compile error, runtime throws
  const joined = patients.leftJoin(encounters, "patient_id");
  // @ts-expect-error: 'prescription_id' not in joined schema
  expect(() => joined.mutate({ note: (r) => r.prescription_id })).toThrow();
});

Deno.test("03 — Join Key: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const p = patients as any;

  // deno-lint-ignore no-explicit-any
  const joined = p.leftJoin(encounters, "patient_id");

  tsResults = [
    // 3a: Join key doesn't exist in left table — runtime error
    captureOutcome(() => p.leftJoin(labs, "encounter_id")),
    // 3b: Misspelled join key — runtime error
    captureOutcome(() => p.leftJoin(encounters, "patient_ID")),
    // 3c: Accessing column not in joined result — should throw
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => joined.mutate({ note: (r: any) => r.prescription_id })),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
  expect(tsResults[2].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("03 — Join Key: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(3);
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  expect(pyResults[1].outcome).toBe("error" as Outcome);
  expect(pyResults[2].outcome).toBe("error" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("03 — Join Key: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(3);
  expect(rResults[0].outcome).toBe("error" as Outcome);
  expect(rResults[1].outcome).toBe("error" as Outcome);
  expect(rResults[2].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("03 — Join Key: Summary", () => {
  printComparisonTable({
    title: "Error Class 03: Join Key Errors",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
