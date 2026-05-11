/**
 * Error Class 33: Duplicate Column Names
 *
 * Tidy-TS uses TypeScript object types for schemas — duplicate keys
 * in object literals are a compile error (TS1117). Even bypassed,
 * JS object semantics mean { a: 1, a: 2 } becomes { a: 2 }.
 * Python silently allows duplicate column names — accessing one
 * returns a DataFrame (not Series), breaking downstream .str ops.
 * R tibble rejects duplicates at runtime.
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
  "33a: .upper() on duplicate col",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("33 — Duplicate Column Names: Tidy-TS compile-time", () => {
  // 33a: Object literal with duplicate key — TS compile error (TS1117)
  // @ts-expect-error: duplicate property 'name' in object literal
  const df = createDataFrame([{ id: 1, name: "Alice", name: "ED" }]);
  df.mutate({ upper: (r) => r.name.toUpperCase() });
});

Deno.test("33 — Duplicate Column Names: Tidy-TS runtime", () => {
  tsResults = [
    // 33a: JS deduplicates — last value wins, .toUpperCase() works on "ED"
    captureOutcome(() => {
      const rows = JSON.parse('[{"id": 1, "name": "Alice", "name": "ED"}]');
      const df = createDataFrame(rows);
      // deno-lint-ignore no-explicit-any
      df.mutate({ upper: (r: any) => r.name.toUpperCase() }).toArray();
      return "Last value wins, .upper() works";
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("33 — Duplicate Column Names: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(1);
  // 33a: .str.upper() on duplicate col returns DataFrame — error
  expect(pyResults[0].outcome).toBe("error" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("33 — Duplicate Column Names: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(1);
  // 33a: tibble rejects duplicate names at creation — error
  expect(rResults[0].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("33 — Duplicate Column Names: Summary", () => {
  printComparisonTable({
    title: "Error Class 33: Duplicate Column Names",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
