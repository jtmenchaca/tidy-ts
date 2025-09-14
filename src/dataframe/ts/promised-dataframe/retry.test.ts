import { createDataFrame } from "../dataframe/index.ts";
import { expect } from "@std/expect";

/**
 * Retry Mechanism Tests
 *
 * Tests for automatic retry of failed async operations in DataFrame transformations.
 */

// Mock async function that fails N times before succeeding (per task)
function createFlakeyApiCall(failuresBeforeSuccess: number) {
  const attemptsPerValue = new Map<number, number>();

  return async function (value: number): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    const attempts = (attemptsPerValue.get(value) || 0) + 1;
    attemptsPerValue.set(value, attempts);

    console.log(
      `Flakey API call for value ${value}, attempt ${attempts}, should fail if <= ${failuresBeforeSuccess}`,
    );

    if (attempts <= failuresBeforeSuccess) {
      console.log(`Throwing error for value ${value} on attempt ${attempts}`);
      throw new Error(`API call failed (attempt ${attempts})`);
    }

    console.log(`Success for value ${value} on attempt ${attempts}`);
    return value * 2;
  };
}

function _otherFlakeyApiCall(
  { value, failuresBeforeSuccess }: {
    value: number;
    failuresBeforeSuccess: number;
  },
): Promise<number | Error> {
  const attemptsPerValue = new Map<number, number>();

  const attempts = (attemptsPerValue.get(value) || 0) + 1;
  attemptsPerValue.set(value, attempts);

  if (attempts <= failuresBeforeSuccess) {
    return Promise.reject(new Error(`API call failed (attempt ${attempts})`));
  }

  return Promise.resolve(value * 2);
}

// Track retry attempts
let retryCallbacks: Array<
  { error: unknown; attempt: number; taskIndex: number }
> = [];

Deno.test("DataFrame Async Retry Mechanism", async () => {
  console.log("=== Testing DataFrame Async Retry Mechanism ===");

  // Create test data
  const testData = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    value: (i + 1) * 10,
  }));

  // Test 1: No retries by default
  console.log("\n--- Test 1: No Retries by Default ---");

  const df1 = createDataFrame(testData);
  const flakeyFn1 = createFlakeyApiCall(1); // Fails once

  try {
    await df1.mutate({
      doubled: async (row) => await flakeyFn1(row.value),
    });
    throw new Error("Should have failed without retries");
  } catch (_error) {
    const errorMessage = _error instanceof Error
      ? _error.message
      : String(_error);
    console.log("Failed as expected (no retries):", errorMessage);
    expect(errorMessage).toContain("Task 0 failed");
  }

  // Test 2: New API - Exponential backoff retry configuration
  console.log("\n--- Test 2: New API - Exponential Backoff Retry ---");

  retryCallbacks = [];
  const flakeyFn2 = createFlakeyApiCall(2); // Fails twice

  const df2 = createDataFrame(testData);

  const result2 = await df2.mutate({
    doubled: async (row) => await flakeyFn2(row.value),
  }, {
    retry: {
      backoff: "exponential",
      maxRetries: 3,
      baseDelay: 50,
      onRetry: (error, attempt, taskIndex) => {
        retryCallbacks.push({ error, attempt, taskIndex });
        console.log(`Retry attempt ${attempt} for task ${taskIndex}`);
      },
    },
  });

  console.log("Successfully completed with retries");
  console.log("Results:", result2.toArray());

  // Should have succeeded after retries
  expect(result2.nrows()).toBe(5);
  expect(result2.toArray()[0].doubled).toBe(20);
  expect(retryCallbacks.length).toBeGreaterThan(0);

  // Test 3: Linear backoff retry strategy
  console.log("\n--- Test 3: Linear Backoff Retry Strategy ---");

  retryCallbacks = [];
  const flakeyFn3 = createFlakeyApiCall(1); // Fails once

  const result3 = await df2
    .mutate({
      doubled: async (row) => await flakeyFn3(row.value),
    }, {
      retry: {
        backoff: "linear",
        maxRetries: 2,
        baseDelay: 50,
        maxDelay: 200,
        onRetry: (error, attempt, taskIndex) => {
          retryCallbacks.push({ error, attempt, taskIndex });
          console.log(
            `Linear retry attempt ${attempt} for task ${taskIndex}`,
          );
        },
      },
    });

  console.log("Successfully completed with override retries");
  console.log("Retry count:", retryCallbacks.length);

  expect(result3.nrows()).toBe(5);
  expect(result3.toArray()[0].doubled).toBe(20);

  // Test 4: Exponential backoff with timing validation
  console.log("\n--- Test 4: Exponential Backoff with Timing ---");

  const delays: number[] = [];
  let lastRetryTime = 0;

  const df4 = createDataFrame(testData.slice(0, 1)); // Just one row for timing test

  const flakeyFn4 = createFlakeyApiCall(4); // Fails 4 times
  const startTime = Date.now();

  const result4 = await df4.mutate({
    doubled: async (row) => await flakeyFn4(row.value),
  }, {
    retry: {
      backoff: "exponential",
      maxRetries: 4,
      baseDelay: 100,
      backoffMultiplier: 2,
      maxDelay: 500,
      onRetry: () => {
        const now = Date.now();
        if (lastRetryTime > 0) {
          delays.push(now - lastRetryTime);
        }
        lastRetryTime = now;
      },
    },
  });

  const totalTime = Date.now() - startTime;
  console.log(`Total time with backoff: ${totalTime}ms`);
  console.log(`Delays between retries: ${delays.join(", ")}ms`);

  expect(result4.nrows()).toBe(1);
  expect(result4.toArray()[0].doubled).toBe(20);

  // Verify exponential backoff (each delay should be roughly double the previous)
  for (let i = 1; i < delays.length; i++) {
    const ratio = delays[i] / delays[i - 1];
    // Allow some tolerance for timing variations
    expect(ratio).toBeGreaterThan(1.5);
    expect(ratio).toBeLessThan(4);
    // Check max delay is respected
    expect(delays[i]).toBeLessThanOrEqual(550); // 500ms max + some tolerance
  }

  // Test 5: Custom backoff function
  console.log("\n--- Test 5: Custom Backoff Function ---");

  const customDelays: number[] = [];
  let customRetryCount = 0;
  const df5 = createDataFrame(testData.slice(0, 1));

  const flakeyFn5 = createFlakeyApiCall(3); // Fails 3 times

  const result5 = await df5.mutate({
    doubled: async (row) => await flakeyFn5(row.value),
  }, {
    retry: {
      backoff: "custom",
      maxRetries: 3,
      backoffFn: (_error, attempt, _taskIndex) => {
        // Custom progressive delay: 50ms, 100ms, 150ms...
        const delay = attempt * 50;
        customDelays.push(delay);
        console.log(`Custom backoff for attempt ${attempt}: ${delay}ms`);
        return delay;
      },
      onRetry: (_error, attempt, taskIndex) => {
        customRetryCount++;
        console.log(`Custom retry ${attempt} for task ${taskIndex}`);
      },
    },
  });

  console.log("Custom backoff completed successfully");
  console.log("Custom delays used:", customDelays);
  expect(result5.nrows()).toBe(1);
  expect(result5.toArray()[0].doubled).toBe(20);
  expect(customRetryCount).toBe(3);
  expect(customDelays).toEqual([50, 100, 150]);

  // Test 6: Custom shouldRetry function
  console.log("\n--- Test 6: Custom shouldRetry Function ---");

  let shouldRetryCount = 0;
  const df6 = createDataFrame(testData.slice(0, 1));

  const flakeyFn6 = createFlakeyApiCall(3); // Fails 3 times

  try {
    await df6.mutate({
      doubled: async (row) => await flakeyFn6(row.value),
    }, {
      retry: {
        backoff: "exponential",
        maxRetries: 5,
        baseDelay: 50,
        shouldRetry: (error, attempt) => {
          // Only retry for specific error messages
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          const shouldRetry = errorMessage.includes("attempt 1") ||
            errorMessage.includes("attempt 2");
          console.log(
            `shouldRetry called for attempt ${attempt}: ${shouldRetry}`,
          );
          return shouldRetry;
        },
        onRetry: () => {
          shouldRetryCount++;
        },
      },
    });
    throw new Error("Should have failed when shouldRetry returns false");
  } catch (_error) {
    console.log("Failed as expected when shouldRetry returned false");
    expect(shouldRetryCount).toBe(2); // Should only retry twice
  }

  // Test 7: Retry with concurrency control
  console.log("\n--- Test 7: Retry with Concurrency Control ---");

  const df7 = createDataFrame(testData);

  const flakeyFn7 = createFlakeyApiCall(1); // Fails once per call

  const result7 = await df7.mutate({
    doubled: async (row) => await flakeyFn7(row.value),
  }, {
    concurrency: 2,
    retry: {
      backoff: "exponential",
      maxRetries: 2,
      baseDelay: 50,
    },
  });

  console.log("Successfully completed with retries and concurrency control");
  expect(result7.nrows()).toBe(5);
  expect(result7.toArray().every((row) => row.doubled === row.value * 2)).toBe(
    true,
  );
});
