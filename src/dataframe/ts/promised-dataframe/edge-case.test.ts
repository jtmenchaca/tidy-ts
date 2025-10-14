import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Async error in mutate propagates correctly", async () => {
  const data = createDataFrame([{ id: 1 }, { id: 2 }]);

  await expect(
    data.mutate({
      bad: async (row) => {
        if (row.id === 2) {
          throw new Error("Async operation failed");
        }
        return row.id;
      },
    }),
  ).rejects.toThrow("Async operation failed");
});

Deno.test("Async error in filter propagates correctly", async () => {
  const data = createDataFrame([{ id: 1 }, { id: 2 }]);

  await expect(
    data.filter(async (row) => {
      if (row.id === 2) {
        throw new Error("Filter failed");
      }
      return true;
    }),
  ).rejects.toThrow("Filter failed");
});

Deno.test("Multiple async mutates with different timing", async () => {
  const data = createDataFrame([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const result = await data.mutate({
    fast: async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return row.id * 10;
    },
    slow: async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return row.id * 100;
    },
  });

  const arr = result.toArray();
  expect(arr[0]).toEqual({ id: 1, fast: 10, slow: 100 });
  expect(arr[1]).toEqual({ id: 2, fast: 20, slow: 200 });
  expect(arr[2]).toEqual({ id: 3, fast: 30, slow: 300 });
});

Deno.test("Chained async operations maintain order", async () => {
  const data = createDataFrame([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const result = await data
    .mutate({
      step1: async (row) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return row.id * 2;
      },
    })
    .filter(async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return row.step1 > 2;
    })
    .mutate({
      step2: async (row) => {
        await new Promise((resolve) => setTimeout(resolve, 8));
        return row.step1 + 100;
      },
    });

  result.print();

  const arr = result.toArray();
  expect(arr.length).toBe(2);
  expect(arr[0]).toEqual({ id: 2, step1: 4, step2: 104 });
  expect(arr[1]).toEqual({ id: 3, step1: 6, step2: 106 });
});

Deno.test("Async operation with Promise.reject", async () => {
  const data = createDataFrame([{ id: 1 }]);

  await expect(
    data.mutate({
      rejected: async () => {
        return Promise.reject(new Error("Rejected promise"));
      },
    }),
  ).rejects.toThrow("Rejected promise");
});

Deno.test("Race condition: shared state in async mutate", async () => {
  let counter = 0;
  const data = createDataFrame([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const result = await data.mutate({
    order: async () => {
      const current = counter++;
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));
      return current;
    },
  });

  const orders = result.toArray().map((r) => r.order);
  expect(orders).toEqual([0, 1, 2]);
});

Deno.test("Empty DataFrame with async operations", async () => {
  const empty = createDataFrame([]);

  const result = await empty
    .mutate({
      value: async () => 42,
    })
    .filter(async () => true);

  expect(result.nrows()).toBe(0);
});

Deno.test("Async mutate with dependent columns", async () => {
  const data = createDataFrame([{ id: 1 }, { id: 2 }]);

  const withA = await data.mutate({
    a: async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return row.id * 10;
    },
  });

  const result = await withA.mutate({
    b: async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 3));
      return row.a * 2;
    },
  });

  const arr = result.toArray();
  expect(arr[0]).toEqual({ id: 1, a: 10, b: 20 });
  expect(arr[1]).toEqual({ id: 2, a: 20, b: 40 });
});

Deno.test("Async filter with all false returns empty", async () => {
  const data = createDataFrame([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const result = await data.filter(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return false;
  });

  expect(result.nrows()).toBe(0);
});
