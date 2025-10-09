import { stats } from "../../../src/dataframe/mod.ts";

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
  console.log("H-statistic:", result.test_statistic.value);
  console.log("df:", result.degrees_of_freedom);
  console.log("p-value:", result.p_value);
});

console.log("\n" + "=".repeat(80));
console.log("KRUSKAL-WALLIS TEST SPOT CHECK");
console.log("=".repeat(80));
