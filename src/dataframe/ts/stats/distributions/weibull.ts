import {
  wasm_dweibull,
  wasm_pweibull,
  wasm_qweibull,
  wasm_rweibull,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               WEIBULL DISTRIBUTION
// ===============================================================================

/**
 * Weibull distribution density function
 * @param x Value at which to evaluate density
 * @param shape Shape parameter (k > 0)
 * @param scale Scale parameter (λ > 0)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dweibull(
  x: number,
  shape: number,
  scale: number = 1,
  giveLog: boolean = false,
): number {
  return wasm_dweibull(x, shape, scale, giveLog);
}

/**
 * Weibull distribution cumulative distribution function
 * @param q Quantile value
 * @param shape Shape parameter (k > 0)
 * @param scale Scale parameter (λ > 0)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pweibull(
  q: number,
  shape: number,
  scale: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pweibull(q, shape, scale, lowerTail, logP);
}

/**
 * Weibull distribution quantile function
 * @param p Probability
 * @param shape Shape parameter (k > 0)
 * @param scale Scale parameter (λ > 0)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qweibull(
  p: number,
  shape: number,
  scale: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qweibull(p, shape, scale, lowerTail, logP);
}

/**
 * Weibull distribution random number generator
 * @param shape Shape parameter (k > 0)
 * @param scale Scale parameter (λ > 0, default: 1)
 * @returns Random value from Weibull distribution
 */
export function rweibull(
  shape: number,
  scale: number = 1,
): number {
  return wasm_rweibull(shape, scale);
}
