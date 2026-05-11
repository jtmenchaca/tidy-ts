/**
 * Error Class 28: Reorder vs Select Schema Preservation
 *
 * Tidy-TS has separate reorder() and select() verbs. reorder()
 * keeps all columns (just changes order). select() drops unmentioned.
 * Python has no built-in "reorder but keep all" — df[cols] always drops.
 * R has select() (drops) vs relocate() (keeps), but no compile-time check.
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
  "28a: access dropped after select",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const patients = createDataFrame([
  { patient_id: "P001", name: "Alice", age: 30, insurance: "Medicare" },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("28 — Reorder Schema: Tidy-TS compile-time", () => {
  // 28a: select drops unmentioned
  const selected = patients.select("name", "patient_id");
  // @ts-expect-error: age was not selected
  expect(() => selected.mutate({ a: (r) => r.age })).toThrow();
});

Deno.test("28 — Reorder Schema: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const p = patients as any;

  tsResults = [
    // 28a: Accessing dropped column after select — runtime error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => p.select("name", "patient_id").mutate({ a: (r: any) => r.age })),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("28 — Reorder Schema: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(1);
  // 28a: df[cols] silently drops other columns
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("28 — Reorder Schema: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(1);
  // 28a: select() silently drops unmentioned columns
  expect(rResults[0].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("28 — Reorder Schema: Summary", () => {
  printComparisonTable({
    title: "Error Class 28: Reorder vs Select Schema Preservation",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
