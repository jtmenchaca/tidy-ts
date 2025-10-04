import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("simple concurrency test", async () => {
  const df = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
  ]);

  console.log("Testing filter with concurrency option...");

  const result = await df.filter(async (row) => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return row.age > 20;
  }, { concurrency: 1 });

  console.log("Filter result:", result.toArray());
  console.log("✅ Simple concurrency test passed!");
});
