/**
 * Descriptive Statistics and Window Functions
 *
 * Demonstrates lag, lead, cumulative operations, ranking, and integration with mutate.
 */

import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

Deno.test("Stats - Lag and Lead Functions", () => {
  const timeSeries = createDataFrame([
    { date: "2023-01", sales: 100 },
    { date: "2023-02", sales: 150 },
    { date: "2023-03", sales: 200 },
    { date: "2023-04", sales: 120 },
  ]);

  const salesValues = timeSeries.extract("sales");

  // Lag by 1 period
  const lag1 = s.lag(salesValues, 1);
  expect(lag1).toEqual([undefined, 100, 150, 200]);

  // Lead by 1 period
  const lead1 = s.lead(salesValues, 1);
  expect(lead1).toEqual([150, 200, 120, undefined]);

  // With default values
  const lag1Default = s.lag(salesValues, 1, 0);
  expect(lag1Default).toEqual([0, 100, 150, 200]);
});

Deno.test("Stats - Cumulative Functions", () => {
  const values = [2, 3, 4, 5];

  // Cumulative product
  const cumprod = s.cumprod(values);
  expect(cumprod).toEqual([2, 6, 24, 120]);

  // Cumulative min/max
  const mixedValues = [5, 2, 8, 1, 9, 3];
  const cummin = s.cummin(mixedValues);
  const cummax = s.cummax(mixedValues);

  expect(cummin).toEqual([5, 2, 2, 1, 1, 1]);
  expect(cummax).toEqual([5, 5, 8, 8, 9, 9]);
});

Deno.test("Stats - Dense Rank Function", () => {
  const scores = [85, 92, 85, 78, 92, 88];

  // Dense ranking (no gaps)
  const denseRanks = s.denseRank(scores);
  expect(denseRanks).toEqual([2, 4, 2, 1, 4, 3]); // 78=1, 85=2, 88=3, 92=4

  // Descending order
  const denseRanksDesc = s.denseRank(scores, { desc: true });
  expect(denseRanksDesc).toEqual([3, 1, 3, 4, 1, 2]); // 92=1, 88=2, 85=3, 78=4
});

Deno.test("Stats - Window Functions with mutate", () => {
  const timeSeries = createDataFrame([
    { date: "2023-01", sales: 100 },
    { date: "2023-02", sales: 150 },
    { date: "2023-03", sales: 200 },
    { date: "2023-04", sales: 120 },
    { date: "2023-05", sales: 180 },
  ]);

  const enriched = timeSeries.mutate({
    prev_sales: s.lag(timeSeries.extract("sales"), 1, 0),
    next_sales: s.lead(timeSeries.extract("sales"), 1, 0),
    running_total: s.cumsum(timeSeries.extract("sales")),
    running_max: s.cummax(timeSeries.extract("sales")),
    sales_rank: s.rank(timeSeries.extract("sales"), "average", true),
  });

  enriched.print("Time Series with Window Functions:");

  expect(enriched[0].prev_sales).toBe(0);
  expect(enriched[1].prev_sales).toBe(100);
  expect(enriched[2].running_total).toBe(450); // 100 + 150 + 200
  expect(enriched[2].running_max).toBe(200);
});
