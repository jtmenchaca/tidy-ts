import { stats } from "../../../src/dataframe/mod.ts";

Deno.test("One-Way ANOVA Spot Check", () => {
  console.log("\n📊 One-Way ANOVA");
  console.log("-".repeat(80));

  const groups = [
    [12, 14, 11, 13, 15],
    [17, 19, 18, 20, 16],
    [22, 24, 23, 21, 25],
  ];

  const result = stats.test.anova.oneWay(groups);

  console.log("Groups:", groups);
  console.log("F-statistic:", result.test_statistic.value);
  console.log("df between:", result.df_between);
  console.log("df within:", result.df_within);
  console.log("p-value:", result.p_value);
});

console.log("\n" + "=".repeat(80));
console.log("ANOVA SPOT CHECK");
console.log("=".repeat(80));
