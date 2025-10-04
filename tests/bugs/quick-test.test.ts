import {
  createDataFrame,
  type DataFrame,
  stats as s,
} from "@tidy-ts/dataframe";

Deno.test("Grouped Statistics - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  // Sample data for all tests
  const salesData = createDataFrame([
    {
      id: 1,
      date: new Date("2023-01-15"),
      product: "Widget Pro",
      price: 29.99,
      quantity: 5,
      customer: "Alice Johnson",
      region: "North",
      category: "Electronics",
      sold: true,
    },
    {
      id: 2,
      date: new Date("2023-01-20"),
      product: "Gadget Max",
      price: 49.99,
      quantity: 2,
      customer: "Bob Smith",
      region: "South",
      category: "Electronics",
      sold: true,
    },
    {
      id: 3,
      date: new Date("2023-02-01"),
      product: "Tool Kit",
      price: 79.99,
      quantity: 1,
      customer: "Carol Davis",
      region: "East",
      category: "Tools",
      sold: false,
    },
    {
      id: 4,
      date: new Date("2023-02-15"),
      product: "Device Elite",
      price: 199.99,
      quantity: 3,
      customer: "Dave Wilson",
      region: "West",
      category: "Electronics",
      sold: true,
    },
    {
      id: 5,
      date: new Date("2023-03-01"),
      product: "Widget Pro",
      price: 29.99,
      quantity: 10,
      customer: "Eve Brown",
      region: "North",
      category: "Electronics",
      sold: true,
    },
    {
      id: 6,
      date: new Date("2023-03-10"),
      product: "Hammer Set",
      price: 45.99,
      quantity: 2,
      customer: "Frank Miller",
      region: "East",
      category: "Tools",
      sold: true,
    },
    {
      id: 7,
      date: new Date("2023-03-15"),
      product: "Drill Kit",
      price: 89.99,
      quantity: 1,
      customer: "Grace Lee",
      region: "West",
      category: "Tools",
      sold: true,
    },
    {
      id: 8,
      date: new Date("2023-03-20"),
      product: "Smartphone",
      price: 299.99,
      quantity: 1,
      customer: "Henry Chen",
      region: "North",
      category: "Electronics",
      sold: true,
    },
  ]);

  console.log("Sample sales data:");
  salesData.print();

  // ============================================================================
  // 2. BASIC GROUPED STATISTICS - Simple grouping by region
  // ============================================================================
  console.log(
    "\n=== 2. Basic Grouped Statistics - Simple Grouping by Region ===",
  );

  // Start with the simplest case: grouping by one column
  const regionStats = salesData
    .groupBy("region")
    .summarise({
      total_sales: (df) => s.sum(df.price.map((p, i) => p * df.quantity[i])),
      avg_price: (df) => s.mean(df.price),
      total_quantity: (df) => s.sum(df.quantity),
      avg_quantity: (df) => s.mean(df.quantity),
      transaction_count: (df) => df.nrows(),
    });

  console.log("Sales statistics by region:");
  regionStats.print();

  // ============================================================================
  // 3. GROUPED STATISTICS BY CATEGORY - Product category analysis
  // ============================================================================
  console.log(
    "\n=== 3. Grouped Statistics by Category - Product Category Analysis ===",
  );

  // Group by product category
  // This shows how to analyze different product types
  const categoryStats = salesData
    .groupBy("category")
    .summarise({
      total_revenue: (df) => s.sum(df.price.map((p, i) => p * df.quantity[i])),
      avg_unit_price: (df) => s.mean(df.price),
      total_units_sold: (df) => s.sum(df.quantity),
      avg_order_size: (df) => s.mean(df.quantity),
      product_count: (df) => df.nrows(),
      success_rate: (df) => {
        const successful = s.countValue(df.sold, true);
        return s.round((successful / df.nrows()) * 100);
      },
    });

  console.log("Product category statistics:");
  categoryStats.print();
});

Deno.test("Statistical Distributions - Using New Descriptive Names", () => {
  // ============================================================================
  // 4. NORMAL DISTRIBUTION EXAMPLES - Basic statistical operations
  // ============================================================================
  console.log("\n=== 4. Normal Distribution Examples ===");

  // Generate some random normal data
  const normalData = Array.from(
    { length: 100 },
    () => s.dist.normal.random({ mean: 0, standardDeviation: 1 }),
  );
  console.log(
    "Generated 100 random values from normal distribution (mean=0, std=1)",
  );
  console.log(`Sample mean: ${s.mean(normalData).toFixed(4)}`);
  console.log(`Sample std: ${s.stdev(normalData).toFixed(4)}`);

  // Calculate density at specific points
  const densityAtZero = s.dist.normal.density({
    at: 0,
    mean: 0,
    standardDeviation: 1,
  });
  const densityAtOne = s.dist.normal.density({
    at: 1,
    mean: 0,
    standardDeviation: 1,
  });
  console.log(`Normal density at x=0: ${densityAtZero.toFixed(4)}`);
  console.log(`Normal density at x=1: ${densityAtOne.toFixed(4)}`);

  // Calculate probabilities
  const probLessThanOne = s.dist.normal.probability({
    at: 1,
    mean: 0,
    standardDeviation: 1,
  });
  const probBetweenNegOneAndOne =
    s.dist.normal.probability({ at: 1, mean: 0, standardDeviation: 1 }) -
    s.dist.normal.probability({ at: -1, mean: 0, standardDeviation: 1 });
  console.log(`P(X < 1): ${probLessThanOne.toFixed(4)}`);
  console.log(`P(-1 < X < 1): ${probBetweenNegOneAndOne.toFixed(4)}`);

  // Calculate quantiles
  const quantile95 = s.dist.normal.quantile({
    probability: 0.95,
    mean: 0,
    standardDeviation: 1,
  });
  const quantile99 = s.dist.normal.quantile({
    probability: 0.99,
    mean: 0,
    standardDeviation: 1,
  });
  console.log(`95th percentile: ${quantile95.toFixed(4)}`);
  console.log(`99th percentile: ${quantile99.toFixed(4)}`);

  // ============================================================================
  // 5. BINOMIAL DISTRIBUTION EXAMPLES - Discrete probability
  // ============================================================================
  console.log("\n=== 5. Binomial Distribution Examples ===");

  // Simulate coin flips (n=10, p=0.5)
  const coinFlips = Array.from(
    { length: 20 },
    () => s.dist.binomial.random({ trials: 10, probabilityOfSuccess: 0.5 }),
  );
  console.log("20 simulations of 10 coin flips each:");
  console.log(coinFlips);

  // Calculate probabilities
  const probExactly5Heads = s.dist.binomial.density({
    at: 5,
    trials: 10,
    probabilityOfSuccess: 0.5,
  });
  const probAtMost3Heads = s.dist.binomial.probability({
    at: 3,
    trials: 10,
    probabilityOfSuccess: 0.5,
  });
  const probAtLeast7Heads = 1 -
    s.dist.binomial.probability({
      at: 6,
      trials: 10,
      probabilityOfSuccess: 0.5,
    });

  console.log(
    `P(exactly 5 heads in 10 flips): ${probExactly5Heads.toFixed(4)}`,
  );
  console.log(`P(at most 3 heads in 10 flips): ${probAtMost3Heads.toFixed(4)}`);
  console.log(
    `P(at least 7 heads in 10 flips): ${probAtLeast7Heads.toFixed(4)}`,
  );

  // ============================================================================
  // 6. POISSON DISTRIBUTION EXAMPLES - Count data
  // ============================================================================
  console.log("\n=== 6. Poisson Distribution Examples ===");

  // Simulate events with rate λ=3
  const poissonEvents = Array.from(
    { length: 15 },
    () => s.dist.poisson.random({ rateLambda: 3 }),
  );
  console.log("15 simulations of Poisson events (λ=3):");
  console.log(poissonEvents);

  // Calculate probabilities
  const probExactly2Events = s.dist.poisson.density({ at: 2, rateLambda: 3 });
  const probAtMost1Event = s.dist.poisson.probability({ at: 1, rateLambda: 3 });
  const probAtLeast5Events = 1 -
    s.dist.poisson.probability({ at: 4, rateLambda: 3 });

  console.log(`P(exactly 2 events): ${probExactly2Events.toFixed(4)}`);
  console.log(`P(at most 1 event): ${probAtMost1Event.toFixed(4)}`);
  console.log(`P(at least 5 events): ${probAtLeast5Events.toFixed(4)}`);

  // ============================================================================
  // 7. T-DISTRIBUTION EXAMPLES - Hypothesis testing
  // ============================================================================
  console.log("\n=== 7. T-Distribution Examples ===");

  // Calculate critical values for different confidence levels
  const t95_10df = s.dist.t.quantile({
    probability: 0.975,
    degreesOfFreedom: 10,
  }); // 95% confidence, 10 df
  const t99_10df = s.dist.t.quantile({
    probability: 0.995,
    degreesOfFreedom: 10,
  }); // 99% confidence, 10 df
  const t95_30df = s.dist.t.quantile({
    probability: 0.975,
    degreesOfFreedom: 30,
  }); // 95% confidence, 30 df

  console.log(`t-critical (95% confidence, 10 df): ${t95_10df.toFixed(4)}`);
  console.log(`t-critical (99% confidence, 10 df): ${t99_10df.toFixed(4)}`);
  console.log(`t-critical (95% confidence, 30 df): ${t95_30df.toFixed(4)}`);

  // Calculate p-values
  const tStat = 2.5;
  const pValue = 2 *
    (1 - s.dist.t.probability({ at: Math.abs(tStat), degreesOfFreedom: 10 }));
  console.log(
    `Two-tailed p-value for t=${tStat} (10 df): ${pValue.toFixed(4)}`,
  );

  // ============================================================================
  // 8. BETA DISTRIBUTION EXAMPLES - Proportions and Bayesian analysis
  // ============================================================================
  console.log("\n=== 8. Beta Distribution Examples ===");

  // Generate beta-distributed data (useful for proportions)
  const betaData = Array.from(
    { length: 20 },
    () => s.dist.beta.random({ alpha: 2, beta: 5 }),
  );
  console.log("20 random values from Beta(2, 5) distribution:");
  console.log(betaData.map((x) => x.toFixed(4)));

  // Calculate probabilities for proportion analysis
  const probLessThanHalf = s.dist.beta.probability({
    at: 0.5,
    alpha: 2,
    beta: 5,
  });
  const probBetweenQuarterAndThreeQuarter =
    s.dist.beta.probability({ at: 0.75, alpha: 2, beta: 5 }) -
    s.dist.beta.probability({ at: 0.25, alpha: 2, beta: 5 });

  console.log(`P(proportion < 0.5): ${probLessThanHalf.toFixed(4)}`);
  console.log(
    `P(0.25 < proportion < 0.75): ${
      probBetweenQuarterAndThreeQuarter.toFixed(4)
    }`,
  );

  // ============================================================================
  // 9. CHI-SQUARE DISTRIBUTION EXAMPLES - Goodness of fit tests
  // ============================================================================
  console.log("\n=== 9. Chi-Square Distribution Examples ===");

  // Critical values for chi-square tests
  const chiSq95_5df = s.dist.chiSquare.quantile({
    probability: 0.95,
    degreesOfFreedom: 5,
  });
  const chiSq99_5df = s.dist.chiSquare.quantile({
    probability: 0.99,
    degreesOfFreedom: 5,
  });

  console.log(`Chi-square critical (95%, 5 df): ${chiSq95_5df.toFixed(4)}`);
  console.log(`Chi-square critical (99%, 5 df): ${chiSq99_5df.toFixed(4)}`);

  // Calculate p-value for a chi-square test
  const chiSqStat = 8.5;
  const chiSqPValue = 1 -
    s.dist.chiSquare.probability({ at: chiSqStat, degreesOfFreedom: 5 });
  console.log(`P-value for χ²=${chiSqStat} (5 df): ${chiSqPValue.toFixed(4)}`);

  console.log("\n=== Distribution Examples Complete ===");
});

Deno.test("Async Error Handling Examples", async () => {
  console.log("=== Async Error Handling Examples ===");

  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 25, height: 96 }, // This will trigger error
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
    { id: 6, name: "BB-8", species: "Droid", mass: 15, height: 67 }, // This will also trigger error
  ]);

  // Pattern 1: Clean error value handling - return errors as values
  console.log("\n--- Pattern 1: Clean Error Value Handling ---");
  async function fetchUserRatingSafe(mass: number): Promise<string | Error> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (mass < 30) {
      return new Error("Mass too low for rating");
    }
    if (mass > 100) return "⭐ Heavyweight";
    if (mass > 50) return "⭐ Medium";
    return "⭐ Lightweight";
  }

  const resultWithErrors = await people
    .mutate({
      rating: async (row) => await fetchUserRatingSafe(row.mass),
    });

  const _typeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    rating: string | Error;
  }> = resultWithErrors;

  resultWithErrors.print("DataFrame with ratings (including errors):");

  // Now you can filter, analyze, or handle errors as data
  const successfulRatings = resultWithErrors.filter((row) =>
    typeof row.rating === "string"
  );

  const errorRows = resultWithErrors.filter((row) =>
    row.rating instanceof Error
  );

  console.log(`\nSuccessful ratings: ${successfulRatings.nrows()}`);
  console.log(`Failed ratings: ${errorRows.nrows()}`);

  if (errorRows.nrows() > 0) {
    console.log("\nError details:");
    errorRows.print("Rows with errors:");
  }

  // Pattern 2: Try/catch for unexpected errors that should stop execution
  console.log("\n--- Pattern 2: Try/Catch for Unexpected Errors ---");
  async function fetchUserRatingThrows(mass: number): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (mass < 30) {
      throw new Error("Mass too low for rating");
    }
    if (mass > 100) return "⭐ Heavyweight";
    if (mass > 50) return "⭐ Medium";
    return "⭐ Lightweight";
  }

  // Handle unexpected errors that should stop the pipeline
  try {
    const result = await people
      .mutate({
        rating: async (row) => await fetchUserRatingThrows(row.mass),
      });

    result.print("DataFrame with ratings (no errors):");
  } catch (error) {
    console.error("Unexpected error occurred:", error);
    console.log("This would stop the entire pipeline execution");
  }

  // Pattern 3: Mixed approach - handle some errors gracefully, others with try/catch
  console.log("\n--- Pattern 3: Mixed Error Handling ---");
  async function fetchUserRatingMixed(mass: number): Promise<string | Error> {
    await new Promise((resolve) => setTimeout(resolve, 1));

    // Network/API errors should be returned as Error values
    if (mass < 30) {
      return new Error("Mass too low for rating");
    }

    // Critical errors should throw (e.g., invalid data structure)
    if (mass > 1000) {
      throw new Error("Invalid mass value - data corruption detected");
    }

    if (mass > 100) return "⭐ Heavyweight";
    if (mass > 50) return "⭐ Medium";
    return "⭐ Lightweight";
  }

  // This will handle the returned errors gracefully
  const mixedResult = await people
    .mutate({
      rating: async (row) => await fetchUserRatingMixed(row.mass),
    });

  mixedResult.print("DataFrame with mixed error handling:");

  console.log("\n=== Error Handling Examples Complete ===");
});

Deno.test("Statistical Tests - Using New Named Argument Format", () => {
  console.log("=== Statistical Tests with Named Arguments ===");

  // ============================================================================
  // 1. T-TESTS - One-sample, independent, and paired t-tests
  // ============================================================================
  console.log("\n--- 1. T-Tests ---");

  // One-sample t-test
  const sampleData = [2.1, 2.3, 1.8, 2.0, 2.2, 1.9, 2.4, 2.1, 1.7, 2.3];
  const oneSampleResult = s.test.t.oneSample({
    data: sampleData,
    mu: 2.0,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log("One-sample t-test result:");
  console.log(
    `Test statistic: ${oneSampleResult.test_statistic?.value?.toFixed(4)}`,
  );
  console.log(`P-value: ${oneSampleResult.p_value?.toFixed(4)}`);
  console.log(
    `Significant: ${(oneSampleResult.p_value! < 0.05) ? "Yes" : "No"}`,
  );

  // Independent t-test
  const group1 = [1.2, 1.4, 1.1, 1.3, 1.5, 1.2, 1.4, 1.3];
  const group2 = [2.1, 2.3, 2.0, 2.2, 2.4, 2.1, 2.3, 2.2];
  const independentResult = s.test.t.independent({
    x: group1,
    y: group2,
    equalVar: true,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log("\nIndependent t-test result:");
  console.log(
    `Test statistic: ${independentResult.test_statistic?.value?.toFixed(4)}`,
  );
  console.log(`P-value: ${independentResult.p_value?.toFixed(4)}`);

  // Paired t-test
  const before = [10, 12, 8, 15, 9, 11, 13, 7];
  const after = [12, 14, 10, 16, 11, 13, 15, 9];
  const pairedResult = s.test.t.paired({
    x: before,
    y: after,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log("\nPaired t-test result:");
  console.log(
    `Test statistic: ${pairedResult.test_statistic?.value?.toFixed(4)}`,
  );
  console.log(`P-value: ${pairedResult.p_value?.toFixed(4)}`);

  // ============================================================================
  // 2. ANOVA - One-way ANOVA with variadic groups
  // ============================================================================
  console.log("\n--- 2. One-way ANOVA ---");

  const groupA = [23, 25, 24, 26, 22, 24, 25];
  const groupB = [28, 30, 29, 31, 27, 29, 30];
  const groupC = [32, 34, 33, 35, 31, 33, 34];

  const anovaResult = s.test.anova.oneWay([groupA, groupB, groupC], 0.05);
  console.log("One-way ANOVA result:");
  console.log(`F-statistic: ${anovaResult.test_statistic?.value?.toFixed(4)}`);
  console.log(`P-value: ${anovaResult.p_value?.toFixed(4)}`);
  console.log(`Significant: ${(anovaResult.p_value! < 0.05) ? "Yes" : "No"}`);

  // ============================================================================
  // 3. CORRELATION TESTS - Pearson, Spearman, and Kendall
  // ============================================================================
  console.log("\n--- 3. Correlation Tests ---");

  const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

  const pearsonResult = s.test.correlation.pearson({
    x: x,
    y: y,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log("Pearson correlation result:");
  console.log(`Correlation: ${pearsonResult.effect_size?.value?.toFixed(4)}`);
  console.log(`P-value: ${pearsonResult.p_value?.toFixed(4)}`);

  const spearmanResult = s.test.correlation.spearman({
    x: x,
    y: y,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log("\nSpearman correlation result:");
  console.log(`Correlation: ${spearmanResult.effect_size?.value?.toFixed(4)}`);
  console.log(`P-value: ${spearmanResult.p_value?.toFixed(4)}`);

  // ============================================================================
  // 4. NON-PARAMETRIC TESTS - Mann-Whitney and Kruskal-Wallis
  // ============================================================================
  console.log("\n--- 4. Non-parametric Tests ---");

  const mannWhitneyResult = s.test.nonparametric.mannWhitney({
    x: group1,
    y: group2,
    exact: true,
    continuityCorrection: true,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log("Mann-Whitney U test result:");
  console.log(
    `U-statistic: ${mannWhitneyResult.test_statistic?.value?.toFixed(4)}`,
  );
  console.log(`P-value: ${mannWhitneyResult.p_value?.toFixed(4)}`);

  const kruskalWallisResult = s.test.nonparametric.kruskalWallis(
    [groupA, groupB, groupC],
    0.05,
  );
  console.log("\nKruskal-Wallis test result:");
  console.log(
    `Test statistic: ${kruskalWallisResult.test_statistic?.value?.toFixed(4)}`,
  );
  console.log(`P-value: ${kruskalWallisResult.p_value?.toFixed(4)}`);

  // ============================================================================
  // 5. CATEGORICAL TESTS - Chi-square and Fisher's exact
  // ============================================================================
  console.log("\n--- 5. Categorical Tests ---");

  const contingencyTable = [[10, 20], [15, 25]];
  const chiSquareResult = s.test.categorical.chiSquare({
    contingencyTable: contingencyTable,
    alpha: 0.05,
  });
  console.log("Chi-square test result:");
  console.log(
    `Chi-square statistic: ${
      chiSquareResult.test_statistic?.value?.toFixed(4)
    }`,
  );
  console.log(`P-value: ${chiSquareResult.p_value?.toFixed(4)}`);

  const fishersExactResult = s.test.categorical.fishersExact({
    contingencyTable: contingencyTable,
    alternative: "two-sided",
    oddsRatio: 1.0,
    alpha: 0.05,
  });
  console.log("\nFisher's exact test result:");
  console.log(`P-value: ${fishersExactResult.p_value?.toFixed(4)}`);
  console.log(
    `Odds ratio: ${fishersExactResult.effect_size?.value?.toFixed(4)}`,
  );

  // ============================================================================
  // 6. NORMALITY TESTS - Shapiro-Wilk
  // ============================================================================
  console.log("\n--- 6. Normality Tests ---");

  const normalityData = [1.2, 1.8, 2.1, 2.3, 2.5, 2.7, 2.9, 3.1, 3.3, 3.5];
  const shapiroResult = s.test.normality.shapiroWilk({
    data: normalityData,
    alpha: 0.05,
  });
  console.log("Shapiro-Wilk normality test result:");
  console.log(
    `Test statistic: ${shapiroResult.test_statistic?.value?.toFixed(4)}`,
  );
  console.log(`P-value: ${shapiroResult.p_value?.toFixed(4)}`);
  console.log(`Normal: ${(shapiroResult.p_value! > 0.05) ? "Yes" : "No"}`);

  console.log("\n=== Statistical Tests Examples Complete ===");
});
