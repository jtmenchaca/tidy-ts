import type { DocEntry } from "../mcp-types.ts";

export const normalityDocs: Record<string, DocEntry> = {
  "s.test.normality.shapiroWilk": {
    name: "s.test.normality.shapiroWilk",
    category: "stats-tests",
    description:
      "Shapiro-Wilk test for assessing whether data follows a normal distribution.",
    signature:
      "s.test.normality.shapiroWilk({ data, alpha? }): ShapiroWilkTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`data: number[]` - Array of numeric values to test",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns: "ShapiroWilkTestResult with `statistic`, `pValue`, `reject`",
    examples: [
      "const data = [1.2, 2.3, 3.1, 4.5, 5.2, 6.1, 7.3, 8.2];",
      "const result = s.test.normality.shapiroWilk({ data });",
      "console.log(result.pValue);  // p-value",
      "if (result.reject) {",
      "  console.log('Data is not normally distributed');",
      "  // Consider non-parametric tests",
      "} else {",
      "  console.log('Data appears normally distributed');",
      "  // Can use parametric tests",
      "}",
    ],
    bestPractices: [
      "Use before applying parametric tests (t-test, ANOVA, etc.)",
      "Requires at least 3 observations",
      "Not reliable for n > 5000 (test will throw error)",
      "If p < alpha, reject normality assumption and consider non-parametric alternatives",
    ],
    antiPatterns: [
      "Using Shapiro-Wilk on very large samples (n > 5000)",
      "Ignoring normality test results when choosing statistical tests",
      "Using Shapiro-Wilk as the only diagnostic (also check visualizations)",
    ],
    related: [
      "s.test.t.oneSample",
      "s.test.anova.oneWay",
      "s.test.nonparametric.mannWhitney",
    ],
  },
};
