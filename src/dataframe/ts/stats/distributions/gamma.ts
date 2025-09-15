import {
  wasm_dgamma,
  wasm_pgamma,
  wasm_qgamma,
  wasm_rgamma,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               GAMMA DISTRIBUTION
// ===============================================================================

/**
 * Gamma distribution density function
 * @param x Value at which to evaluate density
 * @param shape Shape parameter (α > 0)
 * @param rate Rate parameter (β > 0, default: 1)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dgamma(
  x: number,
  shape: number,
  rate: number = 1,
  giveLog: boolean = false,
): number {
  return wasm_dgamma(x, shape, rate, giveLog);
}

/**
 * Gamma distribution cumulative distribution function
 * @param q Quantile value
 * @param shape Shape parameter (α > 0)
 * @param rate Rate parameter (β > 0, default: 1)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pgamma(
  q: number,
  shape: number,
  rate: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pgamma(q, shape, rate, lowerTail, logP);
}

/**
 * Gamma distribution quantile function
 * @param p Probability
 * @param shape Shape parameter (α > 0)
 * @param rate Rate parameter (β > 0, default: 1)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qgamma(
  p: number,
  shape: number,
  rate: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qgamma(p, shape, rate, lowerTail, logP);
}

/**
 * Gamma distribution random number generator
 * @param shape Shape parameter (α > 0)
 * @param rate Rate parameter (β > 0, default: 1)
 * @returns Random value from gamma distribution
 */
export function rgamma(
  shape: number,
  rate: number = 1,
): number {
  return wasm_rgamma(shape, rate);
}
