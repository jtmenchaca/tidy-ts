import { expect } from "@std/expect";
import { stats as s } from "../stats.ts";

// Helper to simulate async operations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function exampleFunction(batch: number[]): Promise<number> {
  await delay(10);
  return batch.reduce((sum, n) => sum + n, 0);
}

Deno.test("s.batch() - basic functionality", async () => {
  const numbers = [1, 2, 3, 4, 5];
  const results = await s.batch(
    numbers,
    (n) => Promise.resolve(n * 2),
  );

  expect(results).toEqual([2, 4, 6, 8, 10]);
});

Deno.test("s.batch() - with concurrency limit", async () => {
  let concurrent = 0;
  let maxConcurrent = 0;

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8];
  await s.batch(
    numbers,
    async (n) => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await delay(20);
      concurrent--;
      return n * 2;
    },
    { concurrency: 3 },
  );

  expect(maxConcurrent).toBeLessThanOrEqual(3);
});

Deno.test("s.batch() - with batch size", async () => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const results = await s.batch(
    numbers,
    (n) => Promise.resolve(n * 2),
    { batchSize: 3 },
  );

  expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
});

Deno.test("s.batch() - with batch delay", async () => {
  const start = Date.now();
  const numbers = [1, 2, 3, 4, 5, 6];

  await s.batch(
    numbers,
    (n) => Promise.resolve(n * 2),
    {
      batchSize: 2,
      batchDelay: 50, // 50ms delay between batches
    },
  );

  const elapsed = Date.now() - start;
  // Should have ~100ms delay (2 delays for 3 batches)
  expect(elapsed).toBeGreaterThanOrEqual(100);
});

Deno.test("s.batch() - with retry on failure", async () => {
  let attempts = 0;

  const results = await s.batch(
    [1, 2],
    (n) => {
      attempts++;
      if (attempts === 1) {
        return Promise.reject(new Error("First attempt fails"));
      }
      return Promise.resolve(n * 2);
    },
    {
      retry: {
        backoff: "exponential",
        maxRetries: 2,
        baseDelay: 10,
      },
    },
  );

  expect(results).toEqual([2, 4]);
  expect(attempts).toBeGreaterThan(2); // Should have retried
});

Deno.test("s.batch() - index parameter", async () => {
  const results = await s.batch(
    ["a", "b", "c"],
    (item, index) => Promise.resolve(`${item}${index}`),
  );

  expect(results).toEqual(["a0", "b1", "c2"]);
});

Deno.test("s.batch() - preserves order", async () => {
  const numbers = [1, 2, 3, 4, 5];
  const results = await s.batch(
    numbers,
    async (n) => {
      // Random delay to test ordering
      await delay(Math.random() * 20);
      return n * 2;
    },
    { concurrency: 5 },
  );

  expect(results).toEqual([2, 4, 6, 8, 10]);
});

Deno.test("s.batch() - works with chunked arrays", async () => {
  const orderProcIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const orderProcIdBatches = s.chunk(orderProcIds, 3);

  const results = await s.batch(
    orderProcIdBatches,
    exampleFunction,
    { concurrency: 2 },
  );

  expect(results).toEqual([
    6, // [1,2,3]
    15, // [4,5,6]
    24, // [7,8,9]
    10, // [10]
  ]);
});

Deno.test("s.batch() - empty array", async () => {
  const results = await s.batch(
    [],
    (n: number) => Promise.resolve(n * 2),
  );

  expect(results).toEqual([]);
});

Deno.test("s.batch() - with exponential backoff retry", async () => {
  const retryAttempts: number[] = [];

  try {
    await s.batch(
      [1],
      () => {
        retryAttempts.push(Date.now());
        return Promise.reject(new Error("Always fails"));
      },
      {
        retry: {
          backoff: "exponential",
          maxRetries: 3,
          baseDelay: 50,
          backoffMultiplier: 2,
        },
      },
    );
  } catch {
    // Expected to fail
  }

  expect(retryAttempts.length).toBe(4); // Initial + 3 retries

  // Check delays are exponential (roughly)
  if (retryAttempts.length >= 3) {
    const delay1 = retryAttempts[1] - retryAttempts[0];
    const delay2 = retryAttempts[2] - retryAttempts[1];
    expect(delay2).toBeGreaterThan(delay1);
  }
});

Deno.test("s.batch() - with linear backoff retry", async () => {
  const retryAttempts: number[] = [];

  try {
    await s.batch(
      [1],
      () => {
        retryAttempts.push(Date.now());
        return Promise.reject(new Error("Always fails"));
      },
      {
        retry: {
          backoff: "linear",
          maxRetries: 3,
          baseDelay: 50,
        },
      },
    );
  } catch {
    // Expected to fail
  }

  expect(retryAttempts.length).toBe(4); // Initial + 3 retries
});

Deno.test("s.batch() - with shouldRetry filter", async () => {
  let attempts = 0;

  try {
    await s.batch(
      [1],
      () => {
        attempts++;
        return Promise.reject(new Error("Network error"));
      },
      {
        retry: {
          backoff: "exponential",
          maxRetries: 5,
          shouldRetry: (error) => {
            // Only retry network errors, stop after 2 attempts
            return error instanceof Error &&
              error.message.includes("Network") &&
              attempts < 2;
          },
        },
      },
    );
  } catch {
    // Expected to fail
  }

  expect(attempts).toBe(2); // Stopped by shouldRetry
});
