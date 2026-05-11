/**
 * Error Class 35: Pivot Column Mismatch
 *
 * After pivotWider with missing combinations, generated columns are
 * typed as number | null. Tidy-TS blocks arithmetic on nullable columns
 * at compile time. Python/R silently produce NaN/NA that propagates
 * through arithmetic.
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
  "35a: arithmetic on pivot null",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const vitals = createDataFrame([
  { patient_id: "P001", metric: "systolic", value: 130 },
  { patient_id: "P001", metric: "diastolic", value: 85 },
  { patient_id: "P002", metric: "systolic", value: 145 },
  // P002 missing diastolic
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("35 — Pivot Column Mismatch: Tidy-TS compile-time", () => {
  const wide = vitals.pivotWider({
    namesFrom: "metric",
    valuesFrom: "value",
    expectedColumns: ["systolic", "diastolic"] as const,
  });

  // 35a: systolic and diastolic are number | null — arithmetic blocked
  // @ts-expect-error: number | null can't be subtracted
  wide.mutate({ pp: (r) => r.systolic - r.diastolic });
});

Deno.test("35 — Pivot Column Mismatch: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const v = vitals as any;

  tsResults = [
    // 35a: arithmetic on pivot undefined — silent (undefined - number = NaN in JS)
    captureOutcome(() => {
      v.pivotWider({ namesFrom: "metric", valuesFrom: "value", expectedColumns: ["systolic", "diastolic"] }).mutate({ pp: (r: any) => r.systolic - r.diastolic });
      return "145-undefined=NaN";
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("35 — Pivot Column Mismatch: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(1);
  // 35a: systolic - diastolic with NaN from missing combo — silent
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("35 — Pivot Column Mismatch: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(1);
  // 35a: systolic - diastolic with NA from missing combo — silent
  expect(rResults[0].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("35 — Pivot Column Mismatch: Summary", () => {
  printComparisonTable({
    title: "Error Class 35: Pivot Column Mismatch",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
