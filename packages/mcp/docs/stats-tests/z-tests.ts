import type { DocEntry } from "../mcp-types.ts";

export const zTestDocs: Record<string, DocEntry> = {
  "s.test.z.oneSample": {
    name: "s.test.z.oneSample",
    category: "stats-tests",
    description:
      "One-sample z-test for comparing sample mean to a known population mean when population standard deviation is known.",
    signature:
      "zTestOneSample({ data, popMean, popStd, alternative?, alpha? }): OneSampleZTestResult",
    imports: ['import { zTestOneSample } from "@tidy-ts/dataframe";'],
    parameters: [
      "`data: number[]` - Array of numeric values",
      "`popMean: number` - Known population mean",
      "`popStd: number` - Known population standard deviation (must be positive)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "OneSampleZTestResult with `test_statistic`, `p_value`, `confidence_interval`, `reject_null`",
    examples: [
      "const data = [102, 98, 105, 99, 101];",
      "const result = zTestOneSample({ data, popMean: 100, popStd: 5 });",
      "console.log(result.p_value);  // p-value",
      "console.log(result.reject_null);  // true if reject H0",
    ],
    bestPractices: [
      "Use when population standard deviation is known (unlike t-test)",
      "Appropriate for large samples (n > 30) even if population std dev is unknown",
      "Requires at least 1 observation",
    ],
    antiPatterns: [
      "Using z-test when population standard deviation is unknown and sample is small (use t-test instead)",
      "Using z-test when data is not normally distributed",
    ],
    related: ["s.test.t.oneSample", "s.test.z.twoSample"],
  },

  "s.test.z.twoSample": {
    name: "s.test.z.twoSample",
    category: "stats-tests",
    description:
      "Two-sample z-test for comparing means of two independent groups when population standard deviations are known.",
    signature:
      "zTestTwoSample({ data1, data2, popStd1, popStd2, alternative?, alpha? }): TwoSampleZTestResult",
    imports: ['import { zTestTwoSample } from "@tidy-ts/dataframe";'],
    parameters: [
      "`data1: number[]` - First group of values",
      "`data2: number[]` - Second group of values",
      "`popStd1: number` - Known population standard deviation for first group (must be positive)",
      "`popStd2: number` - Known population standard deviation for second group (must be positive)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "TwoSampleZTestResult with `test_statistic`, `p_value`, `confidence_interval`, `reject_null`",
    examples: [
      "const group1 = [10.2, 9.8, 10.5, 9.9, 10.1];",
      "const group2 = [11.1, 10.9, 11.3, 11.0, 11.2];",
      "const result = zTestTwoSample({ data1: group1, data2: group2, popStd1: 0.5, popStd2: 0.6 });",
      "console.log(result.p_value);  // compare means",
    ],
    bestPractices: [
      "Use when population standard deviations are known for both groups",
      "Appropriate for large samples even if population std devs are unknown",
      "Each group must have at least 1 observation",
    ],
    antiPatterns: [
      "Using z-test when population standard deviations are unknown and samples are small (use t-test instead)",
      "Using z-test when data is not normally distributed",
    ],
    related: ["s.test.t.independent", "s.test.z.oneSample"],
  },
};
