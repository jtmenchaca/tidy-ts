import {
  wasm_dnorm,
  wasm_pnorm,
  wasm_qnorm,
  wasm_rnorm,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                              NORMAL DISTRIBUTION
// ===============================================================================

/**
 * Normal distribution density function
 * @param x Value at which to evaluate density
 * @param mean Mean of the distribution (default: 0)
 * @param sd Standard deviation (default: 1)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dnorm(
  x: number,
  mean: number = 0,
  sd: number = 1,
  giveLog: boolean = false,
): number {
  return wasm_dnorm(x, mean, sd, giveLog);
}

/**
 * Normal distribution cumulative distribution function
 * @param q Quantile value
 * @param mean Mean of the distribution (default: 0)
 * @param sd Standard deviation (default: 1)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pnorm(
  q: number,
  mean: number = 0,
  sd: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pnorm(q, mean, sd, lowerTail, logP);
}

/**
 * Normal distribution quantile function
 * @param p Probability
 * @param mean Mean of the distribution (default: 0)
 * @param sd Standard deviation (default: 1)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qnorm(
  p: number,
  mean: number = 0,
  sd: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qnorm(p, mean, sd, lowerTail, logP);
}

/**
 * Normal distribution random number generation
 * @param mean Mean of the distribution (default: 0)
 * @param sd Standard deviation (default: 1)
 * @returns A random sample from the normal distribution
 */
export function rnorm(
  mean: number = 0,
  sd: number = 1,
): number {
  return wasm_rnorm(mean, sd);
}
