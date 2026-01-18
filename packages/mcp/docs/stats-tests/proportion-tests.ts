import type { DocEntry } from "../mcp-types.ts";

export const proportionTestDocs: Record<string, DocEntry> = {
  "s.test.proportion.oneSample": {
    name: "s.test.proportion.oneSample",
    category: "stats-tests",
    description:
      "One-sample proportion test to compare observed proportion to a hypothesized population proportion.",
    signature:
      "proportionTestOneSample({ data, hypothesizedProportion, alternative?, alpha? }): OneSampleProportionTestResult",
    imports: ['import { proportionTestOneSample } from "@tidy-ts/dataframe";'],
    parameters: [
      "`data: boolean[]` - Array of boolean values (true = success, false = failure)",
      "`hypothesizedProportion: number` - Hypothesized population proportion (between 0 and 1)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "OneSampleProportionTestResult with `test_statistic`, `p_value`, `confidence_interval`, `sample_proportion`",
    examples: [
      "const data = [true, false, true, true, false, true];",
      "const result = proportionTestOneSample({ data, hypothesizedProportion: 0.5 });",
      "console.log(result.p_value);  // p-value",
      "console.log(result.sample_proportion);  // observed proportion",
    ],
    bestPractices: [
      "Use for testing if a proportion differs from a known value",
      "Data should be boolean array (true/false)",
      "Requires at least 1 observation",
      "Hypothesized proportion must be between 0 and 1",
    ],
    antiPatterns: [
      "Using proportion test on continuous data",
      "Using proportion test when sample size is too small",
    ],
    related: ["s.test.proportion.twoSample", "s.test.categorical.chiSquare"],
  },

  "s.test.proportion.twoSample": {
    name: "s.test.proportion.twoSample",
    category: "stats-tests",
    description:
      "Two-sample proportion test to compare proportions between two independent groups.",
    signature:
      "proportionTestTwoSample({ data1, data2, pooled?, alternative?, alpha? }): TwoSampleProportionTestResult",
    imports: ['import { proportionTestTwoSample } from "@tidy-ts/dataframe";'],
    parameters: [
      "`data1: boolean[]` - First group of boolean values",
      "`data2: boolean[]` - Second group of boolean values",
      "`pooled?: boolean` - Use pooled variance estimate (default: true)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "TwoSampleProportionTestResult with `test_statistic`, `p_value`, `confidence_interval`, `proportion_difference`",
    examples: [
      "const group1 = [true, false, true, true, false];",
      "const group2 = [true, true, true, false, true];",
      "const result = proportionTestTwoSample({ data1: group1, data2: group2 });",
      "console.log(result.p_value);  // compare proportions",
    ],
    bestPractices: [
      "Use for comparing proportions between two independent groups",
      "Both groups should be boolean arrays",
      "Each group must have at least 1 observation",
      "Pooled variance (default) assumes equal population proportions under H0",
    ],
    antiPatterns: [
      "Using proportion test on continuous data",
      "Using proportion test for dependent/paired samples",
    ],
    related: [
      "s.test.proportion.oneSample",
      "s.test.categorical.chiSquare",
      "s.test.categorical.fishersExact",
    ],
  },
};
