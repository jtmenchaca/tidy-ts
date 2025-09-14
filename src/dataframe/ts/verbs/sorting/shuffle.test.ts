// deno-lint-ignore-file no-explicit-any
import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("shuffle - basic functionality", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "David" },
    { id: 5, name: "Eve" },
  ]);

  const shuffled = df.shuffle();

  // Should have same number of rows
  expect(shuffled.nrows()).toBe(5);

  // Should have same columns
  expect(shuffled.columns()).toEqual(["id", "name"]);

  // Should contain all original rows (in any order)
  const originalRows = [...df.toArray()].sort((a, b) => a.id - b.id);
  const shuffledRows = [...shuffled.toArray()].sort((a, b) => a.id - b.id);
  expect(shuffledRows).toEqual(originalRows);
});

Deno.test("shuffle - reproducible with seed", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "David" },
    { id: 5, name: "Eve" },
  ]);

  const shuffled1 = df.shuffle(42);
  const shuffled2 = df.shuffle(42);

  // Same seed should produce same order
  expect(shuffled1.toArray()).toEqual(shuffled2.toArray());

  // Different seed should (very likely) produce different order
  const shuffled3 = df.shuffle(123);
  const rows1 = shuffled1.toArray().map((r) => r.id);
  const rows3 = shuffled3.toArray().map((r) => r.id);

  // With high probability, different seeds produce different orders
  // (Could rarely be same by chance, but very unlikely)
  const sameOrder = JSON.stringify(rows1) === JSON.stringify(rows3);
  expect(sameOrder).toBe(false);
});

Deno.test("shuffle - without seed gives different results", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "David" },
    { id: 5, name: "Eve" },
  ]);

  const shuffled1 = df.shuffle();
  const shuffled2 = df.shuffle();

  // Without seed, results should (very likely) be different
  const rows1 = shuffled1.toArray().map((r) => r.id);
  const rows2 = shuffled2.toArray().map((r) => r.id);

  // Check if at least one position is different
  let hasDifference = false;
  for (let i = 0; i < rows1.length; i++) {
    if (rows1[i] !== rows2[i]) {
      hasDifference = true;
      break;
    }
  }

  // Very high probability of difference with 5 elements
  expect(hasDifference).toBe(true);
});

Deno.test("shuffle - grouped DataFrame shuffles within groups", () => {
  const df = createDataFrame([
    { id: 1, category: "A", value: 10 },
    { id: 2, category: "A", value: 20 },
    { id: 3, category: "A", value: 30 },
    { id: 4, category: "B", value: 40 },
    { id: 5, category: "B", value: 50 },
    { id: 6, category: "B", value: 60 },
  ]);

  const grouped = df.groupBy("category");
  const shuffled = grouped.shuffle(42);

  // Should maintain all rows
  expect(shuffled.nrows()).toBe(6);

  // Check that all original rows are present
  const originalIds = df.toArray().map((r: any) => r.id).sort((
    a: number,
    b: number,
  ) => a - b);
  const shuffledIds = shuffled.toArray().map((r: any) => r.id).sort((
    a: number,
    b: number,
  ) => a - b);
  expect(shuffledIds).toEqual(originalIds);

  // With seed, should be reproducible
  const shuffled2 = grouped.shuffle(42);
  expect(shuffled.toArray()).toEqual(shuffled2.toArray());
});

Deno.test("shuffle - empty DataFrame", () => {
  const df = createDataFrame([] as Array<{ id: number; name: string }>);
  const shuffled = df.shuffle();

  expect(shuffled.nrows()).toBe(0);
  expect(shuffled.toArray()).toEqual([]);
});

Deno.test("shuffle - single row", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
  ]);

  const shuffled = df.shuffle();

  expect(shuffled.nrows()).toBe(1);
  expect(shuffled.toArray()).toEqual([{ id: 1, name: "Alice" }]);
});

Deno.test("shuffle - maintains data types", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", score: 95.5, active: true },
    { id: 2, name: "Bob", score: 87.2, active: false },
    { id: 3, name: "Charlie", score: 92.1, active: true },
  ]);

  const shuffled = df.shuffle();
  const rows = shuffled.toArray();

  // Check that all data types are preserved
  for (const row of rows) {
    expect(typeof row.id).toBe("number");
    expect(typeof row.name).toBe("string");
    expect(typeof row.score).toBe("number");
    expect(typeof row.active).toBe("boolean");
  }
});

Deno.test("sample - basic functionality with seed", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "David" },
    { id: 5, name: "Eve" },
  ]);

  const sampled = df.sample(3, 42);

  expect(sampled.nrows()).toBe(3);
  expect(sampled.columns()).toEqual(["id", "name"]);

  // With same seed, should get same sample
  const sampled2 = df.sample(3, 42);
  expect(sampled.toArray()).toEqual(sampled2.toArray());
});

Deno.test("sample - different seeds give different results", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "David" },
    { id: 5, name: "Eve" },
  ]);

  const sampled1 = df.sample(3, 42);
  const sampled2 = df.sample(3, 123);

  expect(sampled1.nrows()).toBe(3);
  expect(sampled2.nrows()).toBe(3);

  // Different seeds should (very likely) give different samples
  const ids1 = sampled1.toArray().map((r) => r.id).sort((a, b) => a - b);
  const ids2 = sampled2.toArray().map((r) => r.id).sort((a, b) => a - b);

  const sameSelection = JSON.stringify(ids1) === JSON.stringify(ids2);
  expect(sameSelection).toBe(false);
});

Deno.test("sample - sample size larger than data", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const sampled = df.sample(5, 42);

  // Should return all available rows when n > data size
  expect(sampled.nrows()).toBe(2);

  // Should contain all original data
  const originalIds = df.toArray().map((r) => r.id).sort((a, b) => a - b);
  const sampledIds = sampled.toArray().map((r) => r.id).sort((a, b) => a - b);
  expect(sampledIds).toEqual(originalIds);
});

Deno.test("sample - without seed gives different results", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "David" },
    { id: 5, name: "Eve" },
  ]);

  const sampled1 = df.sample(3);
  const sampled2 = df.sample(3);

  expect(sampled1.nrows()).toBe(3);
  expect(sampled2.nrows()).toBe(3);

  // Try multiple attempts to detect randomness (to avoid false failures)
  let foundDifference = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    const test1 = df.sample(3);
    const test2 = df.sample(3);

    const ids1 = test1.toArray().map((r: any) => r.id).sort((
      a: number,
      b: number,
    ) => a - b);
    const ids2 = test2.toArray().map((r: any) => r.id).sort((
      a: number,
      b: number,
    ) => a - b);

    if (JSON.stringify(ids1) !== JSON.stringify(ids2)) {
      foundDifference = true;
      break;
    }
  }

  // Very high probability of finding a difference across multiple attempts
  expect(foundDifference).toBe(true);
});
