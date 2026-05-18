/**
 * Probe: Category 4 — Join Safety Errors in Arquero
 *
 * Consolidates error classes 03, 17, 18.
 * Each case mirrors the pandas probe (probe.py) to enable direct comparison.
 *
 * Usage: deno run -A joss/comparisons/cat-4-join-safety/probe-arquero.ts
 */
import * as aq from "arquero";
import { readFileSync } from "node:fs";

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

const fixturesDir = new URL("../../fixtures/", import.meta.url).pathname;

function loadCSV(filename: string) {
  const text = readFileSync(fixturesDir + filename, "utf-8");
  return aq.fromCSV(text);
}

const patients = loadCSV("patients.csv");
const encounters = loadCSV("encounters.csv");
const labs = loadCSV("lab_results.csv");

// ═══════════════════════════════════════════════════════════════════════════════
// Join key errors
// ═══════════════════════════════════════════════════════════════════════════════

// a: join on key not in left table
// patients has no "encounter_id" column; labs does
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const merged = (patients as any).join(labs, ["encounter_id"]);
  return `merged without error, ${merged.numRows()} rows`;
}));

// b: join on misspelled key
// patients has "patient_id", not "patient_ID"
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const merged = (patients as any).join(encounters, ["patient_ID"]);
  return `merged without error, ${merged.numRows()} rows`;
}));

// c: access missing column post-join
results.push(capture(() => {
  const joined = patients.join(encounters, ["patient_id"]);
  // "prescription_id" does not exist in either table
  // deno-lint-ignore no-explicit-any
  const selected = (joined as any).select("prescription_id");
  return `accessed without error, ${selected.numRows()} rows`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Join nullability
// ═══════════════════════════════════════════════════════════════════════════════

const patients17 = aq.table({
  patient_id: ["P001", "P002", "P003"],
  name: ["Alice Johnson", "Bob Smith", "Carol Davis"],
});

const encounters17 = aq.table({
  patient_id: ["P001", "P001"],
  department: ["Emergency", "ICU"],
  los_days: [3, 7],
});

const joined = patients17.join_left(encounters17, ["patient_id"]);

// d: string method on null/undefined from left join
results.push(capture(() => {
  const withUpper = joined.derive({
    dept_upper: aq.escape((d: { department: string | null }) =>
      d.department != null ? d.department.toUpperCase() : undefined
    ),
  }).objects();
  const nullCount = withUpper.filter(
    (r: { dept_upper: unknown }) => r.dept_upper == null,
  ).length;
  return `str.upper() on null from join produced ${nullCount} null silently`;
}));

// e: arithmetic on null/undefined from left join
results.push(capture(() => {
  const withWeeks = joined.derive({
    // deno-lint-ignore no-explicit-any
    los_weeks: (d: any) => d.los_days / 7,
  }).objects();
  const nullCount = withWeeks.filter(
    (r: { los_weeks: unknown }) => r.los_weeks == null || Number.isNaN(r.los_weeks),
  ).length;
  return `arithmetic on null from join produced ${nullCount} null/NaN silently`;
}));

// f: comparison silently excludes null rows from join
results.push(capture(() => {
  // deno-lint-ignore no-explicit-any
  const longStays = joined.filter((d: any) => d.los_days > 5).objects();
  const allRows = joined.objects();
  const nullRows = allRows.filter(
    (r: { los_days: unknown }) => r.los_days == null,
  ).length;
  return `comparison silently excluded ${nullRows} null rows from join, kept ${longStays.length}`;
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Column name collision
// ═══════════════════════════════════════════════════════════════════════════════

const admissions = aq.table({
  patient_id: ["P001", "P002"],
  date: ["2024-01-15", "2024-02-20"],
  department: ["ED", "ICU"],
});

const discharges = aq.table({
  patient_id: ["P001", "P002"],
  date: ["2024-01-18", "2024-02-25"],
  disposition: ["Home", "SNF"],
});

// g: explicit suffixes — access original column name after rename
// Arquero auto-suffixes with _1, _2; we can rename manually to mimic explicit suffixes
results.push(capture(() => {
  const joined18 = admissions.join(discharges, ["patient_id"]);
  // After join, "date" becomes "date_1" and "date_2"; try accessing original "date"
  // deno-lint-ignore no-explicit-any
  const selected = (joined18 as any).select("date");
  return `accessed 'date' after collision`;
}));

// h: no suffixes — access ambiguous column after collision
// Arquero auto-suffixes; the original "date" should not exist
results.push(capture(() => {
  const joined18 = admissions.join(discharges, ["patient_id"]);
  const cols = joined18.columnNames();
  const hasDate = cols.includes("date");
  const hasSuffixed = cols.includes("date_1") || cols.includes("date_2");
  if (hasDate) {
    return `'date' still accessible (ambiguous)`;
  } else if (hasSuffixed) {
    return `'date' renamed to suffixed columns: ${cols.filter((c: string) => c.startsWith("date")).join(", ")}`;
  }
  return `columns: ${cols.join(", ")}`;
}));

console.log(JSON.stringify(results));
