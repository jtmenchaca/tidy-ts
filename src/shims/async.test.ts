import { expect } from "@std/expect";
import { batch, chunk, parallel } from "./async.ts";

// Helper to simulate async operations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// parallel() tests
// ============================================================================

Deno.test("parallel() - basic functionality", async () => {
  const results = await parallel(
    [
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3),
    ],
    { concurrency: 3 },
  );

  expect(results).toEqual([1, 2, 3]);
});

Deno.test("parallel() - high concurrency runs in parallel", async () => {
  const start = Date.now();
  const results = await parallel(
    [
      delay(20).then(() => 1),
      delay(20).then(() => 2),
      delay(20).then(() => 3),
    ],
    { concurrency: 10 },
  );
  const elapsed = Date.now() - start;

  expect(results).toEqual([1, 2, 3]);
  // All run in parallel, should complete in ~20ms not ~60ms
  expect(elapsed).toBeLessThan(50);
});

Deno.test("parallel() - with concurrency limit", async () => {
  let concurrent = 0;
  let maxConcurrent = 0;

  const results = await parallel(
    [1, 2, 3, 4, 5].map((n) => async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await delay(10);
      concurrent--;
      return n;
    }),
    { concurrency: 2 },
  );

  expect(results).toEqual([1, 2, 3, 4, 5]);
  expect(maxConcurrent).toBeLessThanOrEqual(2);
});

Deno.test("parallel() - with retry on failure (using functions)", async () => {
  let attempts = 0;

  const results = await parallel(
    [
      () => {
        attempts++;
        if (attempts === 1) {
          return Promise.reject(new Error("First attempt fails"));
        }
        return Promise.resolve(2);
      },
      () => Promise.resolve(4),
    ],
    {
      concurrency: 1,
      retry: {
        backoff: "exponential",
        maxRetries: 2,
        baseDelay: 10,
      },
    },
  );

  expect(results).toEqual([2, 4]);
  expect(attempts).toBeGreaterThan(1);
});

Deno.test("parallel() - retry doesn't work with already-created promises", async () => {
  let attempts = 0;

  const promises = [
    // deno-lint-ignore require-await
    (async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error("First attempt fails");
      }
      return 2;
    })(),
    Promise.resolve(4),
  ];

  try {
    await parallel(promises, {
      concurrency: 1,
      retry: {
        backoff: "exponential",
        maxRetries: 2,
        baseDelay: 10,
      },
    });
    expect(false).toBe(true); // Should not reach here
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect(attempts).toBe(1); // Only one attempt - promise already created
  }
});

Deno.test("parallel() - preserves order", async () => {
  const results = await parallel(
    [1, 2, 3, 4, 5].map((n) => async () => {
      await delay(Math.random() * 20);
      return n * 2;
    }),
    { concurrency: 5 },
  );

  expect(results).toEqual([2, 4, 6, 8, 10]);
});

Deno.test("parallel() - empty array", async () => {
  const results = await parallel([], { concurrency: 1 });
  expect(results).toEqual([]);
});

Deno.test("parallel() - with exponential backoff retry", async () => {
  const retryAttempts: number[] = [];

  try {
    await parallel(
      [
        () => {
          retryAttempts.push(Date.now());
          return Promise.reject(new Error("Always fails"));
        },
      ],
      {
        concurrency: 1,
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

  if (retryAttempts.length >= 3) {
    const delay1 = retryAttempts[1] - retryAttempts[0];
    const delay2 = retryAttempts[2] - retryAttempts[1];
    expect(delay2).toBeGreaterThan(delay1);
  }
});

Deno.test("parallel() - with linear backoff retry", async () => {
  const retryAttempts: number[] = [];

  try {
    await parallel(
      [
        () => {
          retryAttempts.push(Date.now());
          return Promise.reject(new Error("Always fails"));
        },
      ],
      {
        concurrency: 1,
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

Deno.test("parallel() - with shouldRetry filter", async () => {
  let attempts = 0;

  try {
    await parallel(
      [
        () => {
          attempts++;
          return Promise.reject(new Error("Network error"));
        },
      ],
      {
        concurrency: 1,
        retry: {
          backoff: "exponential",
          maxRetries: 5,
          baseDelay: 10,
          shouldRetry: (error) => {
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

  expect(attempts).toBe(2);
});

Deno.test("parallel() - handles mixed success and failure", async () => {
  try {
    await parallel(
      [
        Promise.resolve(1),
        Promise.reject(new Error("Fail")),
        Promise.resolve(3),
      ],
      { concurrency: 3 },
    );
    expect(false).toBe(true);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }
});

Deno.test("parallel() - mixing promises and functions", async () => {
  const results = await parallel(
    [
      Promise.resolve(2),
      () => Promise.resolve(4),
      Promise.resolve(4),
      () => Promise.resolve(6),
    ],
    { concurrency: 4 },
  );

  expect(results).toEqual([2, 4, 4, 6]);
});

Deno.test("parallel() - error preserves cause", async () => {
  const originalError = new Error("original error");

  try {
    await parallel([() => Promise.reject(originalError)], { concurrency: 1 });
    expect(false).toBe(true);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).cause).toBe(originalError);
  }
});

Deno.test("parallel() - AbortSignal cancellation", async () => {
  const controller = new AbortController();
  controller.abort();

  try {
    await parallel([Promise.resolve(1)], {
      concurrency: 1,
      signal: controller.signal,
    });
    expect(false).toBe(true);
  } catch (error) {
    expect((error as Error).name).toBe("AbortError");
  }
});

Deno.test({
  name: "parallel() - AbortSignal cancels pending tasks",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const controller = new AbortController();
    let completed = 0;

    const promise = parallel(
      [1, 2, 3, 4, 5].map((n) => async () => {
        await delay(50);
        completed++;
        return n;
      }),
      { concurrency: 1, signal: controller.signal },
    );

    // Abort after first task starts
    setTimeout(() => controller.abort(), 25);

    try {
      await promise;
      expect(false).toBe(true);
    } catch (error) {
      expect((error as Error).name).toBe("AbortError");
      // Only first task should have completed (or none)
      expect(completed).toBeLessThanOrEqual(1);
    }
  },
});

Deno.test({
  name: "parallel() - AbortSignal.timeout aborts between tasks",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    // Note: AbortSignal can only abort between tasks or during retry delays.
    // It cannot abort an in-flight promise that doesn't support AbortSignal.
    // This test verifies the signal is checked between task executions.
    let tasksStarted = 0;

    try {
      await parallel(
        [
          async () => {
            tasksStarted++;
            await delay(10);
            return 1;
          },
          async () => {
            tasksStarted++;
            await delay(10);
            return 2;
          },
          async () => {
            tasksStarted++;
            await delay(10);
            return 3;
          },
        ],
        { concurrency: 1, signal: AbortSignal.timeout(25) },
      );
      expect(false).toBe(true);
    } catch (error) {
      const err = error as Error;
      expect(err.name === "TimeoutError" || err.name === "AbortError").toBe(
        true,
      );
      // With concurrency 1 and 10ms per task, ~2-3 tasks should start before 25ms timeout
      expect(tasksStarted).toBeLessThan(4);
    }
  },
});

Deno.test({
  name: "parallel() - onRetry callback",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const retries: Array<{ attempt: number; taskIndex: number }> = [];

    try {
      await parallel(
        [() => Promise.reject(new Error("fail"))],
        {
          concurrency: 1,
          retry: {
            backoff: "exponential",
            maxRetries: 2,
            baseDelay: 10,
            onRetry: (_error, attempt, taskIndex) => {
              retries.push({ attempt, taskIndex });
            },
          },
        },
      );
    } catch {
      // Expected
    }

    expect(retries).toEqual([
      { attempt: 1, taskIndex: 0 },
      { attempt: 2, taskIndex: 0 },
    ]);
  },
});

// ============================================================================
// batch() tests
// ============================================================================

Deno.test("batch() - basic functionality", async () => {
  const results = await batch(
    [1, 2, 3, 4, 5],
    (n) => Promise.resolve(n * 2),
    { concurrency: 5 },
  );

  expect(results).toEqual([2, 4, 6, 8, 10]);
});

Deno.test("batch() - concurrency 1 runs sequentially", async () => {
  let concurrent = 0;
  let maxConcurrent = 0;

  await batch(
    [1, 2, 3, 4, 5],
    async (n) => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await delay(10);
      concurrent--;
      return n * 2;
    },
    { concurrency: 1 },
  );

  expect(maxConcurrent).toBe(1);
});

Deno.test("batch() - with concurrency limit", async () => {
  let concurrent = 0;
  let maxConcurrent = 0;

  await batch(
    [1, 2, 3, 4, 5, 6, 7, 8],
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

Deno.test("batch() - processes all items", async () => {
  const results = await batch(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    (n) => Promise.resolve(n * 2),
    { concurrency: 3 },
  );

  expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
});

Deno.test("batch() - high concurrency runs all in parallel", async () => {
  const start = Date.now();

  await batch(
    [1, 2, 3, 4, 5, 6],
    async (n) => {
      await delay(20);
      return n * 2;
    },
    { concurrency: 10 },
  );

  const elapsed = Date.now() - start;
  // All run in parallel, should complete in ~20ms not ~120ms
  expect(elapsed).toBeLessThan(50);
});

Deno.test("batch() - with retry on failure", async () => {
  let attempts = 0;

  const results = await batch(
    [1, 2],
    (n) => {
      attempts++;
      if (attempts === 1) {
        return Promise.reject(new Error("First attempt fails"));
      }
      return Promise.resolve(n * 2);
    },
    {
      concurrency: 1,
      retry: {
        backoff: "exponential",
        maxRetries: 2,
        baseDelay: 10,
      },
    },
  );

  expect(results).toEqual([2, 4]);
  expect(attempts).toBeGreaterThan(2);
});

Deno.test("batch() - index parameter", async () => {
  const results = await batch(
    ["a", "b", "c"],
    (item, index) => Promise.resolve(`${item}${index}`),
    { concurrency: 3 },
  );

  expect(results).toEqual(["a0", "b1", "c2"]);
});

Deno.test("batch() - preserves order", async () => {
  const results = await batch(
    [1, 2, 3, 4, 5],
    async (n) => {
      await delay(Math.random() * 20);
      return n * 2;
    },
    { concurrency: 5 },
  );

  expect(results).toEqual([2, 4, 6, 8, 10]);
});

Deno.test("batch() - empty array", async () => {
  const results = await batch(
    [],
    (n: number) => Promise.resolve(n * 2),
    { concurrency: 1 },
  );

  expect(results).toEqual([]);
});

Deno.test("batch() - with exponential backoff retry", async () => {
  const retryAttempts: number[] = [];

  try {
    await batch(
      [1],
      () => {
        retryAttempts.push(Date.now());
        return Promise.reject(new Error("Always fails"));
      },
      {
        concurrency: 1,
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

  expect(retryAttempts.length).toBe(4);

  if (retryAttempts.length >= 3) {
    const delay1 = retryAttempts[1] - retryAttempts[0];
    const delay2 = retryAttempts[2] - retryAttempts[1];
    expect(delay2).toBeGreaterThan(delay1);
  }
});

Deno.test("batch() - with linear backoff retry", async () => {
  const retryAttempts: number[] = [];

  try {
    await batch(
      [1],
      () => {
        retryAttempts.push(Date.now());
        return Promise.reject(new Error("Always fails"));
      },
      {
        concurrency: 1,
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

  expect(retryAttempts.length).toBe(4);
});

Deno.test("batch() - with shouldRetry filter", async () => {
  let attempts = 0;

  try {
    await batch(
      [1],
      () => {
        attempts++;
        return Promise.reject(new Error("Network error"));
      },
      {
        concurrency: 1,
        retry: {
          backoff: "exponential",
          maxRetries: 5,
          baseDelay: 10,
          shouldRetry: (error) => {
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

  expect(attempts).toBe(2);
});

Deno.test("batch() - error preserves cause", async () => {
  const originalError = new Error("original error");

  try {
    await batch([1], () => Promise.reject(originalError), { concurrency: 1 });
    expect(false).toBe(true);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).cause).toBe(originalError);
  }
});

Deno.test("batch() - AbortSignal cancellation", async () => {
  const controller = new AbortController();
  controller.abort();

  try {
    await batch([1, 2, 3], (n) => Promise.resolve(n), {
      concurrency: 1,
      signal: controller.signal,
    });
    expect(false).toBe(true);
  } catch (error) {
    expect((error as Error).name).toBe("AbortError");
  }
});

Deno.test({
  name: "batch() - AbortSignal cancels pending items",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const controller = new AbortController();
    let processed = 0;

    const promise = batch(
      [1, 2, 3, 4, 5],
      async (n) => {
        await delay(50);
        processed++;
        return n;
      },
      { concurrency: 1, signal: controller.signal },
    );

    // Abort after first item starts
    setTimeout(() => controller.abort(), 25);

    try {
      await promise;
      expect(false).toBe(true);
    } catch (error) {
      expect((error as Error).name).toBe("AbortError");
      expect(processed).toBeLessThanOrEqual(1);
    }
  },
});

Deno.test({
  name: "batch() - custom backoff function",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const timestamps: number[] = [];

    try {
      await batch(
        [1],
        () => {
          timestamps.push(Date.now());
          return Promise.reject(new Error("fail"));
        },
        {
          concurrency: 1,
          retry: {
            backoff: "custom",
            maxRetries: 3,
            backoffFn: (_error, attempt) => attempt * 25, // 25, 50, 75
          },
        },
      );
    } catch {
      // Expected
    }

    expect(timestamps.length).toBe(4); // Initial + 3 retries

    // Check delays between attempts
    const delay1 = timestamps[1] - timestamps[0]; // Should be ~25ms
    const delay2 = timestamps[2] - timestamps[1]; // Should be ~50ms
    const delay3 = timestamps[3] - timestamps[2]; // Should be ~75ms

    expect(delay1).toBeGreaterThanOrEqual(20);
    expect(delay2).toBeGreaterThanOrEqual(45);
    expect(delay3).toBeGreaterThanOrEqual(70);
  },
});

// ============================================================================
// settled option tests
// ============================================================================

Deno.test("parallel() - settled mode returns all results", async () => {
  const results = await parallel(
    [
      () => Promise.resolve(1),
      () => Promise.reject(new Error("fail")),
      () => Promise.resolve(3),
    ],
    { concurrency: 3, settled: true },
  );

  expect(results.length).toBe(3);
  expect(results[0]).toEqual({ status: "fulfilled", value: 1 });
  expect(results[1].status).toBe("rejected");
  expect((results[1] as { status: "rejected"; reason: Error }).reason.message)
    .toBe("fail");
  expect(results[2]).toEqual({ status: "fulfilled", value: 3 });
});

Deno.test("parallel() - settled mode with all success", async () => {
  const results = await parallel(
    [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)],
    { concurrency: 3, settled: true },
  );

  expect(results).toEqual([
    { status: "fulfilled", value: 1 },
    { status: "fulfilled", value: 2 },
    { status: "fulfilled", value: 3 },
  ]);
});

Deno.test("parallel() - settled mode with all failures", async () => {
  const results = await parallel(
    [
      () => Promise.reject(new Error("a")),
      () => Promise.reject(new Error("b")),
    ],
    { concurrency: 2, settled: true },
  );

  expect(results.length).toBe(2);
  expect(results[0].status).toBe("rejected");
  expect(results[1].status).toBe("rejected");
});

Deno.test("batch() - settled mode returns all results", async () => {
  let callCount = 0;
  const results = await batch(
    [1, 2, 3],
    (n) => {
      callCount++;
      if (n === 2) return Promise.reject(new Error("fail on 2"));
      return Promise.resolve(n * 10);
    },
    { concurrency: 3, settled: true },
  );

  expect(callCount).toBe(3);
  expect(results.length).toBe(3);
  expect(results[0]).toEqual({ status: "fulfilled", value: 10 });
  expect(results[1].status).toBe("rejected");
  expect(results[2]).toEqual({ status: "fulfilled", value: 30 });
});

Deno.test("batch() - settled mode with concurrency", async () => {
  const results = await batch(
    [1, 2, 3, 4],
    (n) => {
      if (n % 2 === 0) return Promise.reject(new Error(`fail ${n}`));
      return Promise.resolve(n);
    },
    { concurrency: 2, settled: true },
  );

  expect(results.length).toBe(4);
  expect(results[0]).toEqual({ status: "fulfilled", value: 1 });
  expect(results[1].status).toBe("rejected");
  expect(results[2]).toEqual({ status: "fulfilled", value: 3 });
  expect(results[3].status).toBe("rejected");
});

Deno.test("parallel() - fail-fast without settled", async () => {
  let task3Started = false;

  try {
    await parallel(
      [
        () => Promise.resolve(1),
        () => Promise.reject(new Error("fail")),
        () => {
          task3Started = true;
          return Promise.resolve(3);
        },
      ],
      { concurrency: 1 },
    );
    expect(false).toBe(true);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("Task 1 failed");
  }

  // Task 3 should not have started due to fail-fast
  expect(task3Started).toBe(false);
});

// ============================================================================
// chunk() tests
// ============================================================================

Deno.test("chunk() - basic functionality", () => {
  const result = chunk([1, 2, 3, 4, 5, 6, 7], 3);
  expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
});

Deno.test("chunk() - even division", () => {
  const result = chunk([1, 2, 3, 4, 5, 6], 2);
  expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
});

Deno.test("chunk() - size larger than array", () => {
  const result = chunk([1, 2, 3], 10);
  expect(result).toEqual([[1, 2, 3]]);
});

Deno.test("chunk() - size of 1", () => {
  const result = chunk([1, 2, 3], 1);
  expect(result).toEqual([[1], [2], [3]]);
});

Deno.test("chunk() - empty array", () => {
  const result = chunk([], 3);
  expect(result).toEqual([]);
});

Deno.test("chunk() - with strings", () => {
  const result = chunk(["a", "b", "c", "d", "e"], 2);
  expect(result).toEqual([["a", "b"], ["c", "d"], ["e"]]);
});

Deno.test("chunk() - with objects", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const result = chunk(items, 2);
  expect(result).toEqual([[{ id: 1 }, { id: 2 }], [{ id: 3 }]]);
});

Deno.test("chunk() - throws on non-positive size", () => {
  expect(() => chunk([1, 2, 3], 0)).toThrow(
    "Chunk size must be a positive integer",
  );
  expect(() => chunk([1, 2, 3], -1)).toThrow(
    "Chunk size must be a positive integer",
  );
});

Deno.test("chunk() - throws on non-integer size", () => {
  expect(() => chunk([1, 2, 3], 1.5)).toThrow(
    "Chunk size must be a positive integer",
  );
});

Deno.test("chunk() - throws on non-array input", () => {
  // @ts-expect-error Testing invalid input
  expect(() => chunk("not an array", 2)).toThrow(
    "First argument must be an array",
  );
});
