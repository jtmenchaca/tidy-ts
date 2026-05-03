/**
 * Standalone reproduction: groupBy("id").sliceMin() behavior with
 * Temporal.PlainDateTime columns, filter, and various group sizes.
 */

import { createDataFrame } from "@tidy-ts/dataframe";

const dt = (s: string) => Temporal.PlainDateTime.from(s);

// deno-lint-ignore no-explicit-any
function report(label: string, result: any, expected?: string) {
  try {
    const ids = result.extract("id");
    // deno-lint-ignore no-explicit-any
    const dates = result.extract("effectiveDateTime").map((d: any) => d?.toString?.() ?? String(d));
    const vals = result.extract("val");
    const line = `  ${label}: nrow=${ids.length}, ids=${JSON.stringify(ids)}, dates=${JSON.stringify(dates)}, vals=${JSON.stringify(vals)}`;
    console.log(line);
    if (expected) console.log(`    expected: ${expected}`);
  } catch (e) {
    console.log(`  ${label}: FAIL — ${(e as Error).message}`);
    if (expected) console.log(`    expected: ${expected}`);
  }
}

// ============================================================================
// Base data: P1 has 3 events, P2 has 2 events
// ============================================================================

const rows = [
  { id: "P1", code: "BP", effectiveDateTime: dt("2025-06-01"), val: 130 },
  { id: "P1", code: "BP", effectiveDateTime: dt("2025-01-01"), val: 120 },
  { id: "P1", code: "BP", effectiveDateTime: dt("2025-03-01"), val: 140 },
  { id: "P2", code: "BP", effectiveDateTime: dt("2025-05-01"), val: 150 },
  { id: "P2", code: "BP", effectiveDateTime: dt("2025-02-01"), val: 110 },
];

const df = createDataFrame(rows);

// ============================================================================
// A. BASELINE: sliceMin without filter
// ============================================================================

console.log("=== A. No filter ===");
report("A1 sliceMin(effectiveDateTime,1)",
  df.groupBy("id").sliceMin("effectiveDateTime", 1),
  "P1->2025-01-01(120), P2->2025-02-01(110)");

report("A2 sliceMin(effectiveDateTime,2)",
  df.groupBy("id").sliceMin("effectiveDateTime", 2),
  "P1->01-01+03-01, P2->02-01+05-01");

// ============================================================================
// B. FILTER that keeps ALL rows (view present but no rows removed)
// ============================================================================

console.log("\n=== B. Filter keeps all rows ===");
// deno-lint-ignore no-explicit-any
const allKept = df.filter((r: any) => r.code === "BP");

report("B1 sliceMin(effectiveDateTime,1)",
  allKept.groupBy("id").sliceMin("effectiveDateTime", 1),
  "P1->2025-01-01(120), P2->2025-02-01(110)");

// ============================================================================
// C. FILTER removes some rows — numeric column predicate
// ============================================================================

console.log("\n=== C. Filter removes rows (val >= 130) ===");
// Keeps: P1(130,140), P2(150). Removes: P1(120), P2(110)
// deno-lint-ignore no-explicit-any
const valFiltered = df.filter((r: any) => r.val >= 130);

report("C1 sliceMin(effectiveDateTime,1)",
  valFiltered.groupBy("id").sliceMin("effectiveDateTime", 1),
  "P1->2025-03-01(140), P2->2025-05-01(150)");

report("C2 sliceMin(val,1) [numeric col]",
  valFiltered.groupBy("id").sliceMin("val", 1),
  "P1->val=130, P2->val=150");

report("C3 sliceMax(effectiveDateTime,1)",
  valFiltered.groupBy("id").sliceMax("effectiveDateTime", 1),
  "P1->2025-06-01(130), P2->2025-05-01(150)");

report("C4 sliceMax(val,1) [numeric col]",
  valFiltered.groupBy("id").sliceMax("val", 1),
  "P1->val=140, P2->val=150");

// ============================================================================
// D. FILTER removes rows — Temporal comparison predicate
// ============================================================================

console.log("\n=== D. Filter with Temporal comparison ===");
const ivStart = dt("2025-02-01");
const ivEnd = dt("2025-04-01");

// Keeps: P1(03-01), P2(02-01). Removes: P1(06-01,01-01), P2(05-01)
// deno-lint-ignore no-explicit-any
const temporalFiltered = df.filter((r: any) => {
  return Temporal.PlainDateTime.compare(r.effectiveDateTime, ivStart) >= 0 &&
    Temporal.PlainDateTime.compare(r.effectiveDateTime, ivEnd) <= 0;
});

report("D1 sliceMin(effectiveDateTime,1)",
  temporalFiltered.groupBy("id").sliceMin("effectiveDateTime", 1),
  "P1->2025-03-01(140), P2->2025-02-01(110)");

report("D2 no groupBy, just arrange",
  temporalFiltered.arrange("effectiveDateTime"),
  "2 rows sorted by date");

report("D3 nrows after filter",
  { extract: (col: string) => col === "id" ? [...temporalFiltered].map((r: any) => r.id) : col === "effectiveDateTime" ? [...temporalFiltered].map((r: any) => r.effectiveDateTime) : [...temporalFiltered].map((r: any) => r.val) },
  "P1(03-01), P2(02-01) — 2 rows");

// ============================================================================
// E. Does groupBy itself work on filtered data?
// ============================================================================

console.log("\n=== E. GroupBy.summarize on filtered data (no sliceMin) ===");
// deno-lint-ignore no-explicit-any
const valFilteredGrouped = valFiltered.groupBy("id").summarize({ count: (g: any) => g.nrows() });
console.log("  E1 groupBy.summarize(nrows):", [...valFilteredGrouped].map((r: any) => `${r.id}:${r.count}`).join(", "));
console.log("    expected: P1:2, P2:1");

// deno-lint-ignore no-explicit-any
const temporalGrouped = temporalFiltered.groupBy("id").summarize({ count: (g: any) => g.nrows() });
console.log("  E2 groupBy.summarize(nrows):", [...temporalGrouped].map((r: any) => `${r.id}:${r.count}`).join(", "));
console.log("    expected: P1:1, P2:1");

// ============================================================================
// F. sliceMin on re-materialized filtered data
// ============================================================================

console.log("\n=== F. Re-materialized filtered data ===");
const valRematted = createDataFrame([...valFiltered]);
report("F1 remat valFiltered sliceMin",
  valRematted.groupBy("id").sliceMin("effectiveDateTime", 1),
  "P1->2025-03-01(140), P2->2025-05-01(150)");

const temporalRematted = createDataFrame([...temporalFiltered]);
report("F2 remat temporalFiltered sliceMin",
  temporalRematted.groupBy("id").sliceMin("effectiveDateTime", 1),
  "P1->2025-03-01(140), P2->2025-02-01(110)");

// ============================================================================
// G. Simple numeric data — isolate Temporal from the equation
// ============================================================================

console.log("\n=== G. Numeric dates (no Temporal) ===");
const numRows = [
  { id: "P1", date: 20250601, val: 130 },
  { id: "P1", date: 20250101, val: 120 },
  { id: "P1", date: 20250301, val: 140 },
  { id: "P2", date: 20250501, val: 150 },
  { id: "P2", date: 20250201, val: 110 },
];
const numDf = createDataFrame(numRows);

report("G1 no filter sliceMin(date,1)",
  numDf.groupBy("id").sliceMin("date", 1),
  "P1->20250101(120), P2->20250201(110)");

// deno-lint-ignore no-explicit-any
const numFiltered = numDf.filter((r: any) => r.val >= 130);
report("G2 filter(val>=130) sliceMin(date,1)",
  numFiltered.groupBy("id").sliceMin("date", 1),
  "P1->20250301(140), P2->20250501(150)");

// deno-lint-ignore no-explicit-any
const numFiltered2 = numDf.filter((r: any) => r.date >= 20250201 && r.date <= 20250401);
report("G3 filter(date range) sliceMin(date,1)",
  numFiltered2.groupBy("id").sliceMin("date", 1),
  "P1->20250301(140), P2->20250201(110)");

// ============================================================================
// H. String dates — isolate from numeric & Temporal
// ============================================================================

console.log("\n=== H. String dates ===");
const strRows = [
  { id: "P1", date: "2025-06-01", val: 130 },
  { id: "P1", date: "2025-01-01", val: 120 },
  { id: "P1", date: "2025-03-01", val: 140 },
  { id: "P2", date: "2025-05-01", val: 150 },
  { id: "P2", date: "2025-02-01", val: 110 },
];
const strDf = createDataFrame(strRows);

report("H1 no filter sliceMin(date,1)",
  strDf.groupBy("id").sliceMin("date", 1),
  "P1->2025-01-01(120), P2->2025-02-01(110)");

// deno-lint-ignore no-explicit-any
const strFiltered = strDf.filter((r: any) => r.val >= 130);
report("H2 filter(val>=130) sliceMin(date,1)",
  strFiltered.groupBy("id").sliceMin("date", 1),
  "P1->2025-03-01(140), P2->2025-05-01(150)");

// ============================================================================
// I. Plain Date objects — another comparable type
// ============================================================================

console.log("\n=== I. Date objects ===");
const dateRows = [
  { id: "P1", date: new Date("2025-06-01"), val: 130 },
  { id: "P1", date: new Date("2025-01-01"), val: 120 },
  { id: "P1", date: new Date("2025-03-01"), val: 140 },
  { id: "P2", date: new Date("2025-05-01"), val: 150 },
  { id: "P2", date: new Date("2025-02-01"), val: 110 },
];
const dateDf = createDataFrame(dateRows);

report("I1 no filter sliceMin(date,1)",
  dateDf.groupBy("id").sliceMin("date", 1),
  "P1->2025-01-01(120), P2->2025-02-01(110)");

// deno-lint-ignore no-explicit-any
const dateFiltered = dateDf.filter((r: any) => r.val >= 130);
report("I2 filter(val>=130) sliceMin(date,1)",
  dateFiltered.groupBy("id").sliceMin("date", 1),
  "P1->2025-03-01(140), P2->2025-05-01(150)");

// ============================================================================
// J. Filter that removes ONE row only (minimal disruption)
// ============================================================================

console.log("\n=== J. Filter removes exactly 1 row ===");
// Remove only P2's 2025-02-01 row (the last row)
// deno-lint-ignore no-explicit-any
const oneRemoved = df.filter((r: any) => !(r.id === "P2" && r.val === 110));
report("J1 sliceMin(effectiveDateTime,1)",
  oneRemoved.groupBy("id").sliceMin("effectiveDateTime", 1),
  "P1->2025-01-01(120), P2->2025-05-01(150)");

// Remove only the first row (P1's 2025-06-01)
// deno-lint-ignore no-explicit-any
const firstRemoved = df.filter((r: any) => !(r.id === "P1" && r.val === 130));
report("J2 remove first row, sliceMin(effectiveDateTime,1)",
  firstRemoved.groupBy("id").sliceMin("effectiveDateTime", 1),
  "P1->2025-01-01(120), P2->2025-02-01(110)");

// Remove a middle row (P1's 2025-01-01 — this IS the min for P1)
// deno-lint-ignore no-explicit-any
const midRemoved = df.filter((r: any) => !(r.id === "P1" && r.val === 120));
report("J3 remove P1's min row, sliceMin(effectiveDateTime,1)",
  midRemoved.groupBy("id").sliceMin("effectiveDateTime", 1),
  "P1->2025-03-01(140), P2->2025-02-01(110)");

// ============================================================================
// K. Vary n parameter
// ============================================================================

console.log("\n=== K. sliceMin with n > 1 on filtered data ===");
report("K1 filter(val>=130) sliceMin(effectiveDateTime,2)",
  valFiltered.groupBy("id").sliceMin("effectiveDateTime", 2),
  "P1->03-01+06-01, P2->05-01");

// ============================================================================
// L. sliceMin on filter that leaves single-row groups only
// ============================================================================

console.log("\n=== L. Single-row groups after filter ===");
// deno-lint-ignore no-explicit-any
const singleRows = df.filter((r: any) => r.val === 140 || r.val === 150);
report("L1 sliceMin(effectiveDateTime,1)",
  singleRows.groupBy("id").sliceMin("effectiveDateTime", 1),
  "P1->2025-03-01(140), P2->2025-05-01(150)");

// ============================================================================
// M. arrange on filtered Temporal data (no groupBy/sliceMin)
// ============================================================================

console.log("\n=== M. Arrange on filtered data (sanity check) ===");
const arranged = valFiltered.arrange("effectiveDateTime");
const arrRows = [...arranged];
console.log("  M1 valFiltered.arrange:", arrRows.map((r: any) => `${r.id}:${r.effectiveDateTime}`).join(", "));
console.log("    expected: P1:2025-03-01, P1:2025-06-01, P2:2025-05-01");

const tempArranged = temporalFiltered.arrange("effectiveDateTime");
const tempArrRows = [...tempArranged];
console.log("  M2 temporalFiltered.arrange:", tempArrRows.map((r: any) => `${r.id}:${r.effectiveDateTime}`).join(", "));
console.log("    expected: P2:2025-02-01, P1:2025-03-01");
