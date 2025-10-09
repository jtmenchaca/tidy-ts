import { stats } from "../../../src/dataframe/mod.ts";

Deno.test("Two-Sample Proportion Test Spot Check", () => {
  console.log("\n📊 Two-Sample Proportion Test");
  console.log("-".repeat(80));

  const group1 = [true, true, false, true, true, true, false, true];
  const group2 = [false, true, false, false, true, false, false, true];

  const result = stats.test.proportion.twoSample({
    data1: group1,
    data2: group2,
    alternative: "two-sided",
  });

  const successes1 = group1.filter((x) => x).length;
  const successes2 = group2.filter((x) => x).length;

  console.log("Group 1:", group1);
  console.log("Group 1 successes:", successes1, "/", group1.length);
  console.log("Group 2:", group2);
  console.log("Group 2 successes:", successes2, "/", group2.length);
  console.log("Test statistic:", result.test_statistic.value);
  console.log("p-value:", result.p_value);
  console.log("CI:", [
    result.confidence_interval.lower,
    result.confidence_interval.upper,
  ]);
});

console.log("\n" + "=".repeat(80));
console.log("TWO-SAMPLE PROPORTION TEST SPOT CHECK");
console.log("=".repeat(80));
