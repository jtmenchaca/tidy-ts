import type { DocEntry } from "../mcp-types.ts";

export const logNormalDocs: Record<string, DocEntry> = {
  "s.dist.logNormal.density": {
    name: "s.dist.logNormal.density",
    category: "stats-distributions",
    description:
      "Log-normal distribution density function (PDF). If X ~ Normal(μ, σ²), then e^X ~ LogNormal(μ, σ²). Used for modeling positive values with right skew.",
    signature:
      "s.dist.logNormal.density({ at, meanLog?, standardDeviationLog?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where density is evaluated (must be > 0)",
      "`meanLog?: number` - Mean of the underlying normal distribution (default: 0)",
      "`standardDeviationLog?: number` - Standard deviation of the underlying normal distribution (default: 1)",
      "`returnLog?: boolean` - If true, return log density (default: false)",
    ],
    returns: "Density value or log density",
    examples: [
      "const pdf = s.dist.logNormal.density({ at: 1.0, meanLog: 0, standardDeviationLog: 1 });",
      "const logPdf = s.dist.logNormal.density({ at: 2.0, meanLog: 1, standardDeviationLog: 0.5, returnLog: true });",
    ],
    bestPractices: [
      "Use for modeling positive values with right skew (e.g., income, sizes)",
      "Mean = exp(μ + σ²/2), Median = exp(μ)",
      "If log(X) ~ Normal(μ, σ²), then X ~ LogNormal(μ, σ²)",
    ],
    related: [
      "s.dist.logNormal.probability",
      "s.dist.logNormal.quantile",
      "s.dist.logNormal.random",
      "s.dist.normal.density",
    ],
  },

  "s.dist.logNormal.probability": {
    name: "s.dist.logNormal.probability",
    category: "stats-distributions",
    description:
      "Log-normal distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.logNormal.probability({ at, meanLog?, standardDeviationLog?, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated",
      "`meanLog?: number` - Mean of the underlying normal distribution (default: 0)",
      "`standardDeviationLog?: number` - Standard deviation of the underlying normal distribution (default: 1)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.logNormal.probability({ at: 1.0, meanLog: 0, standardDeviationLog: 1 });",
      "const pValue = s.dist.logNormal.probability({ at: 2.0, meanLog: 1, standardDeviationLog: 0.5, direction: 'above' });",
    ],
    bestPractices: [
      "Use for calculating probabilities of positive skewed data",
      "CDF uses normal distribution: P(X ≤ at) = P(log(X) ≤ log(at))",
    ],
    related: [
      "s.dist.logNormal.density",
      "s.dist.logNormal.quantile",
      "s.dist.logNormal.random",
    ],
  },

  "s.dist.logNormal.quantile": {
    name: "s.dist.logNormal.quantile",
    category: "stats-distributions",
    description:
      "Log-normal distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.",
    signature:
      "s.dist.logNormal.quantile({ probability, meanLog?, standardDeviationLog?, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`meanLog?: number` - Mean of the underlying normal distribution (default: 0)",
      "`standardDeviationLog?: number` - Standard deviation of the underlying normal distribution (default: 1)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (x > 0)",
    examples: [
      "const median = s.dist.logNormal.quantile({ probability: 0.5, meanLog: 0, standardDeviationLog: 1 });",
      "// = exp(0) = 1",
      "const q95 = s.dist.logNormal.quantile({ probability: 0.95, meanLog: 1, standardDeviationLog: 0.5 });",
    ],
    bestPractices: [
      "Use for finding percentiles of positive skewed data",
      "Median = exp(meanLog)",
    ],
    related: [
      "s.dist.logNormal.density",
      "s.dist.logNormal.probability",
      "s.dist.logNormal.random",
    ],
  },

  "s.dist.logNormal.random": {
    name: "s.dist.logNormal.random",
    category: "stats-distributions",
    description:
      "Generate random samples from log-normal distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.logNormal.random({ meanLog?, standardDeviationLog?, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`meanLog?: number` - Mean of the underlying normal distribution (default: 0)",
      "`standardDeviationLog?: number` - Standard deviation of the underlying normal distribution (default: 1)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns: "Random sample(s) from the log-normal distribution (values > 0)",
    examples: [
      "const single = s.dist.logNormal.random();",
      "const sample = s.dist.logNormal.random({ meanLog: 1, standardDeviationLog: 0.5, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for generating synthetic positive skewed data",
      "Use for modeling income, sizes, or other right-skewed positive values",
    ],
    related: [
      "s.dist.logNormal.density",
      "s.dist.logNormal.probability",
      "s.dist.logNormal.quantile",
    ],
  },
};
