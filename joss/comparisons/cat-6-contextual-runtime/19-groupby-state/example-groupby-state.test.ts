/**
 * Error Class 19: GroupBy State Tracking
 *
 * Tidy-TS's groupBy returns a typed GroupedDataFrame. Only grouped
 * operations (summarize, mutate with group context) are available.
 * After summarize, the result is always ungrouped.
 * Python's GroupBy object silently produces MultiIndex.
 * R's summarise silently drops the last grouping level.
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

const LABELS = [
  "19b: multi-group state",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const labs = createDataFrame([
  { patient_id: "P001", test_name: "BNP", result_value: 1250 },
  { patient_id: "P001", test_name: "WBC", result_value: 15 },
  { patient_id: "P002", test_name: "BNP", result_value: 450 },
  { patient_id: "P002", test_name: "WBC", result_value: 8 },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("19 — GroupBy State: Tidy-TS compile-time", () => {
  const grouped = labs.groupBy("patient_id");
  const summary = grouped.summarize({
    mean_val: (g) => s.mean(g.result_value),
  });

  // 19b: Accessing non-summarized column after summarize — compile error, runtime throws
  // @ts-expect-error: test_name not in summarize result
  expect(() => summary.mutate({ t: (r) => r.test_name })).toThrow();
});

Deno.test("19 — GroupBy State: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;

  tsResults = [
    // 19b: Accessing non-summarized column after summarize — error
    captureOutcome(() => l.groupBy("patient_id").summarize({ mean_val: (g: any) => s.mean(g.result_value) }).mutate({ t: (r: any) => r.test_name })),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("19 — GroupBy State: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(1);
  // 19b: Multi-level groupby + agg silently produces MultiIndex
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("19 — GroupBy State: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(1);
  // 19b: Second summarise on still-grouped result — silent (per-group, not overall)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("19 — GroupBy State: Summary", () => {
  printComparisonTable({
    title: "Error Class 19: GroupBy State Tracking",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
