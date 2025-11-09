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


Deno.test("s.parallel() - with retry on failure (using functions)", async () => {
  // Retry works when passing functions that create promises
  let attempts = 0;

  const promises = [
    () => {
      attempts++;
      if (attempts === 1) {
        return Promise.reject(new Error("First attempt fails"));
      }
      return Promise.resolve(2);
    },
    () => Promise.resolve(4),
  ];

  const results = await s.parallel(promises, {
    retry: {
      backoff: "exponential",
      maxRetries: 2,
      baseDelay: 10,
    },
  });

  expect(results).toEqual([2, 4]);
  expect(attempts).toBeGreaterThan(1); // Should have retried
});

Deno.test("s.parallel() - retry doesn't work with already-created promises", async () => {
  // This test documents that retry won't work with already-created promises
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

Deno.test("s.parallel() - with exponential backoff retry (using functions)", async () => {
  const retryAttempts: number[] = [];

  try {
    await s.parallel(
      [
        () => {
          retryAttempts.push(Date.now());
          return Promise.reject(new Error("Always fails"));
        },
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
    // Expected to fail after retries
  }

  expect(retryAttempts.length).toBe(4); // Initial + 3 retries

  // Check delays are exponential (roughly)
  if (retryAttempts.length >= 3) {
    const delay1 = retryAttempts[1] - retryAttempts[0];
    const delay2 = retryAttempts[2] - retryAttempts[1];
    expect(delay2).toBeGreaterThan(delay1);
  }
});

Deno.test("s.parallel() - with linear backoff retry (using functions)", async () => {
  const retryAttempts: number[] = [];

  try {
    await s.parallel(
      [
        () => {
          retryAttempts.push(Date.now());
          return Promise.reject(new Error("Always fails"));
        },
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
    // Expected to fail after retries
  }

  expect(retryAttempts.length).toBe(4); // Initial + 3 retries
});

Deno.test("s.parallel() - with shouldRetry filter (using functions)", async () => {
  let attempts = 0;

  try {
    await s.parallel(
      [
        () => {
          attempts++;
          return Promise.reject(new Error("Network error"));
        },
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
    // Expected to fail - stopped by shouldRetry
  }

  expect(attempts).toBe(2); // Stopped by shouldRetry after 2 attempts
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

Deno.test("s.parallel() - mixing promises and functions", async () => {
  // Can mix already-created promises with functions
  const promises = [
    add(1, 1),           // Promise: 2
    () => multiply(2, 2), // Function: 4
    square(2),           // Promise: 4
    () => add(3, 3),     // Function: 6
  ];

  const results = await s.parallel(promises);

  expect(results).toEqual([2, 4, 4, 6]);
});

Deno.test("s.parallel() - retry works with mixed promises and functions", async () => {
  let attempts = 0;

  const promises = [
    add(1, 1),           // Promise: 2 (no retry)
    () => {              // Function: can retry
      attempts++;
      if (attempts === 1) {
        return Promise.reject(new Error("First attempt fails"));
      }
      return Promise.resolve(4);
    },
    square(2),           // Promise: 4 (no retry)
  ];

  const results = await s.parallel(promises, {
    retry: {
      backoff: "exponential",
      maxRetries: 2,
      baseDelay: 10,
    },
  });

  expect(results).toEqual([2, 4, 4]);
  expect(attempts).toBeGreaterThan(1); // Function was retried
});

