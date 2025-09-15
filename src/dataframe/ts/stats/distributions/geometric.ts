import {
  wasm_dgeom,
  wasm_pgeom,
  wasm_qgeom,
  wasm_rgeom,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               GEOMETRIC DISTRIBUTION
// ===============================================================================

/**
 * Geometric distribution density function
 * @param x Value at which to evaluate density (number of failures before first success)
 * @param prob Probability of success on each trial (0 < prob ≤ 1)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dgeom(
  x: number,
  prob: number,
  giveLog: boolean = false,
): number {
  return wasm_dgeom(x, prob, giveLog);
}

/**
 * Geometric distribution cumulative distribution function
 * @param q Quantile value
 * @param prob Probability of success on each trial (0 < prob ≤ 1)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pgeom(
  q: number,
  prob: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pgeom(q, prob, lowerTail, logP);
}

/**
 * Geometric distribution quantile function
 * @param p Probability
 * @param prob Probability of success on each trial (0 < prob ≤ 1)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qgeom(
  p: number,
  prob: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qgeom(p, prob, lowerTail, logP);
}

/**
 * Geometric distribution random number generator
 * @param prob Probability of success on each trial (0 < prob ≤ 1)
 * @returns Random value from geometric distribution
 */
export function rgeom(
  prob: number,
): number {
  return wasm_rgeom(prob);
}
