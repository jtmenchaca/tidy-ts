import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { name: "Alice", age: 25, score1: 85, score2: 90, score3: 88 },
  { name: "Bob", age: 30, score1: 92, score2: 88, score3: 95 },
  { name: "Charlie", age: 28, score1: 78, score2: 85, score3: 82 },
  { name: "Diana", age: 35, score1: 95, score2: 92, score3: 90 },
]);

Deno.test("summarise_columns basic functionality", () => {
  const result = data
    .summariseColumns({
      colType: "number",
      columns: ["score1", "score2", "score3"],
      newColumns: [
        { prefix: "mean_", fn: (col) => stats.mean(col) },
        { prefix: "sum_", fn: (col) => stats.sum(col) },
      ],
    });

  expect(result[0]["mean_score1"]).toBe(87.5); // (85 + 92 + 78 + 95) / 4
  expect(result[0]["mean_score2"]).toBe(88.75); // (90 + 88 + 85 + 92) / 4
  expect(result[0]["mean_score3"]).toBe(88.75); // (88 + 95 + 82 + 90) / 4
  expect(result[0]["sum_score1"]).toBe(350); // 85 + 92 + 78 + 95
  expect(result[0]["sum_score2"]).toBe(355); // 90 + 88 + 85 + 92
  expect(result[0]["sum_score3"]).toBe(355); // 88 + 95 + 82 + 90
});

Deno.test("summarise_columns with grouped data", () => {
  const result = data
    .groupBy("age")
    .summariseColumns({
      colType: "number",
      columns: ["score1", "score2"],
      newColumns: [
        { prefix: "mean_", fn: (col) => stats.mean(col) },
      ],
    });

  // Should have one row per age group with mean scores
  expect(result.nrows()).toBe(4); // 4 different ages
  expect(result[0]["age"]).toBe(25);
  expect(result[0]["mean_score1"]).toBe(85); // Only Alice has age 25
  expect(result[0]["mean_score2"]).toBe(90);
});
