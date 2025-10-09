import { stats } from "../../../src/dataframe/mod.ts";

Deno.test("Kendall Correlation Test Spot Check", () => {
  console.log("\n📊 Kendall Correlation Test");
  console.log("-".repeat(80));

  const x = [1.5, 2.3, 3.1, 4.2, 5.0, 6.1, 7.3, 8.5];
  const y = [2.1, 3.5, 4.2, 5.8, 6.5, 7.9, 9.1, 10.2];

  const result = stats.test.correlation.kendall({
    x,
    y,
    alternative: "two-sided",
  });

  console.log("x:", x);
  console.log("y:", y);
  console.log("Kendall tau:", result.effect_size.value);
  console.log("z-statistic:", result.test_statistic.value);
  console.log("p-value:", result.p_value);
});

console.log("\n" + "=".repeat(80));
console.log("KENDALL CORRELATION TEST SPOT CHECK");
console.log("=".repeat(80));
