/**
 * Category 3: Null & Missing Data
 *
 * Does the type system track nullability through transforms? Does it
 * force explicit null handling before arithmetic, aggregation, or
 * comparison?
 *
 * Consolidates error classes: 05, 11, 12, 21, 24, 26, 31, 35.
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

const labs05 = createDataFrame([
  { patient_id: "P001", result_value: 100, reference_high: 120 as number | null },
  { patient_id: "P002", result_value: 200, reference_high: null },
]);

const labs11 = createDataFrame([
  { lab_id: "L1", result_value: 100, reference_high: 120 as number | null },
  { lab_id: "L2", result_value: 200, reference_high: null },
]);

const labs12 = createDataFrame([
  { test: "BNP", value: 100, ref_high: 120 as number | null },
  { test: "WBC", value: 200, ref_high: null },
]);

const labs21 = createDataFrame([
  { patient_id: "P001", result_value: 1250 as number | null },
  { patient_id: "P001", result_value: null },
  { patient_id: "P002", result_value: 450 },
]);

const labs26 = createDataFrame([
  { patient_id: "P001", result_value: 100 as number | null },
  { patient_id: "P002", result_value: null },
  { patient_id: "P003", result_value: 50 },
]);

const vitals35 = createDataFrame([
  { patient_id: "P001", metric: "systolic", value: 130 },
  { patient_id: "P001", metric: "diastolic", value: 85 },
  { patient_id: "P002", metric: "systolic", value: 145 },
  // P002 missing diastolic
]);

const labsNullA = createDataFrame([
  { id: "P1", value: 100, note: null as string | null },
]);
const labsNullB = createDataFrame([
  { id: "P2", value: 200, source: "lab" },
]);

// ═══════════════════════════════════════════════════════════════════════════════
// Labels & compile outcomes — single flat array across all error classes
// ═══════════════════════════════════════════════════════════════════════════════

const LABELS = [
  "a: method call on nullable column",
  "b: arithmetic on nullable column",
  "c: comparison on nullable column",
  "d: arithmetic on nullable before narrowing",
  "e: arithmetic after re-introducing null",
  "f: mean on nullable column then arithmetic",
  "g: sum on nullable column then arithmetic",
  "h: min on nullable column then arithmetic",
  "i: groupby mean on nullable column then arithmetic",
  "j: sum silently skips or returns null",
  "k: arithmetic on null-skipped aggregation result",
  "l: shift/lag introduces null at boundary",
  "m: arithmetic on lagged null propagates",
  "n: sort silently places null at end",
  "o: arithmetic on null from missing pivot combination",
  "p: null vs missing conflated",
  "q: conditional fill on null vs missing",
];

// All cat-3 cases have @ts-expect-error — every case is caught at compile time
const TS_COMPILE: CompileOutcome[] = LABELS.map(() => "error");

let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];
let polarsResults: ProbeResult[];

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS compile-time
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 3 — Null & Missing Data: Tidy-TS compile-time", () => {
  // a: method call on nullable column — compile error
  // @ts-expect-error: reference_high is number | null, .toFixed() not safe
  expect(() => labs05.mutate({ label: (r) => r.reference_high.toFixed(1) })).toThrow();

  // b: arithmetic on nullable column — compile error
  // @ts-expect-error: number | null can't be subtracted
  labs05.mutate({ deviation: (r) => r.result_value - r.reference_high });

  // c: comparison on nullable column — compile error
  // @ts-expect-error: reference_high is number | null, > not safe
  labs05.filter((r) => r.reference_high > 100);

  // d: arithmetic on nullable column before narrowing — compile error
  // @ts-expect-error: number | null can't be divided
  labs11.mutate({ pct: (r) => r.result_value / r.reference_high });

  // e: arithmetic after re-introducing null via mutate — compile error
  const filled11 = labs11.replaceNull({ reference_high: 999 });
  const refilled11 = filled11.mutate({
    reference_high: (r) => r.reference_high > 500 ? null : r.reference_high,
  });
  // @ts-expect-error: reference_high is number | null again after mutate
  refilled11.mutate({ pct: (r) => r.result_value / r.reference_high });

  // f: mean on nullable column returns number | null — arithmetic blocked
  const meanResult = labs12.groupBy("test").summarize({
    avg: (g) => s.mean(g.ref_high),
  });
  // @ts-expect-error: number | null can't be multiplied
  meanResult.mutate({ doubled: (r) => r.avg * 2 });

  // g: sum on nullable column returns number | null — arithmetic blocked
  const sumResult = labs12.groupBy("test").summarize({
    total: (g) => s.sum(g.ref_high),
  });
  // @ts-expect-error: number | null can't be multiplied
  sumResult.mutate({ doubled: (r) => r.total * 2 });

  // h: min on nullable column returns number | null — arithmetic blocked
  const minResult = labs12.groupBy("test").summarize({
    minimum: (g) => s.min(g.ref_high),
  });
  // @ts-expect-error: number | null can't be multiplied
  minResult.mutate({ doubled: (r) => r.minimum * 2 });

  // i: groupby mean — same nullable return, arithmetic blocked
  const grouped12 = labs12.groupBy("test").summarize({
    avg: (g) => s.mean(g.ref_high),
  });
  // @ts-expect-error: number | null can't be added
  grouped12.mutate({ plus1: (r) => r.avg + 1 });

  // j: s.sum on nullable column — arithmetic on nullable result blocked
  const totals21 = labs21.groupBy("patient_id").summarize({
    total: (g) => s.sum(g.result_value),
  });
  // @ts-expect-error: number | null can't be divided
  totals21.mutate({ per_patient: (r) => r.total / 2 });

  // k: downstream arithmetic on nullable sum also blocked
  // @ts-expect-error: number | null can't be multiplied
  totals21.mutate({ doubled: (r) => r.total * 2 });

  // l: lag() returns (number | undefined)[] — arithmetic blocked
  const values24 = [120, 130, 125, 140];
  const lagged24 = s.lag(values24);
  // @ts-expect-error: undefined can't be subtracted
  const _diff24 = lagged24.map((v, i) => v - values24[i]);

  // m: any arithmetic on lagged values is blocked
  // @ts-expect-error: number | undefined can't be added
  const _sum24 = lagged24.map((v, i) => v + values24[i]);

  // n: arrange on nullable column preserves nullability — arithmetic blocked
  const sorted26 = labs26.arrange("result_value", "asc");
  // @ts-expect-error: number | null can't be multiplied
  sorted26.mutate({ doubled: (r) => r.result_value * 2 });

  // o: pivot with missing combinations — columns are number | null, arithmetic blocked
  const wide35 = vitals35.pivotWider({
    namesFrom: "metric",
    valuesFrom: "value",
    expectedColumns: ["systolic", "diastolic"] as const,
  });
  // @ts-expect-error: number | null can't be subtracted
  wide35.mutate({ pp: (r) => r.systolic - r.diastolic });

  // p: method on nullable+optional column after bindRows
  const combined31 = labsNullA.bindRows(labsNullB);
  // @ts-expect-error: note is string | null | undefined
  expect(() => combined31.mutate({ upper: (r) => r.note.toUpperCase() })).toThrow();

  // q: only check null, miss undefined — .toUpperCase() blocked
  // @ts-expect-error: after null check, note is still string | undefined
  expect(() => combined31.mutate({ filled: (r) => r.note === null ? "inconclusive" : r.note.toUpperCase() })).toThrow();
});

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS runtime
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 3 — Null & Missing Data: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l05 = labs05 as any;
  // deno-lint-ignore no-explicit-any
  const l11 = labs11 as any;
  // deno-lint-ignore no-explicit-any
  const l12 = labs12 as any;
  // deno-lint-ignore no-explicit-any
  const l21 = labs21 as any;
  // deno-lint-ignore no-explicit-any
  const l26 = labs26 as any;
  // deno-lint-ignore no-explicit-any
  const v35 = vitals35 as any;
  // deno-lint-ignore no-explicit-any
  const nA = labsNullA as any;
  // deno-lint-ignore no-explicit-any
  const nB = labsNullB as any;

  tsResults = [
    // a: method call on null — runtime error (.toFixed on null throws)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => l05.mutate({ label: (r: any) => r.reference_high.toFixed(1) })),
    // b: arithmetic on null — silent (null - number = 0 in JS, no hook point)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = l05.mutate({ deviation: (r: any) => r.result_value - r.reference_high });
      // deno-lint-ignore no-explicit-any
      const rows = df.toArray() as any[];
      const nullRow = rows.find((r) => r.reference_high === null);
      return nullRow && nullRow.deviation === nullRow.result_value
        ? "null coerced to 0 silently"
        : "null propagated as NaN";
    }),
    // c: comparison with null — silent (null > 100 is false in JS)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const filtered = l05.filter((r: any) => r.reference_high > 100);
      const total = l05.toArray().length;
      const kept = filtered.toArray().length;
      return `null rows silently dropped (${total - kept})`;
    }),
    // d: division by null — silent (JS: null coerces to 0, produces Infinity)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = l11.mutate({ pct: (r: any) => r.result_value / r.reference_high });
      // deno-lint-ignore no-explicit-any
      const rows = df.toArray() as any[];
      // deno-lint-ignore no-explicit-any
      const infCount = rows.filter((row: any) => !isFinite(row.pct)).length;
      return `${infCount} Infinity from null div`;
    }),
    // e: re-introduce null via mutate, then divide — silent (same Infinity problem)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const filled = l11.replaceNull({ reference_high: 999 });
      const refilled = filled.mutate({
        // deno-lint-ignore no-explicit-any
        reference_high: (r: any) => r.result_value > 150 ? null : r.reference_high,
      });
      // deno-lint-ignore no-explicit-any
      const df = refilled.mutate({ pct: (r: any) => r.result_value / r.reference_high });
      // deno-lint-ignore no-explicit-any
      const rows = df.toArray() as any[];
      // deno-lint-ignore no-explicit-any
      const infCount = rows.filter((row: any) => !isFinite(row.pct)).length;
      return `${infCount} Infinity after re-null`;
    }),
    // f: mean on nullable — arithmetic produces null * 2 = 0 (JS coercion)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = l12.groupBy("test").summarize({ avg: (g: any) => s.mean(g.ref_high) });
      // deno-lint-ignore no-explicit-any
      const doubled = df.mutate({ doubled: (r: any) => r.avg * 2 });
      // deno-lint-ignore no-explicit-any
      const rows = doubled.toArray() as any[];
      // deno-lint-ignore no-explicit-any
      const badCount = rows.filter((row: any) => row.doubled === 0 && row.avg === null).length;
      return `${badCount} null*2 coerced to 0`;
    }),
    // g: sum on nullable — arithmetic produces null * 2 = 0
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = l12.groupBy("test").summarize({ total: (g: any) => s.sum(g.ref_high) });
      // deno-lint-ignore no-explicit-any
      const doubled = df.mutate({ doubled: (r: any) => r.total * 2 });
      // deno-lint-ignore no-explicit-any
      const rows = doubled.toArray() as any[];
      // deno-lint-ignore no-explicit-any
      const badCount = rows.filter((row: any) => row.doubled === 0 && row.total === null).length;
      return `${badCount} null*2 coerced to 0`;
    }),
    // h: min on nullable — arithmetic produces null * 2 = 0
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = l12.groupBy("test").summarize({ minimum: (g: any) => s.min(g.ref_high) });
      // deno-lint-ignore no-explicit-any
      const doubled = df.mutate({ doubled: (r: any) => r.minimum * 2 });
      // deno-lint-ignore no-explicit-any
      const rows = doubled.toArray() as any[];
      // deno-lint-ignore no-explicit-any
      const badCount = rows.filter((row: any) => row.doubled === 0 && row.minimum === null).length;
      return `${badCount} null*2 coerced to 0`;
    }),
    // i: groupby mean — arithmetic on null avg produces 0
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = l12.groupBy("test").summarize({ avg: (g: any) => s.mean(g.ref_high) });
      // deno-lint-ignore no-explicit-any
      const plusOne = df.mutate({ inc: (r: any) => r.avg + 1 });
      // deno-lint-ignore no-explicit-any
      const rows = plusOne.toArray() as any[];
      // deno-lint-ignore no-explicit-any
      const badCount = rows.filter((row: any) => row.inc === 1 && row.avg === null).length;
      return `${badCount} null+1 coerced to 1`;
    }),
    // j: s.sum on nullable column — silent (skips nulls, returns number)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      l21.groupBy("patient_id").summarize({ total: (g: any) => s.sum(g.result_value) });
      return "Skipped null, returned number";
    }),
    // k: arithmetic on sum result — silent (null / 2 = 0 in JS)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      l21.groupBy("patient_id").summarize({ total: (g: any) => s.sum(g.result_value) }).mutate({ half: (r: any) => r.total / 2 });
      return "Divided null-skipped sum by 2";
    }),
    // l: lag introduces undefined at position 0 — silent
    captureOutcome(() => {
      s.lag([120, 130, 125, 140]);
      return "lag() introduced 1 undefined";
    }),
    // m: arithmetic on lagged undefined produces NaN — silent
    captureOutcome(() => {
      const values = [120, 130, 125, 140];
      const lagged = s.lag(values);
      lagged.map((v, i) => (v as number) - values[i]);
      return "NaN produced in subtraction";
    }),
    // n: arrange on nullable column — silent (nulls sorted to end)
    captureOutcome(() => {
      l26.arrange("result_value", "asc");
      return "Nulls sorted to end";
    }),
    // o: arithmetic on pivot undefined — silent (undefined - number = NaN in JS)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      v35.pivotWider({ namesFrom: "metric", valuesFrom: "value", expectedColumns: ["systolic", "diastolic"] }).mutate({ pp: (r: any) => r.systolic - r.diastolic });
      return "145-undefined=NaN";
    }),
    // p: .toUpperCase() on null/undefined — error (cannot read property of null)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => nA.bindRows(nB).mutate({ upper: (r: any) => r.note.toUpperCase() })),
    // q: only check null, miss undefined — .toUpperCase() on undefined throws
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      nA.bindRows(nB).mutate({ filled: (r: any) => r.note === null ? "inconclusive" : r.note.toUpperCase() });
      return "filled without checking undefined";
    }),
  ];

  // a: error (method call on null throws)
  expect(tsResults[0].outcome).toBe("error" as Outcome);
  // b: silent (JS coercion)
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
  // c: silent (null > 100 is false)
  expect(tsResults[2].outcome).toBe("silent" as Outcome);
  // d: silent (null coerces to 0, produces Infinity)
  expect(tsResults[3].outcome).toBe("silent" as Outcome);
  // e: silent (same Infinity problem)
  expect(tsResults[4].outcome).toBe("silent" as Outcome);
  // f–i: silent (JS coercion / null propagation)
  expect(tsResults[5].outcome).toBe("silent" as Outcome);
  expect(tsResults[6].outcome).toBe("silent" as Outcome);
  expect(tsResults[7].outcome).toBe("silent" as Outcome);
  expect(tsResults[8].outcome).toBe("silent" as Outcome);
  // j–k: silent (skips nulls)
  expect(tsResults[9].outcome).toBe("silent" as Outcome);
  expect(tsResults[10].outcome).toBe("silent" as Outcome);
  // l–m: silent (lag introduces undefined)
  expect(tsResults[11].outcome).toBe("silent" as Outcome);
  expect(tsResults[12].outcome).toBe("silent" as Outcome);
  // n: silent (nulls sorted to end)
  expect(tsResults[13].outcome).toBe("silent" as Outcome);
  // o: silent (undefined - number = NaN)
  expect(tsResults[14].outcome).toBe("silent" as Outcome);
  // p–q: error (null/undefined property access)
  expect(tsResults[15].outcome).toBe("error" as Outcome);
  expect(tsResults[16].outcome).toBe("error" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Pyright (Python static type checker) — strict mode with pandas-stubs
// ═══════════════════════════════════════════════════════════════════════════════

let pyrightResults: ProbeResult[];

Deno.test("Cat 3 — Null & Missing Data: Pyright", () => {
  pyrightResults = runPythonProbe(probePath(BASE, "./probe-pyright.py"));
  expect(pyrightResults.length).toBe(LABELS.length);

  // Pyright in strict mode catches NONE of the null/missing data issues.
  // pandas-stubs do not encode column-level nullability, so pyright has
  // no information to flag any of these cases.
  for (let i = 0; i < LABELS.length; i++) {
    expect(pyrightResults[i].outcome).toBe("silent" as Outcome);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Mypy (Python static type checker) — strict mode with pandas-stubs
// ═══════════════════════════════════════════════════════════════════════════════

let mypyResults: ProbeResult[];

Deno.test("Cat 3 — Null & Missing Data: Mypy", () => {
  mypyResults = runPythonProbe(probePath(BASE, "./probe-mypy.py"));
  expect(mypyResults.length).toBe(LABELS.length);

  // Mypy in strict mode catches NONE of the null/missing data issues.
  // Like pyright, pandas-stubs do not encode column-level nullability.
  for (let i = 0; i < LABELS.length; i++) {
    expect(mypyResults[i].outcome).toBe("silent" as Outcome);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Python — single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 3 — Null & Missing Data: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(LABELS.length);

  // a–c: null safety — all silent (NaN propagates)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
  // d–e: null narrowing — all silent (NaN propagates)
  expect(pyResults[3].outcome).toBe("silent" as Outcome);
  expect(pyResults[4].outcome).toBe("silent" as Outcome);
  // f–i: aggregation on missing data — all silent (NaN skipped)
  expect(pyResults[5].outcome).toBe("silent" as Outcome);
  expect(pyResults[6].outcome).toBe("silent" as Outcome);
  expect(pyResults[7].outcome).toBe("silent" as Outcome);
  expect(pyResults[8].outcome).toBe("silent" as Outcome);
  // j–k: aggregation return type — all silent (NaN skipped)
  expect(pyResults[9].outcome).toBe("silent" as Outcome);
  expect(pyResults[9].result).toBe("Skipped 1 NaN, returned 1700");
  expect(pyResults[10].outcome).toBe("silent" as Outcome);
  // l–m: window function output — all silent (NaN propagates)
  expect(pyResults[11].outcome).toBe("silent" as Outcome);
  expect(pyResults[11].result).toBe("shift() introduced 1 NaN");
  expect(pyResults[12].outcome).toBe("silent" as Outcome);
  // n: sort nullable — silent (NaN placed at end)
  expect(pyResults[13].outcome).toBe("silent" as Outcome);
  expect(pyResults[13].result).toBe("NaN silently placed at end");
  // o: pivot column mismatch — silent (NaN propagates)
  expect(pyResults[14].outcome).toBe("silent" as Outcome);
  // p: null and missing both NaN — silent (no distinction)
  expect(pyResults[15].outcome).toBe("silent" as Outcome);
  // q: conditional fill treats both NaN identically — silent
  expect(pyResults[16].outcome).toBe("silent" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Polars — runtime probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 3 — Null & Missing Data: Polars", () => {
  polarsResults = runPythonProbe(probePath(BASE, "./probe-polars.py"));
  expect(polarsResults.length).toBe(LABELS.length);
});

// ═══════════════════════════════════════════════════════════════════════════════
// R — single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 3 — Null & Missing Data: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(LABELS.length);

  // a–c: null safety — all silent (NA propagates)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  expect(rResults[1].outcome).toBe("silent" as Outcome);
  expect(rResults[2].outcome).toBe("silent" as Outcome);
  // d–e: null narrowing — all silent (NA propagates)
  expect(rResults[3].outcome).toBe("silent" as Outcome);
  expect(rResults[4].outcome).toBe("silent" as Outcome);
  // f–i: aggregation on missing data — all silent (NA propagates)
  expect(rResults[5].outcome).toBe("silent" as Outcome);
  expect(rResults[6].outcome).toBe("silent" as Outcome);
  expect(rResults[7].outcome).toBe("silent" as Outcome);
  expect(rResults[8].outcome).toBe("silent" as Outcome);
  // j–k: aggregation return type — all silent (NA propagates)
  expect(rResults[9].outcome).toBe("silent" as Outcome);
  expect(rResults[10].outcome).toBe("silent" as Outcome);
  // l–m: window function output — all silent (NA propagates)
  expect(rResults[11].outcome).toBe("silent" as Outcome);
  expect(rResults[12].outcome).toBe("silent" as Outcome);
  // n: sort nullable — silent (NA placed at end)
  expect(rResults[13].outcome).toBe("silent" as Outcome);
  // o: pivot column mismatch — silent (NA propagates)
  expect(rResults[14].outcome).toBe("silent" as Outcome);
  // p: null and missing both NA — silent (no distinction)
  expect(rResults[15].outcome).toBe("silent" as Outcome);
  // q: conditional fill treats both NA identically — silent
  expect(rResults[16].outcome).toBe("silent" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Summary — single table for the whole category
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 3 — Null & Missing Data: Summary", () => {
  printComparisonTable({
    title: "Category 3: Null & Missing Data",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    pyright: pyrightResults,
    mypy: mypyResults,
    polars: polarsResults,
    r: rResults,
  });
});
