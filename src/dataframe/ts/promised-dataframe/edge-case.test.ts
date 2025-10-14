import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Async error in mutate propagates correctly", async () => {
  const data = createDataFrame([{ id: 1 }, { id: 2 }]);

  await expect(
    data.mutate({
      // deno-lint-ignore require-await
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
    // deno-lint-ignore require-await
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
      // deno-lint-ignore require-await
      rejected: async () => {
        return Promise.reject(new Error("Rejected promise"));
      },
    }),
  ).rejects.toThrow("Rejected promise");
});
