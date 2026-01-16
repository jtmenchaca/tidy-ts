import { createDataFrame, stats } from "@tidy-ts/dataframe";

console.log("Testing pivotWider runtime validation...\n");

const salesData = createDataFrame([
  { store: "A", product: "apples", revenue: 100 },
  { store: "A", product: "bananas", revenue: 75 },
  { store: "A", product: "cherries", revenue: 50 },
  { store: "B", product: "apples", revenue: 120 },
  { store: "B", product: "bananas", revenue: 90 },
  { store: "B", product: "cherries", revenue: 80 },
]);

console.log("Actual unique values in data:", stats.unique(salesData.product));
// Output: ["apples", "bananas", "cherries"]

console.log("\n--- Test 1: Missing expected column ---");
try {
  const result = salesData
    .pivotWider({
      namesFrom: "product",
      valuesFrom: "revenue",
      expectedColumns: ["apples", "bananas"], // Missing "cherries"
    });
  console.log("Success:", result);
} catch (error) {
  console.log(
    "ERROR:",
    error instanceof Error ? error.message : "Unknown error",
  );
}

console.log("\n--- Test 2: Extra expected column ---");
try {
  const result = salesData
    .pivotWider({
      namesFrom: "product",
      valuesFrom: "revenue",
      expectedColumns: ["apples", "bananas", "cherries", "dates"], // Extra "dates"
    });
  console.log("Success:", result);
} catch (error) {
  console.log(
    "ERROR:",
    error instanceof Error ? error.message : "Unknown error",
  );
}

console.log("\n--- Test 3: Wrong expected column name ---");
try {
  const result = salesData
    .pivotWider({
      namesFrom: "product",
      valuesFrom: "revenue",
      expectedColumns: ["apples", "oranges", "cherries"], // "oranges" instead of "bananas"
    });
  console.log("Success:", result);
} catch (error) {
  console.log(
    "ERROR:",
    error instanceof Error ? error.message : "Unknown error",
  );
}

console.log("\n--- Test 4: Correct expected columns ---");
try {
  const result = salesData
    .pivotWider({
      namesFrom: "product",
      valuesFrom: "revenue",
      expectedColumns: ["apples", "bananas", "cherries"], // Correct!
    });
  console.log("Success! Result:");
  console.log(result);
} catch (error) {
  console.log(
    "ERROR:",
    error instanceof Error ? error.message : "Unknown error",
  );
}

console.log("\n--- Test 5: Using .unique() method (always works) ---");
try {
  const result = salesData
    .pivotWider({
      namesFrom: "product",
      valuesFrom: "revenue",
      expectedColumns: stats.unique(salesData.product), // Always correct!
    });
  console.log("Success! Result:");
  console.log(result);
} catch (error) {
  console.log(
    "ERROR:",
    error instanceof Error ? error.message : "Unknown error",
  );
}

console.log("\n--- Test 6: No expectedColumns (no validation) ---");
try {
  const result = salesData
    .pivotWider({
      namesFrom: "product",
      valuesFrom: "revenue",
      // No expectedColumns - will work but return Record<string, unknown>
    });
  console.log("Success! Result:");
  console.log(result);
} catch (error) {
  console.log(
    "ERROR:",
    error instanceof Error ? error.message : "Unknown error",
  );
}
