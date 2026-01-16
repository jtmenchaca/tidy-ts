/**
 * Integration tests showing how chunk, batch, and parallel work together.
 *
 * These three utilities serve complementary purposes:
 * - `chunk`: Synchronously splits an array into smaller arrays (preparation)
 * - `batch`: Maps items through an async function with concurrency control
 * - `parallel`: Runs pre-created promises/task functions with concurrency control
 *
 * Common patterns:
 * 1. chunk + parallel: Split data, process each chunk as a unit
 * 2. batch alone: Process items with concurrency control
 * 3. chunk + batch: Process items in sequential groups with delays between
 */

import { expect } from "@std/expect";
import { batch, chunk, parallel } from "./async.ts";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// Pattern 1: chunk + parallel - Process chunks as units
// ============================================================================

Deno.test("chunk + parallel: batch insert to database", async () => {
  console.log("\n=== Pattern: chunk + parallel (batch insert) ===");
  console.log("Scenario: Insert 25 records, API accepts max 10 at a time\n");

  const records = Array.from(
    { length: 25 },
    (_, i) => ({ id: i, name: `Item ${i}` }),
  );
  console.log(`Total records: ${records.length}`);

  const insertedBatches: typeof records[] = [];

  const batchInsert = async (b: typeof records) => {
    await delay(5);
    insertedBatches.push(b);
    console.log(
      `  Inserted batch of ${b.length} records (IDs: ${b[0].id}-${
        b[b.length - 1].id
      })`,
    );
    return b.length;
  };

  // Split into chunks of 10
  const chunks = chunk(records, 10);
  console.log(
    `\nSplit into ${chunks.length} chunks: [${
      chunks.map((c) => c.length).join(", ")
    }]`,
  );

  // Process 3 chunks concurrently
  console.log("Processing chunks with concurrency: 3\n");
  const results = await parallel(
    chunks.map((c) => () => batchInsert(c)),
    { concurrency: 3 },
  );

  console.log(`\nResults (records per batch): [${results.join(", ")}]`);
  console.log(`Total inserted: ${results.reduce((a, b) => a + b, 0)}`);

  expect(results).toEqual([10, 10, 5]);
  expect(insertedBatches.length).toBe(3);
  expect(insertedBatches.flat().length).toBe(25);
});

Deno.test("chunk + parallel: parallel file processing with grouping", async () => {
  console.log("\n=== Pattern: chunk + parallel (file processing) ===");
  console.log(
    "Scenario: Process files grouped by directory, directories in parallel\n",
  );

  const filesByDir = {
    src: ["a.ts", "b.ts", "c.ts"],
    tests: ["a.test.ts", "b.test.ts"],
    docs: ["readme.md"],
  };

  console.log("Files by directory:");
  for (const [dir, files] of Object.entries(filesByDir)) {
    console.log(`  ${dir}/: ${files.join(", ")}`);
  }

  const processedDirs: string[] = [];

  const processDirectory = async (dir: string, files: string[]) => {
    await delay(5);
    processedDirs.push(dir);
    const paths = files.map((f) => `${dir}/${f}`);
    console.log(`  Processed ${dir}/ -> ${paths.length} files`);
    return paths;
  };

  console.log("\nProcessing all directories in parallel (concurrency: 3):\n");
  const dirEntries = Object.entries(filesByDir);
  const results = await parallel(
    dirEntries.map(([dir, files]) => () => processDirectory(dir, files)),
    { concurrency: 3 },
  );

  console.log(`\nAll processed files: ${results.flat().length} total`);
  results.flat().forEach((f) => console.log(`  ${f}`));

  expect(results.flat()).toEqual([
    "src/a.ts",
    "src/b.ts",
    "src/c.ts",
    "tests/a.test.ts",
    "tests/b.test.ts",
    "docs/readme.md",
  ]);
  expect(processedDirs.length).toBe(3);
});

// ============================================================================
// Pattern 2: batch alone - Map with concurrency control
// ============================================================================

Deno.test("batch: API calls with concurrency", async () => {
  console.log("\n=== Pattern: batch (API calls) ===");
  console.log("Scenario: Fetch 10 user profiles with concurrency limit of 5\n");

  const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  console.log(`User IDs to fetch: [${userIds.join(", ")}]`);

  let maxConcurrent = 0;
  let concurrent = 0;

  const fetchUser = async (id: number) => {
    concurrent++;
    maxConcurrent = Math.max(maxConcurrent, concurrent);
    console.log(`  Fetching user ${id} (concurrent: ${concurrent})`);
    await delay(10);
    concurrent--;
    return { id, name: `User ${id}` };
  };

  console.log("\nFetching with concurrency: 5\n");
  const users = await batch(userIds, fetchUser, { concurrency: 5 });

  console.log(`\nFetched ${users.length} users`);
  console.log(`Max concurrent requests: ${maxConcurrent}`);

  expect(users.length).toBe(10);
  expect(users[0]).toEqual({ id: 1, name: "User 1" });
  expect(maxConcurrent).toBeLessThanOrEqual(5);
});

Deno.test("batch: sequential processing with index", async () => {
  console.log("\n=== Pattern: batch (sequential with index) ===");
  console.log("Scenario: Process items one by one, tracking position\n");

  const items = ["first", "second", "third"];
  console.log(`Items: [${items.join(", ")}]`);

  const processed: string[] = [];

  console.log("\nProcessing with concurrency: 1 (sequential)\n");
  const results = await batch(
    items,
    async (item, index) => {
      await delay(5);
      const result = `${index + 1}. ${item}`;
      processed.push(result);
      console.log(`  Processed: "${result}"`);
      return result;
    },
    { concurrency: 1 },
  );

  console.log(`\nResults: [${results.join(", ")}]`);
  console.log(`Processing order preserved: ${JSON.stringify(processed)}`);

  expect(results).toEqual(["1. first", "2. second", "3. third"]);
  expect(processed).toEqual(["1. first", "2. second", "3. third"]);
});

// ============================================================================
// Pattern 3: chunk + batch - Process in waves
// ============================================================================

Deno.test("chunk + batch: rate-limited API with waves", async () => {
  console.log("\n=== Pattern: chunk + batch (rate-limited waves) ===");
  console.log("Scenario: API allows 3 requests per window, process 9 items\n");

  const items = Array.from({ length: 9 }, (_, i) => i);
  console.log(`Items: [${items.join(", ")}]`);

  const processedTimes: number[] = [];

  // Split into chunks of 3 (the rate limit)
  const chunks = chunk(items, 3);
  console.log(`\nSplit into ${chunks.length} chunks of 3:`);
  chunks.forEach((c, i) => console.log(`  Wave ${i + 1}: [${c.join(", ")}]`));

  // Process chunks sequentially with delay between
  console.log("\nProcessing waves with 50ms delay between:\n");
  const results: number[] = [];
  const startTime = Date.now();

  for (const [i, c] of chunks.entries()) {
    console.log(`Wave ${i + 1} starting at ${Date.now() - startTime}ms`);

    const chunkResults = await batch(
      c,
      async (item) => {
        processedTimes.push(Date.now());
        await delay(5);
        console.log(`  Item ${item} -> ${item * 2}`);
        return item * 2;
      },
      { concurrency: 3 }, // All 3 can run at once within rate limit
    );
    results.push(...chunkResults);

    if (i < chunks.length - 1) {
      console.log(`  (waiting 50ms for rate limit window)`);
      await delay(50);
    }
  }

  console.log(`\nResults: [${results.join(", ")}]`);
  console.log(`Total time: ${Date.now() - startTime}ms`);

  expect(results).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16]);

  // Verify timing
  const chunk1Times = processedTimes.slice(0, 3);
  const chunk2Times = processedTimes.slice(3, 6);
  const chunk1Spread = Math.max(...chunk1Times) - Math.min(...chunk1Times);
  const gapBetweenChunks = Math.min(...chunk2Times) - Math.max(...chunk1Times);

  expect(chunk1Spread).toBeLessThan(20);
  expect(gapBetweenChunks).toBeGreaterThan(40);
});

// ============================================================================
// Pattern 4: Combining all three for complex workflows
// ============================================================================

Deno.test("chunk + batch + parallel: ETL pipeline", async () => {
  console.log("\n=== Pattern: chunk + batch + parallel (ETL) ===");
  console.log("Scenario: Extract-Transform-Load pipeline\n");

  const sourceData = Array.from(
    { length: 20 },
    (_, i) => ({ id: i, raw: `data-${i}` }),
  );
  console.log(`Source data: ${sourceData.length} records`);

  // Stage 1: Extract in chunks
  console.log("\n--- Stage 1: EXTRACT (chunking) ---");
  const extractedChunks = chunk(sourceData, 5);
  console.log(`Split into ${extractedChunks.length} chunks of 5`);

  // Stage 2: Transform each chunk's items
  console.log(
    "\n--- Stage 2: TRANSFORM (parallel chunks, concurrent items) ---",
  );
  const transformedChunks = await parallel(
    extractedChunks.map((c, chunkIdx) => async () => {
      console.log(`  Transforming chunk ${chunkIdx + 1}...`);
      return await batch(
        c,
        async (item) => {
          await delay(2);
          return { ...item, transformed: true, value: item.id * 10 };
        },
        { concurrency: 3 },
      );
    }),
    { concurrency: 2 },
  );

  const allTransformed = transformedChunks.flat();
  console.log(`Transformed ${allTransformed.length} records`);

  // Stage 3: Load to multiple destinations
  console.log("\n--- Stage 3: LOAD (parallel destinations) ---");
  const destinations = ["db1", "db2"];

  const loadResults = await parallel(
    destinations.map((dest) => async () => {
      const destChunks = chunk(allTransformed, 10);
      let loaded = 0;
      for (const c of destChunks) {
        await delay(5);
        loaded += c.length;
      }
      console.log(`  Loaded ${loaded} records to ${dest}`);
      return { destination: dest, count: loaded };
    }),
    { concurrency: 2 },
  );

  console.log("\nFinal results:");
  loadResults.forEach((r) =>
    console.log(`  ${r.destination}: ${r.count} records`)
  );

  expect(loadResults).toEqual([
    { destination: "db1", count: 20 },
    { destination: "db2", count: 20 },
  ]);
  expect(allTransformed.length).toBe(20);
  expect(allTransformed[0]).toEqual({
    id: 0,
    raw: "data-0",
    transformed: true,
    value: 0,
  });
});

Deno.test("chunk + parallel with retry: resilient batch processing", async () => {
  console.log("\n=== Pattern: chunk + parallel + retry ===");
  console.log("Scenario: Process batches with automatic retry on failure\n");

  const items = Array.from({ length: 15 }, (_, i) => i);
  const chunks = chunk(items, 5);
  console.log(`Items: [${items.join(", ")}]`);
  console.log(`Chunks: ${chunks.map((c) => `[${c.join(",")}]`).join(", ")}`);

  let failureCount = 0;
  const processChunk = async (c: number[]) => {
    const sum = c.reduce((a, b) => a + b, 0);
    if (c.includes(5) && failureCount < 1) {
      failureCount++;
      console.log(`  Chunk [${c.join(",")}] FAILED (attempt ${failureCount})`);
      throw new Error("Temporary failure");
    }
    console.log(`  Chunk [${c.join(",")}] -> sum: ${sum}`);
    await delay(5);
    return sum;
  };

  console.log("\nProcessing with retry (maxRetries: 2, baseDelay: 10ms):\n");
  const results = await parallel(
    chunks.map((c) => () => processChunk(c)),
    {
      concurrency: 2,
      retry: {
        backoff: "exponential",
        maxRetries: 2,
        baseDelay: 10,
      },
    },
  );

  console.log(`\nResults (sums): [${results.join(", ")}]`);
  console.log(`Failures that were retried: ${failureCount}`);

  expect(results).toEqual([10, 35, 60]);
  expect(failureCount).toBe(1);
});

// ============================================================================
// Pattern 5: Error handling patterns
// ============================================================================

Deno.test("chunk + parallel with settled: collect all results including failures", async () => {
  console.log("\n=== Pattern: settled mode (collect failures) ===");
  console.log("Scenario: Process batches, some may fail, need all results\n");

  const items = Array.from({ length: 12 }, (_, i) => i);
  const chunks = chunk(items, 4);
  console.log(`Items: [${items.join(", ")}]`);
  console.log(`Chunks: ${chunks.map((c) => `[${c.join(",")}]`).join(", ")}`);

  const processChunk = async (c: number[]) => {
    if (c.includes(4)) {
      console.log(`  Chunk [${c.join(",")}] -> FAILED (contains 4)`);
      throw new Error("Chunk with 4 fails");
    }
    await delay(5);
    console.log(`  Chunk [${c.join(",")}] -> OK`);
    return c;
  };

  console.log("\nProcessing with settled: true\n");
  const results = await parallel(
    chunks.map((c) => () => processChunk(c)),
    { concurrency: 3, settled: true },
  );

  console.log("\nResults:");
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`  Chunk ${i + 1}: fulfilled -> [${r.value.join(",")}]`);
    } else {
      console.log(
        `  Chunk ${i + 1}: rejected -> ${(r.reason as Error).message}`,
      );
    }
  });

  expect(results.length).toBe(3);
  expect(results[0]).toEqual({ status: "fulfilled", value: [0, 1, 2, 3] });
  expect(results[1].status).toBe("rejected");
  expect(results[2]).toEqual({ status: "fulfilled", value: [8, 9, 10, 11] });
});

Deno.test("batch with settled: continue processing after failures", async () => {
  console.log("\n=== Pattern: batch + settled (partial success) ===");
  console.log("Scenario: Process items, some fail, extract successes\n");

  const items = [1, 2, 3, 4, 5];
  console.log(`Items: [${items.join(", ")}]`);

  console.log("\nProcessing (item 3 will fail):\n");
  const results = await batch(
    items,
    async (n) => {
      if (n === 3) {
        console.log(`  Item ${n} -> FAILED`);
        throw new Error("Three fails");
      }
      await delay(2);
      console.log(`  Item ${n} -> ${n * 10}`);
      return n * 10;
    },
    { concurrency: 3, settled: true },
  );

  console.log("\nResults:");
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`  Item ${items[i]}: fulfilled -> ${r.value}`);
    } else {
      console.log(
        `  Item ${items[i]}: rejected -> ${(r.reason as Error).message}`,
      );
    }
  });

  // Extract successful results
  const successful = results
    .filter((r): r is { status: "fulfilled"; value: number } =>
      r.status === "fulfilled"
    )
    .map((r) => r.value);

  console.log(`\nSuccessful values: [${successful.join(", ")}]`);
  console.log(`Success rate: ${successful.length}/${results.length}`);

  expect(results).toEqual([
    { status: "fulfilled", value: 10 },
    { status: "fulfilled", value: 20 },
    { status: "rejected", reason: expect.any(Error) },
    { status: "fulfilled", value: 40 },
    { status: "fulfilled", value: 50 },
  ]);
  expect(successful).toEqual([10, 20, 40, 50]);
});
