import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Simple async aggregation functions for testing
async function asyncSum(values: readonly number[]): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return values.reduce((sum, val) => sum + val, 0);
}

async function asyncMean(values: readonly number[]): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

// deno-lint-ignore no-explicit-any
async function asyncCount(df: any): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return df.nrows();
}

Deno.test("summarise with async function - simplest case", async () => {
  const df = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "B", value: 30 },
    { category: "B", value: 40 },
  ]);

  console.log("Original DataFrame:");
  df.print();

  // EXPECTED BEHAVIOR: Auto-detection should make this return Promise<DataFrame>
  const result = await df.summarise({
    total_sum: async (df) => await asyncSum(df.value),
    avg_value: async (df) => await asyncMean(df.value),
  });

  console.log("\nResult with async summarise:");
  result.print();

  // Should have one row with aggregated values
  const data = result.toArray();
  expect(data.length).toBe(1);
  expect(data[0].total_sum).toBe(100); // 10+20+30+40
  expect(data[0].avg_value).toBe(25); // 100/4
});

Deno.test("summarise with sync function - comparison", () => {
  const df = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "B", value: 30 },
    { category: "B", value: 40 },
  ]);

  // Sync summarise should return DataFrame directly
  const result = df.summarise({
    total_sum: (df) => df.value.reduce((sum, val) => sum + val, 0),
    count: (df) => df.nrows(),
  });

  result.print();

  const data = result.toArray();
  expect(data.length).toBe(1);
  expect(data[0].total_sum).toBe(100);
  expect(data[0].count).toBe(4);
});

Deno.test("grouped summarise with async functions", async () => {
  const df = createDataFrame([
    { category: "A", value: 10, score: 85 },
    { category: "A", value: 20, score: 90 },
    { category: "B", value: 30, score: 75 },
    { category: "B", value: 40, score: 95 },
  ]);

  console.log("Original data:");
  df.print();

  // EXPECTED: Grouped async summarise
  const result = await df
    .groupBy("category")
    .summarise({
      async_sum: async (df) => await asyncSum(df.value),
      async_mean: async (df) => await asyncMean(df.score),
      async_count: async (df) => await asyncCount(df),
    });

  console.log("\nGrouped async summarise result:");
  result.print();

  const data = result.toArray();
  expect(data.length).toBe(2); // Two groups: A and B

  const groupA = data.find((row) => row.category === "A");
  const groupB = data.find((row) => row.category === "B");

  expect(groupA?.async_sum).toBe(30); // 10+20
  expect(groupA?.async_mean).toBe(87.5); // (85+90)/2
  expect(groupA?.async_count).toBe(2);

  expect(groupB?.async_sum).toBe(70); // 30+40
  expect(groupB?.async_mean).toBe(85); // (75+95)/2
  expect(groupB?.async_count).toBe(2);
});

Deno.test("mixed sync/async summarise", async () => {
  const df = createDataFrame([
    { type: "X", amount: 100, quantity: 5 },
    { type: "Y", amount: 200, quantity: 3 },
    { type: "X", amount: 150, quantity: 7 },
  ]);

  console.log("Original data:");
  df.print();

  // EXPECTED: Mixed sync and async aggregation functions
  const result = await df.summarise({
    sync_total: (df) => df.amount.reduce((sum, val) => sum + val, 0), // sync
    async_avg: async (df) => await asyncMean(df.quantity), // async
    sync_count: (df) => df.nrows(), // sync
    async_sum_qty: async (df) => await asyncSum(df.quantity), // async
  });

  console.log("\nMixed sync/async summarise result:");
  result.print();

  const data = result.toArray();
  expect(data.length).toBe(1);
  expect(data[0].sync_total).toBe(450); // 100+200+150
  expect(data[0].async_avg).toBeCloseTo(5, 1); // (5+3+7)/3
  expect(data[0].sync_count).toBe(3);
  expect(data[0].async_sum_qty).toBe(15); // 5+3+7
});

Deno.test("async summarise with chaining", async () => {
  const df = createDataFrame([
    { region: "North", sales: 1000, cost: 600 },
    { region: "South", sales: 1500, cost: 900 },
    { region: "North", sales: 800, cost: 500 },
    { region: "South", sales: 1200, cost: 700 },
  ]);

  console.log("Original data:");
  df.print();

  // Chain: filter -> groupBy -> async summarise -> mutate
  const afterFilter = df.filter((row) => row.sales > 900);

  const afterAsyncSummarise = await afterFilter
    .groupBy("region")
    .summarise({
      total_sales: async (df) => await asyncSum(df.sales),
      avg_cost: async (df) => await asyncMean(df.cost),
    });

  const result = afterAsyncSummarise.mutate({
    profit: (r) => (r.total_sales as number) - (r.avg_cost as number),
  });

  console.log("\nAfter filter -> groupBy -> async summarise -> mutate:");
  result.print();

  const data = result.toArray();
  expect(data.length).toBe(2); // Two regions

  const north = data.find((row) => row.region === "North");
  const south = data.find((row) => row.region === "South");

  expect(north?.total_sales).toBe(1000); // Only sales > 900 from North
  expect(south?.total_sales).toBe(2700); // 1500 + 1200
  expect(south?.avg_cost).toBe(800); // (900 + 700) / 2
});
