import { stats } from "../../../src/dataframe/mod.ts";

Deno.test("Mann-Whitney U Test Spot Check", () => {
  console.log("\n📊 Mann-Whitney U Test");
  console.log("-".repeat(80));

  const group1 = [14, 15, 16, 17, 18];
  const group2 = [20, 21, 22, 23, 24];

  const result = stats.test.nonparametric.mannWhitney({
    x: group1,
    y: group2,
    alternative: "two-sided",
  });

  console.log("Group 1:", group1);
  console.log("Group 2:", group2);
  console.log("U-statistic:", result.test_statistic.value);
  console.log("p-value:", result.p_value);
});

console.log("\n" + "=".repeat(80));
console.log("MANN-WHITNEY U TEST SPOT CHECK");
console.log("=".repeat(80));
