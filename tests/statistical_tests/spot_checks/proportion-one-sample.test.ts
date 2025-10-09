import { stats } from "../../../src/dataframe/mod.ts";

Deno.test("One-Sample Proportion Test Spot Check", () => {
  console.log("\n📊 One-Sample Proportion Test");
  console.log("-".repeat(80));

  const data = [true, true, false, true, true, true, false, true, true, false];
  const p0 = 0.5;

  const result = stats.test.proportion.oneSample({
    data,
    popProportion: p0,
    alternative: "two-sided",
  });

  const successes = data.filter((x) => x).length;
  const n = data.length;

  console.log("Data:", data);
  console.log("Successes:", successes, "/", n);
  console.log("p0 (null hypothesis):", p0);
  console.log("Test statistic:", result.test_statistic.value);
  console.log("p-value:", result.p_value);
  console.log("CI:", [
    result.confidence_interval.lower,
    result.confidence_interval.upper,
  ]);
});

console.log("\n" + "=".repeat(80));
console.log("ONE-SAMPLE PROPORTION TEST SPOT CHECK");
console.log("=".repeat(80));
