import { stats } from "../../../src/dataframe/mod.ts";

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
  console.log("t-statistic:", result.test_statistic.value);
  console.log("df:", result.degrees_of_freedom);
  console.log("p-value:", result.p_value);
  console.log("CI:", [
    result.confidence_interval.lower,
    result.confidence_interval.upper,
  ]);
  console.log("Cohen's d:", result.effect_size.value);
});

console.log("\n" + "=".repeat(80));
console.log("PAIRED T-TEST SPOT CHECK");
console.log("=".repeat(80));
