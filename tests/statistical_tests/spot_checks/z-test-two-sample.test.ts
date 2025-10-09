import { stats } from "../../../src/dataframe/mod.ts";

Deno.test("Two-Sample Z-Test Spot Check", () => {
  console.log("\n📊 Two-Sample Z-Test");
  console.log("-".repeat(80));

  const group1 = [23.5, 24.1, 22.8, 23.9, 24.3];
  const group2 = [21.2, 20.7, 21.8, 20.9, 21.5];
  const sigma1 = 1.2;
  const sigma2 = 1.0;

  const result = stats.test.z.twoSample({
    data1: group1,
    data2: group2,
    popStd1: sigma1,
    popStd2: sigma2,
    alternative: "two-sided",
  });

  console.log("Group 1:", group1);
  console.log("Group 2:", group2);
  console.log("sigma1:", sigma1);
  console.log("sigma2:", sigma2);
  console.log("Z-statistic:", result.test_statistic.value);
  console.log("p-value:", result.p_value);
  console.log("CI:", [
    result.confidence_interval.lower,
    result.confidence_interval.upper,
  ]);
});

console.log("\n" + "=".repeat(80));
console.log("TWO-SAMPLE Z-TEST SPOT CHECK");
console.log("=".repeat(80));
