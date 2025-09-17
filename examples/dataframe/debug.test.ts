import { createDataFrame, stats } from "@tidy-ts/dataframe";

console.log("=== 1. Setting Up the Data ===");

Deno.test("Advanced Operations and Chaining - Progressive Examples", () => {
  const salesData = createDataFrame([
    {
      id: 1,
      region: "North",
      product: "Widget",
      sales: 1000,
      date: "2023-Q1",
      rep: "Alice",
    },
    {
      id: 2,
      region: "North",
      product: "Gadget",
      sales: 1500,
      date: "2023-Q1",
      rep: "Bob",
    },
    {
      id: 3,
      region: "South",
      product: "Widget",
      sales: 800,
      date: "2023-Q1",
      rep: "Carol",
    },
    {
      id: 4,
      region: "South",
      product: "Gadget",
      sales: 1200,
      date: "2023-Q1",
      rep: "Dave",
    },
    {
      id: 5,
      region: "North",
      product: "Widget",
      sales: 1100,
      date: "2023-Q2",
      rep: "Alice",
    },
    {
      id: 6,
      region: "North",
      product: "Gadget",
      sales: 1600,
      date: "2023-Q2",
      rep: "Bob",
    },
    {
      id: 7,
      region: "South",
      product: "Widget",
      sales: 900,
      date: "2023-Q2",
      rep: "Carol",
    },
    {
      id: 8,
      region: "South",
      product: "Gadget",
      sales: 1300,
      date: "2023-Q2",
      rep: "Dave",
    },
    {
      id: 9,
      region: "West",
      product: "Tool",
      sales: 500,
      date: "2023-Q1",
      rep: "Eve",
    },
    {
      id: 10,
      region: "West",
      product: "Device",
      sales: 750,
      date: "2023-Q2",
      rep: "Frank",
    },
  ]);

  // Multi-step transformation pipeline
  // This demonstrates a complete analysis workflow
  const analysisResult = salesData
    // 1. Add calculated columns
    .mutate({
      quarter_num: (row) => row.date.includes("Q1") ? 1 : 2,
      sales_category: (row) => {
        if (row.sales >= 1500) return "High";
        if (row.sales >= 1000) return "Medium";
        return "Low";
      },
      region_code: (row) => row.region.substring(0, 1).toUpperCase(),
    });
  console.log("\n\n\n");
  console.log("analysisResult");
  analysisResult.print();
  console.log("\n\n\n");
  const analysisResult1 = analysisResult
    // 2. Filter to focus on main regions
    .filter((row) => ["North", "South"].includes(row.region))
    // 3. Group and aggregate
    .groupBy("region", "quarter_num")
    .summarise({
      total_sales: (df) => stats.sum(df.sales),
      avg_sales: (df) => stats.round(stats.mean(df.sales), 2),
      transaction_count: (df) => df.nrows(),
      top_product: (df) => {
        const topProduct = df
          .groupBy("product")
          .summarise({
            total: (g) => stats.sum(g.sales),
          })
          .sliceMax("total", 1)
          .extractHead("product", 1);
        return topProduct || "Unknown";
      },
    });
  console.log("\n\n\n");
  console.log("analysisResult1");
  analysisResult1.print();
  console.log("\n\n\n");
  const analysisResult2 = analysisResult1
    // 4. Add derived metrics
    .mutate({
      sales_per_transaction: (row) =>
        stats.round(row.total_sales / row.transaction_count, 2),
      performance_score: (row) => {
        const baseScore = row.avg_sales / 1000; // Normalize to 0-1 scale
        return stats.round(baseScore * 100, 1);
      },
    })
    // 5. Final arrangement
    .arrange("total_sales", "desc");

  console.log("\n\n\n");
  console.log("analysisResult2");
  analysisResult2.print();
  console.log("\n\n\n");
});

Deno.test("Statistical Testing with New Compare API", () => {
  console.log("=== 2. Statistical Testing with New Compare API ===");

  // Create sample datasets for testing
  const controlGroup = [
    12.1,
    13.4,
    11.8,
    14.2,
    12.9,
    13.1,
    12.5,
    13.8,
    12.3,
    13.6,
  ];
  const treatmentGroup = [
    15.2,
    16.1,
    14.8,
    17.3,
    15.9,
    16.4,
    15.7,
    16.8,
    15.5,
    16.2,
  ];
  const placeboGroup = [
    12.3,
    13.1,
    12.8,
    13.5,
    12.9,
    13.2,
    12.7,
    13.4,
    12.6,
    13.3,
  ];

  // Binary outcomes (success/failure)
  const successRates = [
    true,
    false,
    true,
    true,
    false,
    true,
    true,
    false,
    true,
    true,
  ];
  const controlSuccess = [
    true,
    false,
    true,
    false,
    true,
    false,
    true,
    true,
    false,
    true,
  ];
  const treatmentSuccess = [
    true,
    true,
    true,
    false,
    true,
    true,
    true,
    true,
    false,
    true,
  ];

  console.log("\n--- One Group Tests ---");

  // 1. One Group: Central Tendency vs. Hypothesized Value
  console.log("\n1.1 Testing if control group mean differs from 13.0");
  const oneGroupTest = stats.compare.oneGroup.centralTendency.toValue({
    data: controlGroup,
    hypothesizedValue: 13.0,
    alternative: "two-sided",
    alpha: 0.05,
    parametric: "auto", // Auto-selects parametric vs non-parametric
  });
  console.log(`One Group Test: ${oneGroupTest}`);

  // 1.2 One Group: Proportions vs. Expected Value
  console.log("\n1.2 Testing if success rate differs from 50%");
  const proportionTest = stats.compare.oneGroup.proportions.toValue({
    data: successRates,
    p: 0.5,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`Proportion Test: ${proportionTest}`);

  // 1.3 One Group: Distribution Normality
  console.log("\n1.3 Testing if control group is normally distributed");
  const normalityTest = stats.compare.oneGroup.distribution.toNormal({
    data: controlGroup,
    alpha: 0.05,
  });
  console.log(`Normality Test: ${normalityTest}`);

  console.log("\n--- Two Groups Tests ---");

  // 2.1 Two Groups: Central Tendency Comparison
  console.log("\n2.1 Comparing means between control and treatment groups");
  const twoGroupTest = stats.compare.twoGroups.centralTendency.toEachOther({
    x: controlGroup,
    y: treatmentGroup,
    parametric: "parametric", // Force parametric test
    equalVar: true,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`Two Group Test: ${twoGroupTest}`);

  // 2.2 Two Groups: Proportions Comparison
  console.log("\n2.2 Comparing success rates between control and treatment");
  const twoGroupProportion = stats.compare.twoGroups.proportions.toEachOther({
    data1: controlSuccess,
    data2: treatmentSuccess,
    alternative: "two-sided",
    alpha: 0.05,
    useChiSquare: false, // Use z-test instead of chi-square
  });
  console.log(`Two Group Proportion: ${twoGroupProportion}`);

  // 2.3 Two Groups: Association/Correlation
  console.log("\n2.3 Testing correlation between two continuous variables");
  const correlationTest = stats.compare.twoGroups.association.toEachOther({
    x: controlGroup,
    y: treatmentGroup,
    method: "pearson", // or "spearman" for non-parametric
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`Correlation Test: ${correlationTest}`);

  // 2.4 Two Groups: Distribution Comparison
  console.log("\n2.4 Comparing distributions between control and placebo");
  const distributionTest = stats.compare.twoGroups.distributions.toEachOther({
    x: controlGroup,
    y: placeboGroup,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`Test: ${distributionTest.test_name}`);
  console.log(
    `Statistic: ${distributionTest.test_statistic?.value?.toFixed(4)}`,
  );
  console.log(`P-value: ${distributionTest.p_value?.toFixed(4)}`);

  console.log("\n--- Multiple Groups Tests ---");

  // 3.1 Multiple Groups: Central Tendency (ANOVA)
  console.log("\n3.1 Comparing means across all three groups (ANOVA)");
  const multiGroupTest = stats.compare.multiGroups.centralTendency.toEachOther({
    groups: [controlGroup, treatmentGroup, placeboGroup],
    parametric: "parametric",
    alpha: 0.05,
  });
  console.log(`Multiple Groups Tet: ${multiGroupTest}`);

  // 3.2 Multiple Groups: Proportions (Chi-square)
  console.log("\n3.2 Comparing success rates across groups (Chi-square)");
  const multiGroupProportion = stats.compare.multiGroups.proportions
    .toEachOther({
      contingencyTable: [
        [6, 4], // Control: 6 successes, 4 failures
        [8, 2], // Treatment: 8 successes, 2 failures
        [5, 5], // Placebo: 5 successes, 5 failures
      ],
      alpha: 0.05,
    });
  console.log(`Multiple Groups Proportion: ${multiGroupProportion}`);

  console.log("\n--- Real-world Analysis Example ---");

  // 4. Complete Analysis Workflow
  console.log("\n4. Complete A/B Test Analysis Workflow");

  // Step 1: Check normality assumptions
  const controlNormality = stats.compare.oneGroup.distribution.toNormal({
    data: controlGroup,
    alpha: 0.05,
  });
  const treatmentNormality = stats.compare.oneGroup.distribution.toNormal({
    data: treatmentGroup,
    alpha: 0.05,
  });

  console.log(
    `Control group normal: ${
      (controlNormality.p_value || 0) > 0.05 ? "Yes" : "No"
    }`,
  );
  console.log(
    `Treatment group normal: ${
      (treatmentNormality.p_value || 0) > 0.05 ? "Yes" : "No"
    }`,
  );

  // Step 2: Choose appropriate test based on normality
  const useParametric = (controlNormality.p_value || 0) > 0.05 &&
    (treatmentNormality.p_value || 0) > 0.05;

  // Step 3: Perform the comparison
  const finalComparison = stats.compare.twoGroups.centralTendency.toEachOther({
    x: controlGroup,
    y: treatmentGroup,
    parametric: useParametric ? "parametric" : "nonparametric",
    alternative: "two-sided",
    alpha: 0.05,
  });

  console.log(`\nFinal Analysis Results:`);
  console.log(finalComparison);
});
