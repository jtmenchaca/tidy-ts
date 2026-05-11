/**
 * Error Class 7: Pipeline Composition Errors
 *
 * Tidy-TS tracks schema changes through multi-step pipelines. Each
 * transformation updates the type, so errors in later steps are caught.
 * Python/R throw KeyError at runtime.
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

const encounters = createDataFrame([
  { encounter_id: "E001", patient_id: "P001", department: "ED" },
]);

const LABELS = [
  "7a: old name after rename",
  "7b: col removed by summarize",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("07 — Pipeline Composition: Tidy-TS compile-time", () => {
  // 7a: Using old column name after rename — compile error, runtime throws
  const renamed = encounters.rename({ department: "dept" });
  // @ts-expect-error: department was renamed to dept
  expect(() => renamed.filter((r) => r.department === "ICU")).toThrow();

  // 7b: Accessing column removed by summarize — compile error, runtime throws
  const summary = encounters.groupBy("department").summarize({
    count: (g) => g.nrows(),
  });
  // @ts-expect-error: encounter_id gone after summarize
  expect(() => summary.mutate({ eid: (r) => r.encounter_id })).toThrow();
});

Deno.test("07 — Pipeline Composition: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const e = encounters as any;

  tsResults = [
    // 7a: Using old column name after rename
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => e.rename({ department: "dept" }).filter((r: any) => r.department === "ICU")),
    // 7b: Accessing column removed by summarize
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => e.groupBy("department").summarize({ count: (g: any) => g.nrows() }).mutate({ eid: (r: any) => r.encounter_id })),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("07 — Pipeline Composition: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 7a: Using old column name after rename — runtime error
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  // 7b: Accessing column removed by groupby/agg — runtime error
  expect(pyResults[1].outcome).toBe("error" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("07 — Pipeline Composition: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 7a: Using old column name after rename — runtime error
  expect(rResults[0].outcome).toBe("error" as Outcome);
  // 7b: Accessing column removed by summarise — runtime error
  expect(rResults[1].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("07 — Pipeline Composition: Summary", () => {
  printComparisonTable({
    title: "Error Class 07: Pipeline Composition Errors",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
