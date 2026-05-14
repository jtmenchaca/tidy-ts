/**
 * Probe: Category 3 — Null & Missing Data Errors in Arquero
 *
 * Consolidates error classes 05, 11, 12, 21, 24, 26, 35.
 * Each case mirrors the pandas probe (probe.py) to enable direct comparison.
 *
 * Usage: deno run -A joss/comparisons/cat-3-null-missing-data/probe-arquero.ts
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

// encounters: discharge_date is null for ED visits (indices 1, 7)
const encounters = aq.table({
  encounter_id: ["E1001", "E1002", "E1003", "E1004", "E1005", "E1006", "E1007", "E1008", "E1009", "E1010"],
  patient_id: ["P001", "P002", "P003", "P001", "P004", "P005", "P006", "P007", "P008", "P002"],
  admit_date: ["2024-01-15", "2024-02-03", "2024-02-10", "2024-03-01", "2024-03-12", "2024-04-01", "2024-04-15", "2024-05-02", "2024-05-20", "2024-06-01"],
  discharge_date: ["2024-01-18", null, "2024-02-10", "2024-03-01", "2024-03-20", "2024-04-01", "2024-04-17", null, "2024-05-28", "2024-06-01"],
  department: ["Internal Medicine", "Emergency", "Primary Care", "Cardiology", "ICU", "OB/GYN", "Surgery", "Emergency", "Oncology", "Primary Care"],
  encounter_type: ["Inpatient", "ED", "Outpatient", "Outpatient", "Inpatient", "Outpatient", "Inpatient", "ED", "Inpatient", "Outpatient"],
});

// lab_results: reference_high is null for L3015 (Blood Culture) and L3016 (Troponin)
const labs = aq.table({
  lab_id: ["L3001", "L3002", "L3003", "L3004", "L3005", "L3006", "L3007", "L3008", "L3009", "L3010", "L3011", "L3012", "L3013", "L3014", "L3015", "L3016"],
  encounter_id: ["E1001", "E1001", "E1001", "E1002", "E1002", "E1003", "E1003", "E1005", "E1005", "E1005", "E1007", "E1009", "E1009", "E1001", "E1002", "E1005"],
  patient_id: ["P001", "P001", "P001", "P002", "P002", "P003", "P003", "P004", "P004", "P004", "P006", "P008", "P008", "P001", "P002", "P004"],
  test_name: ["BNP", "Sodium", "Creatinine", "WBC", "Procalcitonin", "HbA1c", "Glucose", "Lactate", "pH", "Creatinine", "Lipase", "Platelets", "Hemoglobin", "BNP", "Blood Culture", "Troponin"],
  result_value: [1250, 131, 1.8, 15.2, 2.1, 8.9, 210, 4.5, 7.28, 3.2, 450, 45, 7.2, 580, 0, 0.04],
  reference_high: [100, 145, 1.2, 11.0, 0.1, 5.6, 100, 2.0, 7.45, 1.2, 60, 400, 17.5, 100, null, null],
});

// ═══════════════════════════════════════════════════════════════════════════════
// Null safety
// ═══════════════════════════════════════════════════════════════════════════════

// a: String method on column with null (discharge_date has null for ED visits)
results.push(capture(() => {
  const withLabel = encounters.derive({
    los_label: aq.escape((d: { discharge_date: string | null }) =>
      d.discharge_date ? d.discharge_date.slice(0, 10) : d.discharge_date
    ),
  });
  const col = withLabel.array("los_label") as (string | null | undefined)[];
  const hasNull = col.some((v) => v == null);
  return `null propagated silently: ${hasNull}`;
}));

// b: Arithmetic on column with null (reference_high has null)
//    Arquero's compiled expressions coerce null to 0, so deviation is numeric (not NaN)
results.push(capture(() => {
  const withDev = labs.derive({
    deviation: (d: { result_value: number; reference_high: number | null }) =>
      d.result_value - d.reference_high,
  });
  const col = withDev.array("deviation") as (number | null | undefined)[];
  const hasNullOrNaN = col.some((v) => v == null || Number.isNaN(v));
  // null coerced to 0 silently — no NaN, no error
  return `null coerced to 0 silently (NaN present: ${hasNullOrNaN})`;
}));

// c: Comparison/filter silently drops null rows
results.push(capture(() => {
  const totalRows = labs.numRows();
  const critical = labs.filter(
    (d: { reference_high: number | null }) => d.reference_high > 100,
  );
  const filteredRows = critical.numRows();
  // Count null reference_high rows
  const refHigh = labs.array("reference_high") as (number | null | undefined)[];
  const nullCount = refHigh.filter((v) => v == null).length;
  return `total=${totalRows}, filtered=${filteredRows}, null rows silently excluded=${nullCount}`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Null narrowing
// ═══════════════════════════════════════════════════════════════════════════════

// d: Division with null — null propagates silently
results.push(capture(() => {
  const withPct = labs.derive({
    pct: (d: { result_value: number; reference_high: number | null }) =>
      d.result_value / d.reference_high,
  });
  const col = withPct.array("pct") as (number | null | undefined)[];
  const nanCount = col.filter((v) => v == null || (typeof v === "number" && !isFinite(v))).length;
  return `${nanCount} NaN/null from null div`;
}));

// e: Re-introduce null after fill, then divide — null propagates again
results.push(capture(() => {
  // Fill nulls in reference_high with 999
  const filled = labs.derive({
    reference_high: aq.escape((d: { reference_high: number | null }) =>
      d.reference_high == null ? 999 : d.reference_high
    ),
  });
  // Re-introduce null where result_value > 150
  const reNulled = filled.derive({
    reference_high: aq.escape((d: { result_value: number; reference_high: number }) =>
      d.result_value > 150 ? null : d.reference_high
    ),
  });
  // Divide
  const withPct = reNulled.derive({
    pct: (d: { result_value: number; reference_high: number | null }) =>
      d.result_value / d.reference_high,
  });
  const col = withPct.array("pct") as (number | null | undefined)[];
  const nanCount = col.filter((v) => v == null || (typeof v === "number" && !isFinite(v))).length;
  return `${nanCount} NaN/null after re-null div`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Aggregation on missing data
// ═══════════════════════════════════════════════════════════════════════════════

// f: mean() silently skips null
results.push(capture(() => {
  const agg = labs.rollup({ avg: aq.op.mean("reference_high") });
  const avg = agg.get("avg", 0) as number;
  const doubled = avg * 2;
  return `mean=${avg}, doubled=${doubled} (null skipped silently)`;
}));

// g: sum() silently skips null
results.push(capture(() => {
  const agg = labs.rollup({ total: aq.op.sum("reference_high") });
  const total = agg.get("total", 0) as number;
  const doubled = total * 2;
  return `sum=${total}, doubled=${doubled} (null skipped silently)`;
}));

// h: min() silently skips null
results.push(capture(() => {
  const agg = labs.rollup({ mn: aq.op.min("reference_high") });
  const mn = agg.get("mn", 0) as number;
  const doubled = mn * 2;
  return `min=${mn}, doubled=${doubled} (null skipped silently)`;
}));

// i: groupby mean then arithmetic — null groups produce NaN
results.push(capture(() => {
  const grouped = labs.groupby("test_name").rollup({
    avg_ref: aq.op.mean("reference_high"),
  });
  const withInc = grouped.derive({
    inc: (d: { avg_ref: number | null }) => d.avg_ref + 1,
  });
  const col = withInc.array("inc") as (number | null | undefined)[];
  const nanCount = col.filter((v) => v == null || (typeof v === "number" && isNaN(v))).length;
  return `${nanCount} groups: null+1 still null/NaN`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Aggregation return type narrowing
// ═══════════════════════════════════════════════════════════════════════════════

const values21 = aq.table({ val: [1250, null, 450] });

// j: sum() silently skips null — returns 1700, not null
results.push(capture(() => {
  const agg = values21.rollup({ total: aq.op.sum("val") });
  const total = agg.get("total", 0) as number;
  const nullCount = (values21.array("val") as (number | null)[]).filter((v) => v == null).length;
  return `sum() silently skipped ${nullCount} null, returned ${total}`;
}));

// k: Arithmetic on null-skipped sum succeeds silently
results.push(capture(() => {
  const agg = values21.rollup({ total: aq.op.sum("val") });
  const total = agg.get("total", 0) as number;
  const perPatient = total / 2;
  return `arithmetic on null-skipped sum succeeded: ${perPatient}`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Window function output type
// ═══════════════════════════════════════════════════════════════════════════════

const values24 = aq.table({ val: [100, 200, 300, 400] });

// l: lag() silently introduces null/undefined
results.push(capture(() => {
  const withLag = values24.derive({ lagged: aq.op.lag("val", 1) });
  const col = withLag.array("lagged") as (number | null | undefined)[];
  const nullCount = col.filter((v) => v == null).length;
  return `lag() silently introduced ${nullCount} null`;
}));

// m: Arithmetic on null from lag propagates silently
results.push(capture(() => {
  const withLag = values24.derive({ lagged: aq.op.lag("val", 1) });
  const withDiff = withLag.derive({
    diff: (d: { lagged: number | null; val: number }) => d.lagged - d.val,
  });
  const col = withDiff.array("diff") as (number | null | undefined)[];
  const nanCount = col.filter((v) => v == null || (typeof v === "number" && isNaN(v))).length;
  return `arithmetic on lagged null produced ${nanCount} NaN/null`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Sorting on nullable columns
// ═══════════════════════════════════════════════════════════════════════════════

const labs26 = aq.table({
  patient_id: ["P001", "P002", "P003"],
  result_value: [100, null, 50],
});

// n: sort silently places null at end (or beginning)
results.push(capture(() => {
  const sorted = labs26.orderby("result_value");
  const col = sorted.array("result_value") as (number | null | undefined)[];
  const lastVal = col[col.length - 1];
  const nullAtEnd = lastVal == null || (typeof lastVal === "number" && isNaN(lastVal));
  const firstVal = col[0];
  const nullAtStart = firstVal == null || (typeof firstVal === "number" && isNaN(firstVal));
  return `sort silently placed null at ${nullAtEnd ? "end" : nullAtStart ? "start" : "middle"}`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Pivot column mismatch
// ═══════════════════════════════════════════════════════════════════════════════

const vitals = aq.table({
  patient_id: ["P001", "P001", "P002"],
  metric: ["systolic", "diastolic", "systolic"],
  value: [130, 85, 145],
});

// o: arithmetic on pivot null — systolic - diastolic with null from missing combo
results.push(capture(() => {
  const wide = vitals.pivot("metric", { value: aq.op.any("value") });
  const withPP = wide.derive({
    pp: (d: { systolic: number; diastolic: number | null }) => d.systolic - d.diastolic,
  });
  const rows = withPP.objects() as { patient_id: string; pp: number | null }[];
  const p002 = rows.find((r) => r.patient_id === "P002");
  const ppVal = p002?.pp;
  return `null propagates: 145-null=${ppVal}`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Nullable vs optional distinction
// ═══════════════════════════════════════════════════════════════════════════════

// p: Null and missing-column both become undefined — indistinguishable
results.push(capture(() => {
  const df1 = aq.table({ id: ["P001"], value: [null] });
  const df2 = aq.table({ id: ["P002"] });
  const combined = df1.concat(df2);
  const rows = combined.objects() as Array<Record<string, unknown>>;
  const p001Val = rows.find((r) => r.id === "P001")?.value;
  const p002Val = rows.find((r) => r.id === "P002")?.value;
  const distinguishable = p001Val !== p002Val;
  return `P001 value=${p001Val}, P002 value=${p002Val}, distinguishable: ${distinguishable}`;
}));

// q: conditional fill — both null types treated same
results.push(capture(() => {
  const df1 = aq.table({ id: ["P001"], value: [null] });
  const df2 = aq.table({ id: ["P002"] });
  const combined = df1.concat(df2);
  const filled = combined.derive({
    value: aq.escape((d: Record<string, unknown>) =>
      d.value == null ? "inconclusive" : d.value
    ),
  });
  const vals = (filled.objects() as Array<Record<string, unknown>>).map(
    (r) => r.value,
  );
  return `both filled same: [${vals.join(", ")}]`;
}));

console.log(JSON.stringify(results));
