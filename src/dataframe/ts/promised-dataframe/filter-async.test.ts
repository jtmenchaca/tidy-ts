import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Simple async predicate functions for testing
async function isValidAsync(value: number): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return value > 15; // Simulate async validation
}

async function checkCategoryAsync(category: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return category === "A"; // Simulate async category lookup
}

Deno.test("filter with async function - simplest case", async () => {
  const df = createDataFrame([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
  ]);

  console.log("Original DataFrame:");
  df.print();

  const result = await df.filter(async (row) => await isValidAsync(row.value));

  console.log("\nResult with async filter:");
  result.print();

  // Should have filtered out the first row (value: 10)
  const data = result.toArray();
  expect(data.length).toBe(2);
  expect(data[0].value).toBe(20);
  expect(data[1].value).toBe(30);
});

Deno.test("filter with sync function - comparison", () => {
  const df = createDataFrame([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
  ]);

  // Sync filter should return DataFrame directly
  const result = df.filter((row) => row.value > 15);

  result.print();

  const data = result.toArray();
  expect(data.length).toBe(2);
  expect(data[0].value).toBe(20);
  expect(data[1].value).toBe(30);
});

Deno.test("filter with mixed async predicates", async () => {
  const df = createDataFrame([
    { id: 1, category: "A", value: 25 },
    { id: 2, category: "B", value: 20 },
    { id: 3, category: "A", value: 10 },
    { id: 4, category: "B", value: 35 },
  ]);

  console.log("Original data:");
  df.print();

  // EXPECTED: Multiple async predicates (all must be true)
  const result = await df.filter(
    async (row) => await checkCategoryAsync(row.category),
    async (row) => await isValidAsync(row.value),
  );

  console.log("\nFiltered with async predicates (category=A AND value>15):");
  result.print();

  const data = result.toArray();
  // Should have only row with id=1 (category="A" and value=25)
  expect(data.length).toBe(1);
  expect(data[0].id).toBe(1);
  expect(data[0].category).toBe("A");
  expect(data[0].value).toBe(25);
});

Deno.test("async filter with chaining", async () => {
  const df = createDataFrame([
    { name: "Alice", score: 85, category: "A" },
    { name: "Bob", score: 92, category: "B" },
    { name: "Charlie", score: 78, category: "A" },
    { name: "Diana", score: 95, category: "B" },
  ]);

  console.log("Original data:");
  df.print();

  // Chain: async filter -> mutate -> arrange
  const afterAsyncFilter = await df.filter(async (row) => {
    console.log(`Checking ${row.name} with score ${row.score}`);
    return await isValidAsync(row.score - 65); // score > 80 (filters out Charlie with 78)
  });

  const result = afterAsyncFilter
    .mutate({
      grade: (r) => r.score >= 90 ? "A" : "B",
    })
    .arrange("score");

  console.log("\nAfter async filter -> mutate -> arrange:");
  result.print();

  const data = result.toArray();

  // Should have Alice (85), Bob (92), Diana (95) - Charlie filtered out
  expect(data.length).toBe(3);
  expect(data[0].name).toBe("Alice"); // lowest score
  expect(data[0].grade).toBe("B"); // 85 < 90
  expect(data[2].name).toBe("Diana"); // highest score
  expect(data[2].grade).toBe("A"); // 95 >= 90
});

Deno.test("async filter error handling", async () => {
  const df = createDataFrame([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
  ]);

  // EXPECTED: Async filter with error handling
  const result = await df.filter(async (row) => {
    try {
      return await isValidAsync(row.value);
    } catch {
      return false; // Default to exclude on error
    }
  });

  console.log("Result with error handling:");
  result.print();

  const data = result.toArray();
  expect(data.length).toBe(1); // Only the valid row (value=20)
  expect(data[0].value).toBe(20);
});
