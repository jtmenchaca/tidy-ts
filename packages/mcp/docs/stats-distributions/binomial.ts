import type { DocEntry } from "../mcp-types.ts";

export const binomialDocs: Record<string, DocEntry> = {
  "s.dist.binomial.density": {
    name: "s.dist.binomial.density",
    category: "stats-distributions",
    description:
      "Binomial distribution probability mass function (PMF). Used for modeling number of successes in n independent trials.",
    signature:
      "s.dist.binomial.density({ at, trials, probabilityOfSuccess, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where PMF is evaluated (number of successes, 0 ≤ at ≤ trials)",
      "`trials: number` - Number of trials (n > 0)",
      "`probabilityOfSuccess: number` - Probability of success on each trial (0 ≤ p ≤ 1)",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Probability value or log probability",
    examples: [
      "const pmf = s.dist.binomial.density({ at: 3, trials: 10, probabilityOfSuccess: 0.5 });",
      "// P(X=3) in 10 trials with p=0.5",
      "const logPmf = s.dist.binomial.density({ at: 5, trials: 20, probabilityOfSuccess: 0.3, returnLog: true });",
    ],
    bestPractices: [
      "Use for modeling binary outcomes",
      "Mean = n×p, Variance = n×p×(1-p)",
      "Approximates normal when n is large and p is not extreme",
    ],
    related: [
      "s.dist.binomial.probability",
      "s.dist.binomial.quantile",
      "s.dist.binomial.random",
      "s.test.proportion.oneSample",
    ],
  },

  "s.dist.binomial.probability": {
    name: "s.dist.binomial.probability",
    category: "stats-distributions",
    description:
      "Binomial distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.binomial.probability({ at, trials, probabilityOfSuccess, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated (number of successes)",
      "`trials: number` - Number of trials",
      "`probabilityOfSuccess: number` - Probability of success on each trial",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.binomial.probability({ at: 3, trials: 10, probabilityOfSuccess: 0.5 });",
      "// P(X ≤ 3) in 10 trials",
      "const pValue = s.dist.binomial.probability({ at: 7, trials: 10, probabilityOfSuccess: 0.5, direction: 'above' });",
    ],
    bestPractices: [
      "Use for calculating p-values in proportion tests",
      "Use for finding probabilities of at most/least k successes",
    ],
    related: [
      "s.dist.binomial.density",
      "s.dist.binomial.quantile",
      "s.dist.binomial.random",
      "s.test.proportion.oneSample",
    ],
  },

  "s.dist.binomial.quantile": {
    name: "s.dist.binomial.quantile",
    category: "stats-distributions",
    description:
      "Binomial distribution quantile function (inverse CDF). Returns the smallest integer k such that P(X ≤ k) ≥ probability.",
    signature:
      "s.dist.binomial.quantile({ probability, trials, probabilityOfSuccess, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`trials: number` - Number of trials",
      "`probabilityOfSuccess: number` - Probability of success on each trial",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ k), 'above' for P(X > k) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (integer, 0 ≤ k ≤ trials)",
    examples: [
      "const median = s.dist.binomial.quantile({ probability: 0.5, trials: 10, probabilityOfSuccess: 0.5 });",
      "const q95 = s.dist.binomial.quantile({ probability: 0.95, trials: 20, probabilityOfSuccess: 0.3 });",
    ],
    bestPractices: [
      "Use for finding percentiles of success counts",
      "Returns integer values (discrete distribution)",
    ],
    related: [
      "s.dist.binomial.density",
      "s.dist.binomial.probability",
      "s.dist.binomial.random",
    ],
  },

  "s.dist.binomial.random": {
    name: "s.dist.binomial.random",
    category: "stats-distributions",
    description:
      "Generate random samples from binomial distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.binomial.random({ trials, probabilityOfSuccess, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`trials: number` - Number of trials",
      "`probabilityOfSuccess: number` - Probability of success on each trial",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns:
      "Random sample(s) from the binomial distribution (integers, 0 ≤ k ≤ trials)",
    examples: [
      "const single = s.dist.binomial.random({ trials: 10, probabilityOfSuccess: 0.5 });",
      "const sample = s.dist.binomial.random({ trials: 20, probabilityOfSuccess: 0.3, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for generating synthetic binary outcome data",
      "Use for simulating coin flips or success/failure experiments",
    ],
    related: [
      "s.dist.binomial.density",
      "s.dist.binomial.probability",
      "s.dist.binomial.quantile",
    ],
  },

  "s.dist.binomial.data": {
    name: "s.dist.binomial.data",
    category: "stats-distributions",
    description:
      "Generate data for binomial distribution visualization. Returns a DataFrame with PMF, CDF, or inverse CDF data.",
    signature:
      "s.dist.binomial.data({ trials, probabilityOfSuccess, type, range?, points? }): DataFrame",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`trials: number` - Number of trials",
      "`probabilityOfSuccess: number` - Probability of success on each trial",
      "`type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate",
      "`range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, trials] for pdf/cdf, [0.01, 0.99] for inverse_cdf",
      "`points?: number` - Number of points to generate (default: 100)",
    ],
    returns:
      "DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf",
    examples: [
      "const pdfData = s.dist.binomial.data({ trials: 10, probabilityOfSuccess: 0.5, type: 'pdf' });",
      "const cdfData = s.dist.binomial.data({ trials: 20, probabilityOfSuccess: 0.3, type: 'cdf' });",
    ],
    bestPractices: [
      "Use for plotting binomial distribution curves",
      "Note: discrete distribution, values are integers",
    ],
    related: [
      "s.dist.binomial.density",
      "s.dist.binomial.probability",
      "s.dist.binomial.quantile",
    ],
  },
};
