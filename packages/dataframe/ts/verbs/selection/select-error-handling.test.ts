import { createDataFrame } from "@tidy-ts/dataframe";

console.log("Testing select error handling...");

const testData = createDataFrame([
  { name: "Alice", age: 25, city: "NYC" },
  { name: "Bob", age: 30, city: "LA" },
]);

console.log("Available columns:", Object.keys(testData[0]));

// Test 1: Single missing column (using type assertion to bypass compile-time checking)
console.log("\n--- Test 1: Single missing column ---");
try {
  const result = testData
    .select("name", "missing_column" as keyof typeof testData[0]);
  console.log("ERROR: Should have thrown, but got:", result);
} catch (error) {
  console.log("✓ Expected error:", (error as Error).message);
}

// Test 2: Multiple missing columns
console.log("\n--- Test 2: Multiple missing columns ---");
try {
  const result = testData
    .select(
      "missing1" as keyof typeof testData[0],
      "missing2" as keyof typeof testData[0],
    );
  console.log("ERROR: Should have thrown, but got:", result);
} catch (error) {
  console.log("✓ Expected error:", (error as Error).message);
}

// Test 3: Mix of valid and invalid columns
console.log("\n--- Test 3: Mix of valid and invalid columns ---");
try {
  const result = testData
    .select("name", "invalid_column" as keyof typeof testData[0], "age");
  console.log("ERROR: Should have thrown, but got:", result);
} catch (error) {
  console.log("✓ Expected error:", (error as Error).message);
}

// Test 4: Valid columns should work
console.log("\n--- Test 4: Valid columns (should succeed) ---");
try {
  const result = testData.select("name", "age");
  console.log("✓ Success:", result);
} catch (error) {
  console.log(
    "ERROR: Should have succeeded, but got:",
    (error as Error).message,
  );
}

// Test 5: Empty dataframe
console.log("\n--- Test 5: Empty dataframe ---");
const emptyData = createDataFrame([]);
try {
  const result = emptyData
    // @ts-expect-error - empty dataframe
    .select("any_column");
  console.log("✓ Empty dataframe result:", result);
} catch (error) {
  console.log("Error with empty dataframe:", (error as Error).message);
}

console.log("\nSelect error handling tests completed!");
