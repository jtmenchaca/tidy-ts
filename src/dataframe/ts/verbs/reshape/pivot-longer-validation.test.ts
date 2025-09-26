import { createDataFrame } from "@tidy-ts/dataframe";

console.log("Testing pivot_longer validation...\n");

const wideData = createDataFrame([
  { id: 1, x: 10, y: 20, z: 30 },
  { id: 2, x: 15, y: 25, z: 35 },
]);

console.log("Available columns in data:", Object.keys(wideData[0]));
// Output: ["id", "x", "y", "z"]

console.log("\n--- Test 1: Valid columns ---");
try {
  const result = wideData
    .pivotLonger({
      cols: ["x", "y", "z"],
      namesTo: "variable",
      valuesTo: "value",
    });
  console.log("Success! Result:");
  console.log(result);
} catch (error) {
  console.log("ERROR:", (error as Error).message);
}

console.log("\n--- Test 2: Invalid column name ---");
try {
  const result = wideData
    .pivotLonger({
      // @ts-expect-error - missing columns
      cols: ["x", "y", "missingColumn"], // "missingColumn" doesn't exist
      namesTo: "variable",
      valuesTo: "value",
    });
  console.log("Success:", result);
} catch (error) {
  console.log("ERROR:", (error as Error).message);
}

console.log("\n--- Test 3: Multiple invalid columns ---");
try {
  const result = wideData
    .pivotLonger({
      // @ts-expect-error - missing columns
      cols: ["x", "missing1", "missing2"], // Two missing columns
      namesTo: "variable",
      valuesTo: "value",
    });
  console.log("Success:", result);
} catch (error) {
  console.log("ERROR:", (error as Error).message);
}

console.log("\n--- Test 4: Partial valid columns ---");
try {
  const result = wideData
    .pivotLonger({
      cols: ["x", "y"], // Only pivot some columns
      namesTo: "variable",
      valuesTo: "value",
    });
  console.log("Success! Result (id and z preserved):");
  console.log(result);
} catch (error) {
  console.log("ERROR:", (error as Error).message);
}
