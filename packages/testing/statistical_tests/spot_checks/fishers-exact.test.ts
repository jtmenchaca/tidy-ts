import { stats } from "@tidy-ts/dataframe";

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
  console.log("Odds ratio (MLE):", result.effectSize.value);
  console.log("p-value:", result.pValue);
  console.log("CI:", [
    result.confidenceInterval.lower,
    result.confidenceInterval.upper,
  ]);
});

console.log("\n" + "=".repeat(80));
console.log("FISHER'S EXACT TEST SPOT CHECK");
console.log("=".repeat(80));
