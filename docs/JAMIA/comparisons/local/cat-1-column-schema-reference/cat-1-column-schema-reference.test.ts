/**
 * Category 1: Column & Schema Reference
 *
 * Does the column exist? Is it spelled correctly? Is it still available
 * after a transform?
 *
 * Consolidates error classes: 01, 04, 07, 14, 15, 19, 28, 36.
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
} from "../../test-helpers.ts";

const BASE = import.meta.url;

// ═══════════════════════════════════════════════════════════════════════════════
// Shared data
// ═══════════════════════════════════════════════════════════════════════════════

const patients = createDataFrame([
  { patient_id: "P001", first_name: "Alice", last_name: "Smith" },
]);
const labs = createDataFrame([
  { lab_id: "L001", patient_id: "P001", result_value: 7.2 },
]);
const encounters = createDataFrame([
  { encounter_id: "E001", patient_id: "P001", department: "ED", attending_physician: "Dr. Smith", encounter_type: "Inpatient" },
]);
const vitals = createDataFrame([
  { patient_id: "P001", metric: "systolic", value: 130 },
  { patient_id: "P001", metric: "diastolic", value: 85 },
  { patient_id: "P002", metric: "systolic", value: 145 },
  { patient_id: "P002", metric: "diastolic", value: 92 },
]);
const wide = vitals.pivotWider({
  namesFrom: "metric",
  valuesFrom: "value",
  expectedColumns: ["systolic", "diastolic"] as const,
});
const encountersDistinct = createDataFrame([
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Patel" },
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Lee" },
  { patient_id: "P2", dept: "ED", physician: "Dr. Martinez" },
]);
const patientsReorder = createDataFrame([
  { patient_id: "P001", name: "Alice", age: 30, insurance: "Medicare" },
]);
const patientsMsg = createDataFrame([
  { patient_id: "P001", first_name: "Alice", last_name: "Smith" },
]);
const labsGrouped = createDataFrame([
  { patient_id: "P001", test_name: "BNP", result_value: 1250 },
  { patient_id: "P001", test_name: "WBC", result_value: 15 },
  { patient_id: "P002", test_name: "BNP", result_value: 450 },
  { patient_id: "P002", test_name: "WBC", result_value: 8 },
]);

// ═══════════════════════════════════════════════════════════════════════════════
// Labels & compile outcomes — single flat array across all error classes
// ═══════════════════════════════════════════════════════════════════════════════

const LABELS = [
  "a: misspelled column name in expression",
  "b: nonexistent column in predicate",
  "c: misspelled column name in sort",
  "d: column dropped by selection still referenced",
  "e: original column referenced after aggregation",
  "f: dropped column used in sort",
  "g: old column name used after rename",
  "h: pre-aggregation column referenced after summarize",
  "i: undeclared column after pivot",
  "j: consumed column referenced after pivot",
  "k: unselected column referenced after distinct",
  "l: narrowed schema after distinct without keep-all",
  "m: unselected column referenced after select",
  "n: error message lists available columns",
  "o: error message on invalid column access",
  "p: access non-summarized column after summarize",
];

// Plain-English task each scenario exercises. Each library's probe is the most
// natural translation of the intent into that library's idioms. See CONTEXT.md
// (equivalence rule) for usage.
const INTENTS = [
  "Filter encounters to those at a specific facility.",
  "Select encounters where admission status equals a specific value.",
  "Sort encounters by admission date.",
  "Select a subset of columns from a wide patient table, then compute a derived value using one of the columns.",
  "Group encounters by patient, summarize counts, then re-reference an original encounter column.",
  "Sort a wide patient table by a column after a prior step has dropped that column.",
  "Rename a column, then use the new name in a downstream operation; the prior code still references the old name.",
  "Group labs by patient and summarize mean value, then access an original lab column on the summarized result.",
  "Pivot a long lab table wide, then access an output column whose name depends on data values.",
  "Pivot a long lab table wide, then access the column whose values were used as the new column names.",
  "Deduplicate encounters by patient and access columns not specified in the deduplication keys.",
  "Reduce a wide table to distinct rows on a subset of columns, then access the unselected columns.",
  "Project a wide patient table to a smaller set of columns, then reference an unselected column downstream.",
  "Access a misspelled column and read the error message.",
  "Use an invalid column name in a select and read the error message.",
  "Group labs by patient and summarize mean value, then access an original lab column on the summarized result (symmetric to 1h via a different access path).",
];
// Keep LABELS and INTENTS in lockstep — same length, same order.

// All cat-1 cases have @ts-expect-error — every case is caught at compile time
const TS_COMPILE: CompileOutcome[] = LABELS.map(() => "error");

let tsResults: ProbeResult[];
let pyrightResults: ProbeResult[];
let mypyResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];
let polarsResults: ProbeResult[];

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS compile-time
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 1 — Column & Schema Reference: Tidy-TS compile-time", () => {
  // a: misspelled column name in expression
  // @ts-expect-error: 'patientId' is not a column on this DataFrame
  expect(() => patients.mutate({ full_name: (r) => r.patientId + " " + r.last_name }))
    .toThrow();

  // b: nonexistent column in predicate
  // @ts-expect-error: 'diagnosis' is not a column on this DataFrame
  expect(() => patients.filter((r) => r.diagnosis === "I50.9"))
    .toThrow();

  // c: misspelled column name in sort
  // @ts-expect-error: 'result_values' is not a column on this DataFrame
  expect(() => labs.arrange("result_values", "desc"))
    .toThrow();

  // d: column dropped by selection still referenced
  const slim = encounters.select("encounter_id", "patient_id", "department");
  // @ts-expect-error: attending_physician was not selected
  expect(() => slim.mutate({ doc: (r) => r.attending_physician })).toThrow();

  // e: original column referenced after aggregation
  const summaryE = encounters.groupBy("department").summarize({
    count: (g) => g.nrows(),
  });
  // @ts-expect-error: encounter_type gone after summarize
  expect(() => summaryE.filter((r) => r.encounter_type === "Inpatient")).toThrow();

  // f: dropped column used in sort
  const noDoc = encounters.drop("attending_physician");
  // @ts-expect-error: attending_physician was dropped
  expect(() => noDoc.arrange("attending_physician", "asc")).toThrow();

  // g: old column name used after rename
  const renamed = encounters.rename({ department: "dept" });
  // @ts-expect-error: department was renamed to dept
  expect(() => renamed.filter((r) => r.department === "ICU")).toThrow();

  // h: pre-aggregation column referenced after summarize
  const summaryH = encounters.groupBy("department").summarize({
    count: (g) => g.nrows(),
  });
  // @ts-expect-error: encounter_id gone after summarize
  expect(() => summaryH.mutate({ eid: (r) => r.encounter_id })).toThrow();

  // i: undeclared column after pivot
  // @ts-expect-error: temperature not in expectedColumns
  expect(() => wide.mutate({ fever: (r) => r.temperature > 100 })).toThrow();

  // j: consumed column referenced after pivot
  // @ts-expect-error: metric no longer exists after pivot
  expect(() => wide.filter((r) => r.metric === "systolic")).toThrow();

  // k: unselected column referenced after distinct
  const unique = encountersDistinct.distinct("patient_id", "dept");
  // @ts-expect-error: physician not in distinct result
  expect(() => unique.mutate({ doc: (r) => r.physician })).toThrow();

  // l: narrowed schema after distinct without keep-all
  const byPatient = encountersDistinct.distinct("patient_id");
  // @ts-expect-error: physician not in distinct result
  expect(() => byPatient.mutate({ doc: (r) => r.physician })).toThrow();

  // m: unselected column referenced after select
  const selected = patientsReorder.select("name", "patient_id");
  // @ts-expect-error: age was not selected
  expect(() => selected.mutate({ a: (r) => r.age })).toThrow();

  // n: error message lists available columns
  // @ts-expect-error: patientId is not a column
  expect(() => patientsMsg.mutate({ x: (r) => r.patientId })).toThrow();

  // o: error message on invalid column access
  // @ts-expect-error: patientId is not a valid column name
  expect(() => patientsMsg.select("patientId")).toThrow();

  // p: accessing non-summarized column after summarize
  const grouped = labsGrouped.groupBy("patient_id");
  const summaryP = grouped.summarize({
    mean_val: (g) => s.mean(g.result_value),
  });
  // @ts-expect-error: test_name not in summarize result
  expect(() => summaryP.mutate({ t: (r) => r.test_name })).toThrow();
});

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS runtime
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 1 — Column & Schema Reference: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const p = patients as any;
  // deno-lint-ignore no-explicit-any
  const l = labs as any;
  // deno-lint-ignore no-explicit-any
  const e = encounters as any;
  // deno-lint-ignore no-explicit-any
  const w = wide as any;
  // deno-lint-ignore no-explicit-any
  const ed = encountersDistinct as any;
  // deno-lint-ignore no-explicit-any
  const pr = patientsReorder as any;
  // deno-lint-ignore no-explicit-any
  const pm = patientsMsg as any;
  // deno-lint-ignore no-explicit-any
  const lg = labsGrouped as any;

  tsResults = [
    // a: misspelled column name in expression
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => p.mutate({ full_name: (r: any) => r.patientId + " " + r.last_name })),
    // b: nonexistent column in predicate
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => p.filter((r: any) => r.diagnosis === "I50.9")),
    // c: misspelled column name in sort
    captureOutcome(() => l.arrange("result_values", "desc")),
    // d: column dropped by selection still referenced
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => e.select("encounter_id", "patient_id", "department").mutate({ doc: (r: any) => r.attending_physician })),
    // e: original column referenced after aggregation
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => e.groupBy("department").summarize({ count: (g: any) => g.nrows() }).filter((r: any) => r.encounter_type === "Inpatient")),
    // f: dropped column used in sort
    captureOutcome(() => e.drop("attending_physician").arrange("attending_physician", "asc")),
    // g: old column name used after rename
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => e.rename({ department: "dept" }).filter((r: any) => r.department === "ICU")),
    // h: pre-aggregation column referenced after summarize
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => e.groupBy("department").summarize({ count: (g: any) => g.nrows() }).mutate({ eid: (r: any) => r.encounter_id })),
    // i: undeclared column after pivot
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => w.mutate({ fever: (r: any) => r.temperature > 100 })),
    // j: consumed column referenced after pivot
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => w.filter((r: any) => r.metric === "systolic")),
    // k: unselected column referenced after distinct
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => ed.distinct("patient_id", "dept").mutate({ doc: (r: any) => r.physician })),
    // l: narrowed schema after distinct without keep-all
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => ed.distinct("patient_id").mutate({ doc: (r: any) => r.physician })),
    // m: unselected column referenced after select
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => pr.select("name", "patient_id").mutate({ a: (r: any) => r.age })),
    // n: error message lists available columns
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => pm.mutate({ x: (r: any) => r.patientId })),
    // o: error message on invalid column access
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => pm.select("patientId" as any)),
    // p: accessing non-summarized column after summarize — error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => lg.groupBy("patient_id").summarize({ mean_val: (g: any) => s.mean(g.result_value) }).mutate({ t: (r: any) => r.test_name })),
  ];

  for (let i = 0; i < tsResults.length; i++) {
    expect(tsResults[i].outcome).toBe("error" as Outcome);
  }
  // n: verify the error message includes available column names
  expect(tsResults[13].message).toMatch(/Available columns/i);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Pyright (Python static type checker) — strict mode with pandas-stubs
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 1 — Column & Schema Reference: Pyright", () => {
  pyrightResults = runPythonProbe(probePath(BASE, "./probe-pyright.py"));
  expect(pyrightResults.length).toBe(LABELS.length);

  // Pyright in strict mode catches NONE of the column/schema reference issues.
  // pandas-stubs use generic `str` keys for column access, so pyright has
  // no information to flag misspelled or missing column names.
  for (let i = 0; i < LABELS.length; i++) {
    expect(pyrightResults[i].outcome).toBe("silent" as Outcome);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Mypy (Python static type checker) — strict mode with pandas-stubs
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 1 — Column & Schema Reference: Mypy", () => {
  mypyResults = runPythonProbe(probePath(BASE, "./probe-mypy.py"));
  expect(mypyResults.length).toBe(LABELS.length);

  // Mypy in strict mode catches NONE of the column/schema reference issues.
  // Like pyright, pandas-stubs do not encode column names at the type level.
  for (let i = 0; i < LABELS.length; i++) {
    expect(mypyResults[i].outcome).toBe("silent" as Outcome);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Python — single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 1 — Column & Schema Reference: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(LABELS.length);

  // a–c: misspelled / nonexistent columns — all error
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  expect(pyResults[1].outcome).toBe("error" as Outcome);
  expect(pyResults[2].outcome).toBe("error" as Outcome);
  // d–f: schema evolution after select/aggregate/drop — all error
  expect(pyResults[3].outcome).toBe("error" as Outcome);
  expect(pyResults[4].outcome).toBe("error" as Outcome);
  expect(pyResults[5].outcome).toBe("error" as Outcome);
  // g–h: stale names after rename/summarize — all error
  expect(pyResults[6].outcome).toBe("error" as Outcome);
  expect(pyResults[7].outcome).toBe("error" as Outcome);
  // i–j: pivot schema — all error
  expect(pyResults[8].outcome).toBe("error" as Outcome);
  expect(pyResults[9].outcome).toBe("error" as Outcome);
  // k–l: distinct narrowing — silent (Python keeps all columns)
  expect(pyResults[10].outcome).toBe("silent" as Outcome);
  expect(pyResults[11].outcome).toBe("silent" as Outcome);
  // m: select narrowing — silent
  expect(pyResults[12].outcome).toBe("silent" as Outcome);
  // n–o: error messages — all error
  expect(pyResults[13].outcome).toBe("error" as Outcome);
  expect(pyResults[14].outcome).toBe("error" as Outcome);
  // p: residual grouping — silent (MultiIndex produced)
  expect(pyResults[15].outcome).toBe("silent" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Polars — runtime probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 1 — Column & Schema Reference: Polars", () => {
  polarsResults = runPythonProbe(probePath(BASE, "./probe-polars.py"));
  expect(polarsResults.length).toBe(LABELS.length);
});

// ═══════════════════════════════════════════════════════════════════════════════
// R — single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 1 — Column & Schema Reference: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(LABELS.length);

  // a–c: misspelled / nonexistent columns — all error
  expect(rResults[0].outcome).toBe("error" as Outcome);
  expect(rResults[1].outcome).toBe("error" as Outcome);
  expect(rResults[2].outcome).toBe("error" as Outcome);
  // d–f: schema evolution after select/aggregate/drop — all error
  expect(rResults[3].outcome).toBe("error" as Outcome);
  expect(rResults[4].outcome).toBe("error" as Outcome);
  expect(rResults[5].outcome).toBe("error" as Outcome);
  // g–h: stale names after rename/summarize — all error
  expect(rResults[6].outcome).toBe("error" as Outcome);
  expect(rResults[7].outcome).toBe("error" as Outcome);
  // i–j: pivot schema — all error
  expect(rResults[8].outcome).toBe("error" as Outcome);
  expect(rResults[9].outcome).toBe("error" as Outcome);
  // k–l: distinct narrowing — silent (R keeps all columns)
  expect(rResults[10].outcome).toBe("silent" as Outcome);
  expect(rResults[11].outcome).toBe("silent" as Outcome);
  // m: select narrowing — silent
  expect(rResults[12].outcome).toBe("silent" as Outcome);
  // n–o: error messages — all error
  expect(rResults[13].outcome).toBe("error" as Outcome);
  expect(rResults[14].outcome).toBe("error" as Outcome);
  // p: residual grouping — silent (per-group, not overall)
  expect(rResults[15].outcome).toBe("silent" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Summary — single table for the whole category
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 1 — Column & Schema Reference: Summary", () => {
  printComparisonTable({
    title: "Category 1: Column & Schema Reference",
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
