import { stats as s } from "@tidy-ts/dataframe";

const heights = [170, 165, 180, 175, 172, 168];

Deno.test("Quick Test 2", () => {
  // Direct test API - specific function access
  const directTest = s.test.t.oneSample({
    data: heights,
    mu: 170,
    alternative: "two-sided",
    alpha: 0.05,
  });

  console.log("Direct test:", directTest);

  // Compare API - guided approach
  const compareAPI = s.compare.oneGroup.centralTendency.toValue({
    data: heights,
    hypothesizedValue: 170,
    parametric: "parametric",
    alpha: 0.05,
  });

  console.log("Compare API:", compareAPI);

  // Both return the same typed result:
  // {
  //   test_name: "One-sample t-test",
  //   p_value: 0.47...,
  //   effect_size: { value: 0.31..., name: "Cohen's D" },
  //   test_statistic: { value: 0.76..., name: "T-Statistic" },
  //   confidence_interval: { lower: 166.08..., upper: 177.24...,
  //     confidence_level: 0.95 },
  //   degrees_of_freedom: 5,
  //   alpha: 0.05
  // }
});
