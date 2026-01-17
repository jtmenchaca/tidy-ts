import type { DocEntry } from "../mcp-types.ts";

export const normalDocs: Record<string, DocEntry> = {
  "s.dist.normal.density": {
    name: "s.dist.normal.density",
    category: "stats-distributions",
    description:
      "Normal distribution density function (PDF). Returns the probability density at a given point.",
    signature:
      "s.dist.normal.density({ at, mean?, standardDeviation?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where density is evaluated",
      "`mean?: number` - Mean of the distribution (default: 0)",
      "`standardDeviation?: number` - Standard deviation (default: 1)",
      "`returnLog?: boolean` - If true, return log density (default: false)",
    ],
    returns: "Density value or log density",
    examples: [
      "const pdf = s.dist.normal.density({ at: 0, mean: 0, standardDeviation: 1 });",
      "// Standard normal: ≈ 0.3989",
      "const logPdf = s.dist.normal.density({ at: 1.96, returnLog: true });",
    ],
    bestPractices: [
      "Use for calculating likelihoods in statistical models",
      "Set returnLog: true for numerical stability when working with very small probabilities",
    ],
    related: [
      "s.dist.normal.probability",
      "s.dist.normal.quantile",
      "s.dist.normal.random",
    ],
  },

  "s.dist.normal.probability": {
    name: "s.dist.normal.probability",
    category: "stats-distributions",
    description:
      "Normal distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.normal.probability({ at, mean?, standardDeviation?, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated",
      "`mean?: number` - Mean of the distribution (default: 0)",
      "`standardDeviation?: number` - Standard deviation (default: 1)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.normal.probability({ at: 0, mean: 0, standardDeviation: 1 });",
      "// Standard normal at 0: 0.5 (50th percentile)",
      "const pValue = s.dist.normal.probability({ at: 1.96, direction: 'above' });",
      "// P(X > 1.96) ≈ 0.025",
    ],
    bestPractices: [
      "Use direction: 'above' for right-tailed p-values",
      "Use direction: 'below' for left-tailed p-values",
    ],
    related: [
      "s.dist.normal.density",
      "s.dist.normal.quantile",
      "s.dist.normal.random",
    ],
  },

  "s.dist.normal.quantile": {
    name: "s.dist.normal.quantile",
    category: "stats-distributions",
    description:
      "Normal distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.",
    signature:
      "s.dist.normal.quantile({ probability, mean?, standardDeviation?, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`mean?: number` - Mean of the distribution (default: 0)",
      "`standardDeviation?: number` - Standard deviation (default: 1)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value",
    examples: [
      "const z95 = s.dist.normal.quantile({ probability: 0.95 });",
      "// ≈ 1.645 (95th percentile of standard normal)",
      "const z975 = s.dist.normal.quantile({ probability: 0.975 });",
      "// ≈ 1.96 (97.5th percentile)",
      "const median = s.dist.normal.quantile({ probability: 0.5, mean: 10, standardDeviation: 2 });",
      "// = 10 (median equals mean for normal)",
    ],
    bestPractices: [
      "Use for finding critical values in hypothesis testing",
      "Use for calculating confidence intervals",
    ],
    related: [
      "s.dist.normal.density",
      "s.dist.normal.probability",
      "s.dist.normal.random",
    ],
  },

  "s.dist.normal.random": {
    name: "s.dist.normal.random",
    category: "stats-distributions",
    description:
      "Generate random samples from a normal distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.normal.random({ mean?, standardDeviation?, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`mean?: number` - Mean of the distribution (default: 0)",
      "`standardDeviation?: number` - Standard deviation (default: 1)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns: "Random sample(s) from the normal distribution",
    examples: [
      "const single = s.dist.normal.random();",
      "// Returns: number (single random value)",
      "const sample = s.dist.normal.random({ mean: 5, standardDeviation: 2, sampleSize: 100 });",
      "// Returns: number[] (array of 100 values)",
    ],
    bestPractices: [
      "Use for Monte Carlo simulations",
      "Use for generating synthetic data",
      "For large samples, consider using sampleSize parameter for efficiency",
    ],
    related: [
      "s.dist.normal.density",
      "s.dist.normal.probability",
      "s.dist.normal.quantile",
    ],
  },

  "s.dist.normal.data": {
    name: "s.dist.normal.data",
    category: "stats-distributions",
    description:
      "Generate data for normal distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.",
    signature:
      "s.dist.normal.data({ mean, standardDeviation, type, range?, points? }): DataFrame",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`mean: number` - Mean of the distribution",
      "`standardDeviation: number` - Standard deviation",
      "`type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate",
      "`range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [-4, 4] for pdf/cdf, [0.01, 0.99] for inverse_cdf",
      "`points?: number` - Number of points to generate (default: 100)",
    ],
    returns:
      "DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf",
    examples: [
      "const pdfData = s.dist.normal.data({ mean: 0, standardDeviation: 1, type: 'pdf' });",
      "// DataFrame with x and density columns",
      "const cdfData = s.dist.normal.data({ mean: 0, standardDeviation: 1, type: 'cdf', range: [-3, 3] });",
      "// DataFrame with x and probability columns",
    ],
    bestPractices: [
      "Use for plotting distribution curves",
      "Adjust range to focus on relevant regions",
      "Increase points for smoother curves",
    ],
    related: [
      "s.dist.normal.density",
      "s.dist.normal.probability",
      "s.dist.normal.quantile",
    ],
  },
};

