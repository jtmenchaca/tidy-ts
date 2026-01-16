import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("BUG: Mutate Working on Original Data Instead of Filtered Data", () => {
  const data = createDataFrame([
    { name: "Alice", age: 30, city: "NYC" },
    { name: "Bob", age: 25, city: "LA" },
    { name: "Charlie", age: 35, city: "NYC" },
  ]);

  // Filter for NYC residents only (should be Alice and Charlie)
  const filtered = data.filter((row) => row.city === "NYC");

  console.log(
    "Filtered DataFrame should only contain NYC residents (Alice and Charlie):",
  );
  filtered.print();

  const mutated = filtered.mutate({
    senior: (row) => {
      const result = row.age >= 35;
      console.log(`Processing ${row.name}: age=${row.age}, senior=${result}`);
      return result;
    },
  });

  console.log(
    "After mutate, the result should only contain Alice and Charlie with correct senior flags:",
  );
  mutated.print();

  // BUG: This test fails because mutate works on original data, not filtered data
  // Expected: Only Alice and Charlie, with Charlie marked as senior=true
  // Actual: Charlie shows as senior=undefined because mutate processed wrong data
  expect(mutated.toArray()).toEqual([
    { name: "Alice", age: 30, city: "NYC", senior: false },
    { name: "Charlie", age: 35, city: "NYC", senior: true },
  ]);
});
