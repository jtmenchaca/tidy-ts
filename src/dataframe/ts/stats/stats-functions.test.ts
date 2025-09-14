import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("Stats Functions for mutate - lag, lead, cumulative, ranking", () => {
  // ============================================================================
  // Test Data Setup
  // ============================================================================

  const timeSeriesData = createDataFrame([
    { date: "2023-01", sales: 100, temp: 32 },
    { date: "2023-02", sales: 150, temp: 45 },
    { date: "2023-03", sales: 200, temp: 58 },
    { date: "2023-04", sales: 120, temp: 72 },
    { date: "2023-05", sales: 180, temp: 85 },
  ]);

  console.log("Time series data:");
  timeSeriesData.print();

  // ============================================================================
  // Lag Function Tests
  // ============================================================================

  console.log("\n=== Lag Function Tests ===");

  const salesValues = timeSeriesData.extract("sales");

  // Test 1: Basic lag by 1
  const lag1 = stats.lag(salesValues, 1);
  console.log("Sales lag 1:", lag1);
  expect(lag1).toEqual([undefined, 100, 150, 200, 120]);

  // Test 2: Lag by 2
  const lag2 = stats.lag(salesValues, 2);
  console.log("Sales lag 2:", lag2);
  expect(lag2).toEqual([undefined, undefined, 100, 150, 200]);

  // Test 3: Lag with default value
  const lag1Default = stats.lag(salesValues, 1, 0);
  console.log("Sales lag 1 with default 0:", lag1Default);
  expect(lag1Default).toEqual([0, 100, 150, 200, 120]);

  // Test 4: Lag by 0 (should return original)
  const lag0 = stats.lag(salesValues, 0);
  expect(lag0).toEqual(salesValues);

  // Test 5: Error on negative lag
  expect(() => stats.lag(salesValues, -1)).toThrow();

  // ============================================================================
  // Lead Function Tests
  // ============================================================================

  console.log("\n=== Lead Function Tests ===");

  // Test 1: Basic lead by 1
  const lead1 = stats.lead(salesValues, 1);
  console.log("Sales lead 1:", lead1);
  expect(lead1).toEqual([150, 200, 120, 180, undefined]);

  // Test 2: Lead by 2
  const lead2 = stats.lead(salesValues, 2);
  console.log("Sales lead 2:", lead2);
  expect(lead2).toEqual([200, 120, 180, undefined, undefined]);

  // Test 3: Lead with default value
  const lead1Default = stats.lead(salesValues, 1, 999);
  console.log("Sales lead 1 with default 999:", lead1Default);
  expect(lead1Default).toEqual([150, 200, 120, 180, 999]);

  // Test 4: Error on negative lead
  expect(() => stats.lead(salesValues, -1)).toThrow();

  // ============================================================================
  // Cumulative Function Tests
  // ============================================================================

  console.log("\n=== Cumulative Function Tests ===");

  // Test cumulative product
  const values = [2, 3, 4, 5];
  const cumprodResult = stats.cumprod(values);
  console.log("Cumulative product of [2,3,4,5]:", cumprodResult);
  expect(cumprodResult).toEqual([2, 6, 24, 120]);

  // Test cumulative minimum
  const mixedValues = [5, 2, 8, 1, 9, 3];
  const cumminResult = stats.cummin(mixedValues);
  console.log("Cumulative min of [5,2,8,1,9,3]:", cumminResult);
  expect(cumminResult).toEqual([5, 2, 2, 1, 1, 1]);

  // Test cumulative maximum
  const cummaxResult = stats.cummax(mixedValues);
  console.log("Cumulative max of [5,2,8,1,9,3]:", cummaxResult);
  expect(cummaxResult).toEqual([5, 5, 8, 8, 9, 9]);

  // Test with null/undefined values
  const withNulls = [1, null, 3, undefined, 5];
  // @ts-expect-error - null values are not allowed
  const cumprodWithNulls = stats.cumprod(withNulls);
  console.log("Cumprod with nulls:", cumprodWithNulls);
  expect(cumprodWithNulls).toEqual([null, null, null, null, null]); // null propagates through cumulative product

  // ============================================================================
  // Dense Rank Function Tests
  // ============================================================================

  console.log("\n=== Dense Rank Function Tests ===");

  // Test 1: Basic dense ranking
  const scores = [85, 92, 85, 78, 92, 88];
  const denseRanks = stats.denseRank(scores);
  console.log("Scores:", scores);
  console.log("Dense ranks:", denseRanks);
  expect(denseRanks).toEqual([2, 4, 2, 1, 4, 3]); // No gaps: 78=1, 85=2, 88=3, 92=4

  // Test 2: Dense ranking descending
  const denseRanksDesc = stats.denseRank(scores, { desc: true });
  console.log("Dense ranks (desc):", denseRanksDesc);
  expect(denseRanksDesc).toEqual([3, 1, 3, 4, 1, 2]); // 92=1, 88=2, 85=3, 78=4

  // Test 3: Dense ranking with null values
  const scoresWithNull = [85, null, 92, undefined, 78];
  const ranksWithNull = stats.denseRank(scoresWithNull);
  console.log("Dense ranks with nulls:", ranksWithNull);
  expect(ranksWithNull).toEqual([2, 0, 3, 0, 1]); // nulls get rank 0

  // ============================================================================
  // Integration with mutate
  // ============================================================================

  console.log("\n=== Integration with mutate ===");

  // Pre-calculate arrays for mutate operations
  const salesArray = timeSeriesData.extract("sales");
  const prevSalesArray = stats.lag(salesArray, 1, 0);
  const nextSalesArray = stats.lead(salesArray, 1, 0);
  const runningTotalArray = stats.cumsum(salesArray);
  const runningMaxArray = stats.cummax(salesArray);
  const salesRankArray = stats.rank(salesArray, "average", true);
  const salesDenseRankArray = stats.denseRank(salesArray, { desc: true });

  // Use all functions in mutate operations
  const enriched = timeSeriesData.mutate({
    prev_sales: (_, idx) => prevSalesArray[idx],
    next_sales: (_, idx) => nextSalesArray[idx],
    running_total: (_, idx) => runningTotalArray[idx],
    running_max: (_, idx) => runningMaxArray[idx],
    sales_rank: (_, idx) => salesRankArray[idx],
    sales_dense_rank: (_, idx) => salesDenseRankArray[idx],
  });

  console.log("Enriched with window functions:");
  enriched.print();

  // Verify some calculations
  expect(enriched[0].prev_sales).toBe(0); // Default value
  expect(enriched[1].prev_sales).toBe(100); // Previous month
  expect(enriched[4].next_sales).toBe(0); // Default value (no next month)

  expect(enriched[2].running_total).toBe(450); // 100 + 150 + 200
  expect(enriched[2].running_max).toBe(200); // Max so far

  // Sales ranking (200 should be rank 1, 180 rank 2, etc.)
  const salesRank200 = enriched
    .filter((row) => row.sales === 200)
    .extractHead("sales_rank", 1);
  expect(salesRank200).toBe(1); // Highest sales

  // ============================================================================
  // Performance and Edge Cases
  // ============================================================================

  console.log("\n=== Edge Cases ===");

  // Empty arrays
  expect(stats.lag([], 1)).toEqual([]);
  expect(stats.lead([], 1)).toEqual([]);
  expect(stats.cumprod([])).toEqual([]);
  expect(stats.cummin([])).toEqual([]);
  expect(stats.cummax([])).toEqual([]);
  expect(stats.denseRank([])).toEqual([]);

  // Single element arrays
  expect(stats.lag([42], 1)).toEqual([undefined]);
  expect(stats.lead([42], 1)).toEqual([undefined]);
  expect(stats.cumprod([42])).toEqual([42]);
  expect(stats.denseRank([42])).toEqual([1]);

  // Large lag/lead values
  const shortArray = [1, 2, 3];
  expect(stats.lag(shortArray, 5)).toEqual([undefined, undefined, undefined]);
  expect(stats.lead(shortArray, 5)).toEqual([undefined, undefined, undefined]);

  console.log("✅ All stats function tests passed!");
});
