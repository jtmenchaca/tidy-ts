/**
 * Error Class 13: Bind Rows Schema Mismatch
 *
 * Tidy-TS's bindRows() computes a merged type: shared columns stay
 * required, columns unique to one side become optional (T | undefined).
 * The compiler then prevents unsafe access on optional columns.
 * Python silently fills with NaN. R silently fills with NA.
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

const labsA = createDataFrame([
  { id: "P1", value: 100, site: "Main" },
]);
const labsB = createDataFrame([
  { id: "P2", value: 200, ref_range: "4-5" },
]);

const LABELS = [
  "13a: access optional col",
  "13b: string op on NaN/NA",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("13 — Bind Rows Schema: Tidy-TS compile-time", () => {
  const combined = labsA.bindRows(labsB);

  // 13a: Accessing optional column without null check — compile error, runtime throws
  // @ts-expect-error: ref_range is string | undefined — can't call toUpperCase
  expect(() => combined.mutate({ upper: (r) => r.ref_range.toUpperCase() })).toThrow();

  // 13b: String method on other optional column — compile error, runtime throws
  // @ts-expect-error: site is string | undefined — can't call toUpperCase
  expect(() => combined.mutate({ upper: (r) => r.site.toUpperCase() })).toThrow();
});

Deno.test("13 — Bind Rows Schema: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const a = labsA as any;
  // deno-lint-ignore no-explicit-any
  const b = labsB as any;

  tsResults = [
    // 13a: .toUpperCase() on undefined — runtime error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => a.bindRows(b).mutate({ upper: (r: any) => r.ref_range.toUpperCase() })),
    // 13b: .toUpperCase() on undefined (site col) — runtime error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => a.bindRows(b).mutate({ upper: (r: any) => r.site.toUpperCase() })),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("13 — Bind Rows Schema: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 13a: concat with different schemas — silent (fills NaN)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 13b: String op on NaN column — silent (NaN propagates)
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("13 — Bind Rows Schema: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 13a: bind_rows with different schemas — silent (fills NA)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 13b: String op on NA column — silent (NA propagates)
  expect(rResults[1].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("13 — Bind Rows Schema: Summary", () => {
  printComparisonTable({
    title: "Error Class 13: Bind Rows Schema Mismatch",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
