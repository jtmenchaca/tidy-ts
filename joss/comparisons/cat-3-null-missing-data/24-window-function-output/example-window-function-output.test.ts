/**
 * Error Class 24: Window Function Output Type
 *
 * Tidy-TS's lag()/lead() return (T | undefined)[] — the type system
 * tracks that shifted positions become undefined. The compiler forces
 * null handling before arithmetic on lagged values.
 * Python's shift() silently introduces NaN. R's lag() silently introduces NA.
 */
import { expect } from "@std/expect";
import { stats as s } from "@tidy-ts/dataframe";
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
  "24a: shift/lag introduces null",
  "24b: arithmetic on lagged null",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("24 — Window Function Output: Tidy-TS compile-time", () => {
  const values = [120, 130, 125, 140];

  // lag() returns (number | undefined)[]
  const lagged = s.lag(values);
  expect(lagged[0]).toBe(undefined);
  expect(lagged[1]).toBe(120);

  // 24a: Arithmetic on lagged value — compile error (number | undefined)
  // @ts-expect-error: undefined can't be subtracted
  const _diff = lagged.map((v, i) => v - values[i]);

  // 24b: Same error — any arithmetic on lagged values is blocked
  // @ts-expect-error: number | undefined can't be added
  const _sum = lagged.map((v, i) => v + values[i]);

  // Correct: handle undefined
  const diff = lagged.map((v, i) =>
    v !== undefined ? v - values[i] : null,
  );
  expect(diff[0]).toBe(null);
});

Deno.test("24 — Window Function Output: Tidy-TS runtime", () => {
  tsResults = [
    // 24a: lag introduces undefined at position 0 — silent
    captureOutcome(() => {
      s.lag([120, 130, 125, 140]);
      return "lag() introduced 1 undefined";
    }),
    // 24b: arithmetic on lagged undefined produces NaN — silent
    captureOutcome(() => {
      const values = [120, 130, 125, 140];
      const lagged = s.lag(values);
      lagged.map((v, i) => (v as number) - values[i]);
      return "NaN produced in subtraction";
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("24 — Window Function Output: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 24a: shift() silently introduces NaN
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 24b: Arithmetic on NaN from shift propagates
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("24 — Window Function Output: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 24a: lag() silently introduces NA
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 24b: Arithmetic on NA from lag propagates
  expect(rResults[1].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("24 — Window Function Output: Summary", () => {
  printComparisonTable({
    title: "Error Class 24: Window Function Output Type",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
