// deno-lint-ignore-file no-explicit-any
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Simple async function for testing
async function doubleAsync(value: number): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return value * 2;
}

// DataFrames are the core data structure in tidy-ts
// They're created from arrays of objects, where each object represents a row
// and the object keys become column names
const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
  { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
]);

Deno.test("mutate with async function - comprehensive workflow", async () => {
  async function enrichBMICategory(bmi: number): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (bmi < 18.5) return "💡 Underweight";
    if (bmi < 25) return "✅ Healthy";
    if (bmi < 30) return "⚠️ Overweight";
    return "🚨 Obese";
  }

  const afterFilter = people
    .mutate({
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
      is_heavy: (row) => row.mass > 100,
      bmi_category: async (row) =>
        await enrichBMICategory(row.mass / Math.pow(row.height / 100, 2)),
    })
    .filter(async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return row.species !== "Droid";
    });

  console.log(
    "afterFilter __thenableDataFrame:",
    (afterFilter as any)[Symbol.for("__thenableDataFrame")],
    "typeof select:",
    typeof (afterFilter as any).select,
  );

  const asyncFinalResult = await (afterFilter as any).select(
    "name",
    "species",
    "mass",
    "height",
    "bmi",
    "bmi_category",
    "is_heavy",
  );

  console.log("Async final result with enriched BMI categories:");
  asyncFinalResult.print();
});

Deno.test("mutate with async function - simplest case", async () => {
  const df = createDataFrame([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
  ]);

  console.log("Original DataFrame:");
  df.print();

  // Test async function in mutate
  const result = await df.mutate({
    doubled: async (r) => await doubleAsync(r.value),
  });

  console.log("\nResult with async function:");
  result.print();

  // Check that values are resolved, not Promises
  const data = result.toArray();
  expect(data[0].doubled).toBe(20); // 10 * 2
  expect(data[1].doubled).toBe(40); // 20 * 2

  // Ensure they're not Promise objects
  expect(typeof data[0].doubled).toBe("number");
  expect(typeof data[1].doubled).toBe("number");
});

Deno.test("mutate with mixed sync/async functions", async () => {
  const df = createDataFrame([
    { id: 1, value: 5 },
    { id: 2, value: 15 },
  ]);

  const result = await df.mutate({
    sync_triple: (r) => r.value * 3, // sync function
    async_double: async (r) => await doubleAsync(r.value), // async function
  });

  result.print();

  const data = result.toArray();
  expect(data[0].sync_triple).toBe(15); // 5 * 3
  expect(data[0].async_double).toBe(10); // 5 * 2
  expect(data[1].sync_triple).toBe(45); // 15 * 3
  expect(data[1].async_double).toBe(30); // 15 * 2
});

Deno.test("async mutate with chaining - comprehensive workflow", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", value: 10, category: "A" },
    { id: 2, name: "Bob", value: 20, category: "B" },
    { id: 3, name: "Charlie", value: 30, category: "A" },
    { id: 4, name: "Diana", value: 40, category: "B" },
  ]);

  console.log("Original data:");
  df.print();

  // Chain operations: filter -> async mutate -> arrange -> select
  const afterFilter = df.filter((r) => r.value >= 15); // Remove Alice (value: 10)

  const afterAsyncMutate = await afterFilter.mutate({
    // Mixed sync/async functions
    name_upper: (r) => r.name.toUpperCase(),
    async_doubled: async (r) => await doubleAsync(r.value),
    value_category: (r) => `${r.value}-${r.category}`,
  });

  const result = afterAsyncMutate
    .arrange("async_doubled") // Sort by the async-computed column
    .select("name", "name_upper", "async_doubled", "value_category");

  console.log("\nAfter filter -> async mutate -> arrange -> select:");
  result.print();

  const data = result.toArray();

  // Should have Bob, Charlie, Diana (Alice filtered out)
  expect(data.length).toBe(3);

  // Check the first row (should be Bob with smallest doubled value: 40)
  expect(data[0].name).toBe("Bob");
  expect(data[0].name_upper).toBe("BOB");
  expect(data[0].async_doubled).toBe(40); // 20 * 2
  expect(data[0].value_category).toBe("20-B");

  // Check the last row (should be Diana with largest doubled value: 80)
  expect(data[2].name).toBe("Diana");
  expect(data[2].name_upper).toBe("DIANA");
  expect(data[2].async_doubled).toBe(80); // 40 * 2
  expect(data[2].value_category).toBe("40-B");
});

Deno.test("chaining before and after async mutate", async () => {
  const df = createDataFrame([
    { category: "X", score: 100 },
    { category: "Y", score: 200 },
    { category: "X", score: 150 },
    { category: "Y", score: 250 },
  ]);

  // Complex chaining: arrange -> mutate (sync) -> async mutate -> filter -> mutate (sync)
  const afterArrange = df.arrange("score"); // Sort by score first
  console.log("\nAfter arrange:");
  afterArrange.print();

  const afterSync = afterArrange.mutate({
    baseline: (r) => r.score - 50, // Sync mutate before async
  });
  console.log("\nAfter sync mutate (baseline):");
  afterSync.print();

  const afterAsync = await afterSync.mutate({
    // Async mutate in the middle
    async_bonus: async (r) => {
      console.log(
        `Computing async_bonus for score: ${r.score}, baseline: ${r.baseline}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1));
      const bonus = r.baseline * 0.1; // 10% of baseline as bonus
      console.log(`Computed bonus: ${bonus}`);
      return bonus;
    },
  });
  console.log("\nAfter async mutate (async_bonus):");
  afterAsync.print();

  const afterFilter = afterAsync.filter((r) => r.async_bonus > 5); // Filter based on async-computed column
  console.log("\nAfter filter (async_bonus > 5):");
  afterFilter.print();

  const result = afterFilter.mutate({
    final_score: (r) => r.score + r.async_bonus, // Sync mutate after async
  });

  console.log("Complex chaining result:");
  result.print();

  const data = result.toArray();

  // Should have filtered out the first row (score: 100, baseline: 50, async_bonus: 5)
  expect(data.length).toBe(3);

  // Check that async_bonus values are computed correctly and > 5
  expect(data[0].async_bonus).toBeCloseTo(10, 1); // (150-50)*0.1 = 10
  expect(data[1].async_bonus).toBeCloseTo(15, 1); // (200-50)*0.1 = 15
  expect(data[2].async_bonus).toBeCloseTo(20, 1); // (250-50)*0.1 = 20

  // Check that final_score is computed correctly
  expect(data[0].final_score).toBeCloseTo(160, 1); // 150 + 10
  expect(data[2].final_score).toBeCloseTo(270, 1); // 250 + 20
});
