import { expect } from "@std/expect";
import { compare } from "./index.ts";

Deno.test("multiGroups.centralTendency.toEachOther - two-way ANOVA with interaction", () => {
  // Data designed to show an interaction effect
  // Factor A: Low vs High intensity
  // Factor B: Morning vs Evening
  // Interaction: High intensity in morning is much better than expected
  const twoWayDataWithInteraction = [
    [[10, 12, 11], [8, 9, 10]], // Low intensity: Morning slightly better than evening
    [[25, 28, 27], [15, 16, 14]], // High intensity: Morning MUCH better than evening (interaction!)
  ];

  const result = compare.multiGroups.centralTendency.toEachOther({
    data: twoWayDataWithInteraction,
    parametric: "parametric",
    design: "two-way",
  });

  console.log("Two-way ANOVA with interaction result:", result);

  // Verify all three effects are present
  expect(result.factor_a).toBeDefined();
  expect(result.factor_b).toBeDefined();
  expect(result.interaction).toBeDefined();

  // With this data, interaction should be significant
  expect(result.interaction.p_value).toBeLessThan(0.05);

  // Factor A (intensity) should also be significant
  expect(result.factor_a.p_value).toBeLessThan(0.05);

  // Factor B (time of day) should be significant
  expect(result.factor_b.p_value).toBeLessThan(0.05);
});

Deno.test("multiGroups.centralTendency.toEachOther - two-way ANOVA no interaction", () => {
  // Data designed to show NO interaction (purely additive effects)
  // Factor A adds 4, Factor B adds 2, no interaction
  const twoWayDataNoInteraction = [
    [[1, 2, 1], [3, 4, 3]], // A1: B1=~1, B2=~3 (diff=2)
    [[5, 6, 5], [7, 8, 7]], // A2: B1=~5, B2=~7 (diff=2, same!)
  ];

  const result = compare.multiGroups.centralTendency.toEachOther({
    data: twoWayDataNoInteraction,
    parametric: "parametric",
    design: "two-way",
  });

  console.log("Two-way ANOVA no interaction result:", result);

  // Verify all three effects are present
  expect(result.factor_a).toBeDefined();
  expect(result.factor_b).toBeDefined();
  expect(result.interaction).toBeDefined();

  // Both main effects should be significant
  expect(result.factor_a.p_value).toBeLessThan(0.001);
  expect(result.factor_b.p_value).toBeLessThan(0.001);

  // Interaction should NOT be significant (p > 0.05)
  expect(result.interaction.p_value).toBeGreaterThan(0.05);
});

Deno.test("multiGroups.proportions.toEachOther - larger contingency table", () => {
  const contingencyTable = [
    [10, 20, 15],
    [15, 25, 20],
    [12, 18, 22],
  ];
  const result = compare.multiGroups.proportions.toEachOther({
    contingencyTable,
  });

  console.log("3x3 contingency table result:", result);
});

Deno.test("multiGroups.proportions.toEachOther - 2x2 contingency table", () => {
  const contingencyTable = [
    [5, 15],
    [10, 20],
  ];
  const result = compare.multiGroups.proportions.toEachOther({
    contingencyTable,
  });

  console.log("2x2 contingency table result:", result);
});

Deno.test("postHoc - provides test functions", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
  ];

  const tukeyResult = compare.postHoc.tukey(groups, 0.05);

  const dunnResult = compare.postHoc.dunn(groups, 0.05);

  console.log("Tukey HSD result:", tukeyResult);
  console.log("Dunn result:", dunnResult);
});

// Additional post-hoc tests
Deno.test("postHoc - Tukey HSD with different alpha", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
  ];

  const tukeyResult = compare.postHoc.tukey(groups, 0.01);
  console.log("Tukey HSD with alpha=0.01:", tukeyResult);
});

Deno.test("postHoc - Games-Howell test", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
  ];

  const gamesHowellResult = compare.postHoc.gamesHowell(groups, 0.05);
  console.log("Games-Howell test result:", gamesHowellResult);
});

Deno.test("postHoc - Dunn test with different alpha", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
  ];

  const dunnResult = compare.postHoc.dunn(groups, 0.01);
  console.log("Dunn test with alpha=0.01:", dunnResult);
});

Deno.test("postHoc - many groups", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];

  const tukeyResult = compare.postHoc.tukey(groups, 0.05);
  console.log("Tukey HSD with many groups:", tukeyResult);
});

Deno.test("postHoc - different group sizes", () => {
  const groups = [
    [1, 2, 3],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16, 17],
  ];

  const tukeyResult = compare.postHoc.tukey(groups, 0.05);
  console.log("Tukey HSD with different group sizes:", tukeyResult);
});

// Edge cases and error handling tests
Deno.test("Edge case - empty data arrays", () => {
  expect(() =>
    compare.oneGroup.centralTendency.toValue({
      data: [],
      hypothesizedValue: 0,
      parametric: "parametric",
    })
  ).toThrow("One-sample t-test requires at least 2 observations");
});

Deno.test("Edge case - single value", () => {
  expect(() =>
    compare.oneGroup.centralTendency.toValue({
      data: [5],
      hypothesizedValue: 0,
      parametric: "parametric",
    })
  ).toThrow("One-sample t-test requires at least 2 observations");
});

Deno.test("Edge case - all identical values", () => {
  const identicalData = [5, 5, 5, 5, 5];
  const result = compare.oneGroup.centralTendency.toValue({
    data: identicalData,
    hypothesizedValue: 5,
    parametric: "parametric",
  });
  console.log("Identical values result:", result);
  expect(result.error_message).toBe(
    "Cannot perform t-test with zero variance (all values identical and equal to hypothesized mean)",
  );
});

Deno.test("Edge case - very small sample", () => {
  const result = compare.twoGroups.centralTendency.toEachOther({
    x: [1, 2],
    y: [3, 4],
    parametric: "parametric",
  });
  console.log("Very small sample t-test:", result);
});

Deno.test("Edge case - identical groups", () => {
  const identicalGroup = [1, 2, 3, 4, 5];
  const result = compare.twoGroups.centralTendency.toEachOther({
    x: identicalGroup,
    y: identicalGroup,
    parametric: "parametric",
  });
  console.log("Identical groups t-test:", result);
});

Deno.test("Edge case - perfect correlation", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [1, 2, 3, 4, 5];
  const result = compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "pearson",
  });
  console.log("Perfect correlation result:", result);
});

Deno.test("Edge case - perfect negative correlation", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [5, 4, 3, 2, 1];
  const result = compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "pearson",
  });
  console.log("Perfect negative correlation result:", result);
});

Deno.test("Edge case - no correlation", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [3, 1, 4, 2, 5]; // Random order, no clear pattern
  const result = compare.twoGroups.association.toEachOther({
    x,
    y,
    method: "pearson",
  });
  console.log("No correlation result:", result);
});

Deno.test("Edge case - extreme values", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [1000, 2000, 3000, 4000, 5000];
  const result = compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "parametric",
  });
  console.log("Extreme values t-test:", result);
});

Deno.test("Edge case - mixed data types", () => {
  const result = compare.twoGroups.association.toEachOther({
    x: [1, 2, 3, 4, 5],
    y: [true, false, true, false, true],
    method: "pearson",
  });
  console.log("Mixed data types result:", result);
});

Deno.test("Edge case - NaN values", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: [1, 2, NaN, 4, 5],
    hypothesizedValue: 3,
    parametric: "parametric",
  });
  console.log("NaN values result:", result);
});

Deno.test("Edge case - Infinity values", () => {
  const result = compare.oneGroup.centralTendency.toValue({
    data: [1, 2, Infinity, 4, 5],
    hypothesizedValue: 3,
    parametric: "parametric",
  });
  console.log("Infinity values result:", result);
});

Deno.test("Edge case - very large datasets", () => {
  const largeData = Array.from(
    { length: 10000 },
    (_, _i) => Math.random() * 100,
  );
  const result = compare.oneGroup.centralTendency.toValue({
    data: largeData,
    hypothesizedValue: 50,
    parametric: "parametric",
  });
  console.log("Large dataset result:", result);
});

Deno.test("Edge case - post-hoc with only two groups", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
  ];

  const tukeyResult = compare.postHoc.tukey(groups, 0.05);
  console.log("Post-hoc with only two groups:", tukeyResult);
});

Deno.test("Edge case - post-hoc with single group", () => {
  const groups = [
    [1, 2, 3, 4, 5],
  ];

  const tukeyResult = compare.postHoc.tukey(groups, 0.05);
  console.log("Post-hoc with single group:", tukeyResult);
});
