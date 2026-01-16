import { createDataFrame, stats } from "@tidy-ts/dataframe";

console.log("Final pivot implementation test...\n");

// Test data
const longData = createDataFrame([
  { group: "A", variable: "x", value: 1 },
  { group: "A", variable: "y", value: 2 },
  { group: "B", variable: "x", value: 3 },
  { group: "B", variable: "y", value: 4 },
]);

const wideData = createDataFrame([
  { id: 1, x: 10, y: 20, z: 30 },
  { id: 2, x: 15, y: 25, z: 35 },
]);

console.log("=== pivot_wider tests ===");

// 1. Basic pivot_wider with explicit expectedColumns
console.log("1. Basic pivot with expectedColumns:");
const basicPivot = longData.pivotWider({
  namesFrom: "variable",
  valuesFrom: "value",
  expectedColumns: ["x", "y"],
});
console.log(basicPivot);

// 2. Using .unique() method
console.log("\n2. Using df.column.unique():");
const autoPivot = longData.pivotWider({
  namesFrom: "variable",
  valuesFrom: "value",
  expectedColumns: stats.unique(longData.variable),
});
console.log(autoPivot);

// 3. With aggregation function (properly typed!)
console.log("\n3. With aggregation function:");
const aggregatedData = createDataFrame([
  { group: "A", variable: "x", value: 1 },
  { group: "A", variable: "x", value: 2 }, // duplicate
  { group: "A", variable: "y", value: 3 },
  { group: "B", variable: "x", value: 4 },
  { group: "B", variable: "y", value: 5 },
]);

const aggregatedPivot = aggregatedData.pivotWider({
  namesFrom: "variable",
  valuesFrom: "value",
  expectedColumns: ["x", "y"],
  valuesFn: (values) => stats.sum(values),
});
console.log(aggregatedPivot);

// 4. Without expectedColumns (returns Record<string, unknown>)
console.log("\n4. Without expectedColumns:");
const dynamicPivot = longData.pivotWider({
  namesFrom: "variable",
  valuesFrom: "value",
});
console.log(dynamicPivot);

console.log("\n=== pivot_longer tests ===");

// 5. Basic pivot_longer
console.log("5. Basic pivot_longer:");
const longerResult = wideData.pivotLonger({
  cols: ["x", "y", "z"],
  namesTo: "variable",
  valuesTo: "value",
});
console.log(longerResult);

// 6. Partial columns pivot_longer
console.log("\n6. Partial columns pivot_longer:");
const partialLonger = wideData.pivotLonger({
  cols: ["x", "y"], // Only pivot some columns
  namesTo: "metric",
  valuesTo: "score",
});
console.log(partialLonger);

console.log("\n=== Error handling tests ===");

// 7. Error: Wrong expectedColumns
console.log("7. Testing validation error:");
try {
  longData.pivotWider({
    namesFrom: "variable",
    valuesFrom: "value",
    expectedColumns: ["x", "z"], // "z" doesn't exist
  });
} catch (error) {
  console.log("✓ Expected error:", (error as Error).message);
}

// 8. Error: Invalid column in pivot_longer
console.log("\n8. Testing pivot_longer validation:");
try {
  wideData.pivotLonger({
    // @ts-expect-error - invalid column name
    cols: ["x", "missing"], // "missing" doesn't exist
    namesTo: "variable",
    valuesTo: "value",
  });
} catch (error) {
  console.log("✓ Expected error:", (error as Error).message);
}

console.log("\n✅ All pivot tests completed successfully!");
