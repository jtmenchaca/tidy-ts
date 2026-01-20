import { stats } from "@tidy-ts/dataframe";

Deno.test("Paired T-Test Spot Check", () => {
  console.log("\n📊 Paired T-Test");
  console.log("-".repeat(80));

  const before = [120, 135, 118, 140, 125, 132, 128, 122];
  const after = [125, 142, 123, 148, 130, 140, 135, 128];

  const result = stats.test.t.paired({
    x: before,
    y: after,
    alternative: "two-sided",
  });

  console.log("Before:", before);
  console.log("After:", after);
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
console.log("PAIRED T-TEST SPOT CHECK");
console.log("=".repeat(80));
