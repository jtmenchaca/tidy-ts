import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// If array-based mutate on grouped data does NOT slice per group,
// cummax will bleed: group B's cummax will carry forward group A's max.
//
// Data arranged by group, value:
//   A: 10, 20, 30  → cummax per-group should be [10, 20, 30]
//   B:  1,  2,  3  → cummax per-group should be [ 1,  2,  3]
//
// If cummax bleeds across groups (computed on full array):
//   full array after arrange: [10, 20, 30, 1, 2, 3]
//   cummax of full:           [10, 20, 30, 30, 30, 30]  ← B gets 30!

Deno.test("array mutate on grouped data — does cummax bleed across groups?", () => {
  const df = createDataFrame([
    { group: "A", value: 10 },
    { group: "A", value: 20 },
    { group: "A", value: 30 },
    { group: "B", value: 1 },
    { group: "B", value: 2 },
    { group: "B", value: 3 },
  ]);

  const sorted = df.arrange(["group", "value"], ["asc", "asc"]);

  // Array-based: cummax over the full extracted column
  const result = sorted
    .groupBy("group")
    .mutate({ cm: s.cummax(sorted.extract("value")) });

  const rows = result.toArray();
  const groupB = rows.filter((r) => r.group === "B");

  // If per-group: B's cummax should be [1, 2, 3]
  // If bleeding:  B's cummax would be [30, 30, 30]
  expect(groupB[0].cm).toBe(1);
  expect(groupB[1].cm).toBe(2);
  expect(groupB[2].cm).toBe(3);
});
