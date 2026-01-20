import type { DocEntry } from "../mcp-types.ts";

export const poissonDocs: Record<string, DocEntry> = {
  "s.dist.poisson.density": {
    name: "s.dist.poisson.density",
    category: "stats-distributions",
    description:
      "Poisson distribution probability mass function (PMF). Used for modeling counts of rare events in fixed intervals.",
    signature: "s.dist.poisson.density({ at, rateLambda, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where PMF is evaluated (count k, must be non-negative integer)",
      "`rateLambda: number` - Rate parameter (λ > 0), mean number of events",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Probability value or log probability",
    examples: [
      "const pmf = s.dist.poisson.density({ at: 3, rateLambda: 2 });",
      "// P(X=3) when λ=2",
      "const logPmf = s.dist.poisson.density({ at: 5, rateLambda: 3, returnLog: true });",
    ],
    bestPractices: [
      "Use for modeling rare event counts",
      "Mean = Variance = λ",
      "Approximates binomial when n is large and p is small",
    ],
    related: [
      "s.dist.poisson.probability",
      "s.dist.poisson.quantile",
      "s.dist.poisson.random",
      "s.dist.binomial.density",
    ],
  },

  "s.dist.poisson.probability": {
    name: "s.dist.poisson.probability",
    category: "stats-distributions",
    description:
      "Poisson distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.poisson.probability({ at, rateLambda, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated (count k)",
      "`rateLambda: number` - Rate parameter (λ > 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.poisson.probability({ at: 3, rateLambda: 2 });",
      "// P(X ≤ 3) when λ=2",
      "const pValue = s.dist.poisson.probability({ at: 5, rateLambda: 3, direction: 'above' });",
    ],
    bestPractices: [
      "Use for calculating p-values in Poisson tests",
      "Use for finding probabilities of observing at most/least k events",
    ],
    related: [
      "s.dist.poisson.density",
      "s.dist.poisson.quantile",
      "s.dist.poisson.random",
    ],
  },

  "s.dist.poisson.quantile": {
    name: "s.dist.poisson.quantile",
    category: "stats-distributions",
    description:
      "Poisson distribution quantile function (inverse CDF). Returns the smallest integer k such that P(X ≤ k) ≥ probability.",
    signature:
      "s.dist.poisson.quantile({ probability, rateLambda, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`rateLambda: number` - Rate parameter (λ > 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ k), 'above' for P(X > k) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (non-negative integer)",
    examples: [
      "const median = s.dist.poisson.quantile({ probability: 0.5, rateLambda: 3 });",
      "const q95 = s.dist.poisson.quantile({ probability: 0.95, rateLambda: 5 });",
    ],
    bestPractices: [
      "Use for finding percentiles of event counts",
      "Returns integer values (discrete distribution)",
    ],
    related: [
      "s.dist.poisson.density",
      "s.dist.poisson.probability",
      "s.dist.poisson.random",
    ],
  },

  "s.dist.poisson.random": {
    name: "s.dist.poisson.random",
    category: "stats-distributions",
    description:
      "Generate random samples from Poisson distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.poisson.random({ rateLambda, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`rateLambda: number` - Rate parameter (λ > 0)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns:
      "Random sample(s) from the Poisson distribution (non-negative integers)",
    examples: [
      "const single = s.dist.poisson.random({ rateLambda: 2 });",
      "const sample = s.dist.poisson.random({ rateLambda: 5, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for generating synthetic count data",
      "Use for simulating rare events",
    ],
    related: [
      "s.dist.poisson.density",
      "s.dist.poisson.probability",
      "s.dist.poisson.quantile",
    ],
  },

  "s.dist.poisson.data": {
    name: "s.dist.poisson.data",
    category: "stats-distributions",
    description:
      "Generate data for Poisson distribution visualization. Returns a DataFrame with PMF, CDF, or inverse CDF data.",
    signature:
      "s.dist.poisson.data({ rateLambda, type, range?, points? }): DataFrame",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`rateLambda: number` - Rate parameter",
      "`type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate",
      "`range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 20] for pdf/cdf, [0.01, 0.99] for inverse_cdf",
      "`points?: number` - Number of points to generate (default: 100)",
    ],
    returns:
      "DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf",
    examples: [
      "const pdfData = s.dist.poisson.data({ rateLambda: 3, type: 'pdf' });",
      "const cdfData = s.dist.poisson.data({ rateLambda: 5, type: 'cdf', range: [0, 15] });",
    ],
    bestPractices: [
      "Use for plotting Poisson distribution curves",
      "Note: discrete distribution, values are integers",
    ],
    related: [
      "s.dist.poisson.density",
      "s.dist.poisson.probability",
      "s.dist.poisson.quantile",
    ],
  },
};
