import { stats } from "@tidy-ts/dataframe";

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
  console.log("F-statistic:", result.testStatistic.value);
  console.log("df between:", result.dfBetween);
  console.log("df within:", result.dfWithin);
  console.log("p-value:", result.pValue);
});

console.log("\n" + "=".repeat(80));
console.log("ANOVA SPOT CHECK");
console.log("=".repeat(80));
