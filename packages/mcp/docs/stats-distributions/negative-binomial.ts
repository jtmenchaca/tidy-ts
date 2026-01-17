import type { DocEntry } from "../mcp-types.ts";

export const negativeBinomialDocs: Record<string, DocEntry> = {
  "s.dist.negativeBinomial.density": {
    name: "s.dist.negativeBinomial.density",
    category: "stats-distributions",
    description:
      "Negative binomial distribution probability mass function (PMF). Models the number of failures before achieving r successes in independent Bernoulli trials.",
    signature:
      "s.dist.negativeBinomial.density({ at, numberOfSuccesses, probabilityOfSuccess, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where PMF is evaluated (number of failures, must be non-negative integer)",
      "`numberOfSuccesses: number` - Number of successes required (r > 0)",
      "`probabilityOfSuccess: number` - Probability of success on each trial (0 < p < 1)",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Probability value or log probability",
    examples: [
      "const pmf = s.dist.negativeBinomial.density({ at: 3, numberOfSuccesses: 2, probabilityOfSuccess: 0.5 });",
      "// P(X=3 failures before 2 successes)",
      "const logPmf = s.dist.negativeBinomial.density({ at: 5, numberOfSuccesses: 3, probabilityOfSuccess: 0.4, returnLog: true });",
    ],
    bestPractices: [
      "Use for modeling overdispersed count data (variance > mean)",
      "Generalizes geometric distribution (r=1)",
      "Mean = r(1-p)/p, Variance = r(1-p)/p²",
    ],
    related: [
      "s.dist.negativeBinomial.probability",
      "s.dist.negativeBinomial.quantile",
      "s.dist.negativeBinomial.random",
      "s.dist.geometric.density",
    ],
  },

  "s.dist.negativeBinomial.probability": {
    name: "s.dist.negativeBinomial.probability",
    category: "stats-distributions",
    description:
      "Negative binomial distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).",
    signature:
      "s.dist.negativeBinomial.probability({ at, numberOfSuccesses, probabilityOfSuccess, direction?, returnLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`at: number` - Point where CDF is evaluated (number of failures)",
      "`numberOfSuccesses: number` - Number of successes required",
      "`probabilityOfSuccess: number` - Probability of success on each trial",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')",
      "`returnLog?: boolean` - If true, return log probability (default: false)",
    ],
    returns: "Cumulative probability or log cumulative probability",
    examples: [
      "const cdf = s.dist.negativeBinomial.probability({ at: 3, numberOfSuccesses: 2, probabilityOfSuccess: 0.5 });",
      "const pValue = s.dist.negativeBinomial.probability({ at: 5, numberOfSuccesses: 3, probabilityOfSuccess: 0.4, direction: 'above' });",
    ],
    bestPractices: [
      "Use for calculating probabilities of overdispersed counts",
      "Use for modeling count data with excess zeros",
    ],
    related: [
      "s.dist.negativeBinomial.density",
      "s.dist.negativeBinomial.quantile",
      "s.dist.negativeBinomial.random",
    ],
  },

  "s.dist.negativeBinomial.quantile": {
    name: "s.dist.negativeBinomial.quantile",
    category: "stats-distributions",
    description:
      "Negative binomial distribution quantile function (inverse CDF). Returns the smallest integer k such that P(X ≤ k) ≥ probability.",
    signature:
      "s.dist.negativeBinomial.quantile({ probability, numberOfSuccesses, probabilityOfSuccess, direction?, probabilityIsLog? }): number",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`probability: number` - Probability value (0..1)",
      "`numberOfSuccesses: number` - Number of successes required",
      "`probabilityOfSuccess: number` - Probability of success on each trial",
      "`direction?: 'below' | 'above'` - 'below' for P(X ≤ k), 'above' for P(X > k) (default: 'below')",
      "`probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)",
    ],
    returns: "Quantile value (non-negative integer)",
    examples: [
      "const median = s.dist.negativeBinomial.quantile({ probability: 0.5, numberOfSuccesses: 2, probabilityOfSuccess: 0.5 });",
      "const q95 = s.dist.negativeBinomial.quantile({ probability: 0.95, numberOfSuccesses: 3, probabilityOfSuccess: 0.4 });",
    ],
    bestPractices: [
      "Use for finding percentiles of failure counts",
      "Returns integer values (discrete distribution)",
    ],
    related: [
      "s.dist.negativeBinomial.density",
      "s.dist.negativeBinomial.probability",
      "s.dist.negativeBinomial.random",
    ],
  },

  "s.dist.negativeBinomial.random": {
    name: "s.dist.negativeBinomial.random",
    category: "stats-distributions",
    description:
      "Generate random samples from negative binomial distribution. Returns a single number or array of numbers.",
    signature:
      "s.dist.negativeBinomial.random({ numberOfSuccesses, probabilityOfSuccess, sampleSize? }): number | number[]",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`numberOfSuccesses: number` - Number of successes required",
      "`probabilityOfSuccess: number` - Probability of success on each trial",
      "`sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]",
    ],
    returns:
      "Random sample(s) from the negative binomial distribution (non-negative integers)",
    examples: [
      "const single = s.dist.negativeBinomial.random({ numberOfSuccesses: 2, probabilityOfSuccess: 0.5 });",
      "const sample = s.dist.negativeBinomial.random({ numberOfSuccesses: 3, probabilityOfSuccess: 0.4, sampleSize: 100 });",
    ],
    bestPractices: [
      "Use for generating synthetic overdispersed count data",
      "Use for simulating count data with excess variance",
    ],
    related: [
      "s.dist.negativeBinomial.density",
      "s.dist.negativeBinomial.probability",
      "s.dist.negativeBinomial.quantile",
    ],
  },
};

