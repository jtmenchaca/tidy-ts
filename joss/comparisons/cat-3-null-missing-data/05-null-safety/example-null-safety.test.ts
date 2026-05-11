/**
 * Error Class 5: Null Safety Errors
 *
 * Tidy-TS tracks nullability through the type system. Nullable columns
 * require explicit null handling before arithmetic or method calls.
 * Python silently propagates NaN. R silently propagates NA.
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

const labs = createDataFrame([
  { patient_id: "P001", result_value: 100, reference_high: 120 as number | null },
  { patient_id: "P002", result_value: 200, reference_high: null },
]);

const LABELS = [
  "5a: method on nullable col",
  "5b: arithmetic on nullable col",
  "5c: comparison on nullable col",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];



// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("05 — Null Safety: Tidy-TS compile-time", () => {
  // 5a: Method call on nullable column — compile error, runtime throws (null.toFixed)
  // @ts-expect-error: reference_high is number | null, .toFixed() not safe
  expect(() => labs.mutate({ label: (r) => r.reference_high.toFixed(1) })).toThrow();

  // 5b: Arithmetic on nullable column — compile error (null arithmetic is silent in JS)
  // @ts-expect-error: number | null can't be subtracted
  labs.mutate({ deviation: (r) => r.result_value - r.reference_high });

  // 5c: Comparison on nullable column — compile error (null comparison is silent in JS)
  // @ts-expect-error: reference_high is number | null, > not safe
  labs.filter((r) => r.reference_high > 100);
});

Deno.test("05 — Null Safety: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;

  tsResults = [
    // 5a: Method call on null — runtime error (.toFixed on null throws)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => l.mutate({ label: (r: any) => r.reference_high.toFixed(1) })),
    // 5b: Arithmetic on null — silent (null - number = 0 in JS, no hook point)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = l.mutate({ deviation: (r: any) => r.result_value - r.reference_high });
      // deno-lint-ignore no-explicit-any
      const rows = df.toArray() as any[];
      // In JS, null coerces to 0 in arithmetic: 200 - null = 200
      const nullRow = rows.find((r) => r.reference_high === null);
      return nullRow && nullRow.deviation === nullRow.result_value
        ? "null coerced to 0 silently"
        : "null propagated as NaN";
    }),
    // 5c: Comparison with null — silent (null > 100 is false in JS, no hook point)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const filtered = l.filter((r: any) => r.reference_high > 100);
      const total = l.toArray().length;
      const kept = filtered.toArray().length;
      return `null rows silently dropped (${total - kept})`;
    }),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
  expect(tsResults[2].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("05 — Null Safety: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(3);
  // 5a: String method on NaN column — silent (NaN propagates)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 5b: Arithmetic on NaN column — silent (NaN propagates)
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
  // 5c: Comparison with NaN — silent (NaN rows silently excluded)
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("05 — Null Safety: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(3);
  // 5a: String method on NA column — silent (NA propagates)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 5b: Arithmetic on NA column — silent (NA propagates)
  expect(rResults[1].outcome).toBe("silent" as Outcome);
  // 5c: Comparison with NA — silent (NA rows silently excluded)
  expect(rResults[2].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("05 — Null Safety: Summary", () => {
  printComparisonTable({
    title: "Error Class 05: Null Safety Errors",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
