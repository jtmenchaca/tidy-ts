/**
 * Error Class 17: Join Nullability
 *
 * After leftJoin, right-side columns become T | undefined because not
 * every left row has a match. Tidy-TS tracks this in the type system.
 * Python/R silently produce NaN/NA for unmatched rows.
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
  "17a: method on join-null",
  "17b: arithmetic on join-null",
  "17c: comparison excludes null",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const patients = createDataFrame([
  { patient_id: "P1", name: "Alice" },
  { patient_id: "P2", name: "Bob" },
]);
const encounters = createDataFrame([
  { patient_id: "P1", department: "ED", los_days: 3 },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("17 — Join Nullability: Tidy-TS compile-time", () => {
  const joined = patients.leftJoin(encounters, "patient_id");

  // 17a: String method on potentially undefined — compile error, runtime throws
  // @ts-expect-error: department is string | undefined
  expect(() => joined.mutate({ upper: (r) => r.department.toUpperCase() })).toThrow();

  // 17b: Arithmetic on potentially undefined — compile error
  // @ts-expect-error: los_days is number | undefined
  joined.mutate({ weeks: (r) => r.los_days / 7 });

  // 17c: Comparison on undefined — compile error (los_days is number | undefined)
  // @ts-expect-error: los_days is number | undefined — can't compare with >
  joined.filter((r) => r.los_days > 2);

  // Correct: narrow first
  joined.mutate({
    upper: (r) => r.department?.toUpperCase() ?? "N/A",
    weeks: (r) => (r.los_days !== undefined ? r.los_days / 7 : null),
  });
});

Deno.test("17 — Join Nullability: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const p = patients as any;

  tsResults = [
    // 17a: .toUpperCase() on undefined from left join — runtime error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => p.leftJoin(encounters, "patient_id").mutate({ upper: (r: any) => r.department.toUpperCase() })),
    // 17b: undefined / 7 produces NaN — silent (JS arithmetic)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { p.leftJoin(encounters, "patient_id").mutate({ weeks: (r: any) => r.los_days / 7 }); return "produced NaN silently"; }),
    // 17c: Comparison on undefined — silent (undefined > 3 is false in JS)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { p.leftJoin(encounters, "patient_id").filter((r: any) => r.los_days > 3); return "excluded undefined rows"; }),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
  expect(tsResults[2].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("17 — Join Nullability: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(3);
  // 17a: str.upper() on NaN from join — silent (NaN propagates)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 17b: Arithmetic on NaN from join — silent (NaN propagates)
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
  // 17c: Comparison silently excludes NaN rows
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("17 — Join Nullability: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(3);
  // 17a: toupper() on NA from join — silent (NA propagates)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 17b: Arithmetic on NA from join — silent (NA propagates)
  expect(rResults[1].outcome).toBe("silent" as Outcome);
  // 17c: filter() silently drops NA rows
  expect(rResults[2].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("17 — Join Nullability: Summary", () => {
  printComparisonTable({
    title: "Error Class 17: Join Nullability",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
