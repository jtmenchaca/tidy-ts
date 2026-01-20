import { stats } from "@tidy-ts/dataframe";

Deno.test("One-Sample Z-Test Spot Check", () => {
  console.log("\n📊 One-Sample Z-Test");
  console.log("-".repeat(80));

  const data = [12.5, 13.1, 11.8, 12.9, 13.3, 12.2, 12.7, 13.0];
  const mu = 12.0;
  const sigma = 0.8;

  const result = stats.test.z.oneSample({
    data,
    popMean: mu,
    popStd: sigma,
    alternative: "two-sided",
  });

  console.log("Data:", data);
  console.log("mu (null hypothesis):", mu);
  console.log("sigma (population SD):", sigma);
  console.log("Z-statistic:", result.testStatistic.value);
  console.log("p-value:", result.pValue);
  console.log("CI:", [
    result.confidenceInterval.lower,
    result.confidenceInterval.upper,
  ]);
});

console.log("\n" + "=".repeat(80));
console.log("Z-TEST SPOT CHECK");
console.log("=".repeat(80));
