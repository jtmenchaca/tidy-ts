/**
 * Probe: Category 1 — Column & Schema Reference Errors in Arquero
 *
 * Consolidates error classes 01, 04, 07, 14, 15, 28, 36.
 * Each case mirrors the pandas probe (probe.py) to enable direct comparison.
 *
 * Usage: deno run -A joss/comparisons/cat-1-column-schema-reference/probe-arquero.ts
 */
import * as aq from "arquero";
import type { ColumnTable } from "arquero";

interface ProbeResult {
  outcome: "error" | "warning" | "silent";
  message: string;
  result: unknown;
}

const results: ProbeResult[] = [];

function capture(fn: () => unknown): ProbeResult {
  try {
    const result = fn();
    return { outcome: "silent", message: "no error", result };
  } catch (e) {
    return { outcome: "error", message: (e as Error).message, result: null };
  }
}

// ── Shared data ──────────────────────────────────────────────────────────────

const patients = aq.table({
  patient_id: ["P001", "P002", "P003"],
  first_name: ["Maria", "James", "Sarah"],
  last_name: ["Gonzalez", "Chen", "Johnson"],
});

const labs = aq.table({
  lab_id: ["L3001", "L3002"],
  encounter_id: ["E1001", "E1001"],
  patient_id: ["P001", "P001"],
  test_name: ["BNP", "Sodium"],
  result_value: [1250, 131],
});

const encounters = aq.table({
  encounter_id: ["E1001", "E1002"],
  patient_id: ["P001", "P002"],
  department: ["Internal Medicine", "Emergency"],
  encounter_type: ["Inpatient", "ED"],
  attending_physician: ["Dr. Patel", "Dr. Lee"],
});

// ═══════════════════════════════════════════════════════════════════════════════
// Column reference errors
// ═══════════════════════════════════════════════════════════════════════════════

// 1a: Misspelled column in derive (mutate equivalent)
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  (patients as any).derive({ full_name: (d: any) => d.patientId + " " + d.last_name }).objects();
}));

// 1b: Nonexistent column in filter
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  (patients as any).filter((d: any) => d.diagnosis === "I50.9").objects();
}));

// 1c: Misspelled column in orderby (sort equivalent)
results.push(capture(() => {
  (patients as ColumnTable).orderby("result_values").objects();
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Schema evolution through pipelines
// ═══════════════════════════════════════════════════════════════════════════════

// 4a: Accessing dropped column after select
results.push(capture(() => {
  const slim = encounters.select("encounter_id", "patient_id", "department");
  // deno-lint-ignore no-explicit-any
  return (slim as any).derive({ doc: (d: any) => d.attending_physician }).objects();
}));

// 4b: Accessing original columns after groupby/rollup (summarize equivalent)
results.push(capture(() => {
  const summary = encounters.groupby("department").rollup({ count: aq.op.count() });
  // deno-lint-ignore no-explicit-any
  return (summary as any).filter((d: any) => d.encounter_type === "Inpatient").objects();
}));

// 4c: Sorting by dropped column
results.push(capture(() => {
  const noDoc = encounters.select(aq.not("attending_physician"));
  return (noDoc as ColumnTable).orderby("attending_physician").objects();
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline composition errors
// ═══════════════════════════════════════════════════════════════════════════════

// 7a: Using old column name after rename
results.push(capture(() => {
  const renamed = encounters.rename({ department: "dept" });
  // deno-lint-ignore no-explicit-any
  return (renamed as any).filter((d: any) => d.department === "ICU").objects();
}));

// 7b: Accessing column removed by groupby/rollup
results.push(capture(() => {
  const pipeline = encounters
    .join(labs, ["encounter_id", "patient_id"])
    .select("patient_id", "department", "test_name", "result_value")
    .groupby("patient_id")
    .rollup({ max_lab: aq.op.max("result_value") });
  // deno-lint-ignore no-explicit-any
  return (pipeline as any).derive({ dept: (d: any) => d.department }).objects();
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Pivot type safety
// ═══════════════════════════════════════════════════════════════════════════════

const vitals = aq.table({
  patient_id: ["P001", "P001", "P002", "P002"],
  metric: ["systolic", "diastolic", "systolic", "diastolic"],
  value: [130, 85, 145, 92],
});

const wide = vitals.pivot("metric", { value: aq.op.any("value") });

// 14a: Accessing non-existent pivot column
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  return (wide as any).derive({ fever: (d: any) => d.temperature > 100 }).objects();
}));

// 14b: Pre-pivot column gone
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  return (wide as any).filter((d: any) => d.metric === "systolic").objects();
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Distinct column narrowing
// ═══════════════════════════════════════════════════════════════════════════════

const encDistinct = aq.table({
  patient_id: ["P001", "P001", "P002", "P002"],
  department: ["Cardiology", "Cardiology", "Emergency", "Primary Care"],
  encounter_type: ["Outpatient", "Inpatient", "ED", "Outpatient"],
  physician: ["Dr. Patel", "Dr. Patel", "Dr. Lee", "Dr. Martinez"],
});

// 15a: dedupe keeps all columns — no schema narrowing
results.push(capture(() => {
  const unique = encDistinct.dedupe("patient_id", "department");
  const hasPhysician = unique.columnNames().includes("physician");
  return `all columns kept silently (physician: ${hasPhysician})`;
}));

// 15b: dedupe keeps all columns — silent
results.push(capture(() => {
  const unique2 = encDistinct.dedupe("patient_id", "department");
  const hasPhysician = unique2.columnNames().includes("physician");
  return `all columns kept silently (physician: ${hasPhysician})`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Reorder vs select schema preservation
// ═══════════════════════════════════════════════════════════════════════════════

const patientsReorder = aq.table({
  patient_id: ["P001"],
  name: ["Alice"],
  age: [30],
  insurance: ["Medicare"],
});

// 28a: select silently drops other columns
results.push(capture(() => {
  const selected = patientsReorder.select("name", "patient_id");
  const colsLost = patientsReorder.columnNames().length - selected.columnNames().length;
  return `Silently dropped ${colsLost} columns`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Column existence error messages
// ═══════════════════════════════════════════════════════════════════════════════

const patientsMsg = aq.table({
  patient_id: ["P001"],
  name: ["Alice"],
  department: ["ED"],
});

// 36a: groupby with wrong column — error message quality
results.push(capture(() => {
  return patientsMsg.groupby("dept").rollup({ n: aq.op.count() }).objects();
}));

// 36b: Column access error message quality
results.push(capture(() => {
  return patientsMsg.select("dept").objects();
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Residual grouping after summarize
// ═══════════════════════════════════════════════════════════════════════════════

const labsGrouped = aq.table({
  patient_id: ["P001", "P001", "P002", "P002"],
  test_name: ["BNP", "WBC", "BNP", "WBC"],
  result_value: [1250, 15.2, 450, 8.1],
});

// p: Multi-level groupby + rollup — does Arquero produce unusual structure?
results.push(capture(() => {
  const multi = labsGrouped
    .groupby("patient_id", "test_name")
    .rollup({ mean_val: aq.op.mean("result_value") });
  const cols = multi.columnNames();
  const nrows = multi.numRows();
  return `groupby+rollup produced ${nrows} rows, columns: [${cols.join(", ")}]`;
}));

console.log(JSON.stringify(results));
