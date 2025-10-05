import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("count() works with PromisedDataFrame (async mutate)", async () => {
  const df = createDataFrame([
    { id: 1, category: "A" },
    { id: 2, category: "B" },
    { id: 3, category: "A" },
  ]);

  // Create a PromisedDataFrame via async mutate
  const promised = df.mutate({
    asyncData: async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return `data_${row.id}`;
    },
  });

  // Count should work on the PromisedDataFrame
  const counted = promised.count("category");

  // Await the result
  const result = await counted;

  expect(result.nrows()).toBe(2);
  const rows = result.toArray();
  expect(rows).toContainEqual({ category: "A", n: 2 });
  expect(rows).toContainEqual({ category: "B", n: 1 });
});

Deno.test("count() after async filter", async () => {
  const df = createDataFrame([
    { id: 1, category: "A", value: 10 },
    { id: 2, category: "B", value: 20 },
    { id: 3, category: "A", value: 30 },
    { id: 4, category: "B", value: 40 },
  ]);

  // Create PromisedDataFrame via async filter
  const filtered = df.filter(async (row) => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return row.value > 15;
  });

  // Count on the filtered result
  const counted = filtered.count("category");

  const result = await counted;

  expect(result.nrows()).toBe(2);
  const rows = result.toArray();
  expect(rows).toContainEqual({ category: "A", n: 1 }); // id 3
  expect(rows).toContainEqual({ category: "B", n: 2 }); // id 2, 4
});

Deno.test("count() in async pipeline", async () => {
  const df = createDataFrame([
    { user_role: "Clinician", score: 5 },
    { user_role: "RN", score: 3 },
    { user_role: "Clinician", score: 8 },
    { user_role: "MA", score: 4 },
  ]);

  const result = await df
    .mutate({
      grade: async (row) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return row.score > 5 ? "High" : "Low";
      },
    })
    .count("user_role");

  expect(result.nrows()).toBe(3);
  const rows = result.toArray();
  expect(rows).toContainEqual({ user_role: "Clinician", n: 2 });
  expect(rows).toContainEqual({ user_role: "RN", n: 1 });
  expect(rows).toContainEqual({ user_role: "MA", n: 1 });
});
