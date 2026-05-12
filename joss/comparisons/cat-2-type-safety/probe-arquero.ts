/**
 * Probe: Category 2 — Type Safety Errors in Arquero
 *
 * Consolidates error classes 02, 10, 16, 22, 25, 30, 34.
 * Each case mirrors the pandas probe (probe.py) to enable direct comparison.
 *
 * Usage: deno run -A joss/comparisons/cat-2-type-safety/probe-arquero.ts
 */
import * as aq from "arquero";

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

const labs = aq.table({
  lab_id: ["L3001", "L3002"],
  encounter_id: ["E1001", "E1001"],
  patient_id: ["P001", "P001"],
  test_name: ["BNP", "Sodium"],
  result_value: [1250, 131],
});

// ═══════════════════════════════════════════════════════════════════════════════
// Type mismatch errors
// ═══════════════════════════════════════════════════════════════════════════════

// a: arithmetic on string column
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const out = (labs as any).derive({ adjusted: (d: any) => d.test_name + 10 }).objects();
  return `adjusted=${out[0].adjusted}`;
}));

// b: numeric aggregation on string column
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const avg = (labs as any).groupby("test_name").rollup({ avg: aq.op.mean("test_name") }).objects();
  const hasNaN = avg.some((r: { avg: number }) => isNaN(r.avg) || r.avg === null || r.avg === undefined);
  return `returned NaN: ${hasNaN}`;
}));

// c: comparing number to string literal
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const filtered = (labs as any).filter((d: any) => d.result_value === "high").objects();
  return `returned ${filtered.length} rows, no error`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Type conversion and narrowing
// ═══════════════════════════════════════════════════════════════════════════════

const convLabs = aq.table({
  lab_id: ["L1", "L2", "L3"],
  test_name: ["BNP", "pH", "WBC"],
  result_str: ["1250", "7.28", "pending"],
});

// d: unparseable string — coerce to number
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const withNum = (convLabs as any).derive({ result_num: (d: any) => +d.result_str }).objects();
  const nanCount = withNum.filter((r: { result_num: number }) => isNaN(r.result_num) || r.result_num === null).length;
  return `${nanCount} value coerced to NaN`;
}));

// e: arithmetic on NaN propagates silently
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const withNum = (convLabs as any).derive({ result_num: (d: any) => +d.result_str }).objects();
  // deno-lint-ignore no-explicit-any
  const doubled = aq.from(withNum).derive({ doubled: (d: any) => d.result_num * 2 }).objects();
  const nanCount = doubled.filter((r: { doubled: number }) => isNaN(r.doubled)).length;
  return `NaN propagated, ${nanCount} NaN`;
}));

// f: mean after conversion silently skips NaN
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const withNum = (convLabs as any).derive({ result_num: (d: any) => +d.result_str }).objects();
  const tbl = aq.from(withNum);
  const avg = tbl.rollup({ avg: aq.op.mean("result_num") }).objects()[0].avg;
  return `mean=${avg}, skipped NaN silently`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Mixed return types
// ═══════════════════════════════════════════════════════════════════════════════

const mixedLabs = aq.table({
  patient_id: ["P001", "P002", "P003"],
  test_name: ["BNP", "WBC", "Glucose"],
  result_value: [1250, 15.2, 210],
});

// g: arithmetic on mixed-type column
results.push(capture(() => {
  // Use aq.escape to allow ternary with closure
  const withStatus = mixedLabs.derive({
    status: aq.escape((d: { result_value: number }) =>
      d.result_value > 100 ? "HIGH" : `${d.result_value}`
    ),
  }).objects();
  const tbl = aq.from(withStatus);
  // deno-lint-ignore no-explicit-any
  const doubled = (tbl as any).derive({ doubled: (d: any) => d.status + d.status }).objects();
  const val = doubled[0].doubled;
  const isRepeated = typeof val === "string" && val === "HIGHHIGH";
  return isRepeated ? "string repeated, not math" : `unexpected: ${val}`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Temporal type safety
// ═══════════════════════════════════════════════════════════════════════════════

// h: invalid date string
results.push(capture(() => {
  const dates = ["2024-01-15", "not-a-date", "2024-02-20"].map((s) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  });
  const nullCount = dates.filter((d) => d === null).length;
  return `Invalid date became null (${nullCount})`;
}));

// i: date compared to number
results.push(capture(() => {
  const dfDates = aq.table({
    patient_id: ["P001", "P002"],
    admit_date: [new Date("2024-01-15"), new Date("2024-02-20")],
    los_days: [3, 7],
  });
  // deno-lint-ignore no-explicit-any
  const filtered = (dfDates as any).filter((d: any) => d.admit_date > 100).objects();
  return `${filtered.length} rows (date > 100)`;
}));

// j: date + number arithmetic
results.push(capture(() => {
  const dfDates = aq.table({
    patient_id: ["P001", "P002"],
    admit_date: [new Date("2024-01-15"), new Date("2024-02-20")],
    los_days: [3, 7],
  });
  // deno-lint-ignore no-explicit-any
  const shifted = (dfDates as any).derive({ shifted: (d: any) => d.admit_date + 7 }).objects();
  const val = shifted[0].shifted;
  return `date+7=${val}`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Column type constraint
// ═══════════════════════════════════════════════════════════════════════════════

const patients = aq.table({
  name: ["Alice", "Bob"],
  age: [30, 45],
  weight: [65.5, 80.0],
  insurance: ["Medicare", "Medicaid"],
});

// k: numeric operation applied to string column
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const result = (patients as any).select("age", "insurance").derive({
    age: (d: any) => d.age * 2,
    insurance: (d: any) => d.insurance * 2,
  }).objects();
  return `insurance*2=${result[0].insurance}`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Row label / transpose type safety
// ═══════════════════════════════════════════════════════════════════════════════

const vitals = aq.table({
  metric: ["systolic", "diastolic"],
  P001: [120, 80],
  P002: [145, 92],
});

// l: arithmetic on transposed data — Arquero has no native transpose, so we fold/pivot
results.push(capture(() => {
  // Fold patient columns into key-value, then pivot metrics as columns
  const folded = vitals.fold(["P001", "P002"], { as: ["patient", "value"] });
  const wide = folded.pivot("metric", { value: aq.op.any("value") });
  // deno-lint-ignore no-explicit-any
  const doubled = (wide as any).derive({ systolic: (d: any) => d.systolic * 2 }).objects();
  return `transposed arithmetic succeeded (systolic=${doubled[0].systolic})`;
}));

// m: pre-transpose column name after transpose
results.push(capture(() => {
  const folded = vitals.fold(["P001", "P002"], { as: ["patient", "value"] });
  const wide = folded.pivot("metric", { value: aq.op.any("value") });
  // After fold+pivot, "P001" no longer exists as a column
  // deno-lint-ignore no-explicit-any
  return (wide as any).select("P001").objects();
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Enum validation
// ═══════════════════════════════════════════════════════════════════════════════

const encounters = aq.table({
  patient_id: ["P001", "P002"],
  status: ["admitted", "discharged"],
});

// n: filter on invalid enum value — Arquero has no enum type, just strings
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const filtered = (encounters as any).filter((d: any) => d.status === "unknown").objects();
  return `${filtered.length} rows (silent empty)`;
}));

console.log(JSON.stringify(results));
