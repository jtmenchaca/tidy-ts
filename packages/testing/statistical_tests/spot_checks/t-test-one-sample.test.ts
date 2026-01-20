import { stats } from "@tidy-ts/dataframe";

Deno.test("One-Sample T-Test Spot Check", () => {
  console.log("\n📊 One-Sample T-Test");
  console.log("-".repeat(80));

  const data = [12.5, 13.1, 11.8, 12.9, 13.3, 12.2, 12.7, 13.0];
  const mu = 12.0;

  const result = stats.test.t.oneSample({
    data,
    mu,
    alternative: "two-sided",
  });

  console.log("Data:", data);
  console.log("mu (null hypothesis):", mu);
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
console.log("ONE-SAMPLE T-TEST SPOT CHECK");
console.log("=".repeat(80));
