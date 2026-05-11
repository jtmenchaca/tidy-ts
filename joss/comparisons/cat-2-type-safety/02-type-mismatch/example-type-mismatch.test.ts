/**
 * Error Class 2: Type Mismatch Errors
 *
 * Scenario: Performing arithmetic on string columns, passing strings
 * to numeric aggregation, or comparing numbers to string literals.
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

const labs = createDataFrame([
  { patient_id: "P001", test_name: "BNP", result_value: 7.2 },
  { patient_id: "P002", test_name: "WBC", result_value: 140 },
]);

const LABELS = [
  "2a: test_name * 10",
  "2b: mean(test_name)",
  "2c: result_value === 'high'",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("02 — Type Mismatch: Tidy-TS compile-time", () => {
  // 2a: Arithmetic on string column — compile error
  // @ts-expect-error: string * number is not valid
  labs.mutate({ adjusted: (r) => r.test_name * 10 });

  // 2b: String column passed to numeric aggregation — compile error
  // @ts-expect-error: string[] not assignable to number[]
  labs.groupBy("test_name").summarize({ avg: (g) => s.mean(g.test_name) });

  // 2c: Comparing number to string literal — compile error
  // @ts-expect-error: number vs string comparison always false
  labs.filter((r) => r.result_value === "high");
});

Deno.test("02 — Type Mismatch: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;

  tsResults = [
    // 2a: Arithmetic on string column — silent (JS coercion produces NaN; no hook point)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { l.mutate({ adjusted: (r: any) => r.test_name * 10 }); return "produced NaN silently"; }),
    // 2b: Numeric aggregation on string column — warning, returns null (like R's NA)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { l.groupBy("test_name").summarize({ avg: (g: any) => s.mean(g.test_name) }); return "returned null with warning"; }),
    // 2c: Comparing number to string — silent (no hook point for JS === operator)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { l.filter((r: any) => r.result_value === "high"); return "returned 0 rows, no error"; }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  expect(tsResults[1].outcome).toBe("warning" as Outcome);
  expect(tsResults[2].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("02 — Type Mismatch: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(3);
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  expect(pyResults[1].outcome).toBe("error" as Outcome);
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("02 — Type Mismatch: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(3);
  expect(rResults[0].outcome).toBe("error" as Outcome);
  expect(rResults[1].outcome).toBe("warning" as Outcome);
  expect(rResults[2].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("02 — Type Mismatch: Summary", () => {
  printComparisonTable({
    title: "Error Class 02: Type Mismatch Errors",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
