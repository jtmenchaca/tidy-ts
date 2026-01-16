import {
  createDataFrame,
  type DataFrame,
  type GroupedDataFrame,
  type PromisedDataFrame,
} from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Simple async function for testing
async function isValidAsync(value: number): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return value > 15;
}

async function asyncSum(values: readonly number[]): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return values.reduce((sum, val) => sum + val, 0);
}

Deno.test("async testing variations", async () => {
  const df = createDataFrame([
    { id: 1, value: 10, score: 85 },
    { id: 2, value: 20, score: 92 },
    { id: 3, value: 30, score: 78 },
  ]);

  console.log("Testing different async patterns:");

  // ══════════════════════════════════════════════════════════════
  // FILTER OPTIONS
  // ══════════════════════════════════════════════════════════════

  // Option 1: await the async function call
  const result1 = await df.filter(async (row) => await isValidAsync(row.value));
  console.log("Option 1 (with await):", result1.nrows());
  console.log("Option 1 type:", typeof result1, result1.constructor.name);
  // Type check: Async function → DataFrame (awaited)
  const _result1TypeCheck: DataFrame<{
    id: number;
    value: number;
    score: number;
  }> = result1;

  // Option 2: return the promise directly
  const result2 = df.filter((row) => isValidAsync(row.value));
  console.log(
    "Option 2 (return promise):",
    typeof result2,
    result2.constructor.name,
  );
  console.log("Option 2 is Promise:", result2 instanceof Promise);
  // Runtime check: sync function returning Promise should return thenable
  expect(typeof result2.then).toBe("function");
  // Type check: Async function → Promise<DataFrame> (not awaited)
  const _result2TypeCheck: PromisedDataFrame<
    {
      id: number;
      value: number;
      score: number;
    }
  > = result2;

  // Option 3: await then return
  const result3 = df.filter(async (row) => {
    const result = await isValidAsync(row.value);
    return result;
  });
  console.log("Option 3 type:", typeof result3, result3.constructor.name);
  console.log("Option 3 is Promise:", result3 instanceof Promise);
  // Runtime check: async function should return thenable
  expect(typeof result3.then).toBe("function");
  // Type check: Async function → Promise<DataFrame> (not awaited)
  const _result3TypeCheck: PromisedDataFrame<
    {
      id: number;
      value: number;
      score: number;
    }
  > = result3;

  // Option 4: sync function should return DataFrame
  const result4 = df.filter((row) => row.value > 15);
  console.log("Option 4 type:", typeof result4, result4.constructor.name);
  // Type check: sync function returning thenable
  const _result4TypeCheck: DataFrame<{
    id: number;
    value: number;
    score: number;
  }> = result4;

  // ══════════════════════════════════════════════════════════════
  // SUMMARISE OPTIONS
  // ══════════════════════════════════════════════════════════════

  // Option 1: sync function call returning async function
  const sumResult1 = df.summarise({
    total: async (df) => await asyncSum(df.value),
  });
  console.log(
    "Sum Option 1 type:",
    typeof sumResult1,
    sumResult1.constructor.name,
  );
  console.log("Sum Option 1 is Promise:", sumResult1 instanceof Promise);
  // Runtime check: async function in summarise should return thenable
  expect(typeof sumResult1.then).toBe("function");
  // Type check: Async function → Promise<DataFrame>
  const _sumResult1TypeCheck: PromisedDataFrame<{
    total: number;
  }> = sumResult1;

  // Option 2: sync function returning promise
  const sumResult2Promise = df.summarise({
    total: (df) => asyncSum(df.value),
  });
  // Runtime check: sync returning Promise should return thenable
  expect(typeof sumResult2Promise.then).toBe("function");
  const sumResult2 = await sumResult2Promise;
  console.log(
    "Sum Option 2 type:",
    typeof sumResult2,
    sumResult2.constructor.name,
  );
  // Type check: Aggregator returns Promise → DataFrame (awaited)
  const _sumResult2TypeCheck: DataFrame<{
    total: number;
  }> = sumResult2;

  // Option 3: await then return
  const sumResult3 = await df.summarise({
    total: async (df) => {
      const result = await asyncSum(df.value);
      return result;
    },
  });
  console.log(
    "Sum Option 3 type:",
    typeof sumResult3,
    sumResult3.constructor.name,
  );
  // Type check: Async function → DataFrame (awaited)
  const _sumResult3TypeCheck: DataFrame<{
    total: number;
  }> = sumResult3;

  // ═══════════════════════════════════════════════════════════════
  // DEMONSTRATION: How to use each pattern correctly
  // ═══════════════════════════════════════════════════════════════

  console.log("\n=== USAGE PATTERNS ===");

  // Pattern A: Sync function returning Promise (auto-detected as async)
  const patternA = await df.filter((row) => isValidAsync(row.value));
  const _patternATypeCheck: DataFrame<{
    id: number;
    value: number;
    score: number;
  }> = patternA;
  console.log("Pattern A (sync func → await result):", patternA.nrows());

  // Pattern B: Async function (explicitly async)
  const patternB = await df.filter(async (row) => {
    const isValid = await isValidAsync(row.value);
    return isValid;
  });
  const _patternBTypeCheck: DataFrame<{
    id: number;
    value: number;
    score: number;
  }> = patternB;
  console.log("Pattern B (async func → await result):", patternB.nrows());

  // Pattern C: Async summarise with proper awaiting
  const patternC = await df.summarise({
    avgScore: async (df) => {
      const sum = await asyncSum(df.score);
      return sum / df.nrows();
    },
    maxValue: (df) => Math.max(...df.value), // sync function
  });
  const _patternCTypeCheck: DataFrame<{
    avgScore: number;
    maxValue: number;
  }> = patternC;
  console.log("Pattern C (mixed sync/async summarise):", patternC.toArray()[0]);

  // Pattern D: Grouped async operations
  const patternD = await df
    .groupBy("id")
    .summarise({
      valueSum: async (group) => await asyncSum(group.value),
      scoreAvg: (group) =>
        group.score.reduce((a, b) => a + b, 0) / group.nrows(),
    });
  const _patternDTypeCheck: DataFrame<{
    id: number;
    valueSum: number;
    scoreAvg: number;
  }> = patternD;
  console.log("Pattern D (grouped async summarise):", patternD.nrows());

  // ═══════════════════════════════════════════════════════════════
  // MUTATE WITH ASYNC FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  console.log("\n=== MUTATE ASYNC PATTERNS ===");

  // Mutate Option 1: async function in mutate
  const mutateResult1 = df.mutate({
    isValid: async (row) => await isValidAsync(row.value),
    doubled: (row) => row.score * 2,
  });
  console.log(
    "Mutate Option 1 type:",
    mutateResult1 instanceof Promise ? "Promise<DataFrame>" : "DataFrame",
  );
  // Runtime check: async function in mutate should return thenable
  expect(typeof mutateResult1.then).toBe("function");
  // Type check: async function → Promise<DataFrame>
  const _mutateResult1TypeCheck: PromisedDataFrame<
    {
      id: number;
      value: number;
      score: number;
      isValid: boolean;
      doubled: number;
    }
  > = mutateResult1;

  // Mutate Option 2: sync function returning Promise
  const mutateResult2 = df.mutate({
    isValid: (row) => isValidAsync(row.value), // returns Promise<boolean>
    processedScore: (row) => Promise.resolve(row.score + 100),
  });
  console.log(
    "Mutate Option 2 type:",
    mutateResult2 instanceof Promise ? "Promise<DataFrame>" : "DataFrame",
  );
  // Runtime check: This SHOULD be thenable
  expect(typeof mutateResult2.then).toBe("function");
  // Type check: sync returning Promise → Promise<DataFrame>
  const _mutateResult2TypeCheck: PromisedDataFrame<
    {
      id: number;
      value: number;
      score: number;
      isValid: boolean;
      processedScore: number;
    }
  > = mutateResult2;

  // Mutate Option 3: mixed sync and async
  const mutateResult3 = await df.mutate({
    syncCol: (row) => row.id * 10, // pure sync
    asyncCol: async (row) => await isValidAsync(row.value), // async
    promiseCol: (row) => asyncSum([row.score, row.value]), // sync returning Promise
  });
  console.log(
    "Mutate Option 3 type:",
    typeof mutateResult3,
    mutateResult3.constructor.name,
  );
  // Type check: mixed → DataFrame (awaited)
  const _mutateResult3TypeCheck: DataFrame<{
    id: number;
    value: number;
    score: number;
    syncCol: number;
    asyncCol: boolean;
    promiseCol: number;
  }> = mutateResult3;

  // Mutate Option 4: chaining with async mutate
  const mutateChain = await df
    .filter((row) => row.id > 0)
    .mutate({
      category: async (row) =>
        await isValidAsync(row.value) ? "valid" : "invalid",
      adjustedScore: async (row) => {
        const adjustment = await asyncSum([row.score, 10]);
        return adjustment;
      },
    })
    .then((df) => df.arrange("score"));

  console.log("Mutate chain result:", mutateChain.nrows());
  // Type check: chained operations
  const _mutateChainTypeCheck: DataFrame<{
    id: number;
    value: number;
    score: number;
    category: "valid" | "invalid";
    adjustedScore: number;
  }> = mutateChain;

  // Mutate Option 5: grouped mutate with async
  const groupedMutate = await df
    .groupBy("id")
    .mutate({
      groupMean: async (_row, _idx, group) => {
        const values = [];
        for (let i = 0; i < group.nrows(); i++) {
          // deno-lint-ignore no-explicit-any
          values.push((group as any)[i].score);
        }
        return await asyncSum(values) / values.length;
      },
      isTopHalf: (_row, idx) => idx < 2,
    });

  console.log(
    "Grouped mutate type:",
    typeof groupedMutate,
    groupedMutate.constructor.name,
  );
  // Type check: grouped mutate with async
  const _groupedMutateTypeCheck: GroupedDataFrame<{
    id: number;
    value: number;
    score: number;
    groupMean: number;
    isTopHalf: boolean;
  }, "id"> = groupedMutate;

  // Mutate Option 6: Verify sync function returning Promise detection
  const mutateDetection = df.mutate({
    // This is a sync function that returns a Promise
    asyncFromSync: (row) => isValidAsync(row.value),
    // This is an async function
    asyncDeclared: async (row) => await isValidAsync(row.score),
  });
  console.log(
    "Mutate detection (sync returning Promise):",
    mutateDetection instanceof Promise ? "Promise<DataFrame>" : "DataFrame",
  );
  // Runtime check: both patterns should trigger thenable return
  expect(typeof mutateDetection.then).toBe("function");
  // Both should trigger async path
  const mutateDetectionResult = await mutateDetection;
  console.log("Result rows:", mutateDetectionResult.nrows());
  expect(mutateDetectionResult.nrows()).toBe(3);
  // Verify the actual values
  const detectionData = mutateDetectionResult.toArray();
  expect(detectionData[0].asyncFromSync).toBe(false); // value 10 > 15 = false
  expect(detectionData[1].asyncFromSync).toBe(true); // value 20 > 15 = true
  expect(detectionData[0].asyncDeclared).toBe(true); // score 85 > 15 = true
  // Type check: Both trigger async
  const _mutateDetectionTypeCheck: DataFrame<{
    id: number;
    value: number;
    score: number;
    asyncFromSync: boolean;
    asyncDeclared: boolean;
  }> = mutateDetectionResult;

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL EDGE CASE TESTS
  // ═══════════════════════════════════════════════════════════════

  console.log("\n=== EDGE CASE TESTS ===");

  // Test 1: Mixed predicates ⇒ Promise
  const mixed = df.filter(
    (row) => row.id > 0, // sync
    (row) => isValidAsync(row.value), // sync-returning-Promise
  );
  expect(typeof mixed.then).toBe("function");
  const _mixedTypeCheck: PromisedDataFrame<
    { id: number; value: number; score: number }
  > = mixed;
  console.log("Mixed predicates test: Promise returned");

  // Test 2: Predicate array length must match current view
  expect(() => {
    // 3-row df; pass wrong-length mask
    // deno-lint-ignore no-explicit-any
    (df as any).filter([true, false]);
  }).toThrow(); // Should throw immediately since it's a sync operation
  console.log(
    "Predicate array length validation: throws error for wrong length",
  );

  // Test 3: Grouped filter preserves grouping in types + async
  const g = df.groupBy("id");
  const gf = g.filter((row) => isValidAsync(row.value));
  expect(typeof gf.then).toBe("function");
  const awaitedGf = await gf;
  const _gfTypeCheck: GroupedDataFrame<
    { id: number; value: number; score: number },
    "id"
  > = awaitedGf;
  console.log("Grouped filter test: Promise returned, grouping preserved");

  // Test 4: Chained mask correctness across sync→async
  // NOTE: Currently there's a bug where chained filters don't properly handle
  // row snapshots from filtered views - the async filter sees original data
  df.print();
  const chained = await df
    .filter((r) => r.value >= 20) // sync mask to rows with values 20, 30
    .filter((r) => isValidAsync(r.value)); // async gets wrong row data due to bug

  chained.print();
  expect(chained.nrows()).toBe(2);

  // Test 5: Boolean-array predicate stays sync
  const arrPred = df.filter([false, true, true] as const);
  const _arrPredTypeCheck: DataFrame<
    { id: number; value: number; score: number }
  > = arrPred;
  expect(arrPred.nrows()).toBe(2);
  console.log("Boolean array predicate test: stays sync, correct row count");

  console.log("\n=== ALL ASYNC TESTS COMPLETE ===");
});

Deno.test("chained async operations row snapshot integrity", async () => {
  const df = createDataFrame([
    { id: 1, value: 10, score: 85, category: "A" },
    { id: 2, value: 20, score: 92, category: "B" },
    { id: 3, value: 30, score: 78, category: "A" },
    { id: 4, value: 40, score: 95, category: "B" },
  ]);

  // Async helpers for testing
  async function isHighValueAsync(value: number): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return value >= 25;
  }

  async function enrichCategoryAsync(category: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return category === "A" ? "Alpha" : "Beta";
  }

  async function computeBonusAsync(score: number): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return score > 90 ? score * 0.1 : score * 0.05;
  }

  console.log("\n=== CHAINED ASYNC OPERATIONS ROW SNAPSHOT INTEGRITY ===");

  // Test 1: Filter → Filter chaining with correct row data
  console.log("\n--- Test 1: Chained Filters ---");
  const chainedFilters = await df
    .filter((row) => row.value >= 20) // Should keep rows 2, 3, 4 (values 20, 30, 40)
    .filter(async (row) => await isHighValueAsync(row.value)); // Should keep rows 3, 4 (values 30, 40)

  console.log("Chained filters result:");
  chainedFilters.print();
  expect(chainedFilters.nrows()).toBe(2);

  const chainedData = chainedFilters.toArray();
  expect(chainedData.map((r) => r.value).sort()).toEqual([30, 40]);

  // Test 2: Filter → Mutate chaining with row snapshots
  console.log("\n--- Test 2: Filter → Mutate Chain ---");
  const filterMutateChain = await df
    .filter((row) => row.category === "A") // Should keep rows 1, 3 (ids 1, 3)
    .mutate({
      enhanced_category: async (row) => await enrichCategoryAsync(row.category),
      bonus: async (row) => await computeBonusAsync(row.score),
      sync_check: (row) => `${row.id}-${row.value}`, // Sync column to verify row data
    });

  console.log("Filter → Mutate result:");
  filterMutateChain.print();
  expect(filterMutateChain.nrows()).toBe(2);

  const filterMutateData = filterMutateChain.toArray();
  // Verify the sync_check column has correct id-value combinations
  const syncChecks = filterMutateData.map((r) => r.sync_check).sort();
  expect(syncChecks).toEqual(["1-10", "3-30"]);

  // Verify async columns got correct data
  expect(filterMutateData.every((r) => r.enhanced_category === "Alpha")).toBe(
    true,
  );

  // Test 3: Mutate → Filter chaining
  console.log("\n--- Test 3: Mutate → Filter Chain ---");
  const mutated = await df
    .mutate({
      doubled_value: (row) => row.value * 2,
      high_performer: (row) => row.score > 90,
    });
  const mutateFilterChain = await mutated
    .filter(async (row) => await isHighValueAsync(row.doubled_value as number));

  console.log("Mutate → Filter result:");
  mutateFilterChain.print();
  expect(mutateFilterChain.nrows()).toBe(3);

  // Should have rows where doubled_value >= 25
  // Since our test data has values [10, 20, 30, 40], doubled: [20, 40, 60, 80]
  // isHighValueAsync checks >= 25, so 40, 60, 80 qualify → original values 20, 30, 40
  expect(mutateFilterChain.extract("value").sort()).toEqual([
    20,
    30,
    40,
  ]);
  expect(mutateFilterChain.extract("doubled_value").sort()).toEqual([
    40,
    60,
    80,
  ]);

  // Test 4: Complex chaining: Filter → Mutate → Filter
  console.log("\n--- Test 4: Filter → Mutate → Filter Chain ---");
  const filtered = df.filter((row) => row.score >= 80); // Keep rows with score >= 80 (all 4 qualify)
  const mutatedComplex = await filtered.mutate({
    performance_tier: async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      if (row.score >= 95) return "Excellent";
      if (row.score >= 90) return "Good";
      return "Fair";
    },
    adjusted_value: (row) => row.value + row.score, // Sync calculation
  });
  const complexChain = await mutatedComplex.filter(async (row) => {
    // Filter for Good or Excellent performers
    await new Promise((resolve) => setTimeout(resolve, 1));
    return row.performance_tier === "Good" ||
      row.performance_tier === "Excellent";
  });

  console.log("Complex chain result:");
  complexChain.print();

  // Should have rows where score >= 90 (rows 2, 4: scores 92, 95)
  expect(complexChain.nrows()).toBe(2);
  expect(complexChain.score).toEqual([92, 95]);
  expect([...complexChain.performance_tier].sort()).toEqual([
    "Excellent",
    "Good",
  ]);

  // Verify adjusted_value was computed with correct row data
  const expectedAdjusted = complexChain.extract("value").map((v, i) =>
    v + complexChain.score[i]
  );
  const actualAdjusted = complexChain.adjusted_value;
  expect(actualAdjusted).toEqual(expectedAdjusted);

  // Test 5: Grouped operations after filtering
  console.log("\n--- Test 5: Filter → GroupBy → Summarise Chain ---");
  const groupedChain = await df
    .filter((row) => row.value >= 20) // Keep values 20, 30, 40
    .groupBy("category")
    .summarise({
      count: (group) => group.nrows(),
      avg_score: async (group) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        const scores = [];
        for (let i = 0; i < group.nrows(); i++) {
          scores.push(group.score[i]);
        }
        return scores.reduce((a, b) => a + b, 0) / scores.length;
      },
      total_value: (group) => {
        let sum = 0;
        for (let i = 0; i < group.nrows(); i++) {
          sum += group.value[i];
        }
        return sum;
      },
    });

  console.log("Grouped chain result:");
  groupedChain.print();

  const groupedData = groupedChain.toArray();
  expect(groupedData.length).toBe(2); // Two categories: A, B

  // Verify calculations are correct for filtered data
  // Category A: row 3 (value=30, score=78)
  // Category B: rows 2,4 (values=20,40, scores=92,95)
  const categoryA = groupedData.find((r) => r.category === "A");
  const categoryB = groupedData.find((r) => r.category === "B");

  expect(categoryA?.count).toBe(1);
  expect(categoryA?.total_value).toBe(30);
  expect(categoryA?.avg_score).toBe(78);

  expect(categoryB?.count).toBe(2);
  expect(categoryB?.total_value).toBe(60); // 20 + 40
  expect(categoryB?.avg_score).toBe(93.5); // (92 + 95) / 2
});

// Tiny async helpers for edge case testing
async function doubleAsync(n: number): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return n * 2;
}

async function categorizeAsync(n: number): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return n > 15 ? "high" : "low";
}

async function checkThresholdAsync(n: number): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return n >= 15;
}

Deno.test("mutate async → arrange seamless chaining", async () => {
  const df = createDataFrame([
    { id: 1, value: 30 },
    { id: 2, value: 10 },
    { id: 3, value: 20 },
  ]);

  const result = await df
    .mutate({ asyncScore: async (row) => await doubleAsync(row.value) })
    .arrange("asyncScore");

  expect(result.asyncScore).toEqual([20, 40, 60]);
});

Deno.test("mutate async → select seamless chaining", async () => {
  const df = createDataFrame([{ id: 1, value: 10 }]);

  const result = await df
    .mutate({ asyncCol: async (row) => await doubleAsync(row.value) })
    .select("asyncCol");

  expect(result.extractNth("asyncCol", 0)).toBe(20);
});

Deno.test("mutate async → join seamless chaining", async () => {
  const df1 = createDataFrame([{ id: 1, value: 10 }]);
  const df2 = createDataFrame([{ joinKey: 20, data: "test" }]);

  const result = await df1
    .mutate({ joinKey: async (row) => await doubleAsync(row.value) })
    .innerJoin(df2, "joinKey");

  expect(result.nrows()).toBe(1);
  expect(result.extractNth("data", 0)).toBe("test");
});

Deno.test("filter async → mutate → arrange seamless chaining", async () => {
  const df = createDataFrame([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
  ]);

  const result = await df
    .filter(async (row) => await checkThresholdAsync(row.value))
    .mutate({ doubled: async (row) => await doubleAsync(row.value) })
    .arrange("doubled");

  expect(result.nrows()).toBe(2);
  expect(result.doubled).toEqual([40, 60]);
});

Deno.test("mutate async → distinct seamless chaining", async () => {
  const df = createDataFrame([
    { id: 1, value: 10 },
    { id: 2, value: 10 },
    { id: 3, value: 20 },
  ]);

  const result = await df
    .mutate({ category: async (row) => await categorizeAsync(row.value) })
    .distinct("category");

  expect(result.nrows()).toBe(2);
});

Deno.test("complex async chain", async () => {
  const df = createDataFrame([
    { id: 1, value: 5 },
    { id: 2, value: 10 },
    { id: 3, value: 20 },
    { id: 4, value: 25 },
  ]);

  const result = await df
    .filter(async (row) => await checkThresholdAsync(row.value))
    .mutate({
      doubled: async (row) => await doubleAsync(row.value),
      category: async (row) => await categorizeAsync(row.value),
    })
    .arrange("doubled")
    .slice(0, 1);

  expect(result.nrows()).toBe(1);
  expect(result.extractNth("doubled", 0)).toBe(40);
});

Deno.test("grouped async operations seamless chaining", async () => {
  const df = createDataFrame([
    { id: 1, value: 10, group: "A" },
    { id: 2, value: 20, group: "B" },
    { id: 3, value: 30, group: "A" },
  ]);

  const result = await df
    .mutate({ doubled: async (row) => await doubleAsync(row.value) })
    .groupBy("group")
    .summarise({
      total: async (g) => await asyncSum(g.doubled),
      count: (g) => g.nrows(),
    });

  expect(result.nrows()).toBe(2);
});
