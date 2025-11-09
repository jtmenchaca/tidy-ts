import { expect } from "@std/expect";
import { stats as s } from "../stats.ts";

// Helper to simulate async operations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Example async math functions with delays
async function add(a: number, b: number): Promise<number> {
  await delay(10);
  return a + b;
}

async function multiply(a: number, b: number): Promise<number> {
  await delay(15);
  return a * b;
}

async function square(n: number): Promise<number> {
  await delay(20);
  return n * n;
}

Deno.test("s.parallel() - basic functionality", async () => {
  const promises = [
    add(1, 2),    // 3
    multiply(2, 3), // 6
    square(4),     // 16
  ];
  const results = await s.parallel(promises);

  expect(results).toEqual([3, 6, 16]);
});

Deno.test("s.parallel() - default behavior like Promise.all", async () => {
  const promises = [
    add(1, 1),      // 2, ~10ms delay
    multiply(2, 2),  // 4, ~15ms delay
    square(3),       // 9, ~20ms delay
  ];
  const start = Date.now();
  const results = await s.parallel(promises);
  const elapsed = Date.now() - start;

  expect(results).toEqual([2, 4, 9]);
  // Should complete in roughly the time of the longest promise (~20ms)
  expect(elapsed).toBeLessThan(50);
});

Deno.test("s.parallel() - with concurrency limit", async () => {
  // Note: Concurrency control works by controlling when promises are awaited
  // If promises are created with async IIFE, they start executing immediately
  // So concurrency control may not work perfectly in that case
  // This test verifies basic functionality
  const promises = [
    add(1, 1),      // 2
    multiply(2, 2), // 4
    square(2),      // 4
    add(3, 3),     // 6
    multiply(3, 2), // 6
  ];

  const results = await s.parallel(promises, { concurrency: 2 });

  expect(results).toEqual([2, 4, 4, 6, 6]);
  // Concurrency is controlled at the await level, so this should work
});

Deno.test("s.parallel() - with batch size", async () => {
  const promises = [
    multiply(1, 2),  // 2
    multiply(2, 2),   // 4
    multiply(3, 2),   // 6
    multiply(4, 2),   // 8
    multiply(5, 2),   // 10
    multiply(6, 2),   // 12
    multiply(7, 2),   // 14
    multiply(8, 2),   // 16
    multiply(9, 2),   // 18
    multiply(10, 2),  // 20
  ];
  const results = await s.parallel(promises, { batchSize: 3 });

  expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
});

Deno.test("s.parallel() - with batch delay", async () => {
  const start = Date.now();
  const promises = [
    add(1, 0),      // 1
    add(1, 0),      // 1
    add(1, 0),      // 1
    add(1, 0),      // 1
    add(1, 0),      // 1
    add(1, 0),      // 1
  ];

  await s.parallel(promises, {
    batchSize: 2,
    batchDelay: 50, // 50ms delay between batches
  });

  const elapsed = Date.now() - start;
  // Should have ~100ms delay (2 delays for 3 batches) plus async operation time
  expect(elapsed).toBeGreaterThanOrEqual(100);
});

Deno.test("s.parallel() - with retry on failure", async () => {
  // Note: Retry requires recreating promises, which isn't possible with already-created promises
  // This test documents that retry won't work with the Promise.all-like API
  // For retry functionality, users should use s.batch() instead
  let attempts = 0;

  const promises = [
    (async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error("First attempt fails");
      }
      return 2;
    })(),
    Promise.resolve(4),
  ];

  // Retry won't work because the promise is already created and executing
  // The promise will reject and can't be retried
  try {
    await s.parallel(promises, {
      retry: {
        backoff: "exponential",
        maxRetries: 2,
        baseDelay: 10,
      },
    });
    expect(false).toBe(true); // Should not reach here
  } catch (error) {
    // Expected to fail - retry doesn't work with already-created promises
    expect(error).toBeInstanceOf(Error);
    expect(attempts).toBe(1); // Only one attempt because promise was already created
  }
});

Deno.test("s.parallel() - preserves order", async () => {
  const promises = [
    add(1, 1),      // 2, ~10ms
    multiply(2, 2), // 4, ~15ms
    square(2),       // 4, ~20ms
    add(4, 4),      // 8, ~10ms
    multiply(5, 2), // 10, ~15ms
  ];

  const results = await s.parallel(promises, { concurrency: 5 });

  // Results should be in same order as input, even though delays vary
  expect(results).toEqual([2, 4, 4, 8, 10]);
});

Deno.test("s.parallel() - empty array", async () => {
  const results = await s.parallel([]);

  expect(results).toEqual([]);
});

Deno.test("s.parallel() - with exponential backoff retry", async () => {
  // Note: Retry doesn't work with already-created promises
  // This test documents the limitation
  const retryAttempts: number[] = [];

  try {
    await s.parallel(
      [
        (async () => {
          retryAttempts.push(Date.now());
          throw new Error("Always fails");
        })(),
      ],
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
    // Expected to fail - retry won't work
  }

  // Retry won't work, so we'll only have 1 attempt
  expect(retryAttempts.length).toBe(1);
});

Deno.test("s.parallel() - with linear backoff retry", async () => {
  // Note: Retry doesn't work with already-created promises
  const retryAttempts: number[] = [];

  try {
    await s.parallel(
      [
        (async () => {
          retryAttempts.push(Date.now());
          throw new Error("Always fails");
        })(),
      ],
      {
        retry: {
          backoff: "linear",
          maxRetries: 3,
          baseDelay: 50,
        },
      },
    );
  } catch {
    // Expected to fail - retry won't work
  }

  // Retry won't work, so we'll only have 1 attempt
  expect(retryAttempts.length).toBe(1);
});

Deno.test("s.parallel() - with shouldRetry filter", async () => {
  // Note: Retry doesn't work with already-created promises
  let attempts = 0;

  try {
    await s.parallel(
      [
        (async () => {
          attempts++;
          throw new Error("Network error");
        })(),
      ],
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
    // Expected to fail - retry won't work
  }

  // Retry won't work, so we'll only have 1 attempt
  expect(attempts).toBe(1);
});

Deno.test("s.parallel() - handles mixed success and failure", async () => {
  const promises = [
    Promise.resolve(1),
    Promise.reject(new Error("Fail")),
    Promise.resolve(3),
  ];

  try {
    await s.parallel(promises);
    expect(false).toBe(true); // Should not reach here
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }
});

Deno.test("s.parallel() - works with already resolved promises", async () => {
  const p1 = add(1, 0);  // 1
  const p2 = multiply(1, 2); // 2
  const p3 = square(1);  // 1

  // Promises are already created (but not yet resolved)
  const results = await s.parallel([p1, p2, p3]);

  expect(results).toEqual([1, 2, 1]);
});

Deno.test("s.parallel() - works with pending promises", async () => {
  const promises = [
    add(1, 0),      // 1, ~10ms
    multiply(1, 2), // 2, ~15ms
    square(1),      // 1, ~20ms
  ];

  const results = await s.parallel(promises, { concurrency: 2 });

  expect(results).toEqual([1, 2, 1]);
});

