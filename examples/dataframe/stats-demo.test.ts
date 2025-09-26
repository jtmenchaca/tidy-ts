import { s } from "@tidy-ts/dataframe";

Deno.test("Stats API Demo - Descriptive Statistics", () => {
  console.log("\n=== DESCRIPTIVE STATISTICS ===");

  // Sample data
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const skewedData = [1, 1, 2, 2, 2, 3, 3, 3, 3, 10];

  console.log("Data:", data);
  console.log("Mean:", s.mean(data));
  console.log("Median:", s.median(data));
  console.log("Mode:", s.mode(skewedData));
  console.log("Standard Deviation:", s.stdev(data));
  console.log("Variance:", s.variance(data));
  console.log("Range:", s.range(data));
  console.log("IQR:", s.iqr(data));
  console.log("Sum:", s.sum(data));
  console.log("Min:", s.min(data));
  console.log("Max:", s.max(data));
  console.log("Quantile (0.25):", s.quantile(data, 0.25));
  console.log("Quartiles:", s.quartiles(data));
});

Deno.test("Stats API Demo - Distribution Functions", () => {
  console.log("\n=== DISTRIBUTION FUNCTIONS ===");

  // Normal distribution
  console.log("Normal Distribution:");
  console.log(
    "  Density at 0:",
    s.dist.normal.density({ at: 0, mean: 0, standardDeviation: 1 }),
  );
  console.log(
    "  Probability P(X ≤ 1.96):",
    s.dist.normal.probability({ at: 1.96, mean: 0, standardDeviation: 1 }),
  );
  console.log(
    "  Quantile for 0.975:",
    s.dist.normal.quantile({
      probability: 0.975,
      mean: 0,
      standardDeviation: 1,
    }),
  );
  console.log(
    "  Random sample:",
    s.dist.normal.random({ mean: 0, standardDeviation: 1 }),
  );

  // T-distribution
  console.log("\nT-Distribution (df=10):");
  console.log(
    "  Density at 0:",
    s.dist.t.density({ at: 0, degreesOfFreedom: 10 }),
  );
  console.log(
    "  Probability P(T ≤ 2.228):",
    s.dist.t.probability({ at: 2.228, degreesOfFreedom: 10 }),
  );
  console.log(
    "  Quantile for 0.975:",
    s.dist.t.quantile({ probability: 0.975, degreesOfFreedom: 10 }),
  );

  // Chi-square distribution
  console.log("\nChi-square Distribution (df=5):");
  console.log(
    "  Density at 3:",
    s.dist.chiSquare.density({ at: 3, degreesOfFreedom: 5 }),
  );
  console.log(
    "  Probability P(χ² ≤ 11.07):",
    s.dist.chiSquare.probability({ at: 11.07, degreesOfFreedom: 5 }),
  );
  console.log(
    "  Quantile for 0.95:",
    s.dist.chiSquare.quantile({ probability: 0.95, degreesOfFreedom: 5 }),
  );

  // Binomial distribution
  console.log("\nBinomial Distribution (n=10, p=0.3):");
  console.log(
    "  Density at 3:",
    s.dist.binomial.density({ at: 3, trials: 10, probabilityOfSuccess: 0.3 }),
  );
  console.log(
    "  Probability P(X ≤ 3):",
    s.dist.binomial.probability({
      at: 3,
      trials: 10,
      probabilityOfSuccess: 0.3,
    }),
  );
  console.log(
    "  Quantile for 0.5:",
    s.dist.binomial.quantile({
      probability: 0.5,
      trials: 10,
      probabilityOfSuccess: 0.3,
    }),
  );
  console.log(
    "  Random sample:",
    s.dist.binomial.random({ trials: 10, probabilityOfSuccess: 0.3 }),
  );
});

Deno.test("Stats API Demo - Statistical Tests (Legacy API)", () => {
  console.log("\n=== STATISTICAL TESTS (LEGACY API) ===");

  const group1 = [1, 2, 3, 4, 5];
  const group2 = [2, 3, 4, 5, 6];
  const paired1 = [1, 2, 3, 4, 5];
  const paired2 = [2, 3, 4, 5, 6];

  // T-tests
  console.log("T-Tests:");
  console.log(
    "  One-sample t-test:",
    s.test.t.oneSample({
      data: group1,
      mu: 0,
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Independent t-test:",
    s.test.t.independent({
      x: group1,
      y: group2,
      equalVar: true,
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Paired t-test:",
    s.test.t.paired({
      x: paired1,
      y: paired2,
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  // ANOVA
  console.log("\nANOVA:");
  console.log(
    "  One-way ANOVA:",
    s.test.anova.oneWay([group1, group2, [3, 4, 5, 6, 7]], 0.05),
  );

  // Correlation tests
  console.log("\nCorrelation Tests:");
  console.log(
    "  Pearson correlation:",
    s.test.correlation.pearson({
      x: group1,
      y: group2,
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Spearman correlation:",
    s.test.correlation.spearman({
      x: group1,
      y: group2,
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  // Non-parametric tests
  console.log("\nNon-parametric Tests:");
  console.log(
    "  Mann-Whitney U test:",
    s.test.nonparametric.mannWhitney({
      x: group1,
      y: group2,
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Wilcoxon signed-rank test:",
    s.test.nonparametric.wilcoxon({
      x: paired1,
      y: paired2,
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  // Normality tests
  console.log("\nNormality Tests:");
  console.log(
    "  Shapiro-Wilk test:",
    s.test.normality.shapiroWilk({
      data: group1,
      alpha: 0.05,
    }),
  );
});

Deno.test("Stats API Demo - New Compare API - One Group", () => {
  console.log("\n=== NEW COMPARE API - ONE GROUP ===");

  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const binaryData = [
    true,
    false,
    true,
    true,
    false,
    true,
    false,
    true,
    true,
    false,
  ];

  // Central tendency vs value
  console.log("Central Tendency vs Value:");
  console.log(
    "  Parametric (t-test):",
    s.compare.oneGroup.centralTendency.toValue({
      data,
      hypothesizedValue: 5,
      parametric: "parametric",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Non-parametric (Wilcoxon):",
    s.compare.oneGroup.centralTendency.toValue({
      data,
      hypothesizedValue: 5,
      parametric: "nonparametric",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Auto (chooses based on normality):",
    s.compare.oneGroup.centralTendency.toValue({
      data,
      hypothesizedValue: 5,
      parametric: "auto",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  // Proportions vs value
  console.log("\nProportions vs Value:");
  console.log(
    "  Proportion test:",
    s.compare.oneGroup.proportions.toValue({
      data: binaryData,
      p: 0.5,
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  // Distribution to normal
  console.log("\nDistribution to Normal:");
  console.log(
    "  Shapiro-Wilk test:",
    s.compare.oneGroup.distribution.toNormal({
      data,
      alpha: 0.05,
    }),
  );
});

Deno.test("Stats API Demo - New Compare API - Two Groups", () => {
  console.log("\n=== NEW COMPARE API - TWO GROUPS ===");

  const group1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const group2 = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const binary1 = [
    true,
    false,
    true,
    true,
    false,
    true,
    false,
    true,
    true,
    false,
  ];
  const binary2 = [
    true,
    true,
    false,
    true,
    true,
    false,
    true,
    true,
    false,
    true,
  ];

  // Central tendency comparison
  console.log("Central Tendency Comparison:");
  console.log(
    "  Parametric (t-test):",
    s.compare.twoGroups.centralTendency.toEachOther({
      x: group1,
      y: group2,
      parametric: "parametric",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Non-parametric (Mann-Whitney):",
    s.compare.twoGroups.centralTendency.toEachOther({
      x: group1,
      y: group2,
      parametric: "nonparametric",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Auto (chooses based on normality):",
    s.compare.twoGroups.centralTendency.toEachOther({
      x: group1,
      y: group2,
      parametric: "auto",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  // Association/correlation
  console.log("\nAssociation/Correlation:");
  console.log(
    "  Pearson correlation:",
    s.compare.twoGroups.association.toEachOther({
      x: group1,
      y: group2,
      method: "pearson",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Spearman correlation:",
    s.compare.twoGroups.association.toEachOther({
      x: group1,
      y: group2,
      method: "spearman",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Auto (chooses based on data):",
    s.compare.twoGroups.association.toEachOther({
      x: group1,
      y: group2,
      method: "auto",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  // Proportions comparison
  console.log("\nProportions Comparison:");
  console.log(
    "  Proportions test:",
    s.compare.twoGroups.proportions.toEachOther({
      data1: binary1,
      data2: binary2,
      useChiSquare: "auto",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  // Distribution comparison
  console.log("\nDistribution Comparison:");
  console.log(
    "  Kolmogorov-Smirnov test:",
    s.compare.twoGroups.distributions.toEachOther({
      x: group1,
      y: group2,
      method: "ks",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Mann-Whitney test:",
    s.compare.twoGroups.distributions.toEachOther({
      x: group1,
      y: group2,
      method: "mann-whitney",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Auto (chooses KS):",
    s.compare.twoGroups.distributions.toEachOther({
      x: group1,
      y: group2,
      method: "auto",
      alternative: "two-sided",
      alpha: 0.05,
    }),
  );
});

Deno.test("Stats API Demo - New Compare API - Multiple Groups", () => {
  console.log("\n=== NEW COMPARE API - MULTIPLE GROUPS ===");

  const groups = [
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 6],
    [3, 4, 5, 6, 7],
  ];

  // One-way ANOVA/Kruskal-Wallis
  console.log("Multiple Groups Central Tendency:");
  console.log(
    "  Parametric (ANOVA):",
    s.compare.multiGroups.centralTendency.toEachOther({
      groups,
      parametric: "parametric",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Non-parametric (Kruskal-Wallis):",
    s.compare.multiGroups.centralTendency.toEachOther({
      groups,
      parametric: "nonparametric",
      alpha: 0.05,
    }),
  );

  console.log(
    "  Auto (chooses based on normality):",
    s.compare.multiGroups.centralTendency.toEachOther({
      groups,
      parametric: "auto",
      alpha: 0.05,
    }),
  );

  // Two-way ANOVA (simulated data)
  const twoWayData = [
    [[1, 2], [3, 4]], // Factor A level 1
    [[2, 3], [4, 5]], // Factor A level 2
  ];

  console.log("\nTwo-way ANOVA:");
  console.log(
    "  Factor A effect:",
    s.compare.multiGroups.centralTendency.toEachOther({
      data: twoWayData,
      design: "two-way",
      testType: "factorA",
      parametric: "parametric",
      alpha: 0.05,
    }),
  );

  // Proportions (contingency table)
  console.log("\nProportions (Contingency Table):");
  console.log(
    "  Chi-square test:",
    s.compare.multiGroups.proportions.toEachOther({
      contingencyTable: [[10, 20], [15, 25]],
      alpha: 0.05,
    }),
  );
});

Deno.test("Stats API Demo - Post-hoc Tests", () => {
  console.log("\n=== POST-HOC TESTS ===");

  const groups = [
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 6],
    [3, 4, 5, 6, 7],
  ];

  console.log("Post-hoc Tests:");
  console.log("  Tukey HSD:", s.compare.postHoc.tukey(groups, 0.05));
  console.log("  Games-Howell:", s.compare.postHoc.gamesHowell(groups, 0.05));
  console.log("  Dunn test:", s.compare.postHoc.dunn(groups, 0.05));
});

Deno.test("Stats API Demo - Advanced Features", () => {
  console.log("\n=== ADVANCED FEATURES ===");

  // Ranking and cumulative functions
  const data = [3, 1, 4, 1, 5, 9, 2, 6];
  console.log("Ranking and Cumulative Functions:");
  console.log("  Data:", data);
  console.log("  Rank:", s.rank(data));
  console.log("  Dense rank:", s.denseRank(data));
  console.log("  Cumulative sum:", s.cumsum(data));
  console.log("  Cumulative mean:", s.cummean(data));
  console.log("  Percentile rank:", s.percentileRank(data, 5));

  // Window functions
  console.log("\nWindow Functions:");
  console.log("  Lag (1):", s.lag(data, 1));
  console.log("  Lead (1):", s.lead(data, 1));

  // Data transformation
  console.log("\nData Transformation:");
  console.log("  Normalized:", s.normalize(data));
  console.log("  Rounded:", s.round(data, 1));
  console.log("  Floor:", s.floor(data));
  console.log("  Ceiling:", s.ceiling(data));

  // Count functions
  console.log("\nCount Functions:");
  console.log("  Unique values:", s.unique(data));
  console.log("  Unique count:", s.uniqueCount(data));
  console.log("  Count value (1):", s.countValue(data, 1));
});
