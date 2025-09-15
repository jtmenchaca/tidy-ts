import {
  wasm_dpois,
  wasm_ppois,
  wasm_qpois,
  wasm_rpois,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                              POISSON DISTRIBUTION
// ===============================================================================

/**
 * Poisson distribution probability mass function
 * @param x Value at which to evaluate probability
 * @param lambda Rate parameter (λ > 0)
 * @param giveLog If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export function dpois(
  x: number,
  lambda: number,
  giveLog: boolean = false,
): number {
  return wasm_dpois(x, lambda, giveLog);
}

/**
 * Poisson distribution cumulative distribution function
 * @param q Quantile value
 * @param lambda Rate parameter (λ > 0)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function ppois(
  q: number,
  lambda: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_ppois(q, lambda, lowerTail, logP);
}

/**
 * Poisson distribution quantile function
 * @param p Probability
 * @param lambda Rate parameter (λ > 0)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qpois(
  p: number,
  lambda: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qpois(p, lambda, lowerTail, logP);
}

/**
 * Poisson distribution random number generator
 * @param lambda Rate parameter (λ > 0)
 * @returns Random value from Poisson distribution
 */
export function rpois(
  lambda: number,
): number {
  return wasm_rpois(lambda);
}
