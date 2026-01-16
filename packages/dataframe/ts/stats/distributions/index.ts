// Statistical Distribution Functions

// Import all distribution functions
import * as beta from "./beta.ts";
import * as binomial from "./binomial.ts";
import * as chiSquare from "./chi-square.ts";
import * as exponential from "./exponential.ts";
import * as fDist from "./f-distribution.ts";
import * as gamma from "./gamma.ts";
import * as geometric from "./geometric.ts";
import * as hypergeometric from "./hypergeometric.ts";
import * as logNormal from "./log-normal.ts";
import * as negativeBinomial from "./negative-binomial.ts";
import * as normal from "./normal.ts";
import * as pareto from "./pareto.ts";
import * as poisson from "./poisson.ts";
import * as tDist from "./t-distribution.ts";
import * as uniform from "./uniform.ts";
import * as weibull from "./weibull.ts";
import * as wilcoxon from "./wilcoxon.ts";

/**
 * Comprehensive probability distributions organized by type.
 * Each distribution provides DPQR functions: Density, Probability, Quantile, Random
 *
 * @example
 * ```typescript
 * import { distributions } from "@tidy-ts/dataframe";
 *
 * // Normal distribution
 * const density = distributions.normal.density(0, 0, 1);
 * const probability = distributions.normal.probability(1.96, 0, 1);
 * const quantile = distributions.normal.quantile(0.975, 0, 1);
 * const random = distributions.normal.random(0, 1);
 *
 * // Beta distribution
 * const randomBeta = distributions.beta.random(2, 5);
 * const chiSquareP = distributions.chiSquare.probability(3.84, 1);
 * ```
 */
export const dist = {
  // Continuous distributions
  normal: {
    density: normal.dnorm,
    probability: normal.pnorm,
    quantile: normal.qnorm,
    random: normal.rnorm,
    data: normal.normalData,
  },

  beta: {
    density: beta.dbeta,
    probability: beta.pbeta,
    quantile: beta.qbeta,
    random: beta.rbeta,
    data: beta.betaData,
  },

  gamma: {
    density: gamma.dgamma,
    probability: gamma.pgamma,
    quantile: gamma.qgamma,
    random: gamma.rgamma,
    data: gamma.gammaData,
  },

  exponential: {
    density: exponential.dexp,
    probability: exponential.pexp,
    quantile: exponential.qexp,
    random: exponential.rexp,
    data: exponential.exponentialData,
  },

  chiSquare: {
    density: chiSquare.dchisq,
    probability: chiSquare.pchisq,
    quantile: chiSquare.qchisq,
    random: chiSquare.rchisq,
    data: chiSquare.chiSquareData,
  },

  t: {
    density: tDist.dt,
    probability: tDist.pt,
    quantile: tDist.qt,
    random: tDist.rt,
    data: tDist.tData,
  },

  f: {
    density: fDist.df,
    probability: fDist.pf,
    quantile: fDist.qf,
    random: fDist.rf,
  },

  uniform: {
    density: uniform.dunif,
    probability: uniform.punif,
    quantile: uniform.qunif,
    random: uniform.runif,
    data: uniform.uniformData,
  },

  weibull: {
    density: weibull.dweibull,
    probability: weibull.pweibull,
    quantile: weibull.qweibull,
    random: weibull.rweibull,
    data: weibull.weibullData,
  },

  logNormal: {
    density: logNormal.dlnorm,
    probability: logNormal.plnorm,
    quantile: logNormal.qlnorm,
    random: logNormal.rlnorm,
  },

  pareto: {
    density: pareto.dpareto,
    probability: pareto.ppareto,
    quantile: pareto.qpareto,
    random: pareto.rpareto,
    data: pareto.paretoData,
  },

  wilcoxon: {
    density: wilcoxon.dwilcox,
    probability: wilcoxon.pwilcox,
    quantile: wilcoxon.qwilcox,
    random: wilcoxon.rwilcox,
  },

  // Discrete distributions
  binomial: {
    density: binomial.dbinom,
    probability: binomial.pbinom,
    quantile: binomial.qbinom,
    random: binomial.rbinom,
    data: binomial.binomialData,
  },

  poisson: {
    density: poisson.dpois,
    probability: poisson.ppois,
    quantile: poisson.qpois,
    random: poisson.rpois,
    data: poisson.poissonData,
  },

  geometric: {
    density: geometric.dgeom,
    probability: geometric.pgeom,
    quantile: geometric.qgeom,
    random: geometric.rgeom,
  },

  negativeBinomial: {
    density: negativeBinomial.dnbinom,
    probability: negativeBinomial.pnbinom,
    quantile: negativeBinomial.qnbinom,
    random: negativeBinomial.rnbinom,
  },

  hypergeometric: {
    density: hypergeometric.dhyper,
    probability: hypergeometric.phyper,
    quantile: hypergeometric.qhyper,
    random: hypergeometric.rhyper,
  },
} as const;

// Export for backward compatibility (flat exports)
export * from "./beta.ts";
export * from "./binomial.ts";
export * from "./chi-square.ts";
export * from "./exponential.ts";
export * from "./f-distribution.ts";
export * from "./gamma.ts";
export * from "./geometric.ts";
export * from "./hypergeometric.ts";
export * from "./log-normal.ts";
export * from "./negative-binomial.ts";
export * from "./normal.ts";
export * from "./pareto.ts";
export * from "./poisson.ts";
export * from "./t-distribution.ts";
export * from "./uniform.ts";
export * from "./weibull.ts";
export * from "./wilcoxon.ts";

// Also export distributions as default
export default dist;
