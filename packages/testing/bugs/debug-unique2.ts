import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Minimal reproduction
const df = createDataFrame([
  { id: "P1", code: "A", date: "2025-01-01" },
  { id: "P1", code: "A", date: "2025-02-01" },
  { id: "P1", code: "B", date: "2025-03-01" },
  { id: "P2", code: "A", date: "2025-04-01" },
]);

// deno-lint-ignore no-explicit-any
const chain = df.filter((r: any) => r.code === "A").mutate({ _dateStr: (r: any) => r.date });

// deno-lint-ignore no-explicit-any
const api = chain as any;
console.log("=== AFTER filter→mutate ===");
console.log("store.length:", api.__store.length);
console.log("store.columnNames:", api.__store.columnNames);
console.log("store.columns.id:", api.__store.columns.id);
console.log("store.columns.code:", api.__store.columns.code);
console.log("store.columns.date:", api.__store.columns.date);
console.log("store.columns._dateStr:", api.__store.columns._dateStr);
console.log("view:", JSON.stringify(api.__view, (_k, v) => v instanceof Uint32Array ? `Uint32[${[...v]}]` : v));

console.log("\n=== GROUPBY ===");
const grouped = chain.groupBy("id");
// deno-lint-ignore no-explicit-any
const gapi = grouped as any;
console.log("grouped.__store === chain.__store:", gapi.__store === api.__store);
console.log("grouped.__view:", JSON.stringify(gapi.__view, (_k, v) => v instanceof Uint32Array ? `Uint32[${[...v]}]` : v));
const groups = gapi.__groups;
console.log("groups.head:", [...groups.head]);
console.log("groups.next:", [...groups.next]);
console.log("groups.count:", [...groups.count]);
console.log("groups.keyRow:", [...groups.keyRow]);
console.log("groups.usesRawIndices:", groups.usesRawIndices);
console.log("groups.size:", groups.size);

console.log("\n=== SUMMARIZE ===");
let callNum = 0;
const result = grouped.summarize({
  // deno-lint-ignore no-explicit-any
  value: (g: any) => {
    callNum++;
    console.log(`\n--- callback #${callNum} ---`);
    console.log(`  nrows(): ${g.nrows()}`);
    console.log(`  columnNames: ${JSON.stringify(g.columnNames)}`);

    const dateCol = g._dateStr;
    console.log(`  g._dateStr type: ${typeof dateCol}`);
    console.log(`  g._dateStr isArray: ${Array.isArray(dateCol)}`);
    console.log(`  g._dateStr length: ${dateCol?.length}`);
    console.log(`  g._dateStr values: ${JSON.stringify(dateCol)}`);
    for (let i = 0; i < (dateCol?.length ?? 0); i++) {
      console.log(`    [${i}] type=${typeof dateCol[i]} value=${JSON.stringify(dateCol[i])}`);
    }

    const idCol = g.id;
    console.log(`  g.id values: ${JSON.stringify(idCol)}`);

    // Test: Array.from on the column
    const arr = Array.isArray(dateCol) ? dateCol : Array.from(dateCol);
    console.log(`  Array.from(_dateStr): ${JSON.stringify(arr)}`);
    console.log(`  arr.length: ${arr.length}`);
    console.log(`  arr has nullish: ${arr.some((x: unknown) => x === null || x === undefined)}`);

    // Test: unique directly
    try {
      console.log("  calling s.unique(dateCol)...");
      const u = s.unique(dateCol);
      console.log(`  s.unique result: ${JSON.stringify(u)}`);
      return u.length;
    } catch (e) {
      console.log(`  s.unique THREW: ${(e as Error).message}`);
      // Fallback: try with filtered nulls
      try {
        const cleaned = arr.filter((x: unknown) => x != null);
        console.log(`  cleaned (no nulls): ${JSON.stringify(cleaned)}`);
        const u2 = s.unique(cleaned);
        console.log(`  s.unique(cleaned) result: ${JSON.stringify(u2)}`);
        return u2.length;
      } catch (e2) {
        console.log(`  s.unique(cleaned) also THREW: ${(e2 as Error).message}`);
        return -1;
      }
    }
  },
});
console.log("\n=== RESULT ===");
console.log([...result]);
