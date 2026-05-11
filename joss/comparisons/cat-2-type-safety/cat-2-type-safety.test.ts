/**
 * Category 2: Type Safety
 *
 * Does the type system prevent applying the wrong operation to a column?
 * Arithmetic on strings, aggregation on non-numeric, mixed return types,
 * temporal misuse, column type constraints, transpose schema, enum values.
 *
 * Consolidates error classes: 02, 10, 16, 22, 25, 30, 34.
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
  { patient_id: "P001", test_name: "BNP", result_value: 7.2 },
  { patient_id: "P002", test_name: "WBC", result_value: 140 },
]);

const raw = createDataFrame([
  { lab_id: "L1", result_str: "1250" },
  { lab_id: "L2", result_str: "pending" },
]);

const mixedLabs = createDataFrame([
  { id: "P1", value: 1250 },
  { id: "P2", value: 15 },
]);

const rawEncounters = createDataFrame([
  { patient_id: "P001", admit_date: "2024-01-15", los_days: 3 },
  { patient_id: "P002", admit_date: "2024-02-20", los_days: 7 },
  { patient_id: "P003", admit_date: "not-a-date", los_days: 5 },
]);

const encounters22 = createDataFrame([
  { patient_id: "P001", admit_date: Temporal.PlainDate.from("2024-01-15"), los_days: 3 },
  { patient_id: "P002", admit_date: Temporal.PlainDate.from("2024-02-20"), los_days: 7 },
]);

const patients = createDataFrame([
  { name: "Alice", age: 30, weight: 65.5, insurance: "Medicare" },
  { name: "Bob", age: 45, weight: 80.0, insurance: "Medicaid" },
]);

const vitals = createDataFrame([
  { metric: "systolic", P001: 120, P002: 145 },
  { metric: "diastolic", P001: 80, P002: 92 },
]);

type Status = "admitted" | "discharged" | "transferred";
const encounters34 = createDataFrame([
  { patient_id: "P001", status: "admitted" as Status },
  { patient_id: "P002", status: "discharged" as Status },
]);

// ═══════════════════════════════════════════════════════════════════════════════
// Labels & compile outcomes
// ═══════════════════════════════════════════════════════════════════════════════

const LABELS = [
  "a: arithmetic on string column",
  "b: numeric aggregation on string column",
  "c: number compared to string literal",
  "d: unparseable string silently becomes null/NaN",
  "e: arithmetic on nullable after conversion",
  "f: aggregation skips null/NaN after conversion",
  "g: arithmetic on mixed-type return column",
  "h: invalid date string parse",
  "i: date compared to number",
  "j: date + number arithmetic",
  "k: numeric function applied to string column",
  "l: arithmetic on transposed mixed-type column",
  "m: pre-transpose column name after transpose",
  "n: filter on invalid enum value",
];

// 22a (h) has no compile-time check — invalid date strings only fail at runtime
const TS_COMPILE: CompileOutcome[] = [
  "error", "error", "error",  // a–c
  "error", "error", "error",  // d–f
  "error",                     // g
  "—", "error", "error",      // h–j (h is compile: N/A)
  "error",                     // k
  "error", "error",            // l–m
  "error",                     // n
];

let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS compile-time
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 2 — Type Safety: Tidy-TS compile-time", () => {
  // a: arithmetic on string column
  // @ts-expect-error: string * number is not valid
  labs.mutate({ adjusted: (r) => r.test_name * 10 });

  // b: numeric aggregation on string column
  // @ts-expect-error: string[] not assignable to number[]
  labs.groupBy("test_name").summarize({ avg: (g) => s.mean(g.test_name) });

  // c: number compared to string literal
  // @ts-expect-error: number vs string comparison always false
  labs.filter((r) => r.result_value === "high");

  // d: unparseable string silently becomes null/NaN
  // @ts-expect-error: string * number is not valid
  raw.mutate({ doubled: (r) => r.result_str * 2 });

  // e: arithmetic on nullable after conversion
  const parsed = raw.mutate({
    result_num: (r) => {
      const n = Number(r.result_str);
      return isNaN(n) ? null : n;
    },
  });
  // @ts-expect-error: number | null can't be multiplied
  parsed.mutate({ doubled: (r) => r.result_num * 2 });

  // f: aggregation skips null/NaN after conversion
  const summary = parsed.groupBy("lab_id").summarize({
    avg: (g) => s.mean(g.result_num),
  });
  // @ts-expect-error: number | null can't be multiplied
  summary.mutate({ doubled: (r) => r.avg * 2 });

  // g: arithmetic on mixed-type return column
  const withStatus = mixedLabs.mutate({
    status: (r) => (r.value > 100 ? "HIGH" as const : r.value),
  });
  // @ts-expect-error: number | "HIGH" can't be multiplied
  withStatus.mutate({ doubled: (r) => r.status * 2 });

  // h: invalid date string parse — compile: N/A (only fails at runtime)
  expect(() => Temporal.PlainDate.from("not-a-date")).toThrow();

  // i: date compared to number
  // j: date + number arithmetic
  try {
    // @ts-expect-error: PlainDate and number have no overlap
    encounters22.filter((r) => r.admit_date > 100);

    // @ts-expect-error: PlainDate + number is not valid arithmetic
    encounters22.mutate({ shifted: (r) => r.admit_date + 7 });
  } catch { /* Temporal valueOf() throws at runtime — expected */ }

  // k: numeric function applied to string column
  // @ts-expect-error: string is not assignable to number parameter
  patients.mutate({ log_ins: (r) => Math.log(r.insurance) });

  // l: arithmetic on transposed mixed-type column
  const transposed = vitals.transpose({ numberOfRows: 2 });
  // @ts-expect-error
  transposed.mutate({ doubled: (r) => r.row_0 * 2 });

  // m: pre-transpose column name after transpose
  // @ts-expect-error
  expect(() => transposed.mutate({ x: (r) => r.P001 })).toThrow();

  // n: filter on invalid enum value
  // @ts-expect-error: Status and "unknown" have no overlap
  encounters34.filter((r) => r.status === "unknown");
});

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS runtime
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 2 — Type Safety: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const l = labs as any;
  // deno-lint-ignore no-explicit-any
  const r = raw as any;
  // deno-lint-ignore no-explicit-any
  const ml = mixedLabs as any;
  // deno-lint-ignore no-explicit-any
  const re = rawEncounters as any;
  // deno-lint-ignore no-explicit-any
  const enc = encounters22 as any;
  // deno-lint-ignore no-explicit-any
  const p = patients as any;
  // deno-lint-ignore no-explicit-any
  const v = vitals as any;
  // deno-lint-ignore no-explicit-any
  const e34 = encounters34 as any;

  tsResults = [
    // a: arithmetic on string column — silent (JS coercion produces NaN)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { l.mutate({ adjusted: (row: any) => row.test_name * 10 }); return "produced NaN silently"; }),
    // b: numeric aggregation on string column — warning, returns null
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { l.groupBy("test_name").summarize({ avg: (g: any) => s.mean(g.test_name) }); return "returned null with warning"; }),
    // c: number compared to string literal — silent (0 rows)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { l.filter((row: any) => row.result_value === "high"); return "returned 0 rows, no error"; }),
    // d: unparseable string silently becomes null/NaN
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = r.mutate({ doubled: (row: any) => row.result_str * 2 });
      const rows = df.toArray();
      // deno-lint-ignore no-explicit-any
      const nanCount = rows.filter((row: any) => Number.isNaN(row.doubled)).length;
      return `${nanCount} value coerced to NaN`;
    }),
    // e: arithmetic on nullable after conversion — silent (null * 2 = 0 in JS)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const parsed = r.mutate({ result_num: (row: any) => { const n = Number(row.result_str); return isNaN(n) ? null : n; } });
      // deno-lint-ignore no-explicit-any
      const df = parsed.mutate({ doubled: (row: any) => row.result_num * 2 });
      const rows = df.toArray();
      // deno-lint-ignore no-explicit-any
      const zeroFromNull = rows.filter((row: any) => row.result_num === null).length;
      return `null*2=0, ${zeroFromNull} null coerced`;
    }),
    // f: aggregation skips null/NaN after conversion — silent
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const parsed = r.mutate({ result_num: (row: any) => { const n = Number(row.result_str); return isNaN(n) ? null : n; } });
      const rows = parsed.toArray();
      // deno-lint-ignore no-explicit-any
      const nullCount = rows.filter((row: any) => row.result_num === null).length;
      return `${nullCount} unparseable became null`;
    }),
    // g: arithmetic on mixed-type return column — silent (string * 2 = NaN)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = ml.mutate({ status: (row: any) => (row.value > 100 ? "HIGH" : row.value) })
        // deno-lint-ignore no-explicit-any
        .mutate({ doubled: (row: any) => row.status * 2 });
      // deno-lint-ignore no-explicit-any
      const rows = df.toArray() as any[];
      const hasNaN = rows.some((row) => Number.isNaN(row.doubled));
      return hasNaN ? "NaN from string * 2" : "all numeric";
    }),
    // h: invalid date string parse — runtime error
    captureOutcome(() =>
      re.mutate({
        // deno-lint-ignore no-explicit-any
        parsed: (row: any) => Temporal.PlainDate.from(row.admit_date),
      })
    ),
    // i: date compared to number — silent (> doesn't trigger valueOf)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const result = enc.filter((row: any) => row.admit_date > 100);
      return `${result.nrows()} rows (date > 100)`;
    }),
    // j: date + number — Temporal valueOf() throws
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const result = enc.mutate({ shifted: (row: any) => row.admit_date + 7 });
      const val = result.toArray()[0].shifted;
      return `date+7=${typeof val === "string" ? "string concat" : val}`;
    }),
    // k: numeric function applied to string column — silent (JS coerces to NaN)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      p.mutate({ log_ins: (row: any) => Math.log(row.insurance) });
      return "Math.log returned NaN column";
    }),
    // l: arithmetic on transposed mixed-type column — silent (JS coercion)
    captureOutcome(() => {
      const t = v.transpose({ numberOfRows: 2 });
      // deno-lint-ignore no-explicit-any
      t.mutate({ doubled: (row: any) => row.row_0 * 2 });
      return `"systolic"*2=NaN`;
    }),
    // m: pre-transpose column name after transpose — proxy throws
    captureOutcome(() => {
      const t = v.transpose({ numberOfRows: 2 });
      // deno-lint-ignore no-explicit-any
      t.mutate({ x: (row: any) => row.P001 });
      return "accessed P001";
    }),
    // n: filter on invalid enum value — silent (returns 0 rows)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const filtered = e34.filter((row: any) => row.status === "unknown");
      return `${filtered.nrows()} rows (silent empty)`;
    }),
  ];

  // a: silent (JS coercion)
  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  // b: warning (s.mean on strings)
  expect(tsResults[1].outcome).toBe("warning" as Outcome);
  // c: silent (0 rows)
  expect(tsResults[2].outcome).toBe("silent" as Outcome);
  // d–f: silent (JS coercion / null propagation)
  expect(tsResults[3].outcome).toBe("silent" as Outcome);
  expect(tsResults[4].outcome).toBe("silent" as Outcome);
  expect(tsResults[5].outcome).toBe("silent" as Outcome);
  // g: silent (NaN from string * 2)
  expect(tsResults[6].outcome).toBe("silent" as Outcome);
  // h: error (Temporal rejects invalid date)
  expect(tsResults[7].outcome).toBe("error" as Outcome);
  // i: silent (> doesn't trigger valueOf)
  expect(tsResults[8].outcome).toBe("silent" as Outcome);
  // j: error (Temporal valueOf throws)
  expect(tsResults[9].outcome).toBe("error" as Outcome);
  // k: silent (JS coerces to NaN)
  expect(tsResults[10].outcome).toBe("silent" as Outcome);
  // l: silent (JS coercion)
  expect(tsResults[11].outcome).toBe("silent" as Outcome);
  // m: error (proxy throws)
  expect(tsResults[12].outcome).toBe("error" as Outcome);
  // n: silent (0 rows)
  expect(tsResults[13].outcome).toBe("silent" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Python — single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 2 — Type Safety: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(LABELS.length);

  // a–b: type mismatch — error
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  expect(pyResults[1].outcome).toBe("error" as Outcome);
  // c: number vs string comparison — silent
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
  // d–f: conversion narrowing — all silent
  expect(pyResults[3].outcome).toBe("silent" as Outcome);
  expect(pyResults[4].outcome).toBe("silent" as Outcome);
  expect(pyResults[5].outcome).toBe("silent" as Outcome);
  // g: mixed return types — silent
  expect(pyResults[6].outcome).toBe("silent" as Outcome);
  // h: invalid date — silent (NaT)
  expect(pyResults[7].outcome).toBe("silent" as Outcome);
  // i–j: temporal operations — error (pandas 3.x strict)
  expect(pyResults[8].outcome).toBe("error" as Outcome);
  expect(pyResults[9].outcome).toBe("error" as Outcome);
  // k: numeric op on string — silent (string repetition)
  expect(pyResults[10].outcome).toBe("silent" as Outcome);
  // l: transposed mixed-type — silent (string repetition)
  expect(pyResults[11].outcome).toBe("silent" as Outcome);
  // m: pre-transpose column — error
  expect(pyResults[12].outcome).toBe("error" as Outcome);
  // n: invalid enum value — silent
  expect(pyResults[13].outcome).toBe("silent" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// R — single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 2 — Type Safety: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(LABELS.length);

  // a: arithmetic on string — error
  expect(rResults[0].outcome).toBe("error" as Outcome);
  // b: numeric aggregation on string — warning
  expect(rResults[1].outcome).toBe("warning" as Outcome);
  // c: number vs string comparison — silent
  expect(rResults[2].outcome).toBe("silent" as Outcome);
  // d: as.numeric on non-numeric — warning
  expect(rResults[3].outcome).toBe("warning" as Outcome);
  // e–f: NA propagation — silent
  expect(rResults[4].outcome).toBe("silent" as Outcome);
  expect(rResults[5].outcome).toBe("silent" as Outcome);
  // g: mixed return types — warning (NAs from coercion)
  expect(rResults[6].outcome).toBe("warning" as Outcome);
  // h: invalid date — silent (NA)
  expect(rResults[7].outcome).toBe("silent" as Outcome);
  // i–j: date operations — silent (Date is days-since-epoch)
  expect(rResults[8].outcome).toBe("silent" as Outcome);
  expect(rResults[9].outcome).toBe("silent" as Outcome);
  // k: across with wrong type — error
  expect(rResults[10].outcome).toBe("error" as Outcome);
  // l: t() coerces to character — error
  expect(rResults[11].outcome).toBe("error" as Outcome);
  // m: pre-transpose column — error
  expect(rResults[12].outcome).toBe("error" as Outcome);
  // n: invalid enum value — silent
  expect(rResults[13].outcome).toBe("silent" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Summary — single table for the whole category
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 2 — Type Safety: Summary", () => {
  printComparisonTable({
    title: "Category 2: Type Safety",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
