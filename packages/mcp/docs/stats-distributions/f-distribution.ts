import type { DocEntry } from "../mcp-types.ts";

export const fDistributionDocs: Record<string, DocEntry> = {
  "s.dist.f.density": {
    name: "s.dist.f.density",
    category: "stats-distributions",
    description:
      "F-distribution density function (PDF). Used for ANOVA and comparing variances.",
    signature:
      "s.dist.f.density({ at, numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where density is evaluated (must be ≥ 0)",
      "`numeratorDegreesOfFreedom: number` - Numerator degrees of freedom (> 0)",
      "`denominatorDegreesOfFreedom: number` - Denominator degrees of freedom (> 0)",
      "`returnLog?: boolean` - If true, return log density (default: false)",
    ],
    returns: "Density value or log density",
    examples: [
      "const pdf = s.dist.f.density({ at: 2.5, numeratorDegreesOfFreedom: 3, denominatorDegreesOfFreedom: 10 });",
      "const logPdf = s.dist.f.density({ at: 1.0, numeratorDegreesOfFreedom: 5, denominatorDegreesOfFreedom: 20, returnLog: true });",
    ],
    bestPractices: [
      "Use for F-test calculations",
      "Numerator df = groups - 1, Denominator df = total - groups for ANOVA",
    ],
    related: [
      "s.dist.f.probability",
      "s.dist.f.quantile",
      "s.dist.f.random",
      "s.test.anova.oneWay",
    ],
  },

  "s.dist.f.probability": {
    name: "s.dist.f.probability",
    category: "stats-distributions",
    description:
      "F-distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.f.probability({ at, numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated",
      "`numeratorDegreesOfFreedom: number` - Numerator degrees of freedom (> 0)",
      "`denominatorDegreesOfFreedom: number` - Denominator degrees of freedom (> 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.f.probability({ at: 2.5, numeratorDegreesOfFreedom: 3, denominatorDegreesOfFreedom: 10 });",
      "const pValue = s.dist.f.probability({ at: 4.0, numeratorDegreesOfFreedom: 5, denominatorDegreesOfFreedom: 20, direction: 'above' });",
    ],
    bestPractices: [
      "Use for calculating p-values in F-tests and ANOVA",
      "Use direction: 'above' for right-tailed tests",
    ],
    related: [
      "s.dist.f.density",
      "s.dist.f.quantile",
      "s.dist.f.random",
      "s.test.anova.oneWay",
    ],
  },

  "s.dist.f.quantile": {
    name: "s.dist.f.quantile",
    category: "stats-distributions",
    description:
      "F-distribution quantile function (inverse CDF). Returns critical values for F-tests.",
    signature:
      "s.dist.f.quantile({ probability, numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`numeratorDegreesOfFreedom: number` - Numerator degrees of freedom (> 0)",
      "`denominatorDegreesOfFreedom: number` - Denominator degrees of freedom (> 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (critical value)",
    examples: [
      "const f95 = s.dist.f.quantile({ probability: 0.95, numeratorDegreesOfFreedom: 3, denominatorDegreesOfFreedom: 10 });",
      "// Critical value for 95% confidence",
      "const f99 = s.dist.f.quantile({ probability: 0.99, numeratorDegreesOfFreedom: 5, denominatorDegreesOfFreedom: 20 });",
    ],
    bestPractices: [
      "Use for finding critical values in F-tests",
      "Use for ANOVA critical values",
    ],
    related: [
      "s.dist.f.density",
      "s.dist.f.probability",
      "s.dist.f.random",
      "s.test.anova.oneWay",
    ],
  },

  "s.dist.f.random": {
    name: "s.dist.f.random",
    category: "stats-distributions",
    description:
      "Generate random samples from F-distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.f.random({ numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`numeratorDegreesOfFreedom: number` - Numerator degrees of freedom (> 0)",
      "`denominatorDegreesOfFreedom: number` - Denominator degrees of freedom (> 0)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns: "Random sample(s) from the F-distribution",
    examples: [
      "const single = s.dist.f.random({ numeratorDegreesOfFreedom: 3, denominatorDegreesOfFreedom: 10 });",
      "const sample = s.dist.f.random({ numeratorDegreesOfFreedom: 5, denominatorDegreesOfFreedom: 20, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for Monte Carlo simulations",
      "Use for bootstrap resampling",
    ],
    related: [
      "s.dist.f.density",
      "s.dist.f.probability",
      "s.dist.f.quantile",
    ],
  },
};
