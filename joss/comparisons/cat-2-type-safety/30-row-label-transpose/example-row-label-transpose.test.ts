/**
 * Error Class 30: Row Label Transpose Type Safety
 *
 * After transpose, column names and types change. Tidy-TS tracks the
 * new schema: row_0 is typed as string | number (union of original
 * column types), blocking arithmetic at compile time. Pre-transpose
 * column names are removed from the type.
 * Python's .T silently loses type info — string * 2 repeats the string.
 * R's t() coerces mixed types to character — arithmetic fails at runtime.
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
  "30a: arithmetic on transposed col",
  "30b: pre-transpose col after transpose",
];

// Collected results for the summary table
let tsResults: ProbeResult[] = [];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const vitals = createDataFrame([
  { metric: "systolic", P001: 120, P002: 145 },
  { metric: "diastolic", P001: 80, P002: 92 },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("30 — Row Label Transpose: Tidy-TS compile-time", () => {
  const transposed = vitals.transpose({ numberOfRows: 2 });

  // 30a: row_0 is string | number — arithmetic blocked
  // @ts-expect-error
  transposed.mutate({ doubled: (r) => r.row_0 * 2 });

  // 30b: P001 no longer exists after transpose — blocked
  // @ts-expect-error
  expect(() => transposed.mutate({ x: (r) => r.P001 })).toThrow();
});

Deno.test("30 — Row Label Transpose: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const v = vitals as any;

  tsResults = [
    // 30a: arithmetic on transposed col — JS coercion, "systolic" * 2 = NaN
    captureOutcome(() => {
      const t = v.transpose({ numberOfRows: 2 });
      // deno-lint-ignore no-explicit-any
      t.mutate({ doubled: (r: any) => r.row_0 * 2 });
      return `"systolic"*2=NaN`;
    }),
    // 30b: access pre-transpose column — proxy throws
    captureOutcome(() => {
      const t = v.transpose({ numberOfRows: 2 });
      // deno-lint-ignore no-explicit-any
      t.mutate({ x: (r: any) => r.P001 });
      return "accessed P001";
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("30 — Row Label Transpose: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 30a: string * 2 = string repetition — silent
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 30b: pre-transpose column name — runtime error
  expect(pyResults[1].outcome).toBe("error" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("30 — Row Label Transpose: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 30a: t() coerces to character — arithmetic error
  expect(rResults[0].outcome).toBe("error" as Outcome);
  // 30b: pre-transpose column name — subscript error
  expect(rResults[1].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("30 — Row Label Transpose: Summary", () => {
  printComparisonTable({
    title: "Error Class 30: Row Label Transpose Type Safety",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
