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
  console.log("Chi-squared statistic:", result.test_statistic.value);
  console.log("df:", result.degrees_of_freedom);
  console.log("p-value:", result.p_value);
});

console.log("\n" + "=".repeat(80));
console.log("CHI-SQUARE TEST SPOT CHECK");
console.log("=".repeat(80));
