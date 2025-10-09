import { stats } from "../../../src/dataframe/mod.ts";

Deno.test("Fisher's Exact Test Spot Check", () => {
  console.log("\n📊 Fisher's Exact Test");
  console.log("-".repeat(80));

  const contingencyTable = [
    [8, 2],
    [1, 5],
  ];

  const result = stats.test.categorical.fishersExact({
    contingencyTable,
  });

  console.log("Contingency Table:", contingencyTable);
  console.log("Odds ratio (MLE):", result.effect_size.value);
  console.log("p-value:", result.p_value);
  console.log("CI:", [
    result.confidence_interval.lower,
    result.confidence_interval.upper,
  ]);
});

console.log("\n" + "=".repeat(80));
console.log("FISHER'S EXACT TEST SPOT CHECK");
console.log("=".repeat(80));
