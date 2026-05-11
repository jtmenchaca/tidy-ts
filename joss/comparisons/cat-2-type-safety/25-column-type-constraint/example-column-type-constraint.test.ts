/**
 * Error Class 25: Column Type Constraint in Specialized Verbs
 *
 * Tidy-TS's type system prevents applying numeric functions to
 * string columns at compile time. The compiler knows column types.
 * Python silently applies * 2 as string repetition on non-numeric columns.
 * R's across(where(is.numeric)) filters at runtime, not compile time.
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
  "25a: numeric op on string col",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const patients = createDataFrame([
  { name: "Alice", age: 30, weight: 65.5, insurance: "Medicare" },
  { name: "Bob", age: 45, weight: 80.0, insurance: "Medicaid" },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("25 — Column Type Constraint: Tidy-TS compile-time", () => {
  // 25a: Math.log on string column — compile error
  // @ts-expect-error: string is not assignable to number parameter
  patients.mutate({ log_ins: (r) => Math.log(r.insurance) });
});

Deno.test("25 — Column Type Constraint: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const p = patients as any;

  tsResults = [
    // 25a: Math.log on string column — silent (JS coerces to NaN)
    captureOutcome(() => {
      p.mutate({ log_ins: (r: any) => Math.log(r.insurance) });
      return "Math.log returned NaN column";
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("25 — Column Type Constraint: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(1);
  // 25a: * 2 on string column repeats string — silent
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("25 — Column Type Constraint: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(1);
  // 25a: across with manual wrong column — runtime error
  expect(rResults[0].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("25 — Column Type Constraint: Summary", () => {
  printComparisonTable({
    title: "Error Class 25: Column Type Constraint in Specialized Verbs",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
