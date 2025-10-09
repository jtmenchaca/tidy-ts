import { stats } from "../../../src/dataframe/mod.ts";

Deno.test("Shapiro-Wilk Normality Test Spot Check", () => {
  console.log("\n📊 Shapiro-Wilk Normality Test");
  console.log("-".repeat(80));

  const data = [2.5, 3.1, 2.8, 3.3, 2.9, 3.0, 2.7, 3.2];

  const result = stats.test.normality.shapiroWilk({ data });

  console.log("Data:", data);
  console.log("W-statistic:", result.test_statistic.value);
  console.log("p-value:", result.p_value);
});

console.log("\n" + "=".repeat(80));
console.log("SHAPIRO-WILK NORMALITY TEST SPOT CHECK");
console.log("=".repeat(80));
