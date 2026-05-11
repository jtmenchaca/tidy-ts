/**
 * Error Class 12: Aggregation on Columns with Missing Data
 *
 * R's mean() silently returns NA when NAs are present. Python's mean()
 * silently skips NaN. Tidy-TS's s.mean() accepts nullable arrays but
 * returns number | null, propagating nullability through the type system.
 */
import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
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

const labs = createDataFrame([
  { test: "BNP", value: 100, ref_high: 120 as number | null },
  { test: "WBC", value: 200, ref_high: null },
]);

const LABELS = [
  "12a: mean on NaN/NA col",
  "12b: sum on NaN/NA col",
  "12c: min on NaN/NA col",
  "12d: groupby mean NaN/NA",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];

let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("12 — Aggregation Missing: Tidy-TS compile-time", () => {
  // 12a: s.mean() on nullable column returns number | null — arithmetic blocked
  const meanResult = labs.groupBy("test").summarize({
    avg: (g) => s.mean(g.ref_high),
  });
  // @ts-expect-error: number | null can't be multiplied
  meanResult.mutate({ doubled: (r) => r.avg * 2 });

  // 12b: s.sum() on nullable column returns number | null — arithmetic blocked
  const sumResult = labs.groupBy("test").summarize({
    total: (g) => s.sum(g.ref_high),
  });
  // @ts-expect-error: number | null can't be multiplied
  sumResult.mutate({ doubled: (r) => r.total * 2 });

  // 12c: s.min() on nullable column returns number | null — arithmetic blocked
  const minResult = labs.groupBy("test").summarize({
    minimum: (g) => s.min(g.ref_high),
  });
  // @ts-expect-error: number | null can't be multiplied
  minResult.mutate({ doubled: (r) => r.minimum * 2 });

  // 12d: groupby mean — same nullable return, arithmetic blocked
  const grouped = labs.groupBy("test").summarize({
    avg: (g) => s.mean(g.ref_high),
  });
  // @ts-expect-error: number | null can't be added
  grouped.mutate({ plus1: (r) => r.avg + 1 });
});

Deno.test("12 — Aggregation Missing: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;

  tsResults = [
    // 12a: mean on nullable → arithmetic produces null * 2 = 0 (JS coercion)
    captureOutcome(() => {
      const df = l.groupBy("test").summarize({ avg: (g: any) => s.mean(g.ref_high) });
      const doubled = df.mutate({ doubled: (r: any) => r.avg * 2 });
      const rows = doubled.toArray();
      const badCount = rows.filter((row: any) => row.doubled === 0 && row.avg === null).length;
      return `${badCount} null*2 coerced to 0`;
    }),
    // 12b: sum on nullable → arithmetic produces null * 2 = 0
    captureOutcome(() => {
      const df = l.groupBy("test").summarize({ total: (g: any) => s.sum(g.ref_high) });
      const doubled = df.mutate({ doubled: (r: any) => r.total * 2 });
      const rows = doubled.toArray();
      const badCount = rows.filter((row: any) => row.doubled === 0 && row.total === null).length;
      return `${badCount} null*2 coerced to 0`;
    }),
    // 12c: min on nullable → arithmetic produces null * 2 = 0
    captureOutcome(() => {
      const df = l.groupBy("test").summarize({ minimum: (g: any) => s.min(g.ref_high) });
      const doubled = df.mutate({ doubled: (r: any) => r.minimum * 2 });
      const rows = doubled.toArray();
      const badCount = rows.filter((row: any) => row.doubled === 0 && row.minimum === null).length;
      return `${badCount} null*2 coerced to 0`;
    }),
    // 12d: groupby mean → arithmetic on null avg produces 0
    captureOutcome(() => {
      const df = l.groupBy("test").summarize({ avg: (g: any) => s.mean(g.ref_high) });
      const plusOne = df.mutate({ inc: (r: any) => r.avg + 1 });
      const rows = plusOne.toArray();
      const badCount = rows.filter((row: any) => row.inc === 1 && row.avg === null).length;
      return `${badCount} null+1 coerced to 1`;
    }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
  expect(tsResults[2].outcome).toBe("silent" as Outcome);
  expect(tsResults[3].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("12 — Aggregation Missing: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(4);
  // 12a: mean() on column with NaN — silent (skips NaN)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 12b: sum() on column with NaN — silent (skips NaN)
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
  // 12c: min() on column with NaN — silent (skips NaN)
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
  // 12d: groupby mean with NaN groups — silent
  expect(pyResults[3].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("12 — Aggregation Missing: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(4);
  // 12a: mean() on column with NA — silent (returns NA)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 12b: sum() on column with NA — silent (returns NA)
  expect(rResults[1].outcome).toBe("silent" as Outcome);
  // 12c: min() on column with NA — silent (returns NA)
  expect(rResults[2].outcome).toBe("silent" as Outcome);
  // 12d: groupby mean with NA — silent (returns NA in groups)
  expect(rResults[3].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("12 — Aggregation Missing: Summary", () => {
  printComparisonTable({
    title: "Error Class 12: Aggregation on Columns with Missing Data",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
