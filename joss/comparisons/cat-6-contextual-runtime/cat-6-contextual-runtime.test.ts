/**
 * Category 6: Contextual & Runtime Safety
 *
 * Does the framework protect against context-dependent mistakes?
 * Groupby state leaks, empty DataFrame traps, nullable vs optional conflation.
 *
 * Consolidates error classes: 19, 29, 31.
 */
import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import {
  captureOutcome,
  type CompileOutcome,
  type Outcome,
  printComparisonTable,
  type ProbeResult,
  probePath,
  runPythonProbe,
  runRProbe,
} from "../test-helpers.ts";

const BASE = import.meta.url;

// ═══════════════════════════════════════════════════════════════════════════════
// Shared data
// ═══════════════════════════════════════════════════════════════════════════════

const labs = createDataFrame([
  { patient_id: "P001", test_name: "BNP", result_value: 1250 },
  { patient_id: "P001", test_name: "WBC", result_value: 15 },
  { patient_id: "P002", test_name: "BNP", result_value: 450 },
  { patient_id: "P002", test_name: "WBC", result_value: 8 },
]);

const labsEmpty = createDataFrame([
  { patient_id: "P001", result_value: 100 },
  { patient_id: "P002", result_value: 200 },
]);

const labsA = createDataFrame([
  { id: "P1", value: 100, note: null as string | null },
]);
const labsB = createDataFrame([
  { id: "P2", value: 200, source: "lab" },
]);

// ═══════════════════════════════════════════════════════════════════════════════
// Labels & compile outcomes — single flat array across all error classes
// ═══════════════════════════════════════════════════════════════════════════════

const LABELS = [
  "a: residual grouping after summarize",
  "b: arithmetic on empty sum",
  "c: arithmetic on empty mean",
  "d: null vs missing conflated",
  "e: conditional fill on null vs missing",
];

const TS_COMPILE: CompileOutcome[] = [
  "error",  // a: @ts-expect-error (test_name not in summarize result)
  "—",      // b: compile: N/A (type system doesn't track emptiness)
  "—",      // c: compile: N/A (type system doesn't track emptiness)
  "error",  // d: @ts-expect-error (note is string | null | undefined)
  "error",  // e: @ts-expect-error (after null check, note is still string | undefined)
];

let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS compile-time
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 6 — Contextual & Runtime Safety: Tidy-TS compile-time", () => {
  // a: accessing non-summarized column after summarize
  const grouped = labs.groupBy("patient_id");
  const summary = grouped.summarize({
    mean_val: (g) => s.mean(g.result_value),
  });
  // @ts-expect-error: test_name not in summarize result
  expect(() => summary.mutate({ t: (r) => r.test_name })).toThrow();

  // b: sum on empty — compile: N/A (type system doesn't track emptiness)
  const empty = labsEmpty.filter(() => false);
  const sumResult = empty.groupBy("patient_id").summarize({
    total: (g) => s.sum(g.result_value),
  });
  sumResult.mutate({ doubled: (r) => r.total * 2 });

  // c: mean on empty — compile: N/A (same)
  const meanResult = empty.groupBy("patient_id").summarize({
    avg: (g) => s.mean(g.result_value),
  });
  meanResult.mutate({ doubled: (r) => r.avg * 2 });

  // d: method on nullable+optional column after bindRows
  const combined = labsA.bindRows(labsB);
  // @ts-expect-error: note is string | null | undefined
  expect(() => combined.mutate({ upper: (r) => r.note.toUpperCase() })).toThrow();

  // e: only check null, miss undefined — .toUpperCase() blocked
  // @ts-expect-error: after null check, note is still string | undefined
  expect(() => combined.mutate({ filled: (r) => r.note === null ? "inconclusive" : r.note.toUpperCase() })).toThrow();
});

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS runtime
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 6 — Contextual & Runtime Safety: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;
  // deno-lint-ignore no-explicit-any
  const le = labsEmpty as any;
  // deno-lint-ignore no-explicit-any
  const a = labsA as any;
  // deno-lint-ignore no-explicit-any
  const b = labsB as any;

  tsResults = [
    // a: accessing non-summarized column after summarize — error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => l.groupBy("patient_id").summarize({ mean_val: (g: any) => s.mean(g.result_value) }).mutate({ t: (r: any) => r.test_name })),
    // b: sum on empty — no rows to corrupt
    captureOutcome(() => {
      const empty = le.filter(() => false);
      // deno-lint-ignore no-explicit-any
      const result = empty.groupBy("patient_id").summarize({ total: (g: any) => s.sum(g.result_value) });
      // deno-lint-ignore no-explicit-any
      result.mutate({ doubled: (r: any) => r.total * 2 });
      return `[] (0 rows)`;
    }),
    // c: mean on empty — no rows to corrupt
    captureOutcome(() => {
      const empty = le.filter(() => false);
      // deno-lint-ignore no-explicit-any
      const result = empty.groupBy("patient_id").summarize({ avg: (g: any) => s.mean(g.result_value) });
      // deno-lint-ignore no-explicit-any
      result.mutate({ doubled: (r: any) => r.avg * 2 });
      return `[] (0 rows)`;
    }),
    // d: .toUpperCase() on null/undefined — error (cannot read property of null)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => a.bindRows(b).mutate({ upper: (r: any) => r.note.toUpperCase() })),
    // e: only check null, miss undefined — .toUpperCase() on undefined throws
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      a.bindRows(b).mutate({ filled: (r: any) => r.note === null ? "inconclusive" : r.note.toUpperCase() });
      return "filled without checking undefined";
    }),
  ];

  // a: error (stale column after summarize)
  expect(tsResults[0].outcome).toBe("error" as Outcome);
  // b–c: silent (empty DataFrame — no rows to corrupt)
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
  expect(tsResults[2].outcome).toBe("silent" as Outcome);
  // d–e: error (null/undefined property access)
  expect(tsResults[3].outcome).toBe("error" as Outcome);
  expect(tsResults[4].outcome).toBe("error" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Python — single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 6 — Contextual & Runtime Safety: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(LABELS.length);

  // a: multi-level groupby + agg silently produces MultiIndex
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // b: sum on empty returns 0 — silent
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
  // c: mean on empty returns NaN — silent
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
  // d: null and missing both NaN — silent (no distinction)
  expect(pyResults[3].outcome).toBe("silent" as Outcome);
  // e: conditional fill treats both NaN identically — silent
  expect(pyResults[4].outcome).toBe("silent" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// R — single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 6 — Contextual & Runtime Safety: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(LABELS.length);

  // a: second summarise on still-grouped result — silent (per-group, not overall)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // b: sum on empty returns 0 — silent
  expect(rResults[1].outcome).toBe("silent" as Outcome);
  // c: mean on empty returns NaN — silent
  expect(rResults[2].outcome).toBe("silent" as Outcome);
  // d: null and missing both NA — silent (no distinction)
  expect(rResults[3].outcome).toBe("silent" as Outcome);
  // e: conditional fill treats both NA identically — silent
  expect(rResults[4].outcome).toBe("silent" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Summary — single table for the whole category
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 6 — Contextual & Runtime Safety: Summary", () => {
  printComparisonTable({
    title: "Category 6: Contextual & Runtime Safety",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
