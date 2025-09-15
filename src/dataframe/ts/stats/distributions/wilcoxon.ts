import {
  wasm_dwilcox,
  wasm_pwilcox,
  wasm_qwilcox,
  wasm_rwilcox,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               WILCOXON DISTRIBUTION
// ===============================================================================

/**
 * Wilcoxon rank-sum distribution density function
 * @param x Value at which to evaluate density (Wilcoxon rank-sum statistic)
 * @param m Size of first sample
 * @param n Size of second sample
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dwilcox(
  x: number,
  m: number,
  n: number,
  giveLog: boolean = false,
): number {
  return wasm_dwilcox(x, m, n, giveLog);
}

/**
 * Wilcoxon rank-sum distribution cumulative distribution function
 * @param q Quantile value
 * @param m Size of first sample
 * @param n Size of second sample
 * @param lowerTail If true, return P(W ≤ q), otherwise P(W > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pwilcox(
  q: number,
  m: number,
  n: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pwilcox(q, m, n, lowerTail, logP);
}

/**
 * Wilcoxon rank-sum distribution quantile function
 * @param p Probability
 * @param m Size of first sample
 * @param n Size of second sample
 * @param lowerTail If true, p is P(W ≤ x), otherwise P(W > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qwilcox(
  p: number,
  m: number,
  n: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qwilcox(p, m, n, lowerTail, logP);
}

/**
 * Wilcoxon rank-sum distribution random number generator
 * @param m Size of first sample
 * @param n Size of second sample
 * @returns Random value from Wilcoxon rank-sum distribution
 */
export function rwilcox(
  m: number,
  n: number,
): number {
  return wasm_rwilcox(m, n);
}
