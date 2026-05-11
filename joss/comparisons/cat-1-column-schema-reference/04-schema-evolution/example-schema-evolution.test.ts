/**
 * Error Class 4: Schema Evolution Through Pipelines
 *
 * After select/drop/summarize, the DataFrame schema changes. Tidy-TS
 * tracks the new schema at compile time. Python/R throw KeyError at runtime.
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
  { encounter_id: "E001", patient_id: "P001", department: "ED", attending_physician: "Dr. Smith", encounter_type: "Inpatient" },
]);

const LABELS = [
  "4a: access dropped col after select",
  "4b: access col after summarize",
  "4c: sort by dropped col",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("04 — Schema Evolution: Tidy-TS compile-time", () => {
  // 4a: Accessing dropped column after select — compile error, runtime throws
  const slim = encounters.select("encounter_id", "patient_id", "department");
  // @ts-expect-error: attending_physician was not selected
  expect(() => slim.mutate({ doc: (r) => r.attending_physician })).toThrow();

  // 4b: Accessing original column after summarize — compile error, runtime throws
  const summary = encounters.groupBy("department").summarize({
    count: (g) => g.nrows(),
  });
  // @ts-expect-error: encounter_type gone after summarize
  expect(() => summary.filter((r) => r.encounter_type === "Inpatient")).toThrow();

  // 4c: Sorting by dropped column — compile error, runtime throws
  const noDoc = encounters.drop("attending_physician");
  // @ts-expect-error: attending_physician was dropped
  expect(() => noDoc.arrange("attending_physician", "asc")).toThrow();
});

Deno.test("04 — Schema Evolution: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const e = encounters as any;

  tsResults = [
    // 4a: Accessing dropped column after select
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => e.select("encounter_id", "patient_id", "department").mutate({ doc: (r: any) => r.attending_physician })),
    // 4b: Accessing original column after summarize
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => e.groupBy("department").summarize({ count: (g: any) => g.nrows() }).filter((r: any) => r.encounter_type === "Inpatient")),
    // 4c: Sorting by dropped column
    captureOutcome(() => e.drop("attending_physician").arrange("attending_physician", "asc")),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
  expect(tsResults[2].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("04 — Schema Evolution: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(3);
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  expect(pyResults[1].outcome).toBe("error" as Outcome);
  expect(pyResults[2].outcome).toBe("error" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("04 — Schema Evolution: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(3);
  expect(rResults[0].outcome).toBe("error" as Outcome);
  expect(rResults[1].outcome).toBe("error" as Outcome);
  expect(rResults[2].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("04 — Schema Evolution: Summary", () => {
  printComparisonTable({
    title: "Error Class 04: Schema Evolution Through Pipelines",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
