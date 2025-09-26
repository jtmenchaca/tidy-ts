import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("Window Functions - Basic Integration", () => {
  const df = createDataFrame([
    { date: "2023-01", value: 100 },
    { date: "2023-02", value: 150 },
    { date: "2023-03", value: 200 },
    { date: "2023-04", value: 120 },
    { date: "2023-05", value: 180 },
  ]);

  const withLagLead = df.mutate({
    prev_value: stats.lag("value", 1),
    next_value: stats.lead("value", 1),
  });

  // Verify lag calculations
  expect(withLagLead[0].prev_value).toBe(undefined);
  expect(withLagLead[1].prev_value).toBe(100);
  expect(withLagLead[2].prev_value).toBe(150);

  // Verify lead calculations
  expect(withLagLead[0].next_value).toBe(150);
  expect(withLagLead[1].next_value).toBe(200);
  expect(withLagLead[4].next_value).toBe(undefined);
});

Deno.test("Window Functions - Financial Analysis", () => {
  const stockData = createDataFrame([
    { date: "2023-01-01", price: 150.0 },
    { date: "2023-01-02", price: 152.5 },
    { date: "2023-01-03", price: 148.0 },
    { date: "2023-01-04", price: 151.0 },
    { date: "2023-01-05", price: 149.5 },
  ]);

  const withLagLead = stockData.mutate({
    prev_price: stats.lag("price", 1),
    next_price: stats.lead("price", 1),
  });

  // Verify calculations
  expect(withLagLead[0].prev_price).toBe(undefined);
  expect(withLagLead[1].prev_price).toBe(150.0);
  expect(withLagLead[0].next_price).toBe(152.5);
  expect(withLagLead[4].next_price).toBe(undefined);
});

Deno.test("Window Functions - Edge Cases", () => {
  // Empty DataFrame
  const emptyDf = createDataFrame([]);
  const emptyResult = emptyDf.mutate({
    prev_value: stats.lag("value", 1),
  });
  expect(emptyResult.length).toBe(undefined);

  // Single row
  const singleRow = createDataFrame([{ value: 100 }]);
  const singleResult = singleRow.mutate({
    prev_value: stats.lag("value", 1),
    next_value: stats.lead("value", 1),
  });
  expect(singleResult[0].prev_value).toBe(undefined);
  expect(singleResult[0].next_value).toBe(undefined);

  // Large lag/lead
  const largeDf = createDataFrame([{ value: 100 }, { value: 200 }]);
  const largeResult = largeDf.mutate({
    prev_value: stats.lag("value", 5),
    next_value: stats.lead("value", 5),
  });
  expect(largeResult[0].prev_value).toBe(undefined);
  expect(largeResult[1].next_value).toBe(undefined);
});

Deno.test("Window Functions - Error Handling", () => {
  const _df = createDataFrame([{ value: 100 }]);

  // Test negative lag/lead
  expect(() => stats.lag([1, 2, 3], -1)).toThrow("Lag k must be non-negative");
  expect(() => stats.lead([1, 2, 3], -1)).toThrow(
    "Lead k must be non-negative",
  );
});

Deno.test("Window Functions - Grouped Operations", () => {
  const timeSeriesData = createDataFrame([
    { group: "A", date: "2023-01", value: 100 },
    { group: "A", date: "2023-02", value: 150 },
    { group: "A", date: "2023-03", value: 200 },
    { group: "B", date: "2023-01", value: 80 },
    { group: "B", date: "2023-02", value: 120 },
    { group: "B", date: "2023-03", value: 180 },
  ]);

  // Process each group separately
  const groupA = timeSeriesData.filter((row) => row.group === "A").arrange([
    "date",
  ]);
  const groupB = timeSeriesData.filter((row) => row.group === "B").arrange([
    "date",
  ]);

  const groupAWithLagLead = groupA.mutate({
    prev_value: stats.lag("value", 1),
    next_value: stats.lead("value", 1),
  });

  const groupBWithLagLead = groupB.mutate({
    prev_value: stats.lag("value", 1),
    next_value: stats.lead("value", 1),
  });

  // Combine results
  const allGroupsWithLagLead = groupAWithLagLead.bindRows(groupBWithLagLead);

  // Verify lag within groups
  const groupAResult = allGroupsWithLagLead.filter((row) => row.group === "A");
  expect(groupAResult[0].prev_value).toBe(undefined); // First row in group A
  expect(groupAResult[1].prev_value).toBe(100); // Second row in group A
  expect(groupAResult[2].prev_value).toBe(150); // Third row in group A

  // Verify lead within groups
  expect(groupAResult[0].next_value).toBe(150); // First row in group A
  expect(groupAResult[1].next_value).toBe(200); // Second row in group A
  expect(groupAResult[2].next_value).toBe(undefined); // Last row in group A
});
