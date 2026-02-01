import type { DocEntry } from "../mcp-types.ts";

export const paretoDocs: Record<string, DocEntry> = {
  "s.dist.pareto.density": {
    name: "s.dist.pareto.density",
    category: "stats-distributions",
    description:
      "Pareto distribution density function (PDF). Used for modeling heavy-tailed distributions (e.g., income, city sizes).",
    signature:
      "s.dist.pareto.density({ at, scale, shape, returnLog? }): number",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where density is evaluated (must be ≥ scale)",
      "`scale: number` - Scale parameter (xm > 0), minimum possible value",
      "`shape: number` - Shape parameter (α > 0), controls tail heaviness",
      "`returnLog?: boolean` - If true, return log density (default: false)",
    ],
    returns: "Density value or log density (0 if at < scale)",
    examples: [
      "const pdf = s.dist.pareto.density({ at: 2.0, scale: 1, shape: 2 });",
      "const logPdf = s.dist.pareto.density({ at: 5.0, scale: 1, shape: 1.5, returnLog: true });",
    ],
    bestPractices: [
      "Use for modeling heavy-tailed phenomena",
      "Power law distribution: P(X > x) ∝ x^(-α)",
      "Mean = α×scale/(α-1) if α > 1, else infinite",
      "Variance exists only if α > 2",
    ],
    related: [
      "s.dist.pareto.probability",
      "s.dist.pareto.quantile",
      "s.dist.pareto.random",
    ],
  },

  "s.dist.pareto.probability": {
    name: "s.dist.pareto.probability",
    category: "stats-distributions",
    description:
      "Pareto distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.pareto.probability({ at, scale, shape, direction?, returnLog? }): number",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated",
      "`scale: number` - Scale parameter (xm > 0)",
      "`shape: number` - Shape parameter (α > 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.pareto.probability({ at: 2.0, scale: 1, shape: 2 });",
      "const survival = s.dist.pareto.probability({ at: 5.0, scale: 1, shape: 1.5, direction: 'above' });",
      "// P(X > 5) = (1/5)^1.5",
    ],
    bestPractices: [
      "Use for survival analysis of heavy-tailed data",
      "P(X > x) = (scale/x)^shape for x ≥ scale",
    ],
    related: [
      "s.dist.pareto.density",
      "s.dist.pareto.quantile",
      "s.dist.pareto.random",
    ],
  },

  "s.dist.pareto.quantile": {
    name: "s.dist.pareto.quantile",
    category: "stats-distributions",
    description:
      "Pareto distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.",
    signature:
      "s.dist.pareto.quantile({ probability, scale, shape, direction?, probabilityIsLog? }): number",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`scale: number` - Scale parameter (xm > 0)",
      "`shape: number` - Shape parameter (α > 0)",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (x ≥ scale)",
    examples: [
      "const median = s.dist.pareto.quantile({ probability: 0.5, scale: 1, shape: 2 });",
      "const q95 = s.dist.pareto.quantile({ probability: 0.95, scale: 1, shape: 1.5 });",
    ],
    bestPractices: [
      "Use for finding percentiles of heavy-tailed data",
      "Quantile = scale × (1 - probability)^(-1/shape)",
    ],
    related: [
      "s.dist.pareto.density",
      "s.dist.pareto.probability",
      "s.dist.pareto.random",
    ],
  },

  "s.dist.pareto.random": {
    name: "s.dist.pareto.random",
    category: "stats-distributions",
    description:
      "Generate random samples from Pareto distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.pareto.random({ scale, shape, sampleSize? }): number | number[]",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`scale: number` - Scale parameter (xm > 0)",
      "`shape: number` - Shape parameter (α > 0)",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns: "Random sample(s) from the Pareto distribution (values ≥ scale)",
    examples: [
      "const single = s.dist.pareto.random({ scale: 1, shape: 2 });",
      "const sample = s.dist.pareto.random({ scale: 1, shape: 1.5, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for generating synthetic heavy-tailed data",
      "Use for simulating income distributions or city sizes",
    ],
    related: [
      "s.dist.pareto.density",
      "s.dist.pareto.probability",
      "s.dist.pareto.quantile",
    ],
  },

  "s.dist.pareto.data": {
    name: "s.dist.pareto.data",
    category: "stats-distributions",
    description:
      "Generate data for Pareto distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.",
    signature:
      "s.dist.pareto.data({ scale, shape, type, range?, points? }): DataFrame",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`scale: number` - Scale parameter",
      "`shape: number` - Shape parameter",
      "`type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate",
      "`range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [scale, scale×10] for pdf/cdf, [0.01, 0.99] for inverse_cdf",
      "`points?: number` - Number of points to generate (default: 100)",
    ],
    returns:
      "DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf",
    examples: [
      "const pdfData = s.dist.pareto.data({ scale: 1, shape: 2, type: 'pdf' });",
      "const cdfData = s.dist.pareto.data({ scale: 1, shape: 1.5, type: 'cdf', range: [1, 20] });",
    ],
    bestPractices: [
      "Use for plotting Pareto distribution curves",
      "Note: distribution is only defined for x ≥ scale",
    ],
    related: [
      "s.dist.pareto.density",
      "s.dist.pareto.probability",
      "s.dist.pareto.quantile",
    ],
  },
};
