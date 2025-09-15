import {
  wasm_dunif,
  wasm_punif,
  wasm_qunif,
  wasm_runif,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               UNIFORM DISTRIBUTION
// ===============================================================================

/**
 * Uniform distribution density function
 * @param x Value at which to evaluate density
 * @param min Lower bound (default: 0)
 * @param max Upper bound (default: 1)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dunif(
  x: number,
  min: number = 0,
  max: number = 1,
  giveLog: boolean = false,
): number {
  return wasm_dunif(x, min, max, giveLog);
}

/**
 * Uniform distribution cumulative distribution function
 * @param q Quantile value
 * @param min Lower bound (default: 0)
 * @param max Upper bound (default: 1)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function punif(
  q: number,
  min: number = 0,
  max: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_punif(q, min, max, lowerTail, logP);
}

/**
 * Uniform distribution quantile function
 * @param p Probability
 * @param min Lower bound (default: 0)
 * @param max Upper bound (default: 1)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qunif(
  p: number,
  min: number = 0,
  max: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qunif(p, min, max, lowerTail, logP);
}

/**
 * Uniform distribution random number generator
 * @param min Lower bound (default: 0)
 * @param max Upper bound (default: 1)
 * @returns Random value from uniform distribution
 */
export function runif(
  min: number = 0,
  max: number = 1,
): number {
  return wasm_runif(min, max);
}
