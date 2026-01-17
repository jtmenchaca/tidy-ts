import type { DocEntry } from "../mcp-types.ts";

export const tDistributionDocs: Record<string, DocEntry> = {
  "s.dist.t.density": {
    name: "s.dist.t.density",
    category: "stats-distributions",
    description:
      "Student's t-distribution density function (PDF). Used for small sample inference.",
    signature: "s.dist.t.density({ at, degreesOfFreedom, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where density is evaluated",
      "`degreesOfFreedom: number` - Degrees of freedom (> 0)",
      "`returnLog?: boolean` - If true, return log density (default: false)",
    ],
    returns: "Density value or log density",
    examples: [
      "const pdf = s.dist.t.density({ at: 0, degreesOfFreedom: 10 });",
      "const logPdf = s.dist.t.density({ at: 2.5, degreesOfFreedom: 5, returnLog: true });",
    ],
    bestPractices: [
      "Use for t-test calculations",
      "Degrees of freedom typically = n - 1 for sample size n",
    ],
    related: [
      "s.dist.t.probability",
      "s.dist.t.quantile",
      "s.dist.t.random",
      "s.test.t.oneSample",
    ],
  },

  "s.dist.t.probability": {
    name: "s.dist.t.probability",
    category: "stats-distributions",
    description:
      "Student's t-distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.t.probability({ at, degreesOfFreedom, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated",
      "`degreesOfFreedom: number` - Degrees of freedom (> 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.t.probability({ at: 2.0, degreesOfFreedom: 10 });",
      "const pValue = s.dist.t.probability({ at: 2.5, degreesOfFreedom: 15, direction: 'above' });",
    ],
    bestPractices: [
      "Use for calculating p-values in t-tests",
      "As degrees of freedom → ∞, t-distribution approaches normal",
    ],
    related: [
      "s.dist.t.density",
      "s.dist.t.quantile",
      "s.dist.t.random",
      "s.test.t.oneSample",
    ],
  },

  "s.dist.t.quantile": {
    name: "s.dist.t.quantile",
    category: "stats-distributions",
    description:
      "Student's t-distribution quantile function (inverse CDF). Returns critical values for t-tests.",
    signature:
      "s.dist.t.quantile({ probability, degreesOfFreedom, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`degreesOfFreedom: number` - Degrees of freedom (> 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (critical value)",
    examples: [
      "const t95 = s.dist.t.quantile({ probability: 0.95, degreesOfFreedom: 10 });",
      "// Critical value for 95% confidence, df=10",
      "const t975 = s.dist.t.quantile({ probability: 0.975, degreesOfFreedom: 20 });",
      "// Critical value for two-tailed test, α=0.05",
    ],
    bestPractices: [
      "Use for finding critical values in hypothesis testing",
      "Use for calculating confidence intervals",
    ],
    related: [
      "s.dist.t.density",
      "s.dist.t.probability",
      "s.dist.t.random",
      "s.test.t.oneSample",
    ],
  },

  "s.dist.t.random": {
    name: "s.dist.t.random",
    category: "stats-distributions",
    description:
      "Generate random samples from Student's t-distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.t.random({ degreesOfFreedom, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`degreesOfFreedom: number` - Degrees of freedom (> 0)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns: "Random sample(s) from the t-distribution",
    examples: [
      "const single = s.dist.t.random({ degreesOfFreedom: 10 });",
      "const sample = s.dist.t.random({ degreesOfFreedom: 15, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for Monte Carlo simulations",
      "Use for bootstrap resampling",
    ],
    related: [
      "s.dist.t.density",
      "s.dist.t.probability",
      "s.dist.t.quantile",
    ],
  },

  "s.dist.t.data": {
    name: "s.dist.t.data",
    category: "stats-distributions",
    description:
      "Generate data for t-distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.",
    signature:
      "s.dist.t.data({ degreesOfFreedom, type, range?, points? }): DataFrame",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`degreesOfFreedom: number` - Degrees of freedom",
      "`type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate",
      "`range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [-4, 4] for pdf/cdf, [0.01, 0.99] for inverse_cdf",
      "`points?: number` - Number of points to generate (default: 100)",
    ],
    returns:
      "DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf",
    examples: [
      "const pdfData = s.dist.t.data({ degreesOfFreedom: 10, type: 'pdf' });",
      "const cdfData = s.dist.t.data({ degreesOfFreedom: 5, type: 'cdf', range: [-3, 3] });",
    ],
    bestPractices: [
      "Use for plotting t-distribution curves",
      "Compare different degrees of freedom to see convergence to normal",
    ],
    related: [
      "s.dist.t.density",
      "s.dist.t.probability",
      "s.dist.t.quantile",
    ],
  },
};

