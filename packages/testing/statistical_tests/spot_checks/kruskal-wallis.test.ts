import { stats } from "@tidy-ts/dataframe";

Deno.test("Kruskal-Wallis Test Spot Check", () => {
  console.log("\n📊 Kruskal-Wallis Test");
  console.log("-".repeat(80));

  const groups = [
    [2.9, 3.0, 2.5, 2.6, 3.2],
    [3.8, 2.7, 4.0, 2.4, 2.8],
    [2.8, 3.4, 3.7, 2.2, 2.0],
  ];

  const result = stats.test.nonparametric.kruskalWallis(groups);

  console.log("Groups:", groups);
  console.log("H-statistic:", result.testStatistic.value);
  console.log("df:", result.degreesOfFreedom);
  console.log("p-value:", result.pValue);
});

console.log("\n" + "=".repeat(80));
console.log("KRUSKAL-WALLIS TEST SPOT CHECK");
console.log("=".repeat(80));
