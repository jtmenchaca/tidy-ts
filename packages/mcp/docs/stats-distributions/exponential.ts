import type { DocEntry } from "../mcp-types.ts";

export const exponentialDocs: Record<string, DocEntry> = {
  "s.dist.exponential.density": {
    name: "s.dist.exponential.density",
    category: "stats-distributions",
    description:
      "Exponential distribution density function (PDF). Used for modeling waiting times between events (memoryless property).",
    signature: "s.dist.exponential.density({ at, rate?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where density is evaluated (must be ≥ 0)",
      "`rate?: number` - Rate parameter (λ > 0, default: 1). Mean = 1/rate",
      "`returnLog?: boolean` - If true, return log density (default: false)",
    ],
    returns: "Density value or log density",
    examples: [
      "const pdf = s.dist.exponential.density({ at: 2.0, rate: 0.5 });",
      "const logPdf = s.dist.exponential.density({ at: 1.0, rate: 1, returnLog: true });",
      "// Mean waiting time = 1/rate",
    ],
    bestPractices: [
      "Use for modeling time between events in Poisson processes",
      "Memoryless property: P(X > s+t | X > s) = P(X > t)",
      "Mean = 1/rate, Variance = 1/rate²",
    ],
    related: [
      "s.dist.exponential.probability",
      "s.dist.exponential.quantile",
      "s.dist.exponential.random",
      "s.dist.poisson.density",
    ],
  },

  "s.dist.exponential.probability": {
    name: "s.dist.exponential.probability",
    category: "stats-distributions",
    description:
      "Exponential distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.exponential.probability({ at, rate?, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated",
      "`rate?: number` - Rate parameter (λ > 0, default: 1)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.exponential.probability({ at: 2.0, rate: 0.5 });",
      "const survival = s.dist.exponential.probability({ at: 3.0, rate: 1, direction: 'above' });",
      "// P(X > 3) = e^(-3) ≈ 0.05",
    ],
    bestPractices: [
      "Use for survival analysis",
      "Use for reliability modeling",
      "P(X > t) = e^(-rate × t)",
    ],
    related: [
      "s.dist.exponential.density",
      "s.dist.exponential.quantile",
      "s.dist.exponential.random",
    ],
  },

  "s.dist.exponential.quantile": {
    name: "s.dist.exponential.quantile",
    category: "stats-distributions",
    description:
      "Exponential distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.",
    signature:
      "s.dist.exponential.quantile({ probability, rate?, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`rate?: number` - Rate parameter (λ > 0, default: 1)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (x ≥ 0)",
    examples: [
      "const median = s.dist.exponential.quantile({ probability: 0.5, rate: 1 });",
      "// Median = ln(2)/rate ≈ 0.693",
      "const q95 = s.dist.exponential.quantile({ probability: 0.95, rate: 0.5 });",
    ],
    bestPractices: [
      "Use for finding percentiles of waiting times",
      "Use for generating random waiting times",
    ],
    related: [
      "s.dist.exponential.density",
      "s.dist.exponential.probability",
      "s.dist.exponential.random",
    ],
  },

  "s.dist.exponential.random": {
    name: "s.dist.exponential.random",
    category: "stats-distributions",
    description:
      "Generate random samples from exponential distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.exponential.random({ rate?, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`rate?: number` - Rate parameter (λ > 0, default: 1)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns: "Random sample(s) from the exponential distribution (values ≥ 0)",
    examples: [
      "const single = s.dist.exponential.random();",
      "const sample = s.dist.exponential.random({ rate: 0.5, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for generating synthetic waiting time data",
      "Use for simulating Poisson processes",
    ],
    related: [
      "s.dist.exponential.density",
      "s.dist.exponential.probability",
      "s.dist.exponential.quantile",
    ],
  },

  "s.dist.exponential.data": {
    name: "s.dist.exponential.data",
    category: "stats-distributions",
    description:
      "Generate data for exponential distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.",
    signature:
      "s.dist.exponential.data({ rate, type, range?, points? }): DataFrame",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`rate: number` - Rate parameter",
      "`type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate",
      "`range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 10] for pdf/cdf, [0.01, 0.99] for inverse_cdf",
      "`points?: number` - Number of points to generate (default: 100)",
    ],
    returns:
      "DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf",
    examples: [
      "const pdfData = s.dist.exponential.data({ rate: 1, type: 'pdf' });",
      "const cdfData = s.dist.exponential.data({ rate: 0.5, type: 'cdf', range: [0, 20] });",
    ],
    bestPractices: [
      "Use for plotting exponential distribution curves",
      "Note: distribution is only defined for x ≥ 0",
    ],
    related: [
      "s.dist.exponential.density",
      "s.dist.exponential.probability",
      "s.dist.exponential.quantile",
    ],
  },
};
