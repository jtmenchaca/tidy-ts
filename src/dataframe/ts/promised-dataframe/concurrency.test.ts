// deno-lint-ignore-file no-explicit-any
import { createDataFrame } from "../dataframe/index.ts";
import { expect } from "@std/expect";

/**
 * Concurrency Control Tests
 *
 * Tests for limiting concurrent async operations to prevent overwhelming servers
 * and provide better resource management for DataFrame operations.
 */

// Mock async function that simulates API calls
function _mockAsyncApiCall(
  value: number,
  delay: number = 100,
): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value * 2), delay);
  });
}

// Track concurrent operations
let activeCalls = 0;
let maxConcurrentCalls = 0;
const activeTimers: number[] = [];

function trackingAsyncCall(value: number): Promise<number> {
  activeCalls++;
  maxConcurrentCalls = Math.max(maxConcurrentCalls, activeCalls);

  return new Promise((resolve) => {
    const timerId = setTimeout(() => {
      activeCalls--;
      resolve(value * 2);
    }, 50);
    activeTimers.push(timerId);
  });
}

// Cleanup function to clear all active timers
function cleanupTimers() {
  activeTimers.forEach((timerId) => clearTimeout(timerId));
  activeTimers.length = 0;
}

Deno.test("DataFrame Async Concurrency Control", async () => {
  // Reset tracking
  activeCalls = 0;
  maxConcurrentCalls = 0;
  cleanupTimers();

  console.log("=== Testing DataFrame Async Concurrency Control ===");

  // Create test data with 20 rows (manageable for testing)
  const testData = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    value: (i + 1) * 10,
    category: i % 3 === 0 ? "A" : i % 3 === 1 ? "B" : "C",
  }));

  const df = createDataFrame(testData);
  console.log(`Created DataFrame with ${df.nrows()} rows`);

  // Test 1: Default behavior (should use default concurrency of 10)
  console.log("\n--- Test 1: Default Concurrency (limit: 10) ---");
  const startTime1 = Date.now();

  // Debug: Check if the function is detected as async
  const testFn = async (row: any) => await trackingAsyncCall(row.value);
  console.log("Test function type:", typeof testFn);
  console.log(
    "Test function is async:",
    testFn.constructor.name === "AsyncFunction",
  );

  const result1 = await df.mutate({
    doubled_value: testFn,
  });

  const duration1 = Date.now() - startTime1;
  console.log(`Completed in ${duration1}ms`);
  console.log(`Max concurrent calls: ${maxConcurrentCalls}`);
  console.log(`First few results:`, result1.toArray().slice(0, 3));

  // Should use default concurrency (10)
  expect(maxConcurrentCalls).toBeLessThanOrEqual(10);
  expect(result1.nrows()).toBe(20);

  // Reset for next test
  activeCalls = 0;
  maxConcurrentCalls = 0;
  cleanupTimers();

  // Test 2: Limited concurrency (proposed API)
  console.log("\n--- Test 2: Limited Concurrency (concurrency: 3) ---");
  const startTime2 = Date.now();

  // Proposed API: Pass concurrency option
  const result2 = await df.mutate({
    doubled_value: async (row) => await trackingAsyncCall(row.value),
  }, { concurrency: 3 });

  const duration2 = Date.now() - startTime2;
  console.log(`Completed in ${duration2}ms`);
  console.log(`Max concurrent calls: ${maxConcurrentCalls}`);
  console.log(`First few results:`, result2.toArray().slice(0, 3));

  // Should have limited concurrency
  expect(maxConcurrentCalls).toBeLessThanOrEqual(3);
  expect(result2.nrows()).toBe(20);

  // Reset for next test
  activeCalls = 0;
  maxConcurrentCalls = 0;
  cleanupTimers();

  // Test 3: DataFrame-level concurrency defaults
  console.log("\n--- Test 3: DataFrame-level Concurrency Defaults ---");
  const startTime3 = Date.now();

  // Create DataFrame with concurrency settings
  const dfWithConcurrency = createDataFrame(testData, { concurrency: 2 });

  const result3 = await dfWithConcurrency.mutate({
    doubled_value: async (row) => await trackingAsyncCall(row.value),
  });

  const duration3 = Date.now() - startTime3;
  console.log(`Completed in ${duration3}ms`);
  console.log(`Max concurrent calls: ${maxConcurrentCalls}`);
  console.log(`First few results:`, result3.toArray().slice(0, 3));

  // Should use DataFrame-level concurrency setting (2)
  expect(maxConcurrentCalls).toBeLessThanOrEqual(2);
  expect(result3.nrows()).toBe(20);

  // Reset for next test
  activeCalls = 0;
  maxConcurrentCalls = 0;
  cleanupTimers();

  // Test 4: Explicit options override DataFrame defaults
  console.log("\n--- Test 4: Explicit Options Override DataFrame Defaults ---");
  const startTime4 = Date.now();

  // DataFrame has concurrency: 2, but we override with 5
  const result4 = await dfWithConcurrency.mutate({
    doubled_value: async (row) => await trackingAsyncCall(row.value),
  }, { concurrency: 5 });

  const duration4 = Date.now() - startTime4;
  console.log(`Completed in ${duration4}ms`);
  console.log(`Max concurrent calls: ${maxConcurrentCalls}`);
  console.log(`First few results:`, result4.toArray().slice(0, 3));

  // Should use explicit override (5), not DataFrame default (2)
  expect(maxConcurrentCalls).toBeLessThanOrEqual(5);
  expect(maxConcurrentCalls).toBeGreaterThan(2);
  expect(result4.nrows()).toBe(20);

  // Final cleanup
  cleanupTimers();
});
