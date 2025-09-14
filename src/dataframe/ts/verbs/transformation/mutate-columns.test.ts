import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

const data = createDataFrame([
  { name: "Alice", age: 25, score1: 85, score2: 90, score3: 88 },
  { name: "Bob", age: 30, score1: 92, score2: 88, score3: 95 },
  { name: "Charlie", age: 28, score1: 78, score2: 85, score3: 82 },
  { name: "Diana", age: 35, score1: 95, score2: 92, score3: 90 },
]);

Deno.test("mutate_columns basic functionality", () => {
  const result = data
    .mutateColumns({
      col_type: "number",
      columns: ["score1", "score2", "score3"],
      new_columns: [
        { prefix: "add_1_", fn: (col) => col + 1 },
        { prefix: "add_2_", fn: (col) => col + 2 },
      ],
    });

  // Test add_1_ function results
  expect(result[0]["add_1_score1"]).toBe(86); // 85 + 1
  expect(result[0]["add_1_score2"]).toBe(91); // 90 + 1
  expect(result[0]["add_1_score3"]).toBe(89); // 88 + 1

  expect(result[1]["add_1_score1"]).toBe(93); // 92 + 1
  expect(result[1]["add_1_score2"]).toBe(89); // 88 + 1
  expect(result[1]["add_1_score3"]).toBe(96); // 95 + 1

  expect(result[2]["add_1_score1"]).toBe(79); // 78 + 1
  expect(result[2]["add_1_score2"]).toBe(86); // 85 + 1
  expect(result[2]["add_1_score3"]).toBe(83); // 82 + 1

  expect(result[3]["add_1_score1"]).toBe(96); // 95 + 1
  expect(result[3]["add_1_score2"]).toBe(93); // 92 + 1
  expect(result[3]["add_1_score3"]).toBe(91); // 90 + 1

  // Test add_2_ function results
  expect(result[0]["add_2_score1"]).toBe(87); // 85 + 2
  expect(result[0]["add_2_score2"]).toBe(92); // 90 + 2
  expect(result[0]["add_2_score3"]).toBe(90); // 88 + 2

  expect(result[1]["add_2_score1"]).toBe(94); // 92 + 2
  expect(result[1]["add_2_score2"]).toBe(90); // 88 + 2
  expect(result[1]["add_2_score3"]).toBe(97); // 95 + 2

  expect(result[2]["add_2_score1"]).toBe(80); // 78 + 2
  expect(result[2]["add_2_score2"]).toBe(87); // 85 + 2
  expect(result[2]["add_2_score3"]).toBe(84); // 82 + 2

  expect(result[3]["add_2_score1"]).toBe(97); // 95 + 2
  expect(result[3]["add_2_score2"]).toBe(94); // 92 + 2
  expect(result[3]["add_2_score3"]).toBe(92); // 90 + 2
});

Deno.test("mutate_columns with grouped data", () => {
  const result = data
    .groupBy("age")
    .mutateColumns({
      col_type: "number",
      columns: ["score1", "score2"],
      new_columns: [
        { prefix: "add_1_", fn: (col) => col + 1 },
        { prefix: "add_2_", fn: (col) => col + 2 },
      ],
    });

  // Should have the same number of rows as original data
  expect(result.nrows()).toBe(4);

  // Test that grouped mutate_columns works the same as ungrouped
  // (since we're not doing group-level operations, just row-level)
  expect(result[0]["add_1_score1"]).toBe(86); // Alice (age 25): 85 + 1
  expect(result[0]["add_1_score2"]).toBe(91); // Alice (age 25): 90 + 1
  expect(result[0]["add_2_score1"]).toBe(87); // Alice (age 25): 85 + 2
  expect(result[0]["add_2_score2"]).toBe(92); // Alice (age 25): 90 + 2

  expect(result[1]["add_1_score1"]).toBe(93); // Bob (age 30): 92 + 1
  expect(result[1]["add_1_score2"]).toBe(89); // Bob (age 30): 88 + 1
  expect(result[1]["add_2_score1"]).toBe(94); // Bob (age 30): 92 + 2
  expect(result[1]["add_2_score2"]).toBe(90); // Bob (age 30): 88 + 2
});
