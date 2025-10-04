import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("DataFrame minimal iterator test", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
    { name: "Carol", age: 35 },
  ]);

  console.log("=== Basic DataFrame iteration ===");

  // Test for...of (iterates over values/rows)
  console.log("\n1. for (const row of df):");
  for (const row of df) {
    console.log("  Row:", row);
  }

  // Test for...in (iterates over keys/indices)
  console.log("\n2. for (const key in df):");
  for (const key in df) {
    console.log("  Key:", key, "Type:", typeof key);
    console.log("  Value:", df[key]);
  }

  // Test direct index access
  console.log("\n3. Direct index access:");
  console.log("  df[0]:", df[0]);
  console.log("  df[1]:", df[1]);
  console.log("  df[2]:", df[2]);
  console.log("  df[3]:", df[3]); // Should be undefined

  // Test with destructuring in for...of
  console.log("\n4. Destructuring in for...of:");
  for (const { name, age } of df) {
    console.log(`  ${name} is ${age} years old`);
  }

  // Test spread operator
  console.log("\n5. Spread operator:");
  const rows = [...df];
  console.log("  Spread result:", rows);

  // Test Array.from
  console.log("\n6. Array.from:");
  const arrayFromDf = Array.from(df);
  console.log("  Array.from result:", arrayFromDf);

  // Test with index tracking
  console.log("\n7. Manual index in for...of:");
  let index = 0;
  for (const row of df) {
    console.log(`  [${index}]:`, row);
    index++;
  }
});
