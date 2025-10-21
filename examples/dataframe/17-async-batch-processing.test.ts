/**
 * Async Batch Processing Examples
 *
 * Demonstrates s.batch() and s.chunk() for efficient async operations
 * with concurrency control, batching, and retry logic.
 */

import { expect } from "@std/expect";
import { stats as s } from "../../src/dataframe/mod.ts";

// Simulate API calls with delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchUser(id: number): Promise<{ id: number; name: string }> {
  await delay(10);
  return { id, name: `User ${id}` };
}

async function processItem(item: number): Promise<number> {
  await delay(5);
  return item * 2;
}

Deno.test("Example 1: Basic batch processing with concurrency", async () => {
  console.log("\n=== Basic Batch Processing ===\n");

  const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Process with concurrency limit to avoid overwhelming the server
  const users = await s.batch(
    userIds,
    fetchUser,
    { concurrency: 3 }, // Max 3 concurrent requests
  );

  console.log(`Fetched ${users.length} users with concurrency limit of 3`);
  expect(users).toHaveLength(10);
  expect(users[0]).toEqual({ id: 1, name: "User 1" });
});

Deno.test("Example 2: Batch processing with delays", async () => {
  console.log("\n=== Batch Processing with Delays ===\n");

  const items = Array.from({ length: 20 }, (_, i) => i + 1);

  // Process in batches with delay between batches (good for rate-limited APIs)
  const results = await s.batch(
    items,
    processItem,
    {
      batchSize: 5, // Process 5 items per batch
      batchDelay: 100, // 100ms delay between batches
    },
  );

  console.log(`Processed ${results.length} items in batches of 5`);
  expect(results).toHaveLength(20);
});

Deno.test("Example 3: Combining chunk and batch", async () => {
  console.log("\n=== Chunk + Batch Pattern ===\n");

  // Simulate processing large dataset in chunks
  const orderIds = Array.from({ length: 100 }, (_, i) => i + 1);

  // Split into chunks of 25
  const chunks = s.chunk(orderIds, 25);
  console.log(`Split ${orderIds.length} orders into ${chunks.length} chunks`);

  // Process each chunk concurrently
  const results = await s.batch(
    chunks,
    async (chunk) => {
      // Simulate batch API call
      await delay(20);
      return chunk.map((id) => ({ id, processed: true }));
    },
    { concurrency: 2 }, // Process 2 chunks at a time
  );

  const flatResults = results.flat();
  console.log(`Processed ${flatResults.length} total orders`);
  expect(flatResults).toHaveLength(100);
});

Deno.test("Example 4: Retry with exponential backoff", async () => {
  console.log("\n=== Retry with Exponential Backoff ===\n");

  let attemptCount = 0;

  const results = await s.batch(
    [1, 2, 3],
    (item) => {
      attemptCount++;
      // Fail first attempt, succeed on retry
      if (attemptCount === 1) {
        return Promise.reject(new Error("Temporary network error"));
      }
      return Promise.resolve(item * 2);
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

  console.log(
    `Completed with ${attemptCount} total attempts (including retries)`,
  );
  expect(results).toEqual([2, 4, 6]);
});

Deno.test("Example 5: Conditional retry logic", async () => {
  console.log("\n=== Conditional Retry Logic ===\n");

  const networkErrors = ["rate limit", "timeout", "network"];
  let retryCount = 0;

  const results = await s.batch(
    ["item1", "item2", "item3"],
    (item, _index) => {
      // Simulate rate limit error on first call
      if (_index === 0 && retryCount === 0) {
        retryCount++;
        return Promise.reject(new Error("rate limit exceeded"));
      }
      return Promise.resolve(`${item}-processed`);
    },
    {
      retry: {
        backoff: "linear",
        maxRetries: 3,
        baseDelay: 50,
        // Only retry on network-related errors
        shouldRetry: (error) => {
          if (error instanceof Error) {
            return networkErrors.some((msg) =>
              error.message.toLowerCase().includes(msg)
            );
          }
          return false;
        },
        onRetry: (error, attempt) => {
          console.log(`Retry attempt ${attempt}: ${error}`);
        },
      },
    },
  );

  console.log(`Completed with conditional retry logic`);
  expect(results).toEqual([
    "item1-processed",
    "item2-processed",
    "item3-processed",
  ]);
});

Deno.test("Example 6: Index parameter usage", async () => {
  console.log("\n=== Using Index Parameter ===\n");

  const items = ["a", "b", "c", "d", "e"];

  const results = await s.batch(
    items,
    async (item, index) => {
      await delay(5);
      return `${index + 1}. ${item.toUpperCase()}`;
    },
    { concurrency: 2 },
  );

  console.log("Results with indices:");
  results.forEach((r) => console.log(`  ${r}`));

  expect(results[0]).toBe("1. A");
  expect(results[4]).toBe("5. E");
});

Deno.test("Example 7: Real-world API pattern", async () => {
  console.log("\n=== Real-world API Pattern ===\n");

  // Simulate fetching data from paginated API
  const pageNumbers = [1, 2, 3, 4, 5];

  async function fetchPage(
    page: number,
  ): Promise<{ page: number; data: number[] }> {
    await delay(15);
    return {
      page,
      data: Array.from({ length: 10 }, (_, i) => page * 10 + i),
    };
  }

  const pages = await s.batch(
    pageNumbers,
    fetchPage,
    {
      concurrency: 2,
      retry: {
        backoff: "exponential",
        maxRetries: 3,
        baseDelay: 100,
        shouldRetry: (error) => {
          // Retry on network errors, not on 404s
          return error instanceof Error &&
            !error.message.includes("404");
        },
      },
    },
  );

  const allData = pages.flatMap((p) => p.data);
  console.log(
    `Fetched ${pages.length} pages with ${allData.length} total items`,
  );
  expect(pages).toHaveLength(5);
  expect(allData).toHaveLength(50);
});

Deno.test("Example 8: Processing with progress tracking", async () => {
  console.log("\n=== Progress Tracking ===\n");

  const items = Array.from({ length: 20 }, (_, i) => i + 1);
  let completed = 0;

  const results = await s.batch(
    items,
    async (item) => {
      await delay(10);
      completed++;
      if (completed % 5 === 0) {
        console.log(
          `Progress: ${completed}/${items.length} (${
            Math.round(completed / items.length * 100)
          }%)`,
        );
      }
      return item * 2;
    },
    { concurrency: 3 },
  );

  console.log(`Completed: ${completed}/${items.length}`);
  expect(results).toHaveLength(20);
});
