/**
 * Statistical Testing with Compare API
 *
 * Demonstrates hypothesis testing for one group and two groups comparisons.
 */

import { stats as s } from "@tidy-ts/dataframe";
import { test } from "@tidy-ts/shims";

test("Compare - One Group Central Tendency", () => {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Parametric t-test
  const tTest = s.compare.oneGroup.centralTendency.toValue({
    data,
    hypothesizedValue: 5,
    parametric: "parametric",
  });

  console.log("One-sample t-test:");
  console.log(`  Test: ${tTest.testName}`);
  console.log(`  Test statistic: ${tTest.testStatistic.value}`);
  console.log(`  P-value: ${tTest.pValue}`);

  // Nonparametric Wilcoxon test
  const wilcoxon = s.compare.oneGroup.centralTendency.toValue({
    data,
    hypothesizedValue: 5,
    parametric: "nonparametric",
  });

  console.log("\nWilcoxon signed-rank test:");
  console.log(`  Test: ${wilcoxon.testName}`);
  console.log(`  P-value: ${wilcoxon.pValue}`);
});

test("Compare - One Group Proportion", () => {
  const data = [true, false, true, true, false];

  const result = s.compare.oneGroup.proportions.toValue({
    data,
    hypothesizedProportion: 0.5,
    comparator: "not equal to",
  });

  console.log("\nOne-sample proportion test:");
  console.log(`  Test: ${result.testName}`);
  console.log(`  P-value: ${result.pValue}`);
});

test("Compare - Normality Test", () => {
  const normalData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const result = s.compare.oneGroup.distribution.toNormal({ data: normalData });

  console.log("\nShapiro-Wilk normality test:");
  console.log(`  Test: ${result.testName}`);
  console.log(`  Test statistic: ${result.testStatistic.value}`);
  console.log(`  P-value: ${result.pValue}`);
});

test("Compare - Two Groups Central Tendency", async () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];

  // Parametric t-test
  const tTest = await s.compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "parametric",
  });

  console.log("\nTwo-sample t-test:");
  console.log(`  Test: ${tTest.testName}`);
  console.log(`  Test statistic: ${tTest.testStatistic.value}`);
  console.log(`  P-value: ${tTest.pValue}`);

  // Nonparametric Mann-Whitney U test
  const mannWhitney = await s.compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "nonparametric",
  });

  console.log("\nMann-Whitney U test:");
  console.log(`  Test: ${mannWhitney.testName}`);
  console.log(`  P-value: ${mannWhitney.pValue}`);
});

test("Compare - Correlation Tests", async () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];

  // Pearson correlation
  const pearson = await s.compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "pearson",
  });

  console.log("\nPearson correlation:");
  console.log(`  Test: ${pearson.testName}`);
  console.log(`  Correlation: ${pearson.testStatistic.value}`);
  console.log(`  P-value: ${pearson.pValue}`);

  // Spearman correlation
  const spearman = await s.compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "spearman",
  });

  console.log("\nSpearman correlation:");
  console.log(`  Test: ${spearman.testName}`);
  console.log(`  Correlation: ${spearman.testStatistic.value}`);
  console.log(`  P-value: ${spearman.pValue}`);
});

test("Compare - Auto Test Selection", async () => {
  const skewedData = [1, 1, 1, 2, 2, 3, 4, 5, 10, 20];

  // Auto mode will choose appropriate test based on data
  const result = await s.compare.oneGroup.centralTendency.toValue({
    data: skewedData,
    hypothesizedValue: 5,
    parametric: "auto",
  });

  console.log("\nAuto test selection on skewed data:");
  console.log(`  Selected test: ${result.testName}`);
  console.log(`  P-value: ${result.pValue}`);
});
