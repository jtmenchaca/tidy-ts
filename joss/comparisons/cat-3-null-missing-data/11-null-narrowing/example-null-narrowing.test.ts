/**
 * Error Class 11: Null Narrowing via replaceNull / removeNull
 *
 * Tidy-TS tracks nullability at the type level. After replaceNull() or
 * removeNull(), columns are narrowed from T | null to T. The compiler
 * then allows operations that were previously forbidden.
 * Python/R have no compile-time nullable tracking.
 */
import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import {
  captureOutcome,
  deriveCompileOutcomes,
  type Outcome,
  type ProbeResult,
  printComparisonTable,
  probePath,
  runPythonProbe,
  runRProbe,
} from "../../test-helpers.ts";

const BASE = import.meta.url;

const LABELS = [
  "11a: arithmetic on nullable col",
  "11b: arithmetic after re-introducing null",
];

let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const labs = createDataFrame([
  { lab_id: "L1", result_value: 100, reference_high: 120 as number | null },
  { lab_id: "L2", result_value: 200, reference_high: null },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("11 — Null Narrowing: Tidy-TS compile-time", () => {
  // 11a: Arithmetic on nullable column — compile error.
  // reference_high is number | null, so division is blocked.
  // @ts-expect-error: number | null can't be divided
  labs.mutate({ pct: (r) => r.result_value / r.reference_high });

  // After replaceNull: column narrowed to number — arithmetic OK
  const filled = labs.replaceNull({ reference_high: 999 });
  filled.mutate({ pct: (r) => r.result_value / r.reference_high });

  // 11b: Re-introducing null via mutate makes the column nullable again.
  // Arithmetic on the re-introduced nullable column is blocked.
  const refilled = filled.mutate({
    reference_high: (r) => r.reference_high > 500 ? null : r.reference_high,
  });
  // @ts-expect-error: reference_high is number | null again after mutate
  refilled.mutate({ pct: (r) => r.result_value / r.reference_high });

});

Deno.test("11 — Null Narrowing: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;

  tsResults = [
    // 11a: Division by null — silent (JS: null coerces to 0, produces Infinity)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = l.mutate({ pct: (r: any) => r.result_value / r.reference_high });
      const rows = df.toArray();
      const infCount = rows.filter((row: any) => !isFinite(row.pct)).length;
      return `${infCount} Infinity from null div`;
    }),
    // 11b: Re-introduce null via mutate, then divide — silent (same Infinity problem)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const filled = l.replaceNull({ reference_high: 999 });
      const refilled = filled.mutate({
        // deno-lint-ignore no-explicit-any
        reference_high: (r: any) => r.result_value > 150 ? null : r.reference_high,
      });
      // deno-lint-ignore no-explicit-any
      const df = refilled.mutate({ pct: (r: any) => r.result_value / r.reference_high });
      const rows = df.toArray();
      const infCount = rows.filter((row: any) => !isFinite(row.pct)).length;
      return `${infCount} Infinity after re-null`;
    }),
  ];
  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("11 — Null Narrowing: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 11a: Division with NaN — silent (NaN propagates)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 11b: Re-introduce NaN then divide — silent (NaN propagates again)
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("11 — Null Narrowing: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 11a: Division with NA — silent (NA propagates)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 11b: Re-introduce NA then divide — silent (NA propagates again)
  expect(rResults[1].outcome).toBe("silent" as Outcome);
});

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("11 — Null Narrowing: Summary", () => {
  printComparisonTable({
    title: "Error Class 11: Null Narrowing via replaceNull / removeNull",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
