/**
 * Error Class 31: Nullable vs Optional Distinction
 *
 * Tidy-TS distinguishes between null (explicit missing value) and
 * undefined (column doesn't exist in this row, e.g., from bindRows).
 * Python/R use a single sentinel (NaN/NA) for both concepts.
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
  "31a: null vs missing conflated",
  "31b: conditional fill on null vs missing",
];

// Collected results for the summary table
let tsResults: ProbeResult[] = [];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const labsA = createDataFrame([
  { id: "P1", value: 100, note: null as string | null },
]);
const labsB = createDataFrame([
  { id: "P2", value: 200, source: "lab" },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("31 — Nullable vs Optional: Tidy-TS compile-time", () => {
  const combined = labsA.bindRows(labsB);

  // note is string | null | undefined (nullable in A, missing in B)
  // source is string | undefined (missing in A, present in B)
  // The type system distinguishes these semantically

  // 31a: Method on nullable+optional column — compile error
  // @ts-expect-error: note is string | null | undefined
  expect(() => combined.mutate({ upper: (r) => r.note.toUpperCase() })).toThrow();

  // 31b: only check null, miss undefined — .toUpperCase() blocked
  // @ts-expect-error: after null check, note is still string | undefined
  expect(() => combined.mutate({ filled: (r) => r.note === null ? "inconclusive" : r.note.toUpperCase() })).toThrow();
});

Deno.test("31 — Nullable vs Optional: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const a = labsA as any;
  // deno-lint-ignore no-explicit-any
  const b = labsB as any;

  tsResults = [
    // 31a: .toUpperCase() on null/undefined — error (cannot read property of null)
    captureOutcome(() => a.bindRows(b).mutate({ upper: (r: any) => r.note.toUpperCase() })),
    // 31b: only check null, miss undefined — .toUpperCase() on undefined throws
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      a.bindRows(b).mutate({ filled: (r: any) => r.note === null ? "inconclusive" : r.note.toUpperCase() });
      return "filled without checking undefined";
    }),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("31 — Nullable vs Optional: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 31a: Both None and missing column become NaN — silent (no distinction)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 31b: conditional fill treats both NaN identically — silent
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("31 — Nullable vs Optional: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 31a: Both NA and missing column become NA — silent (no distinction)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 31b: conditional fill treats both NA identically — silent
  expect(rResults[1].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("31 — Nullable vs Optional: Summary", () => {
  printComparisonTable({
    title: "Error Class 31: Nullable vs Optional Distinction",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
