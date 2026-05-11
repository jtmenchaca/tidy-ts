/**
 * Error Class 18: Column Name Collision in Joins
 *
 * Each row tests a specific mistake a user could make when joining
 * DataFrames with overlapping non-key column names.
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
  "18a: explicit suffix — access original name",
  "18b: no suffix — access original name",
];

let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const admissions = createDataFrame([
  { patient_id: "P1", date: "2024-01-15", department: "ED" },
]);
const discharges = createDataFrame([
  { patient_id: "P1", date: "2024-01-18", disposition: "Home" },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("18 — Column Name Collision: Tidy-TS compile-time", () => {
  const withSuffixes = admissions.innerJoin(discharges, {
    keys: ["patient_id"],
    suffixes: { left: "_admit", right: "_discharge" },
  });
  const noSuffixes = admissions.innerJoin(discharges, {
    keys: ["patient_id"],
  });

  // 18a: Explicit suffixes — access original name → compile error
  // @ts-expect-error: date no longer exists after suffixed join
  expect(() => withSuffixes.mutate({ d: (r) => r.date })).toThrow();

  // 18b: No suffixes — access original name → compile error
  // Both sides renamed: date_x (left) and date_y (right)
  // @ts-expect-error: date no longer exists — now date_x and date_y
  expect(() => noSuffixes.mutate({ d: (r) => r.date })).toThrow();
});

Deno.test("18 — Column Name Collision: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const a = admissions as any;

  tsResults = [
    // 18a: Explicit suffixes — access original name → runtime error
    captureOutcome(() => {
      const j = a.innerJoin(discharges, {
        keys: ["patient_id"],
        suffixes: { left: "_admit", right: "_discharge" },
      });
      // deno-lint-ignore no-explicit-any
      j.mutate({ d: (r: any) => r.date });
    }),
    // 18b: No suffixes — access original name → runtime error
    captureOutcome(() => {
      const j = a.innerJoin(discharges, { keys: ["patient_id"] });
      // deno-lint-ignore no-explicit-any
      j.mutate({ d: (r: any) => r.date });
    }),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("18 — Column Name Collision: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 18a: Explicit suffixes — access original → error
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  // 18b: No suffixes — access original → error (renamed to _x/_y)
  expect(pyResults[1].outcome).toBe("error" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("18 — Column Name Collision: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 18a: Explicit suffixes — access original → error
  expect(rResults[0].outcome).toBe("error" as Outcome);
  // 18b: No suffixes — access original → error (renamed to .x/.y)
  expect(rResults[1].outcome).toBe("error" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("18 — Column Name Collision: Summary", () => {
  printComparisonTable({
    title: "Error Class 18: Column Name Collision in Joins",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
