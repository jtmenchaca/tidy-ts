import { stats } from "@tidy-ts/dataframe";

Deno.test("Chi-Square Test Spot Check", () => {
  console.log("\n📊 Chi-Square Test of Independence");
  console.log("-".repeat(80));

  const contingencyTable = [
    [10, 20, 30],
    [15, 25, 35],
  ];

  const result = stats.test.categorical.chiSquare({
    contingencyTable,
  });

  console.log("Contingency Table:", contingencyTable);
  console.log("Chi-squared statistic:", result.testStatistic.value);
  console.log("df:", result.degreesOfFreedom);
  console.log("p-value:", result.pValue);
});

console.log("\n" + "=".repeat(80));
console.log("CHI-SQUARE TEST SPOT CHECK");
console.log("=".repeat(80));
