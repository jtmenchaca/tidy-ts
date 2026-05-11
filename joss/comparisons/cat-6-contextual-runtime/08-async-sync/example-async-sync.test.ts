/**
 * Error Class 8: Async/Sync Confusion
 *
 * When an async function is passed to a sync mutate, the column stores
 * Promise/coroutine objects instead of resolved values. Downstream
 * operations like filtering silently fail (comparing Promise to string
 * is always false). Tidy-TS detects the Promise return and throws.
 * Python silently stores coroutine objects — filter returns 0 rows.
 * R does not have async/await.
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
} from "../../test-helpers.ts";

const BASE = import.meta.url;

const meds = createDataFrame([
  { drug: "Aspirin", dose_mg: 325 },
]);

async function lookupInteraction(_drug: string): Promise<string> {
  return "none";
}

const LABELS = [
  "8a: filter on async-mutated col",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("08 — Async/Sync: Tidy-TS compile-time", () => {
  // Wrap in try/catch — mutate throws at runtime (Promise detection),
  // but the type check on .filter() is what we're demonstrating
  try {
    const withInteraction = meds.mutate({ interaction: (r) => lookupInteraction(r.drug) });

    // 8a: interaction is Promise<string> — comparing to "none" blocked (no overlap)
    // @ts-expect-error: Promise<string> and "none" have no overlap
    withInteraction.filter((r) => r.interaction === "none");
  } catch { /* runtime Promise detection — expected */ }
});

Deno.test("08 — Async/Sync: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const m = meds as any;

  tsResults = [
    // 8a: async mutate then filter — Tidy-TS throws on Promise return before filter
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const withInteraction = m.mutate({ interaction: async (r: any) => await lookupInteraction(r.drug) });
      withInteraction.filter((r: any) => r.interaction === "none");
      return "filter matched";
    }),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("08 — Async/Sync: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(1);
  // 8a: filter on coroutine column — silent (0 rows, comparison always false)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────
// R does not have async/await — no probe.R for this error class.

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("08 — Async/Sync: Summary", () => {
  printComparisonTable({
    title: "Error Class 08: Async/Sync Confusion",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: [],
  });
});
