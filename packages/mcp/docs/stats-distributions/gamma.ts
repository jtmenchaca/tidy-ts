import type { DocEntry } from "../mcp-types.ts";

export const gammaDocs: Record<string, DocEntry> = {
  "s.dist.gamma.density": {
    name: "s.dist.gamma.density",
    category: "stats-distributions",
    description:
      "Gamma distribution density function (PDF). Used for modeling waiting times and positive continuous data.",
    signature: "s.dist.gamma.density({ at, shape, rate?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where density is evaluated (must be > 0)",
      "`shape: number` - Shape parameter (α > 0)",
      "`rate?: number` - Rate parameter (β > 0, default: 1)",
      "`returnLog?: boolean` - If true, return log density (default: false)",
    ],
    returns: "Density value or log density",
    examples: [
      "const pdf = s.dist.gamma.density({ at: 2.0, shape: 2, rate: 1 });",
      "const logPdf = s.dist.gamma.density({ at: 5.0, shape: 3, rate: 0.5, returnLog: true });",
      "// Exponential when shape=1",
    ],
    bestPractices: [
      "Use for modeling waiting times and durations",
      "shape=1 gives exponential distribution",
      "Mean = shape/rate, Variance = shape/rate²",
    ],
    related: [
      "s.dist.gamma.probability",
      "s.dist.gamma.quantile",
      "s.dist.gamma.random",
      "s.dist.exponential.density",
    ],
  },

  "s.dist.gamma.probability": {
    name: "s.dist.gamma.probability",
    category: "stats-distributions",
    description:
      "Gamma distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.gamma.probability({ at, shape, rate?, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated",
      "`shape: number` - Shape parameter (α > 0)",
      "`rate?: number` - Rate parameter (β > 0, default: 1)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.gamma.probability({ at: 2.0, shape: 2, rate: 1 });",
      "const pValue = s.dist.gamma.probability({ at: 5.0, shape: 3, rate: 0.5, direction: 'above' });",
    ],
    bestPractices: [
      "Use for survival analysis",
      "Use for reliability modeling",
    ],
    related: [
      "s.dist.gamma.density",
      "s.dist.gamma.quantile",
      "s.dist.gamma.random",
    ],
  },

  "s.dist.gamma.quantile": {
    name: "s.dist.gamma.quantile",
    category: "stats-distributions",
    description:
      "Gamma distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.",
    signature:
      "s.dist.gamma.quantile({ probability, shape, rate?, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`shape: number` - Shape parameter (α > 0)",
      "`rate?: number` - Rate parameter (β > 0, default: 1)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (x > 0)",
    examples: [
      "const median = s.dist.gamma.quantile({ probability: 0.5, shape: 2, rate: 1 });",
      "const q95 = s.dist.gamma.quantile({ probability: 0.95, shape: 3, rate: 0.5 });",
    ],
    bestPractices: [
      "Use for finding percentiles of waiting times",
      "Use for generating random positive values",
    ],
    related: [
      "s.dist.gamma.density",
      "s.dist.gamma.probability",
      "s.dist.gamma.random",
    ],
  },

  "s.dist.gamma.random": {
    name: "s.dist.gamma.random",
    category: "stats-distributions",
    description:
      "Generate random samples from gamma distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.gamma.random({ shape, rate?, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`shape: number` - Shape parameter (α > 0)",
      "`rate?: number` - Rate parameter (β > 0, default: 1)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns: "Random sample(s) from the gamma distribution (values > 0)",
    examples: [
      "const single = s.dist.gamma.random({ shape: 2, rate: 1 });",
      "const sample = s.dist.gamma.random({ shape: 3, rate: 0.5, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for generating synthetic waiting time data",
      "Use for Monte Carlo simulations",
    ],
    related: [
      "s.dist.gamma.density",
      "s.dist.gamma.probability",
      "s.dist.gamma.quantile",
    ],
  },

  "s.dist.gamma.data": {
    name: "s.dist.gamma.data",
    category: "stats-distributions",
    description:
      "Generate data for gamma distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.",
    signature:
      "s.dist.gamma.data({ shape, rate, type, range?, points? }): DataFrame",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`shape: number` - Shape parameter",
      "`rate: number` - Rate parameter",
      "`type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate",
      "`range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 10] for pdf/cdf, [0.01, 0.99] for inverse_cdf",
      "`points?: number` - Number of points to generate (default: 100)",
    ],
    returns:
      "DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf",
    examples: [
      "const pdfData = s.dist.gamma.data({ shape: 2, rate: 1, type: 'pdf' });",
      "const cdfData = s.dist.gamma.data({ shape: 3, rate: 0.5, type: 'cdf', range: [0, 20] });",
    ],
    bestPractices: [
      "Use for plotting gamma distribution curves",
      "Note: distribution is only defined for x > 0",
    ],
    related: [
      "s.dist.gamma.density",
      "s.dist.gamma.probability",
      "s.dist.gamma.quantile",
    ],
  },
};

