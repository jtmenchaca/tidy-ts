import { compare } from "./index.ts";

// Test data
const normalData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const skewedData = [1, 1, 1, 2, 2, 3, 4, 5, 10, 20];
const binaryData = [true, false, true, true, false];
const smallData = [1, 2, 3];
const largeData = Array.from({ length: 100 }, (_, i) => i + 1);
const tiedData = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
const extremeData = [1, 2, 3, 4, 5, 100, 200, 300, 400, 500];
const negativeData = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

Deno.test("oneGroup.centralTendency.toValue - parametric t-test", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: normalData,
    hypothesizedValue: 5,
    parametric: "parametric",
  });

  console.log("Parametric t-test result:", result);
});

Deno.test("oneGroup.centralTendency.toValue - nonparametric Wilcoxon", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: normalData,
    hypothesizedValue: 5,
    parametric: "nonparametric",
  });

  console.log("Nonparametric Wilcoxon result:", result);
});

Deno.test("oneGroup.centralTendency.toValue - auto selection", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: normalData,
    hypothesizedValue: 5,
    parametric: "auto",
  });

  console.log("Auto selection result:", result);
});

Deno.test("oneGroup.centralTendency.toValue - auto selection with skewed data", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: skewedData,
    hypothesizedValue: 5,
    parametric: "auto",
  });

  console.log("Auto selection with skewed data result:", result);

  // Should likely choose non-parametric test due to skewness
});

Deno.test("oneGroup.proportions.toValue - one-sample proportion test", () => {
  const result = compare.oneGroup.proportions.toValue({
    data: binaryData,
    p: 0.5,
  });

  console.log("One-sample proportion test result:", result);
});

Deno.test("oneGroup.distribution.toNormal - Shapiro-Wilk test", () => {
  const result = compare.oneGroup.distribution.toNormal({ data: normalData });

  console.log("Shapiro-Wilk test result:", result);
});

// Additional one-group tests
Deno.test("oneGroup.centralTendency.toValue - with alternative hypothesis", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: normalData,
    hypothesizedValue: 5,
    parametric: "parametric",
    alternative: "greater",
  });

  console.log("One-tailed t-test (greater) result:", result);
});

Deno.test("oneGroup.centralTendency.toValue - with custom alpha", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: normalData,
    hypothesizedValue: 5,
    parametric: "parametric",
    alpha: 0.01,
  });

  console.log("T-test with alpha=0.01 result:", result);
});

Deno.test("oneGroup.centralTendency.toValue - small sample", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: smallData,
    hypothesizedValue: 2,
    parametric: "auto",
  });

  console.log("Small sample auto test result:", result);
});

Deno.test("oneGroup.centralTendency.toValue - large sample", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: largeData,
    hypothesizedValue: 50,
    parametric: "parametric",
  });

  console.log("Large sample t-test result:", result);
});

Deno.test("oneGroup.centralTendency.toValue - negative values", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: negativeData,
    hypothesizedValue: 0,
    parametric: "parametric",
  });

  console.log("Negative values t-test result:", result);
});

Deno.test("oneGroup.centralTendency.toValue - extreme outliers", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: extremeData,
    hypothesizedValue: 100,
    parametric: "auto",
  });

  console.log("Extreme outliers auto test result:", result);
});

Deno.test("oneGroup.proportions.toValue - different proportions", () => {
  const result = compare.oneGroup.proportions.toValue({
    data: binaryData,
    p: 0.3,
  });

  console.log("Proportion test with p=0.3 result:", result);
});

Deno.test("oneGroup.proportions.toValue - extreme proportion", () => {
  const result = compare.oneGroup.proportions.toValue({
    data: [true, true, true, true, true],
    p: 0.1,
  });

  console.log("Extreme proportion test result:", result);
});

Deno.test("oneGroup.distribution.toNormal - skewed data", () => {
  const result = compare.oneGroup.distribution.toNormal({ data: skewedData });

  console.log("Shapiro-Wilk test on skewed data:", result);
});

Deno.test("oneGroup.distribution.toNormal - tied data", () => {
  const result = compare.oneGroup.distribution.toNormal({ data: tiedData });

  console.log("Shapiro-Wilk test on tied data:", result);
});

Deno.test("twoGroups.centralTendency.toEachOther - parametric t-test", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];
  const result = compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "parametric",
  });

  console.log("Two-group parametric t-test result:", result);
});

Deno.test("twoGroups.centralTendency.toEachOther - nonparametric Mann-Whitney", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];
  const result = compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "nonparametric",
  });

  console.log("Two-group nonparametric Mann-Whitney result:", result);
});

Deno.test("twoGroups.association.toEachOther - Pearson correlation", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];
  const result = compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "pearson",
  });

  console.log("Pearson correlation result:", result);
});

Deno.test("twoGroups.association.toEachOther - Spearman correlation", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];
  const result = compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "spearman",
  });

  console.log("Spearman correlation result:", result);
});

Deno.test("twoGroups.proportions.toEachOther - two-sample proportion test", () => {
  const data1 = [true, false, true, true];
  const data2 = [false, true, false, false];
  const result = compare.twoGroups.proportions.toEachOther({
    data1,
    data2,
  });

  console.log("Two-group proportions result:", result);
});

// Additional two-group tests
Deno.test("twoGroups.centralTendency.toEachOther - with equal variances assumption", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];
  const result = compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "parametric",
    assumeEqualVariances: true,
  });

  console.log("T-test with equal variances assumption:", result);
});

Deno.test("twoGroups.centralTendency.toEachOther - with unequal variances assumption", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];
  const result = compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "parametric",
    assumeEqualVariances: false,
  });

  console.log("T-test with unequal variances assumption:", result);
});

Deno.test("twoGroups.centralTendency.toEachOther - auto selection", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];
  const result = compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "auto",
  });

  console.log("Auto selection two-group test:", result);
});

Deno.test("twoGroups.centralTendency.toEachOther - with alternative hypothesis", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];
  const result = compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "parametric",
    alternative: "less",
  });

  console.log("One-tailed t-test (less) result:", result);
});

Deno.test("twoGroups.centralTendency.toEachOther - different sample sizes", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const result = compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "parametric",
  });

  console.log("Different sample sizes t-test:", result);
});

Deno.test("twoGroups.centralTendency.toEachOther - skewed data", () => {
  const x = [1, 1, 2, 2, 3, 4, 5, 10, 20];
  const y = [2, 2, 3, 3, 4, 5, 6, 11, 21];
  const result = compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "auto",
  });

  console.log("Skewed data auto test:", result);
});

Deno.test("twoGroups.association.toEachOther - Kendall correlation", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];
  const result = compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "kendall",
  });

  console.log("Kendall correlation result:", result);
});

Deno.test("twoGroups.association.toEachOther - auto method selection", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];
  const result = compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "auto",
  });

  console.log("Auto correlation method result:", result);
});

Deno.test("twoGroups.association.toEachOther - with ties", () => {
  const x = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
  const y = [2, 2, 4, 4, 6, 6, 8, 8, 10, 10];
  const result = compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "auto",
  });

  console.log("Correlation with ties result:", result);
});

Deno.test("twoGroups.association.toEachOther - point-biserial (boolean + numeric)", () => {
  const x = [true, false, true, true, false];
  const y = [1, 2, 3, 4, 5];
  const result = compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "pearson",
  });

  console.log("Point-biserial correlation result:", result);
});

Deno.test("twoGroups.distributions.toEachOther - Kolmogorov-Smirnov test", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];
  const result = compare.twoGroups.distributions.toEachOther({
    x,
    y,
    method: "ks",
  });

  console.log("Kolmogorov-Smirnov test result:", result);
});

Deno.test("twoGroups.distributions.toEachOther - Mann-Whitney for distributions", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];
  const result = compare.twoGroups.distributions.toEachOther({
    x,
    y,
    method: "mann-whitney",
  });

  console.log("Mann-Whitney distribution test result:", result);
});
