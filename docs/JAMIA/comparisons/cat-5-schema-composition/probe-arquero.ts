/**
 * Probe: Category 5 — Schema Composition Errors in Arquero
 *
 * Consolidates error classes 06, 13, 20, 27, 33.
 * Each case mirrors the pandas probe (probe.py) to enable direct comparison.
 *
 * Usage: deno run -A joss/comparisons/cat-5-schema-composition/probe-arquero.ts
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

// ═══════════════════════════════════════════════════════════════════════════════
// Schema validation at data boundaries
// ═══════════════════════════════════════════════════════════════════════════════

// a: Non-numeric value in numeric column
results.push(capture(() => {
  const dt = aq.table({
    lab_id: ["L1", "L2", "L3"],
    result_value: [100, "pending", 200],
  });
  const vals = dt.array("result_value") as unknown[];
  const types = [...new Set(vals.map((v) => typeof v))];
  return `mixed types accepted silently: [${types.join(", ")}]`;
}));

// b: Missing column accessed after creation
results.push(capture(() => {
  const dt = aq.table({
    lab_id: ["L3001", "L3002"],
    result_value: [1250, 131],
  });
  // deno-lint-ignore no-explicit-any
  const vals = (dt as any).array("nonexistent_column");
  return `accessed without error: ${vals}`;
}));

// c: Null/undefined cell in column
results.push(capture(() => {
  const dt = aq.table({
    lab_id: ["L1", "L2", "L3"],
    reference_high: [100, undefined, 200],
  });
  const vals = dt.array("reference_high") as (number | undefined)[];
  const nullCount = vals.filter((v) => v === undefined || v === null).length;
  return `${nullCount} cells are undefined/null, no error`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Bind rows schema mismatch
// ═══════════════════════════════════════════════════════════════════════════════

const labsA = aq.table({
  patient_id: ["P001", "P002"],
  test_name: ["BNP", "WBC"],
  result_value: [1250, 15.2],
  lab_site: ["Main", "Main"],
});

const labsB = aq.table({
  patient_id: ["P003", "P004"],
  test_name: ["HbA1c", "Glucose"],
  result_value: [8.9, 210],
  reference_range: ["4.0-5.6", "70-100"],
});

// d: concat with different schemas — Arquero keeps only first table's columns
results.push(capture(() => {
  const combined = labsA.concat(labsB);
  const cols = combined.columnNames();
  const objs = combined.objects() as Record<string, unknown>[];
  const undefLabSite = objs.filter((r) => r.lab_site === undefined || r.lab_site === null).length;
  const hasRefRange = cols.includes("reference_range");
  return `columns=${JSON.stringify(cols)}, lab_site undefined=${undefLabSite}, reference_range kept=${hasRefRange}`;
}));

// e: String op on undefined column after concat
results.push(capture(() => {
  const combined = labsA.concat(labsB);
  // deno-lint-ignore no-explicit-any
  const withUpper = (combined as any).derive({
    site_upper: (d: { lab_site: string }) => d.lab_site ? aq.op.upper(d.lab_site) : d.lab_site,
  });
  const objs = withUpper.objects() as Record<string, unknown>[];
  const nullCount = objs.filter((r) => r.site_upper === undefined || r.site_upper === null).length;
  return `undefined propagated in upper(): ${nullCount} undefined rows`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Implicit type coercion in row binding
// ═══════════════════════════════════════════════════════════════════════════════

const numericDoses = aq.table({
  drug: ["Aspirin", "Lisinopril"],
  dose: [325, 10],
});

const textDoses = aq.table({
  drug: ["Insulin", "Warfarin"],
  dose: ["sliding scale", "per INR"],
});

// f: concat silently coerces column type
results.push(capture(() => {
  const combined = numericDoses.concat(textDoses);
  const vals = combined.array("dose") as unknown[];
  const types = [...new Set(vals.map((v) => typeof v))];
  return `concat mixed dose types silently: [${types.join(", ")}]`;
}));

// g: Arithmetic on mixed-type column after concat
results.push(capture(() => {
  const combined = numericDoses.concat(textDoses);
  // deno-lint-ignore no-explicit-any
  const doubled = (combined as any).derive({ doubled: (d: any) => d.dose * 2 }).objects();
  const insulinRow = doubled.find((r: { drug: string }) => r.drug === "Insulin");
  const val = insulinRow?.doubled;
  return `dose*2 on string: ${val} (NaN=${isNaN(val)})`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Append row type mismatch
// ═══════════════════════════════════════════════════════════════════════════════

const patients = aq.table({
  patient_id: ["P001"],
  name: ["Alice"],
  age: [30],
});

// h: Missing column silently filled on append
results.push(capture(() => {
  const newRow = aq.table({ patient_id: ["P002"], name: ["Bob"] });
  const combined = patients.concat(newRow);
  const objs = combined.objects() as Record<string, unknown>[];
  const hasUndef = objs.some((r) => r.age === undefined || r.age === null);
  return `missing column silently filled with undefined: ${hasUndef}`;
}));

// i: Wrong type silently coerced on append
results.push(capture(() => {
  const badRow = aq.table({ patient_id: ["P003"], name: ["Carol"], age: ["thirty"] });
  const combined = patients.concat(badRow);
  const vals = combined.array("age") as unknown[];
  const types = [...new Set(vals.map((v) => typeof v))];
  return `age has mixed types after concat: [${types.join(", ")}]`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Duplicate column names
// ═══════════════════════════════════════════════════════════════════════════════

// j: Duplicate column names + string operation
results.push(capture(() => {
  // Arquero uses object-based column spec, so duplicate keys collapse
  // We test what happens when building from row objects with duplicate keys
  const dt = aq.from([
    { id: 1, name: "Alice", name_2: "ED" },
  ]).rename({ name_2: "name" });
  const cols = dt.columnNames();
  // deno-lint-ignore no-explicit-any
  const upper = (dt as any).derive({ name: (d: any) => aq.op.upper(d.name) }).objects();
  return `columns=${JSON.stringify(cols)}, upper name=${upper[0].name}`;
}));

console.log(JSON.stringify(results));
