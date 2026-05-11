/**
 * Error Class 34: Enum Validation
 *
 * When status is typed as a union ("admitted" | "discharged" | "transferred"),
 * TS catches comparisons against values outside the union at compile time
 * (TS2367: no overlap). Python/R silently filter against invalid values,
 * returning empty results with no indication of the typo.
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
  "34a: filter on invalid enum value",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

type Status = "admitted" | "discharged" | "transferred";

const encounters = createDataFrame([
  { patient_id: "P001", status: "admitted" as Status },
  { patient_id: "P002", status: "discharged" as Status },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("34 — Enum Validation: Tidy-TS compile-time", () => {
  // 34a: filter comparing status to "unknown" — blocked (TS2367: no overlap)
  // @ts-expect-error: Status and "unknown" have no overlap
  encounters.filter((r) => r.status === "unknown");
});

Deno.test("34 — Enum Validation: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const e = encounters as any;

  tsResults = [
    // 34a: filter on invalid enum value — silent (returns 0 rows)
    captureOutcome(() => {
      const filtered = e.filter((r: any) => r.status === "unknown");
      return `${filtered.nrows()} rows (silent empty)`;
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("34 — Enum Validation: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(1);
  // 34a: filter on invalid enum value — silent (returns empty df)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("34 — Enum Validation: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(1);
  // 34a: filter on invalid enum value — silent (returns 0 rows)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("34 — Enum Validation: Summary", () => {
  printComparisonTable({
    title: "Error Class 34: Enum Validation",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
