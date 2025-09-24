import { compare } from "./index.ts";

Deno.test("twoGroups.distributions.toEachOther - auto method selection", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];
  const result = compare.twoGroups.distributions.toEachOther({
    x,
    y,
    method: "auto",
  });

  console.log("Auto distribution test result:", result);
});

Deno.test("twoGroups.proportions.toEachOther - with Fisher's exact", () => {
  const data1 = [true, false, true, true];
  const data2 = [false, true, false, false];
  const result = compare.twoGroups.proportions.toEachOther({
    data1,
    data2,
    useChiSquare: "fisher",
  });

  console.log("Fisher's exact test result:", result);
});

Deno.test("twoGroups.proportions.toEachOther - with Chi-square", () => {
  const data1 = [true, false, true, true];
  const data2 = [false, true, false, false];
  const result = compare.twoGroups.proportions.toEachOther({
    data1,
    data2,
    useChiSquare: true,
  });

  console.log("Chi-square test result:", result);
});

Deno.test("twoGroups.proportions.toEachOther - auto selection", () => {
  const data1 = [true, false, true, true];
  const data2 = [false, true, false, false];
  const result = compare.twoGroups.proportions.toEachOther({
    data1,
    data2,
    useChiSquare: "auto",
  });

  console.log("Auto proportion test selection:", result);
});

Deno.test("multiGroups.centralTendency.toEachOther - parametric ANOVA", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
  ];
  const result = compare.multiGroups.centralTendency.toEachOther({
    groups,
    parametric: "parametric",
  });

  console.log("Multi-group ANOVA result:", result);
});

Deno.test("multiGroups.centralTendency.toEachOther - nonparametric Kruskal-Wallis", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
  ];
  const result = compare.multiGroups.centralTendency.toEachOther({
    groups,
    parametric: "nonparametric",
  });

  console.log("Kruskal-Wallis test result:", result);
});

Deno.test("multiGroups.proportions.toEachOther - chi-square test", () => {
  const contingencyTable = [
    [10, 20],
    [15, 25],
  ];
  const result = compare.multiGroups.proportions.toEachOther({
    contingencyTable,
  });

  console.log("Chi-square test result:", result);
});

// Additional multi-group tests
Deno.test("multiGroups.centralTendency.toEachOther - auto selection", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
  ];
  const result = compare.multiGroups.centralTendency.toEachOther({
    groups,
    parametric: "auto",
  });

  console.log("Auto selection multi-group test:", result);
});

Deno.test("multiGroups.centralTendency.toEachOther - with equal variances assumption", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
  ];
  const result = compare.multiGroups.centralTendency.toEachOther({
    groups,
    parametric: "parametric",
    assumeEqualVariances: true,
  });

  console.log("ANOVA with equal variances assumption:", result);
});

Deno.test("multiGroups.centralTendency.toEachOther - with unequal variances assumption", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
  ];
  const result = compare.multiGroups.centralTendency.toEachOther({
    groups,
    parametric: "parametric",
    assumeEqualVariances: false,
  });

  console.log("Welch ANOVA with unequal variances assumption:", result);
});

Deno.test("multiGroups.centralTendency.toEachOther - many groups", () => {
  const groups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];
  const result = compare.multiGroups.centralTendency.toEachOther({
    groups,
    parametric: "parametric",
  });

  console.log("Many groups ANOVA result:", result);
});

Deno.test("multiGroups.centralTendency.toEachOther - different group sizes", () => {
  const groups = [
    [1, 2, 3],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16, 17],
  ];
  const result = compare.multiGroups.centralTendency.toEachOther({
    groups,
    parametric: "parametric",
  });

  console.log("Different group sizes ANOVA:", result);
});

Deno.test("multiGroups.centralTendency.toEachOther - skewed data", () => {
  const groups = [
    [1, 1, 2, 2, 3, 4, 5, 10, 20],
    [2, 2, 3, 3, 4, 5, 6, 11, 21],
    [3, 3, 4, 4, 5, 6, 7, 12, 22],
  ];
  const result = compare.multiGroups.centralTendency.toEachOther({
    groups,
    parametric: "auto",
  });

  console.log("Skewed data multi-group test:", result);
});

Deno.test("multiGroups.centralTendency.toEachOther - two-way ANOVA factor A", () => {
  // Two-way data as 3D array: [factorA][factorB][values]
  const twoWayData = [
    [[1, 2], [3, 4]], // A1: B1=[1,2], B2=[3,4]
    [[5, 6], [7, 8]], // A2: B1=[5,6], B2=[7,8]
    [[9, 10], [11, 12]], // A3: B1=[9,10], B2=[11,12]
  ];

  const result = compare.multiGroups.centralTendency.toEachOther({
    data: twoWayData,
    parametric: "parametric",
    design: "two-way",
    testType: "factorA",
  });

  console.log("Two-way ANOVA factor A result:", result);
});
