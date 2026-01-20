import { stats } from "@tidy-ts/dataframe";

Deno.test("Independent T-Test Spot Check", () => {
  console.log("\n📊 Independent (Two-Sample) T-Test");
  console.log("-".repeat(80));

  const group1 = [23.5, 24.1, 22.8, 23.9, 24.3];
  const group2 = [21.2, 20.7, 21.8, 20.9, 21.5];

  const result = stats.test.t.independent({
    x: group1,
    y: group2,
    alternative: "two-sided",
    equalVar: true,
  });

  console.log("Group 1:", group1);
  console.log("Group 2:", group2);
  console.log("t-statistic:", result.testStatistic.value);
  console.log("df:", result.degreesOfFreedom);
  console.log("p-value:", result.pValue);
  console.log("CI:", [
    result.confidenceInterval.lower,
    result.confidenceInterval.upper,
  ]);
  console.log("Cohen's d:", result.effectSize.value);
});

console.log("\n" + "=".repeat(80));
console.log("INDEPENDENT T-TEST SPOT CHECK");
console.log("=".repeat(80));
