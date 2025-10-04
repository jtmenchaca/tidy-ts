import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Filter groups where first row has flag === true", () => {
  const df = createDataFrame([
    { group: "A", value: 5, flag: true }, // A's first row: flag = true
    { group: "A", value: 1, flag: false },
    { group: "A", value: 8, flag: false },
    { group: "B", value: 3, flag: false }, // B's first row: flag = false
    { group: "B", value: 1, flag: true },
    { group: "B", value: 7, flag: true },
    { group: "C", value: 2, flag: true }, // C's first row: flag = true
    { group: "C", value: 9, flag: false },
    { group: "C", value: 4, flag: false },
  ]);

  // Get the first row of each group
  const firstRows = df
    .groupBy("group")
    .sliceHead(1);

  console.log("First row of each group:");
  firstRows.print();

  // Filter to only groups where first row has flag === true
  const groupsWithTrueFirst = firstRows
    .filter((r) => r.flag === true);

  console.log("\nGroups where first row has flag === true:");
  groupsWithTrueFirst.print();

  expect(groupsWithTrueFirst.nrows()).toBe(2);
  expect([...groupsWithTrueFirst].map((r) => r.group)).toEqual(["A", "C"]);
  expect([...groupsWithTrueFirst].every((r) => r.flag === true)).toBe(true);

  // Now get the group names that passed
  const validGroups = [...groupsWithTrueFirst].map((r) => r.group);

  // Filter original dataframe to only those groups
  const result = df.filter((r) => validGroups.includes(r.group));

  console.log("\nAll rows from groups where first row has flag === true:");
  result.print();

  expect(result.nrows()).toBe(6); // 3 from A + 3 from C
  expect([...result].map((r) => r.group).every((g) => g === "A" || g === "C"))
    .toBe(true);
});

Deno.test("Filter groups where first row has value === 1", () => {
  const df = createDataFrame([
    { group: "A", value: 1, flag: false }, // A's first row: value = 1
    { group: "A", value: 5, flag: true },
    { group: "A", value: 8, flag: false },
    { group: "B", value: 3, flag: false }, // B's first row: value = 3
    { group: "B", value: 1, flag: true },
    { group: "B", value: 7, flag: true },
    { group: "C", value: 1, flag: true }, // C's first row: value = 1
    { group: "C", value: 2, flag: false },
    { group: "C", value: 9, flag: false },
  ]);

  // Get the first row of each group and filter
  const firstRows = df
    .groupBy("group")
    .sliceHead(1)
    .filter((r) => r.value === 1);

  console.log("\nGroups where first row has value === 1:");
  firstRows.print();

  expect(firstRows.nrows()).toBe(2);
  expect([...firstRows].map((r) => r.group)).toEqual(["A", "C"]);
  expect([...firstRows].every((r) => r.value === 1)).toBe(true);
});

Deno.test("Count groups where first row meets condition", () => {
  const df = createDataFrame([
    { group: "A", score: 100, status: "active" },
    { group: "A", score: 50, status: "inactive" },
    { group: "B", score: 30, status: "inactive" },
    { group: "B", score: 80, status: "active" },
    { group: "C", score: 90, status: "active" },
    { group: "C", score: 60, status: "inactive" },
  ]);

  // Count how many groups have score >= 80 in their first row
  const count = df
    .groupBy("group")
    .sliceHead(1)
    .filter((r) => r.score >= 80)
    .nrows();

  console.log(`\nNumber of groups with first row score >= 80: ${count}`);
  expect(count).toBe(2); // Groups A and C
});

Deno.test("Use summarize to check first row condition", () => {
  const df = createDataFrame([
    { group: "A", score: 100, status: "active" },
    { group: "A", score: 50, status: "inactive" },
    { group: "B", score: 30, status: "inactive" },
    { group: "B", score: 80, status: "active" },
    { group: "C", score: 90, status: "active" },
    { group: "C", score: 60, status: "inactive" },
  ]);

  // Use summarize to get first row info for each group
  const summary = df
    .groupBy("group")
    .summarize({
      first_score: (g) => g.score[0],
      first_status: (g) => g.status[0],
      has_high_first_score: (g) => g.score[0] >= 80,
    })
    .filter((r) => r.has_high_first_score);

  console.log("\nGroups with first row score >= 80 (using summarize):");
  summary.print();

  expect(summary.nrows()).toBe(2);
  expect([...summary].map((r) => r.group)).toEqual(["A", "C"]);
});
