import type { DocEntry } from "../mcp-types.ts";

export const betaDocs: Record<string, DocEntry> = {
  "s.dist.beta.density": {
    name: "s.dist.beta.density",
    category: "stats-distributions",
    description:
      "Beta distribution density function (PDF). Used for modeling probabilities and proportions.",
    signature: "s.dist.beta.density({ at, alpha, beta, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where density is evaluated (0 ≤ at ≤ 1)",
      "`alpha: number` - First shape parameter (α > 0)",
      "`beta: number` - Second shape parameter (β > 0)",
      "`returnLog?: boolean` - If true, return log density (default: false)",
    ],
    returns: "Density value or log density",
    examples: [
      "const pdf = s.dist.beta.density({ at: 0.5, alpha: 2, beta: 5 });",
      "const logPdf = s.dist.beta.density({ at: 0.3, alpha: 1, beta: 1, returnLog: true });",
      "// Uniform when α=1, β=1",
    ],
    bestPractices: [
      "Use for modeling probabilities and proportions",
      "α=β=1 gives uniform distribution on [0,1]",
      "α>β gives left-skewed, α<β gives right-skewed",
    ],
    related: [
      "s.dist.beta.probability",
      "s.dist.beta.quantile",
      "s.dist.beta.random",
    ],
  },

  "s.dist.beta.probability": {
    name: "s.dist.beta.probability",
    category: "stats-distributions",
    description:
      "Beta distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.beta.probability({ at, alpha, beta, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated (0 ≤ at ≤ 1)",
      "`alpha: number` - First shape parameter (α > 0)",
      "`beta: number` - Second shape parameter (β > 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.beta.probability({ at: 0.5, alpha: 2, beta: 5 });",
      "const pValue = s.dist.beta.probability({ at: 0.3, alpha: 1, beta: 1, direction: 'above' });",
    ],
    bestPractices: [
      "Use for Bayesian inference with beta priors",
      "Use for modeling uncertainty in proportions",
    ],
    related: [
      "s.dist.beta.density",
      "s.dist.beta.quantile",
      "s.dist.beta.random",
    ],
  },

  "s.dist.beta.quantile": {
    name: "s.dist.beta.quantile",
    category: "stats-distributions",
    description:
      "Beta distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.",
    signature:
      "s.dist.beta.quantile({ probability, alpha, beta, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`alpha: number` - First shape parameter (α > 0)",
      "`beta: number` - Second shape parameter (β > 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (0 ≤ x ≤ 1)",
    examples: [
      "const median = s.dist.beta.quantile({ probability: 0.5, alpha: 2, beta: 5 });",
      "const q95 = s.dist.beta.quantile({ probability: 0.95, alpha: 1, beta: 1 });",
      "// 95th percentile of uniform distribution = 0.95",
    ],
    bestPractices: [
      "Use for finding credible intervals in Bayesian analysis",
      "Use for generating random proportions",
    ],
    related: [
      "s.dist.beta.density",
      "s.dist.beta.probability",
      "s.dist.beta.random",
    ],
  },

  "s.dist.beta.random": {
    name: "s.dist.beta.random",
    category: "stats-distributions",
    description:
      "Generate random samples from beta distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.beta.random({ alpha, beta, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`alpha: number` - First shape parameter (α > 0)",
      "`beta: number` - Second shape parameter (β > 0)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns: "Random sample(s) from the beta distribution (values in [0, 1])",
    examples: [
      "const single = s.dist.beta.random({ alpha: 2, beta: 5 });",
      "const sample = s.dist.beta.random({ alpha: 1, beta: 1, sampleSize: 100 });",
      "// Uniform random numbers when α=1, β=1",
    ],
    bestPractices: [
      "Use for generating random proportions",
      "Use for Bayesian posterior sampling",
    ],
    related: [
      "s.dist.beta.density",
      "s.dist.beta.probability",
      "s.dist.beta.quantile",
    ],
  },

  "s.dist.beta.data": {
    name: "s.dist.beta.data",
    category: "stats-distributions",
    description:
      "Generate data for beta distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.",
    signature:
      "s.dist.beta.data({ alpha, beta, type, range?, points? }): DataFrame",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`alpha: number` - First shape parameter",
      "`beta: number` - Second shape parameter",
      "`type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate",
      "`range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 1] for pdf/cdf, [0.01, 0.99] for inverse_cdf",
      "`points?: number` - Number of points to generate (default: 100)",
    ],
    returns:
      "DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf",
    examples: [
      "const pdfData = s.dist.beta.data({ alpha: 2, beta: 5, type: 'pdf' });",
      "const cdfData = s.dist.beta.data({ alpha: 1, beta: 1, type: 'cdf' });",
    ],
    bestPractices: [
      "Use for plotting beta distribution curves",
      "Note: distribution is only defined on [0, 1]",
    ],
    related: [
      "s.dist.beta.density",
      "s.dist.beta.probability",
      "s.dist.beta.quantile",
    ],
  },
};
