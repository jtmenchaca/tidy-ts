// deno-lint-ignore-file no-explicit-any
import { createDataFrame } from "@tidy-ts/dataframe";

const rows = [
  { id: "P1", val: 130, date: 20250601 },
  { id: "P1", val: 120, date: 20250101 },
  { id: "P1", val: 140, date: 20250301 },
  { id: "P2", val: 150, date: 20250501 },
  { id: "P2", val: 110, date: 20250201 },
];
const df = createDataFrame(rows);

// Case 1: Remove last row (P2's val=110)
const oneRemoved = df.filter((r: any) => !(r.id === "P2" && r.val === 110));
console.log("=== Remove P2 val=110 (last row) ===");
console.log("filtered nrows:", oneRemoved.nrows());
console.log("filtered rows:", [...oneRemoved].map((r: any) => `${r.id}:${r.val}:${r.date}`));
const result1 = oneRemoved.groupBy("id").sliceMin("date", 1);
console.log("sliceMin nrows:", result1.nrows());
console.log("sliceMin rows:", [...result1].map((r: any) => `${r.id}:${r.val}:${r.date}`));
console.log("expected: P1:120:20250101, P2:150:20250501");

// Case 2: Remove first row (P1's val=130)
console.log("\n=== Remove P1 val=130 (first row) ===");
const firstRemoved = df.filter((r: any) => !(r.id === "P1" && r.val === 130));
console.log("filtered nrows:", firstRemoved.nrows());
console.log("filtered rows:", [...firstRemoved].map((r: any) => `${r.id}:${r.val}:${r.date}`));
const result2 = firstRemoved.groupBy("id").sliceMin("date", 1);
console.log("sliceMin nrows:", result2.nrows());
console.log("sliceMin rows:", [...result2].map((r: any) => `${r.id}:${r.val}:${r.date}`));
console.log("expected: P1:120:20250101, P2:110:20250201");

// Case 3: Remove P1's min row (val=120)
console.log("\n=== Remove P1 val=120 (P1's min) ===");
const minRemoved = df.filter((r: any) => !(r.id === "P1" && r.val === 120));
console.log("filtered nrows:", minRemoved.nrows());
console.log("filtered rows:", [...minRemoved].map((r: any) => `${r.id}:${r.val}:${r.date}`));
const result3 = minRemoved.groupBy("id").sliceMin("date", 1);
console.log("sliceMin nrows:", result3.nrows());
console.log("sliceMin rows:", [...result3].map((r: any) => `${r.id}:${r.val}:${r.date}`));
console.log("expected: P1:140:20250301, P2:110:20250201");

// Shuffle case
console.log("\n=== Shuffle: Remove P1 code=B ===");
const ddf = createDataFrame([
  { id: "P1", code: "A", val: 10 },
  { id: "P1", code: "A", val: 20 },
  { id: "P1", code: "B", val: 30 },
  { id: "P2", code: "A", val: 40 },
  { id: "P2", code: "A", val: 50 },
  { id: "P2", code: "B", val: 60 },
]);
const sFiltered = ddf.filter((r: any) => !(r.id === "P1" && r.val === 30));
console.log("filtered nrows:", sFiltered.nrows());
const sResult = sFiltered.groupBy("id").shuffle(42);
console.log("shuffle nrows:", sResult.nrows());
console.log("shuffle vals:", [...sResult].map((r: any) => r.val).sort());
console.log("expected 5 rows, vals: [10, 20, 40, 50, 60]");

// Distinct case
console.log("\n=== Distinct: Remove P1 code=B ===");
const dFiltered = ddf.filter((r: any) => !(r.id === "P1" && r.code === "B"));
console.log("filtered nrows:", dFiltered.nrows());
console.log("filtered rows:", [...dFiltered].map((r: any) => `${r.id}:${r.code}`));
const dResult = dFiltered.groupBy("id").distinct("code");
console.log("distinct nrows:", dResult.nrows());
console.log("distinct rows:", [...dResult].map((r: any) => `${r.id}:${r.code}`));
console.log("expected 3 rows: P1:A, P2:A, P2:B");
