import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { id: 1, name: "Alice", value: 10, category: "A" },
  { id: 2, name: "Bob", value: 20, category: "B" },
  { id: 3, name: "Charlie", value: 30, category: "A" },
  { id: 4, name: "David", value: 40, category: "B" },
  { id: 5, name: "Eve", value: 50, category: "A" },
]);

// Test 1: filter by string (should NOT use rawMask, since it's not numeric)
const byCategory = df.filter((row: any) => row.category === "A");
console.log(`filter category=A: nrows=${byCategory.nrows()}, expected=3`);
console.log(`  [0].name=${byCategory[0]?.name}, expected=Alice`);

// Test 2: filter by numeric (SHOULD use rawMask)
const byValue = df.filter((row: any) => row.value > 20);
console.log(`filter value>20: nrows=${byValue.nrows()}, expected=3`);
console.log(`  [0].name=${byValue[0]?.name}, expected=Charlie`);

// Test 3: chained filter+select+arrange
const chained = df
  .filter((row: any) => row.value > 20)
  .select("name", "value")
  .arrange("value", "desc");
console.log(`chained: nrows=${chained.nrows()}, expected=3`);
console.log(`  [0].name=${chained[0]?.name}, expected=Eve`);

// Test 4: filter with boolean column
const df2 = createDataFrame([
  { id: 1, name: "Alice", active: true },
  { id: 2, name: "Bob", active: false },
  { id: 3, name: "Charlie", active: true },
]);
const activeOnly = df2.filter((r: any) => r.active);
console.log(`filter active: nrows=${activeOnly.nrows()}, expected=2`);

// Check view internals
console.log(`\n--- View internals ---`);
const api = byValue as any;
const view = api.__view;
console.log(`view:`, view ? Object.keys(view) : 'null');
console.log(`view.mask:`, view?.mask);
console.log(`view.rawMask:`, view?.rawMask ? `Uint8Array(${view.rawMask.length})` : 'null');
console.log(`view._materializedIndex:`, view?._materializedIndex);
