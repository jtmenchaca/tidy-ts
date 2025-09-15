import { stats as s } from "@tidy-ts/dataframe";

Deno.test("Stats Compare - Hierarchical Test API", () => {
  // Sample data for testing
  const singleGroup = [23, 25, 24, 26, 22, 24, 25, 23, 27, 24];
  const group1 = [1.2, 1.4, 1.1, 1.3, 1.5, 1.2, 1.4, 1.3];
  const group2 = [2.1, 2.3, 2.0, 2.2, 2.4, 2.1, 2.3, 2.2];
  const group3 = [3.5, 3.7, 3.4, 3.6, 3.8, 3.5, 3.7, 3.6];

  console.log("=== Testing Hierarchical Stats Compare API ===");

  // ============================================================================
  // ONE GROUP COMPARISONS
  // ============================================================================
  console.log("\n--- One Group Comparisons ---");

  // Test if mean of single group equals a specific value
  console.log(
    "\n1. Testing central tendency against value (parametric t-test):",
  );
  const oneSampleT = s.compare.oneGroup.centralTendency.toValue({
    data: singleGroup,
    hypothesizedValue: 24,
    parametric: true,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`  Test statistic: ${oneSampleT.test_statistic.toFixed(4)}`);
  console.log(`  P-value: ${oneSampleT.p_value.toFixed(4)}`);
  console.log(
    `  Result: Mean ${
      oneSampleT.p_value < 0.05 ? "differs from" : "equals"
    } 24`,
  );

  // Test if mean of single group equals a specific value (non-parametric)
  console.log(
    "\n2. Testing central tendency against value (non-parametric Wilcoxon):",
  );

  const wilcoxonTest = s.compare.oneGroup.centralTendency.toValue({
    data: singleGroup,
    hypothesizedValue: 24,
  });
  console.log(`  Test statistic: ${wilcoxonTest.test_statistic.toFixed(4)}`);
  console.log(`  P-value: ${wilcoxonTest.p_value.toFixed(4)}`);

  const _wilcoxonTest1 = s.compare.oneGroup.centralTendency.toValue({
    data: singleGroup,
    hypothesizedValue: 24,
    parametric: false,
  });

  // Test auto mode (default)
  console.log("\\n2b. Testing central tendency with auto detection:");
  const autoTest = s.compare.oneGroup.centralTendency.toValue({
    data: singleGroup,
    hypothesizedValue: 24,
  });
  console.log(`  Auto-selected test: ${autoTest.test_name}`);
  console.log(`  Test statistic: ${autoTest.test_statistic.toFixed(4)}`);
  console.log(`  P-value: ${autoTest.p_value.toFixed(4)}`);

  // Test auto mode with non-normal data to force Wilcoxon
  const skewedData = [1, 1, 1, 1, 2, 2, 3, 100, 200, 300]; // Highly skewed
  const autoTestSkewed = s.compare.oneGroup.centralTendency.toValue({
    data: skewedData,
    hypothesizedValue: 50,
  });
  console.log(
    `  Auto-selected test for skewed data: ${autoTestSkewed.test_name}`,
  );
  console.log(
    `  Skewed data test statistic: ${autoTestSkewed.test_statistic.toFixed(4)}`,
  );
  console.log(`  Skewed data p-value: ${autoTestSkewed.p_value.toFixed(4)}`);

  // Test if proportion meets expected value
  console.log("\n3. Testing proportions against value:");
  // Create data with 45 successes out of 100 trials
  const proportionData = Array(100).fill(false).map((_, i) => i < 45);
  const propTest = s.compare.oneGroup.proportions.toValue({
    data: proportionData,
    p: 0.5,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`  Test statistic: ${propTest.test_statistic.toFixed(4)}`);
  console.log(`  P-value: ${propTest.p_value.toFixed(4)}`);
  console.log(
    `  Result: Proportion ${
      propTest.p_value < 0.05 ? "differs from" : "equals"
    } 0.5`,
  );

  // Test if distribution is normal
  console.log("\n4. Testing distribution normality (Shapiro-Wilk):");
  const normalityTest = s.compare.oneGroup.distribution.toNormal({
    data: singleGroup,
    alpha: 0.05,
  });
  console.log(`  Test statistic: ${normalityTest.test_statistic.toFixed(4)}`);
  console.log(`  P-value: ${normalityTest.p_value.toFixed(4)}`);
  console.log(
    `  Result: Data is ${
      normalityTest.p_value > 0.05 ? "normally distributed" : "not normal"
    }`,
  );

  // ============================================================================
  // TWO GROUPS COMPARISONS
  // ============================================================================
  console.log("\n--- Two Groups Comparisons ---");

  // Compare central tendencies between two groups
  console.log("\n5. Comparing central tendencies (parametric t-test):");
  const twoSampleT = s.compare.twoGroups.centralTendency.toEachOther({
    x: group1,
    y: group2,
    parametric: true,
    equalVar: true,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`  Test statistic: ${twoSampleT.test_statistic.toFixed(4)}`);
  console.log(`  P-value: ${twoSampleT.p_value.toFixed(4)}`);
  console.log(
    `  Result: Groups ${twoSampleT.p_value < 0.05 ? "differ" : "are similar"}`,
  );

  // Compare proportions between two groups
  console.log("\n6. Comparing proportions (z-test):");
  // Create data for two groups with different success rates
  const group1Props = Array(100).fill(false).map((_, i) => i < 45); // 45% success
  const group2Props = Array(100).fill(false).map((_, i) => i < 55); // 55% success
  const twoPropTest = s.compare.twoGroups.proportions.toEachOther({
    data1: group1Props,
    data2: group2Props,
    alternative: "two-sided",
    alpha: 0.05,
    useChiSquare: false,
  });
  console.log(`  Test statistic: ${twoPropTest.test_statistic.toFixed(4)}`);
  console.log(`  P-value: ${twoPropTest.p_value.toFixed(4)}`);

  // Test association between two continuous variables
  console.log("\n7. Testing association (Pearson correlation):");
  const x = [1, 2, 3, 4, 5, 6, 7, 8];
  const y = [2, 4, 6, 8, 10, 12, 14, 16];
  const corrTest = s.compare.twoGroups.association.toEachOther({
    x: x,
    y: y,
    method: "pearson",
    alternative: "two.sided",
    alpha: 0.05,
  });
  console.log(`  Correlation: ${corrTest.correlation.toFixed(4)}`);
  console.log(`  P-value: ${corrTest.p_value.toFixed(4)}`);
  console.log(
    `  Result: ${
      corrTest.p_value < 0.05 ? "Significant correlation" : "No correlation"
    }`,
  );

  // Compare distributions between two groups
  console.log("\n8. Comparing distributions (Mann-Whitney):");
  const distTest = s.compare.twoGroups.distributions.toEachOther({
    x: group1,
    y: group2,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`  U-statistic: ${distTest.u_statistic.toFixed(4)}`);
  console.log(`  P-value: ${distTest.p_value.toFixed(4)}`);

  // ============================================================================
  // MULTIPLE GROUPS COMPARISONS
  // ============================================================================
  console.log("\n--- Multiple Groups Comparisons ---");

  // Compare central tendencies across multiple groups
  console.log("\n9. Comparing central tendencies across groups (ANOVA):");
  const anovaTest = s.compare.multiGroups.centralTendency.toEachOther({
    groups: [group1, group2, group3],
    parametric: true,
    alpha: 0.05,
  });
  console.log(`  F-statistic: ${anovaTest.f_statistic.toFixed(4)}`);
  console.log(`  P-value: ${anovaTest.p_value.toFixed(4)}`);
  console.log(
    `  Result: Groups ${
      anovaTest.p_value < 0.05 ? "differ significantly" : "are similar"
    }`,
  );

  // Compare central tendencies across multiple groups (non-parametric)
  console.log(
    "\n10. Comparing central tendencies across groups (Kruskal-Wallis):",
  );
  const kwTest = s.compare.multiGroups.centralTendency.toEachOther({
    groups: [group1, group2, group3],
    parametric: false,
    alpha: 0.05,
  });
  console.log(`  Test statistic: ${kwTest.test_statistic.toFixed(4)}`);
  console.log(`  P-value: ${kwTest.p_value.toFixed(4)}`);

  // Compare proportions across multiple groups
  console.log("\n11. Comparing proportions across groups (Chi-squared):");
  const contingencyTable = [
    [10, 20, 30],
    [15, 25, 35],
    [20, 30, 40],
  ];
  const chiTest = s.compare.multiGroups.proportions.toEachOther({
    contingencyTable: contingencyTable,
    alpha: 0.05,
  });
  console.log(`  Chi-squared statistic: ${chiTest.test_statistic.toFixed(4)}`);
  console.log(`  P-value: ${chiTest.p_value.toFixed(4)}`);
  console.log(
    `  Result: ${
      chiTest.p_value < 0.05 ? "Significant association" : "No association"
    }`,
  );

  console.log("\n=== Hierarchical Compare API Successfully Tested ===");
});
