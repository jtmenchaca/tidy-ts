import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("DataFrame forEach method test", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
    { name: "Carol", age: 35 },
  ]);

  console.log("=== Testing new forEach method ===");

  // Test new forEach method
  console.log("\n1. Using forEach:");
  const rows: unknown[] = [];
  const indices: number[] = [];

  df.forEach((row, idx) => {
    console.log(`  [${idx}]: ${row.name} is ${row.age} years old`);
    rows.push(row);
    indices.push(idx);
  });

  console.log("Collected rows:", rows.length);
  console.log("Collected indices:", indices);

  // Test backward compatibility with forEachRow
  console.log("\n2. Using forEachRow (backward compatibility):");
  const backwardRows: unknown[] = [];

  df.forEachRow((row, idx) => {
    console.log(`  [${idx}]: ${row.name} (backward compat)`);
    backwardRows.push(row);
  });

  console.log("Backward compat rows:", backwardRows.length);

  // Test that both return the same DataFrame for chaining
  console.log("\n3. Testing method chaining:");
  const result1 = df.forEach(() => {}).nrows();
  const result2 = df.forEachRow(() => {}).nrows();

  console.log("forEach chain result:", result1);
  console.log("forEachRow chain result:", result2);

  // Test with grouped DataFrame
  console.log("\n4. Testing with grouped DataFrame:");
  const grouped = df.groupBy(["age"]);

  grouped.forEach((row, idx) => {
    console.log(`  Grouped [${idx}]: ${row.name}`);
  });

  console.log("✅ All forEach tests completed successfully!");
});
