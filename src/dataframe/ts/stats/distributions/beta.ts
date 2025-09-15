import {
  wasm_dbeta,
  wasm_pbeta,
  wasm_qbeta,
  wasm_rbeta,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               BETA DISTRIBUTION
// ===============================================================================

/**
 * Beta distribution density function
 * @param x Value at which to evaluate density
 * @param shape1 First shape parameter (α > 0)
 * @param shape2 Second shape parameter (β > 0)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dbeta(
  x: number,
  shape1: number,
  shape2: number,
  giveLog: boolean = false,
): number {
  return wasm_dbeta(x, shape1, shape2, giveLog);
}

/**
 * Beta distribution cumulative distribution function
 * @param q Quantile value
 * @param shape1 First shape parameter (α > 0)
 * @param shape2 Second shape parameter (β > 0)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pbeta(
  q: number,
  shape1: number,
  shape2: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pbeta(q, shape1, shape2, lowerTail, logP);
}

/**
 * Beta distribution quantile function
 * @param p Probability
 * @param shape1 First shape parameter (α > 0)
 * @param shape2 Second shape parameter (β > 0)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qbeta(
  p: number,
  shape1: number,
  shape2: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qbeta(p, shape1, shape2, lowerTail, logP);
}

/**
 * Beta distribution random number generation
 * @param shape1 First shape parameter (α > 0)
 * @param shape2 Second shape parameter (β > 0)
 * @returns A random sample from the beta distribution
 */
export function rbeta(
  shape1: number,
  shape2: number,
): number {
  return wasm_rbeta(shape1, shape2);
}
