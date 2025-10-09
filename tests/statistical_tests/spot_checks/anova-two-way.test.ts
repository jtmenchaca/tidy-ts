import { stats } from "../../../src/dataframe/mod.ts";

Deno.test("Two-Way ANOVA Spot Check", () => {
  console.log("\n📊 Two-Way ANOVA");
  console.log("-".repeat(80));

  // Data structure: data[factorA_level][factorB_level] = [observations]
  // Factor A: Diet (2 levels: low, high)
  // Factor B: Exercise (3 levels: none, moderate, intense)
  const data = [
    // Diet = low
    [
      [2.1, 2.3, 2.5], // Exercise = none
      [3.1, 3.3, 3.5], // Exercise = moderate
      [4.1, 4.3, 4.5], // Exercise = intense
    ],
    // Diet = high
    [
      [3.2, 3.4, 3.6], // Exercise = none
      [4.2, 4.4, 4.6], // Exercise = moderate
      [5.2, 5.4, 5.6], // Exercise = intense
    ],
  ];

  const result = stats.test.anova.twoWay({ data });

  console.log("Data structure: 2 (Diet) × 3 (Exercise) design");
  console.log("\nFactor A (Diet):");
  console.log("  F-statistic:", result.factor_a.test_statistic.value);
  console.log("  p-value:", result.factor_a.p_value);
  console.log("  df:", result.factor_a.degrees_of_freedom);

  console.log("\nFactor B (Exercise):");
  console.log("  F-statistic:", result.factor_b.test_statistic.value);
  console.log("  p-value:", result.factor_b.p_value);
  console.log("  df:", result.factor_b.degrees_of_freedom);

  console.log("\nInteraction (A×B):");
  console.log("  F-statistic:", result.interaction.test_statistic.value);
  console.log("  p-value:", result.interaction.p_value);
  console.log("  df:", result.interaction.degrees_of_freedom);
});

console.log("\n" + "=".repeat(80));
console.log("TWO-WAY ANOVA SPOT CHECK");
console.log("=".repeat(80));
