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

console.log("Original df nrows:", df.nrows());

// Positive filter: keep val >= 130
const pos = df.filter((r: any) => r.val >= 130);
console.log("\nfilter(val >= 130):");
console.log("  nrows:", pos.nrows());
console.log("  rows:", [...pos].map((r: any) => `${r.id}:${r.val}`));

// Negation filter: remove exactly 1 row
const neg1 = df.filter((r: any) => !(r.id === "P2" && r.val === 110));
console.log("\nfilter(!(P2 && 110)) — should keep 4:");
console.log("  nrows:", neg1.nrows());
console.log("  rows:", [...neg1].map((r: any) => `${r.id}:${r.val}`));

// Another negation
const neg2 = df.filter((r: any) => r.val !== 110);
console.log("\nfilter(val !== 110) — should keep 4:");
console.log("  nrows:", neg2.nrows());
console.log("  rows:", [...neg2].map((r: any) => `${r.id}:${r.val}`));

// Negation with != on id
const neg3 = df.filter((r: any) => r.id !== "P2");
console.log("\nfilter(id !== P2) — should keep 3:");
console.log("  nrows:", neg3.nrows());
console.log("  rows:", [...neg3].map((r: any) => `${r.id}:${r.val}`));

// Filter that keeps all
const all = df.filter((r: any) => true);
console.log("\nfilter(true) — should keep 5:");
console.log("  nrows:", all.nrows());

// Filter that removes all
const none = df.filter((r: any) => false);
console.log("\nfilter(false) — should keep 0:");
console.log("  nrows:", none.nrows());
