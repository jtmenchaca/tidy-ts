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
    parametric: "parametric",
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`  Complete test result:`, JSON.stringify(oneSampleT, null, 2));

  // Test if mean of single group equals a specific value (non-parametric)
  console.log(
    "\n2. Testing central tendency against value (non-parametric Wilcoxon):",
  );

  const wilcoxonTest = s.compare.oneGroup.centralTendency.toValue({
    data: singleGroup,
    hypothesizedValue: 24,
  });
  console.log(`  Complete test result:`, JSON.stringify(wilcoxonTest, null, 2));

  const _wilcoxonTest1 = s.compare.oneGroup.centralTendency.toValue({
    data: singleGroup,
    hypothesizedValue: 24,
    parametric: "nonparametric",
  });

  // Test auto mode (default)
  console.log("\n2b. Testing central tendency with auto detection:");
  const autoTest = s.compare.oneGroup.centralTendency.toValue({
    data: singleGroup,
    hypothesizedValue: 24,
  });

  console.log(`  Complete test result:`, JSON.stringify(autoTest, null, 2));

  // Test auto mode with non-normal data to force Wilcoxon
  const skewedData = [1, 1, 1, 1, 2, 2, 3, 100, 200, 300]; // Highly skewed
  const autoTestSkewed = s.compare.oneGroup.centralTendency.toValue({
    data: skewedData,
    hypothesizedValue: 50,
  });
  console.log(
    `  Complete test result:`,
    JSON.stringify(autoTestSkewed, null, 2),
  );

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
  console.log(`  Complete test result:`, JSON.stringify(propTest, null, 2));

  // Test if distribution is normal
  console.log("\n4. Testing distribution normality (Shapiro-Wilk):");
  const normalityTest = s.compare.oneGroup.distribution.toNormal({
    data: singleGroup,
    alpha: 0.05,
  });
  console.log(
    `  Complete test result:`,
    JSON.stringify(normalityTest, null, 2),
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
    parametric: "parametric",
    equalVar: true,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`  Complete test result:`, JSON.stringify(twoSampleT, null, 2));

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
  console.log(`  Complete test result:`, JSON.stringify(twoPropTest, null, 2));

  // Test association between two continuous variables
  console.log("\n7. Testing association (Pearson correlation):");
  const x = [1, 2, 3, 4, 5, 6, 7, 8];
  const y = [2, 4, 6, 8, 10, 12, 14, 16];
  const corrTest = s.compare.twoGroups.association.toEachOther({
    x: x,
    y: y,
    method: "pearson",
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`  Complete test result:`, JSON.stringify(corrTest, null, 2));

  // Compare distributions between two groups
  console.log("\n8. Comparing distributions (Mann-Whitney):");
  const distTest = s.compare.twoGroups.distributions.toEachOther({
    x: group1,
    y: group2,
    alternative: "two-sided",
    alpha: 0.05,
  });
  console.log(`  Complete test result:`, JSON.stringify(distTest, null, 2));

  // ============================================================================
  // MULTIPLE GROUPS COMPARISONS
  // ============================================================================
  console.log("\n--- Multiple Groups Comparisons ---");

  // Compare central tendencies across multiple groups
  console.log("\n9. Comparing central tendencies across groups (ANOVA):");
  const anovaTest = s.compare.multiGroups.centralTendency.toEachOther({
    groups: [group1, group2, group3],
    parametric: "parametric",
    alpha: 0.05,
  });
  console.log(`  Complete test result:`, JSON.stringify(anovaTest, null, 2));

  // Compare central tendencies across multiple groups (non-parametric)
  console.log(
    "\n10. Comparing central tendencies across groups (Kruskal-Wallis):",
  );
  const kwTest = s.compare.multiGroups.centralTendency.toEachOther({
    groups: [group1, group2, group3],
    parametric: "nonparametric",
    alpha: 0.05,
  });
  console.log(`  Complete test result:`, JSON.stringify(kwTest, null, 2));

  // Test auto-selection for multiple groups
  console.log("\n10b. Auto-selection for multiple groups:");
  const autoMultiTest = s.compare.multiGroups.centralTendency.toEachOther({
    groups: [group1, group2, group3], // Normal data - should pick ANOVA
  });
  console.log(
    `  Complete test result:`,
    JSON.stringify(autoMultiTest, null, 2),
  );

  // Test auto-selection with two-groups association
  console.log("\n10c. Auto-selection for association tests:");
  const autoAssocTest = s.compare.twoGroups.association.toEachOther({
    x: x,
    y: y, // Will auto-select Pearson for normal data
  });
  console.log(
    `  Complete test result:`,
    JSON.stringify(autoAssocTest, null, 2),
  );
  // Test with binary data for point-biserial correlation
  const binaryData = [true, false, true, false, true, false, true, false];
  const continuousData = [2, 1, 3, 1, 4, 2, 5, 2];
  const pointBiserialTest = s.compare.twoGroups.association.toEachOther({
    x: binaryData,
    y: continuousData, // Should auto-select point-biserial (Pearson with 0/1)
  });
  console.log(
    `  Complete test result:`,
    JSON.stringify(pointBiserialTest, null, 2),
  );
  // Test two-way ANOVA design
  console.log("\n10d. Two-way ANOVA design:");
  // Create 2x2 factorial data: factorA[2] x factorB[2]
  const twoWayData = [
    [[5, 6, 7], [8, 9, 10]], // Factor A level 1: [B1, B2]
    [[15, 16, 17], [18, 19, 20]], // Factor A level 2: [B1, B2]
  ];

  const twoWayTestA = s.compare.multiGroups.centralTendency.toEachOther({
    data: twoWayData,
    parametric: "parametric",
    design: "two-way",
    testType: "factorA",
  });
  console.log(`  Complete test result:`, JSON.stringify(twoWayTestA, null, 2));
  const twoWayTestB = s.compare.multiGroups.centralTendency.toEachOther({
    data: twoWayData,
    parametric: "parametric",
    design: "two-way",
    testType: "factorB",
  });
  console.log(`  Complete test result:`, JSON.stringify(twoWayTestB, null, 2));

  const twoWayInteraction = s.compare.multiGroups.centralTendency.toEachOther({
    data: twoWayData,
    parametric: "parametric",
    design: "two-way",
    testType: "interaction",
  });
  console.log(
    `  Complete test result:`,
    JSON.stringify(twoWayInteraction, null, 2),
  );

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
  console.log(`  Complete test result:`, JSON.stringify(chiTest, null, 2));
});
