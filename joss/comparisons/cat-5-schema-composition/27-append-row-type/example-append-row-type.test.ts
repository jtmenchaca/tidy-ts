/**
 * Error Class 27: Append Row Type Mismatch
 *
 * Tidy-TS's append() is type-checked — the row must match the
 * DataFrame schema. Missing columns or wrong types are compile errors.
 * Python silently fills NaN for missing columns and coerces types.
 * R silently fills NA or errors on type mismatch.
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
  "27a: missing col in append",
  "27b: wrong type in append",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const patients = createDataFrame([
  { patient_id: "P001", name: "Alice", age: 30 },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("27 — Append Row Type: Tidy-TS compile-time", () => {
  // 27a: Missing column in appended row — compile error + runtime error
  expect(() => {
    // @ts-expect-error: age is missing from the row
    patients.append({ patient_id: "P002", name: "Bob" });
  }).toThrow();

  // 27b: Wrong type in appended row — compile error + runtime error
  expect(() => {
    // @ts-expect-error: age should be number, not string
    patients.append({ patient_id: "P003", name: "Carol", age: "thirty" });
  }).toThrow();

  // Correct: full row with correct types
  patients.append({ patient_id: "P002", name: "Bob", age: 45 });
});

Deno.test("27 — Append Row Type: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const p = patients as any;

  tsResults = [
    // 27a: append with missing column — append() receives the row and knows
    // the schema. It should validate that all columns are present.
    captureOutcome(() => p.append({ patient_id: "P002", name: "Bob" })),
    // 27b: append with wrong type — append() can check value types against schema.
    captureOutcome(() => p.append({ patient_id: "P003", name: "Carol", age: "thirty" })),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("27 — Append Row Type: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 27a: Missing column silently filled with NaN
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 27b: Wrong type silently coerced (age becomes object)
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("27 — Append Row Type: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 27a: Missing column silently filled with NA
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 27b: Wrong type — R errors on double + character
  expect(rResults[1].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("27 — Append Row Type: Summary", () => {
  printComparisonTable({
    title: "Error Class 27: Append Row Type Mismatch",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
