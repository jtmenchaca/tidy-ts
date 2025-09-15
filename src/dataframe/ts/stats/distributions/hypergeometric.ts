import {
  wasm_dhyper,
  wasm_phyper,
  wasm_qhyper,
  wasm_rhyper,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               HYPERGEOMETRIC DISTRIBUTION
// ===============================================================================

/**
 * Hypergeometric distribution density function
 * @param x Number of successes in sample
 * @param m Number of success items in population
 * @param n Number of failure items in population
 * @param k Sample size
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dhyper(
  x: number,
  m: number,
  n: number,
  k: number,
  giveLog: boolean = false,
): number {
  return wasm_dhyper(x, m, n, k, giveLog);
}

/**
 * Hypergeometric distribution cumulative distribution function
 * @param q Quantile value
 * @param m Number of success items in population
 * @param n Number of failure items in population
 * @param k Sample size
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function phyper(
  q: number,
  m: number,
  n: number,
  k: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_phyper(q, m, n, k, lowerTail, logP);
}

/**
 * Hypergeometric distribution quantile function
 * @param p Probability
 * @param m Number of success items in population
 * @param n Number of failure items in population
 * @param k Sample size
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qhyper(
  p: number,
  m: number,
  n: number,
  k: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qhyper(p, m, n, k, lowerTail, logP);
}

/**
 * Hypergeometric distribution random number generator
 * @param m Number of success items in population
 * @param n Number of failure items in population
 * @param k Sample size
 * @returns Random value from hypergeometric distribution
 */
export function rhyper(
  m: number,
  n: number,
  k: number,
): number {
  return wasm_rhyper(m, n, k);
}
