/**
 * Error Class 9: Forbidden Array Methods / API Escape
 *
 * Tidy-TS forbids raw array methods (map, push, reduce) on DataFrames
 * at compile time. This prevents escaping the typed pipeline.
 * Python allows direct mutation via .loc. R allows $ access with typos.
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

const patients = createDataFrame([
  { patient_id: "P001", name: "Alice", age: 30 },
]);

const LABELS = [
  "9a: .map() / direct mutation",
  "9b: .push() / mixed apply",
  "9c: .reduce() / type coercion",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("09 — Forbidden Methods: Tidy-TS compile-time", () => {
  // 9a: .map() is forbidden on DataFrame — compile error, runtime throws
  // @ts-expect-error: map is forbidden on DataFrame
  expect(() => patients.map((r: unknown) => r)).toThrow();

  // 9b: .push() is forbidden on DataFrame — compile error, runtime throws
  // @ts-expect-error: push is forbidden on DataFrame
  expect(() => patients.push({ patient_id: "P002", name: "Bob", age: 45 })).toThrow();

  // 9c: .reduce() is forbidden on DataFrame — compile error, runtime throws
  // @ts-expect-error: reduce is forbidden on DataFrame
  expect(() => patients.reduce((sum: number, _r: unknown) => sum, 0)).toThrow();
});

Deno.test("09 — Forbidden Methods: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const p = patients as any;

  tsResults = [
    // 9a: .map() doesn't exist on DataFrame — error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => p.map((r: any) => r)),
    // 9b: .push() doesn't exist on DataFrame — error
    captureOutcome(() => p.push({ patient_id: "P002", name: "Bob", age: 45 })),
    // 9c: .reduce() doesn't exist on DataFrame — error
    captureOutcome(() => p.reduce((sum: number, _r: unknown) => sum, 0)),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
  expect(tsResults[2].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("09 — Forbidden Methods: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(3);
  // 9a: Direct mutation via .loc — silent (no immutability protection)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 9b: .apply() returning mixed types — silent (dtype becomes object)
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
  // 9c: Manual loop coerces types — silent (no type safety)
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("09 — Forbidden Methods: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(3);
  // 9a: $ access with typo — warning (returns NULL with warning)
  expect(rResults[0].outcome).toBe("warning" as Outcome);
  // 9b: Direct vector assignment changes column type — silent
  expect(rResults[1].outcome).toBe("silent" as Outcome);
  // 9c: for-loop sum coerces types — silent
  expect(rResults[2].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("09 — Forbidden Methods: Summary", () => {
  printComparisonTable({
    title: "Error Class 09: Forbidden Array Methods / API Escape",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
