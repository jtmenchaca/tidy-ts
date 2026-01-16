import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("filter sync", () => {
  const data = createDataFrame([
    { product: "Widget A" },
    { product: "Widget C" },
  ]);

  const result = data.filter((_row) => true);
  expect(result.nrows()).toBe(2);
});

Deno.test("filter async", async () => {
  const data = createDataFrame([
    { product: "Widget A" },
    { product: "Widget C" },
  ]);

  const result = await data.filter(async (_row) => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return true;
  });
  expect(result.nrows()).toBe(2);
});

Deno.test("mutate sync", () => {
  const data = createDataFrame([
    { product: "Widget A", value: 10 },
    { product: "Widget C", value: 20 },
  ]);

  const result = data.mutate({
    doubled: (row) => row.value * 2,
  });

  const arr = result.toArray();
  expect(arr[0].doubled).toBe(20);
  expect(arr[1].doubled).toBe(40);
});

Deno.test("mutate async", async () => {
  const data = createDataFrame([
    { product: "Widget A", value: 10 },
    { product: "Widget C", value: 20 },
  ]);

  const result = await data.mutate({
    doubled: async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return row.value * 2;
    },
  });

  const arr = result.toArray();
  expect(arr[0].doubled).toBe(20);
  expect(arr[1].doubled).toBe(40);
});

Deno.test("filter sync + mutate sync", () => {
  const data = createDataFrame([
    { product: "Widget A", value: 10 },
    { product: "Widget C", value: 20 },
  ]);

  const result = data
    .filter((_row) => true)
    .mutate({
      doubled: (row) => row.value * 2,
    });

  const arr = result.toArray();
  expect(arr[0].doubled).toBe(20);
  expect(arr[1].doubled).toBe(40);
});

Deno.test("filter async + mutate sync", async () => {
  const data = createDataFrame([
    { product: "Widget A", value: 10 },
    { product: "Widget C", value: 20 },
  ]);

  const result = await data
    .filter(async (_row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return true;
    })
    .mutate({
      doubled: (row) => row.value * 2,
    });

  const arr = result.toArray();
  expect(arr[0].doubled).toBe(20);
  expect(arr[1].doubled).toBe(40);
});

Deno.test("filter async + mutate async", async () => {
  const data = createDataFrame([
    { product: "Widget A", value: 10 },
    { product: "Widget C", value: 20 },
  ]);

  const result = await data
    .filter(async (_row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return true;
    })
    .mutate({
      doubled: async (row) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return row.value * 2;
      },
    });

  const arr = result.toArray();
  expect(arr[0].doubled).toBe(20);
  expect(arr[1].doubled).toBe(40);
});

const groupedData = createDataFrame([
  { category: "A", product: "Widget A", value: 10, region: "East" },
  { category: "A", product: "Widget B", value: 20, region: "West" },
  { category: "B", product: "Widget C", value: 30, region: "East" },
  { category: "B", product: "Widget D", value: 40, region: "West" },
  { category: "A", product: "Widget E", value: 15, region: "East" },
  { category: "B", product: "Widget F", value: 35, region: "West" },
]);

Deno.test("groupBy + filter sync + mutate sync", () => {
  const result = groupedData
    .groupBy("category")
    .filter((row) => row.value > 10)
    .mutate({ doubled: (row) => row.value * 2 });

  const arr = result.toArray();
  // Expected:
  // Category A: Widget B (20 -> 40), Widget E (15 -> 30)
  // Category B: Widget C (30 -> 60), Widget D (40 -> 80), Widget F (35 -> 70)
  expect(arr.filter((r) => r.category === "A").length).toBe(2);
  expect(arr.find((r) => r.product === "Widget B")?.doubled).toBe(40);
  expect(arr.find((r) => r.product === "Widget E")?.doubled).toBe(30);
  expect(arr.filter((r) => r.category === "B").length).toBe(3);
  expect(arr.find((r) => r.product === "Widget C")?.doubled).toBe(60);
});

Deno.test("groupBy + filter sync + mutate async", async () => {
  const result = await groupedData
    .groupBy("category")
    .filter((row) => row.value > 10)
    .mutate({
      doubled: async (row) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return row.value * 2;
      },
    });

  const arr = result.toArray();
  expect(arr.filter((r) => r.category === "A").length).toBe(2);
  expect(arr.find((r) => r.product === "Widget B")?.doubled).toBe(40);
  expect(arr.find((r) => r.product === "Widget E")?.doubled).toBe(30);
  expect(arr.filter((r) => r.category === "B").length).toBe(3);
  expect(arr.find((r) => r.product === "Widget C")?.doubled).toBe(60);
});

Deno.test("groupBy + filter async + mutate sync", async () => {
  const result = await groupedData
    .groupBy("category")
    .filter(async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return row.value > 10;
    })
    .mutate({ doubled: (row) => row.value * 2 });

  const arr = result.toArray();
  expect(arr.filter((r) => r.category === "A").length).toBe(2);
  expect(arr.find((r) => r.product === "Widget B")?.doubled).toBe(40);
  expect(arr.find((r) => r.product === "Widget E")?.doubled).toBe(30);
  expect(arr.filter((r) => r.category === "B").length).toBe(3);
  expect(arr.find((r) => r.product === "Widget C")?.doubled).toBe(60);
});

Deno.test("groupBy + filter async + mutate async", async () => {
  const result = await groupedData
    .groupBy("category")
    .filter(async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return row.value > 10;
    })
    .mutate({
      doubled: async (row) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return row.value * 2;
      },
    });

  const arr = result.toArray();
  expect(arr.filter((r) => r.category === "A").length).toBe(2);
  expect(arr.find((r) => r.product === "Widget B")?.doubled).toBe(40);
  expect(arr.find((r) => r.product === "Widget E")?.doubled).toBe(30);
  expect(arr.filter((r) => r.category === "B").length).toBe(3);
  expect(arr.find((r) => r.product === "Widget C")?.doubled).toBe(60);
});

Deno.test("filter sync + mutate sync + groupBy", () => {
  const result = groupedData
    .filter((row) => row.value > 10)
    .mutate({ doubled: (row) => row.value * 2 })
    .groupBy("category");

  const arr = result.toArray();
  // Check if grouping is preserved and values are correct
  expect(result.__groups).toBeDefined();
  expect(result.__groups?.groupingColumns).toEqual(["category"]);
  expect(arr.filter((r) => r.category === "A").length).toBe(2);
  expect(arr.find((r) => r.product === "Widget B")?.doubled).toBe(40);
  expect(arr.find((r) => r.product === "Widget E")?.doubled).toBe(30);
});

Deno.test("filter sync + mutate async + groupBy", async () => {
  const result = await groupedData
    .filter((row) => row.value > 10)
    .mutate({
      doubled: async (row) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return row.value * 2;
      },
    })
    .groupBy("category");

  const arr = result.toArray();
  expect(result.__groups).toBeDefined();
  expect(result.__groups?.groupingColumns).toEqual(["category"]);
  expect(arr.filter((r) => r.category === "A").length).toBe(2);
  expect(arr.find((r) => r.product === "Widget B")?.doubled).toBe(40);
  expect(arr.find((r) => r.product === "Widget E")?.doubled).toBe(30);
});

Deno.test("filter async + mutate sync + groupBy", async () => {
  const result = await groupedData
    .filter(async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return row.value > 10;
    })
    .mutate({ doubled: (row) => row.value * 2 })
    .groupBy("category");

  const arr = result.toArray();
  expect(result.__groups).toBeDefined();
  expect(result.__groups?.groupingColumns).toEqual(["category"]);
  expect(arr.filter((r) => r.category === "A").length).toBe(2);
  expect(arr.find((r) => r.product === "Widget B")?.doubled).toBe(40);
  expect(arr.find((r) => r.product === "Widget E")?.doubled).toBe(30);
});

Deno.test("filter async + mutate async + groupBy", async () => {
  const result = await groupedData
    .filter(async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return row.value > 10;
    })
    .mutate({
      doubled: async (row) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return row.value * 2;
      },
    })
    .groupBy("category");

  const arr = result.toArray();
  expect(result.__groups).toBeDefined();
  expect(result.__groups?.groupingColumns).toEqual(["category"]);
  expect(arr.filter((r) => r.category === "A").length).toBe(2);
  expect(arr.find((r) => r.product === "Widget B")?.doubled).toBe(40);
  expect(arr.find((r) => r.product === "Widget E")?.doubled).toBe(30);
});
