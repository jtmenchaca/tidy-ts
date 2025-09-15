import {
  wasm_dexp,
  wasm_pexp,
  wasm_qexp,
  wasm_rexp,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                            EXPONENTIAL DISTRIBUTION
// ===============================================================================

/**
 * Exponential distribution density function
 * @param x Value at which to evaluate density
 * @param rate Rate parameter (λ > 0, default: 1)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dexp(
  x: number,
  rate: number = 1,
  giveLog: boolean = false,
): number {
  return wasm_dexp(x, rate, giveLog);
}

/**
 * Exponential distribution cumulative distribution function
 * @param q Quantile value
 * @param rate Rate parameter (λ > 0, default: 1)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pexp(
  q: number,
  rate: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pexp(q, rate, lowerTail, logP);
}

/**
 * Exponential distribution quantile function
 * @param p Probability
 * @param rate Rate parameter (λ > 0, default: 1)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qexp(
  p: number,
  rate: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qexp(p, rate, lowerTail, logP);
}

/**
 * Exponential distribution random number generator
 * @param rate Rate parameter (λ > 0, default: 1)
 * @returns Random value from exponential distribution
 */
export function rexp(
  rate: number = 1,
): number {
  return wasm_rexp(rate);
}
