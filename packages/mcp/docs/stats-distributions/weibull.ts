import type { DocEntry } from "../mcp-types.ts";

export const weibullDocs: Record<string, DocEntry> = {
  "s.dist.weibull.density": {
    name: "s.dist.weibull.density",
    category: "stats-distributions",
    description:
      "Weibull distribution density function (PDF). Used for modeling failure times and reliability analysis.",
    signature:
      "s.dist.weibull.density({ at, shape, scale?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where density is evaluated (must be ≥ 0)",
      "`shape: number` - Shape parameter (k > 0). Controls the distribution shape",
      "`scale?: number` - Scale parameter (λ > 0, default: 1). Characteristic scale",
      "`returnLog?: boolean` - If true, return log density (default: false)",
    ],
    returns: "Density value or log density",
    examples: [
      "const pdf = s.dist.weibull.density({ at: 2.0, shape: 2, scale: 1 });",
      "const logPdf = s.dist.weibull.density({ at: 5.0, shape: 1.5, scale: 3, returnLog: true });",
      "// Exponential when shape=1",
    ],
    bestPractices: [
      "Use for reliability and survival analysis",
      "shape=1 gives exponential distribution",
      "shape<1: decreasing hazard, shape>1: increasing hazard",
      "Mean = scale × Γ(1 + 1/shape)",
    ],
    related: [
      "s.dist.weibull.probability",
      "s.dist.weibull.quantile",
      "s.dist.weibull.random",
      "s.dist.exponential.density",
    ],
  },

  "s.dist.weibull.probability": {
    name: "s.dist.weibull.probability",
    category: "stats-distributions",
    description:
      "Weibull distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.weibull.probability({ at, shape, scale?, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated",
      "`shape: number` - Shape parameter (k > 0)",
      "`scale?: number` - Scale parameter (λ > 0, default: 1)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.weibull.probability({ at: 2.0, shape: 2, scale: 1 });",
      "const survival = s.dist.weibull.probability({ at: 5.0, shape: 1.5, scale: 3, direction: 'above' });",
      "// P(X > 5) = survival function",
    ],
    bestPractices: [
      "Use for survival analysis",
      "Use for reliability modeling",
      "P(X > t) = exp(-(t/scale)^shape)",
    ],
    related: [
      "s.dist.weibull.density",
      "s.dist.weibull.quantile",
      "s.dist.weibull.random",
    ],
  },

  "s.dist.weibull.quantile": {
    name: "s.dist.weibull.quantile",
    category: "stats-distributions",
    description:
      "Weibull distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.",
    signature:
      "s.dist.weibull.quantile({ probability, shape, scale?, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`shape: number` - Shape parameter (k > 0)",
      "`scale?: number` - Scale parameter (λ > 0, default: 1)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (x ≥ 0)",
    examples: [
      "const median = s.dist.weibull.quantile({ probability: 0.5, shape: 2, scale: 1 });",
      "const q95 = s.dist.weibull.quantile({ probability: 0.95, shape: 1.5, scale: 3 });",
    ],
    bestPractices: [
      "Use for finding percentiles of failure times",
      "Use for reliability calculations",
    ],
    related: [
      "s.dist.weibull.density",
      "s.dist.weibull.probability",
      "s.dist.weibull.random",
    ],
  },

  "s.dist.weibull.random": {
    name: "s.dist.weibull.random",
    category: "stats-distributions",
    description:
      "Generate random samples from Weibull distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.weibull.random({ shape, scale?, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`shape: number` - Shape parameter (k > 0)",
      "`scale?: number` - Scale parameter (λ > 0, default: 1)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns: "Random sample(s) from the Weibull distribution (values ≥ 0)",
    examples: [
      "const single = s.dist.weibull.random({ shape: 2, scale: 1 });",
      "const sample = s.dist.weibull.random({ shape: 1.5, scale: 3, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for generating synthetic failure time data",
      "Use for Monte Carlo reliability simulations",
    ],
    related: [
      "s.dist.weibull.density",
      "s.dist.weibull.probability",
      "s.dist.weibull.quantile",
    ],
  },

  "s.dist.weibull.data": {
    name: "s.dist.weibull.data",
    category: "stats-distributions",
    description:
      "Generate data for Weibull distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.",
    signature:
      "s.dist.weibull.data({ shape, scale, type, range?, points? }): DataFrame",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`shape: number` - Shape parameter",
      "`scale: number` - Scale parameter",
      "`type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate",
      "`range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 10] for pdf/cdf, [0.01, 0.99] for inverse_cdf",
      "`points?: number` - Number of points to generate (default: 100)",
    ],
    returns:
      "DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf",
    examples: [
      "const pdfData = s.dist.weibull.data({ shape: 2, scale: 1, type: 'pdf' });",
      "const cdfData = s.dist.weibull.data({ shape: 1.5, scale: 3, type: 'cdf', range: [0, 20] });",
    ],
    bestPractices: [
      "Use for plotting Weibull distribution curves",
      "Note: distribution is only defined for x ≥ 0",
    ],
    related: [
      "s.dist.weibull.density",
      "s.dist.weibull.probability",
      "s.dist.weibull.quantile",
    ],
  },
};

