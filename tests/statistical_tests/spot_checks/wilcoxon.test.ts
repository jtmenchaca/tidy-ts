import { stats } from "../../../src/dataframe/mod.ts";

Deno.test("Wilcoxon Signed-Rank Test Spot Check", () => {
  console.log("\n📊 Wilcoxon Signed-Rank Test");
  console.log("-".repeat(80));

  const before = [125, 115, 130, 140, 140, 115, 140, 125];
  const after = [110, 122, 125, 120, 140, 124, 123, 137];

  const result = stats.test.nonparametric.wilcoxon({
    x: before,
    y: after,
    alternative: "two-sided",
  });

  console.log("Before:", before);
  console.log("After:", after);
  console.log("V-statistic:", result.test_statistic.value);
  console.log("p-value:", result.p_value);
  console.log("Effect size:", result.effect_size.value);
});

console.log("\n" + "=".repeat(80));
console.log("WILCOXON SIGNED-RANK TEST SPOT CHECK");
console.log("=".repeat(80));
