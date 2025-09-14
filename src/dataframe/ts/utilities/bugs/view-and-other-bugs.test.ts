import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("View awareness bugs - fixed verbs should respect filtered/arranged state", async () => {
  console.log("\n=== TESTING VIEW AWARENESS FIXES ===\n");

  // Create test data
  const df = createDataFrame([
    { id: 1, name: "Alice", value: 10, category: "A" },
    { id: 2, name: "Bob", value: 20, category: "B" },
    { id: 3, name: "Charlie", value: 30, category: "A" },
    { id: 4, name: "David", value: 40, category: "B" },
    { id: 5, name: "Eve", value: 50, category: "A" },
  ]);

  console.log("Original data:");
  df.print();

  // Create a filtered and arranged view
  const filtered = df.filter((row) => row.value >= 20);
  const filteredAndArranged = filtered.arrange("value", "desc");

  console.log("\nAfter filter (value >= 20) + arrange (desc):");
  filteredAndArranged.print();

  // Test 1: head should respect the view (should get Eve with value 50)
  console.log("\n--- Test 1: head(1) after filter+arrange ---");
  const headResult = await filteredAndArranged.head(1);
  headResult.print();

  expect(headResult.nrows()).toBe(1);
  expect(headResult.extract("name")).toEqual(["Eve"]);
  expect(headResult.extract("value")).toEqual([50]);

  // Test 2: tail should respect the view (should get Bob with value 20)
  console.log("\n--- Test 2: tail(1) after filter+arrange ---");
  const tailResult = await filteredAndArranged.tail(1);
  tailResult.print();

  expect(tailResult.nrows()).toBe(1);
  expect(tailResult.extract("name")).toEqual(["Bob"]);
  expect(tailResult.extract("value")).toEqual([20]);

  // Test 3: slice should respect the view (get first 2 rows)
  console.log("\n--- Test 3: slice(0, 2) after filter+arrange ---");
  const sliceResult = await filteredAndArranged.slice(0, 2);
  sliceResult.print();

  expect(sliceResult.nrows()).toBe(2);
  expect(sliceResult.extract("name")).toEqual(["Eve", "David"]);
  expect(sliceResult.extract("value")).toEqual([50, 40]);

  // Test 4: sliceMin should respect the view
  console.log("\n--- Test 4: sliceMin('value', 1) after filter+arrange ---");
  const sliceMinResult = await filteredAndArranged.sliceMin("value", 1);
  sliceMinResult.print();

  expect(sliceMinResult.nrows()).toBe(1);
  expect(sliceMinResult.extract("name")).toEqual(["Bob"]);
  expect(sliceMinResult.extract("value")).toEqual([20]);

  // Test 5: sliceMax should respect the view
  console.log("\n--- Test 5: sliceMax('value', 1) after filter+arrange ---");
  const sliceMaxResult = await filteredAndArranged.sliceMax("value", 1);
  sliceMaxResult.print();

  expect(sliceMaxResult.nrows()).toBe(1);
  expect(sliceMaxResult.extract("name")).toEqual(["Eve"]);
  expect(sliceMaxResult.extract("value")).toEqual([50]);

  // Test 6: rename should respect the view
  console.log("\n--- Test 6: rename after filter+arrange ---");
  const renameResult = await filteredAndArranged.rename({
    full_name: "name",
    amount: "value",
  });
  renameResult.print();

  expect(renameResult.nrows()).toBe(4); // Should have 4 filtered rows
  expect(renameResult.columns().includes("full_name")).toBe(true);
  expect(renameResult.columns().includes("amount")).toBe(true);
  expect(renameResult.columns().includes("name")).toBe(false); // old name should be gone
  expect(renameResult.extract("full_name")).toEqual([
    "Eve",
    "David",
    "Charlie",
    "Bob",
  ]);
  expect(renameResult.extract("amount")).toEqual([50, 40, 30, 20]);

  // Test 7: drop should respect the view
  console.log("\n--- Test 7: drop after filter+arrange ---");
  const dropResult = await filteredAndArranged.drop("category");
  dropResult.print();

  expect(dropResult.nrows()).toBe(4); // Should have 4 filtered rows
  expect(dropResult.columns().includes("category")).toBe(false);
  expect(dropResult.columns().includes("name")).toBe(true);
  expect(dropResult.extract("name")).toEqual([
    "Eve",
    "David",
    "Charlie",
    "Bob",
  ]);
  expect(dropResult.extract("value")).toEqual([50, 40, 30, 20]);

  // Test 8: mutateColumns should respect the view
  console.log("\n--- Test 8: mutateColumns after filter+arrange ---");
  const mutateColsResult = await filteredAndArranged.mutateColumns({
    col_type: "number" as const,
    columns: ["value"] as const,
    new_columns: [
      { prefix: "double_", fn: (col: number) => col * 2 },
    ] as const,
  });
  mutateColsResult.print();

  expect(mutateColsResult.nrows()).toBe(4); // Should have 4 filtered rows
  expect(mutateColsResult.columns().includes("double_value")).toBe(true);
  expect(mutateColsResult.extract("name")).toEqual([
    "Eve",
    "David",
    "Charlie",
    "Bob",
  ]);
  expect(mutateColsResult.extract("double_value")).toEqual([100, 80, 60, 40]); // doubled values from filtered view
});

Deno.test("View awareness with distinct and slice chaining", () => {
  console.log("\n=== TESTING DISTINCT AND SLICE CHAINING ===\n");

  // Test the specific bugs that were reported in dataframe-async-testing.test.ts
  const df = createDataFrame([
    { id: 1, category: "low", value: 10 },
    { id: 2, category: "low", value: 15 },
    { id: 3, category: "high", value: 25 },
    { id: 4, category: "high", value: 30 },
  ]);

  console.log("Original data:");
  df.print();

  // Test distinct with column parameter after filter
  console.log("\n--- Test: distinct('category') after filtering ---");
  const filtered = df.filter((row) => row.value >= 15);
  console.log("After filter (value >= 15):");
  filtered.print();

  const distinctResult = filtered.distinct("category");
  console.log("After distinct('category'):");
  distinctResult.print();

  expect(distinctResult.nrows()).toBe(2); // Should have 2 unique categories
  expect([...new Set(distinctResult.extract("category"))].sort()).toEqual([
    "high",
    "low",
  ]);

  // Test slice after arrange
  console.log("\n--- Test: slice after arrange ---");
  const arranged = df.arrange("value", "desc");
  console.log("After arrange (value desc):");
  arranged.print();

  const sliceResult = arranged.slice(0, 2);
  console.log("After slice(0, 2):");
  sliceResult.print();

  expect(sliceResult.nrows()).toBe(2);
  expect(sliceResult.extract("value")).toEqual([30, 25]); // Should get highest values
});

Deno.test("View awareness edge cases", async () => {
  console.log("\n=== TESTING VIEW AWARENESS EDGE CASES ===\n");

  const df = createDataFrame([
    { id: 1, name: "A", score: 100 },
    { id: 2, name: "B", score: 200 },
    { id: 3, name: "C", score: 300 },
    { id: 4, name: "D", score: 400 },
    { id: 5, name: "E", score: 500 },
  ]);

  // Test 1: Empty result after filtering
  console.log("\n--- Test 1: Operations on empty filtered result ---");
  const emptyFiltered = df.filter((row) => row.score > 1000); // No matches
  expect(emptyFiltered.nrows()).toBe(0);

  const emptyHead = await emptyFiltered.head(2);
  expect(emptyHead.nrows()).toBe(0);

  const emptyRename = await emptyFiltered.rename({ full_name: "name" });
  expect(emptyRename.nrows()).toBe(0);

  // Test 2: Single row result
  console.log("\n--- Test 2: Operations on single row filtered result ---");
  const singleFiltered = df.filter((row) => row.score === 300);
  expect(singleFiltered.nrows()).toBe(1);

  const singleHead = await singleFiltered.head(5); // Request more than available
  expect(singleHead.nrows()).toBe(1);
  expect(singleHead.extract("name")).toEqual(["C"]);

  // Test 3: Chained view operations
  console.log("\n--- Test 3: Multiple chained view operations ---");
  const chainedResult = await df
    .filter((row) => row.score >= 200) // Should have B, C, D, E
    .arrange("score", "desc") // Should order E, D, C, B
    .head(3) // Should get E, D, C
    .drop("id") // Should remove id column
    .rename({ full_name: "name" }); // Should rename name to full_name

  chainedResult.print();

  expect(chainedResult.nrows()).toBe(3);
  expect(chainedResult.extract("full_name")).toEqual(["E", "D", "C"]);
  expect(chainedResult.extract("score")).toEqual([500, 400, 300]);
  expect(chainedResult.columns().includes("id")).toBe(false);
  expect(chainedResult.columns().includes("full_name")).toBe(true);
});
