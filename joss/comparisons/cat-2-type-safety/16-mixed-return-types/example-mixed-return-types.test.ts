/**
 * Error Class 16: Return Type Consistency in Mutate
 *
 * When a mutate returns different types depending on a condition,
 * Tidy-TS infers the union type (e.g., number | "HIGH") and forces
 * you to handle it before downstream operations.
 * Python silently coerces to object dtype. R silently coerces to character.
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
  "16a: arithmetic on union col",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const labs = createDataFrame([
  { id: "P1", value: 1250 },
  { id: "P2", value: 15 },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("16 — Mixed Return Types: Tidy-TS compile-time", () => {
  // status is inferred as number | "HIGH" — TS tracks the union
  const withStatus = labs.mutate({
    status: (r) => (r.value > 100 ? "HIGH" as const : r.value),
  });

  // 16a: Arithmetic on union column — compile error (can't multiply string)
  // @ts-expect-error: number | "HIGH" can't be multiplied
  withStatus.mutate({ doubled: (r) => r.status * 2 });
});

Deno.test("16 — Mixed Return Types: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;

  tsResults = [
    // 16a: Arithmetic on mixed column — silent in JS (string * 2 = NaN)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = l.mutate({ status: (r: any) => (r.value > 100 ? "HIGH" : r.value) })
        // deno-lint-ignore no-explicit-any
        .mutate({ doubled: (r: any) => r.status * 2 });
      // deno-lint-ignore no-explicit-any
      const rows = df.toArray() as any[];
      const hasNaN = rows.some((r) => Number.isNaN(r.doubled));
      return hasNaN ? "NaN from string * 2" : "all numeric";
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("16 — Mixed Return Types: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(1);
  // 16a: Mixed types — silent (coerced to object, arithmetic fails silently)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("16 — Mixed Return Types: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(1);
  // 16a: ifelse + as.numeric on "HIGH" — warning (NAs introduced by coercion)
  expect(rResults[0].outcome).toBe("warning" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("16 — Mixed Return Types: Summary", () => {
  printComparisonTable({
    title: "Error Class 16: Return Type Consistency in Mutate",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
