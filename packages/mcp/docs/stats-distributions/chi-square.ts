import type { DocEntry } from "../mcp-types.ts";

export const chiSquareDocs: Record<string, DocEntry> = {
  "s.dist.chiSquare.density": {
    name: "s.dist.chiSquare.density",
    category: "stats-distributions",
    description:
      "Chi-squared distribution density function (PDF). Used for goodness-of-fit tests and variance tests.",
    signature:
      "s.dist.chiSquare.density({ at, degreesOfFreedom, returnLog? }): number",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where density is evaluated (must be ≥ 0)",
      "`degreesOfFreedom: number` - Degrees of freedom (> 0)",
      "`returnLog?: boolean` - If true, return log density (default: false)",
    ],
    returns: "Density value or log density",
    examples: [
      "const pdf = s.dist.chiSquare.density({ at: 3.84, degreesOfFreedom: 1 });",
      "const logPdf = s.dist.chiSquare.density({ at: 5.0, degreesOfFreedom: 3, returnLog: true });",
    ],
    bestPractices: [
      "Use for chi-square test calculations",
      "Degrees of freedom = (rows - 1) × (cols - 1) for contingency tables",
    ],
    related: [
      "s.dist.chiSquare.probability",
      "s.dist.chiSquare.quantile",
      "s.dist.chiSquare.random",
      "s.test.categorical.chiSquare",
    ],
  },

  "s.dist.chiSquare.probability": {
    name: "s.dist.chiSquare.probability",
    category: "stats-distributions",
    description:
      "Chi-squared distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.chiSquare.probability({ at, degreesOfFreedom, direction?, returnLog? }): number",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated",
      "`degreesOfFreedom: number` - Degrees of freedom (> 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.chiSquare.probability({ at: 3.84, degreesOfFreedom: 1 });",
      "const pValue = s.dist.chiSquare.probability({ at: 5.99, degreesOfFreedom: 2, direction: 'above' });",
    ],
    bestPractices: [
      "Use for calculating p-values in chi-square tests",
      "Use direction: 'above' for right-tailed tests",
    ],
    related: [
      "s.dist.chiSquare.density",
      "s.dist.chiSquare.quantile",
      "s.dist.chiSquare.random",
      "s.test.categorical.chiSquare",
    ],
  },

  "s.dist.chiSquare.quantile": {
    name: "s.dist.chiSquare.quantile",
    category: "stats-distributions",
    description:
      "Chi-squared distribution quantile function (inverse CDF). Returns critical values for chi-square tests.",
    signature:
      "s.dist.chiSquare.quantile({ probability, degreesOfFreedom, direction?, probabilityIsLog? }): number",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`degreesOfFreedom: number` - Degrees of freedom (> 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (critical value)",
    examples: [
      "const chi95 = s.dist.chiSquare.quantile({ probability: 0.95, degreesOfFreedom: 1 });",
      "// Critical value for 95% confidence, df=1 (≈ 3.84)",
      "const chi99 = s.dist.chiSquare.quantile({ probability: 0.99, degreesOfFreedom: 5 });",
    ],
    bestPractices: [
      "Use for finding critical values in chi-square tests",
      "Common values: df=1, α=0.05 → 3.84; df=1, α=0.01 → 6.63",
    ],
    related: [
      "s.dist.chiSquare.density",
      "s.dist.chiSquare.probability",
      "s.dist.chiSquare.random",
      "s.test.categorical.chiSquare",
    ],
  },

  "s.dist.chiSquare.random": {
    name: "s.dist.chiSquare.random",
    category: "stats-distributions",
    description:
      "Generate random samples from chi-squared distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.chiSquare.random({ degreesOfFreedom, sampleSize? }): number | number[]",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`degreesOfFreedom: number` - Degrees of freedom (> 0)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns: "Random sample(s) from the chi-squared distribution",
    examples: [
      "const single = s.dist.chiSquare.random({ degreesOfFreedom: 5 });",
      "const sample = s.dist.chiSquare.random({ degreesOfFreedom: 10, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for Monte Carlo simulations",
      "Use for bootstrap resampling",
    ],
    related: [
      "s.dist.chiSquare.density",
      "s.dist.chiSquare.probability",
      "s.dist.chiSquare.quantile",
    ],
  },

  "s.dist.chiSquare.data": {
    name: "s.dist.chiSquare.data",
    category: "stats-distributions",
    description:
      "Generate data for chi-squared distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.",
    signature:
      "s.dist.chiSquare.data({ degreesOfFreedom, type, range?, points? }): DataFrame",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`degreesOfFreedom: number` - Degrees of freedom",
      "`type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate",
      "`range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 20] for pdf/cdf, [0.01, 0.99] for inverse_cdf",
      "`points?: number` - Number of points to generate (default: 100)",
    ],
    returns:
      "DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf",
    examples: [
      "const pdfData = s.dist.chiSquare.data({ degreesOfFreedom: 5, type: 'pdf' });",
      "const cdfData = s.dist.chiSquare.data({ degreesOfFreedom: 10, type: 'cdf', range: [0, 30] });",
    ],
    bestPractices: [
      "Use for plotting chi-squared distribution curves",
      "Note: distribution is only defined for x ≥ 0",
    ],
    related: [
      "s.dist.chiSquare.density",
      "s.dist.chiSquare.probability",
      "s.dist.chiSquare.quantile",
    ],
  },
};
