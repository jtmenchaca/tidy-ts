import {
  wasm_dlnorm,
  wasm_plnorm,
  wasm_qlnorm,
  wasm_rlnorm,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               LOG-NORMAL DISTRIBUTION
// ===============================================================================

/**
 * Log-normal distribution density function
 * @param x Value at which to evaluate density
 * @param meanlog Mean of the underlying normal distribution (default: 0)
 * @param sdlog Standard deviation of the underlying normal distribution (default: 1)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dlnorm(
  x: number,
  meanlog: number = 0,
  sdlog: number = 1,
  giveLog: boolean = false,
): number {
  return wasm_dlnorm(x, meanlog, sdlog, giveLog);
}

/**
 * Log-normal distribution cumulative distribution function
 * @param q Quantile value
 * @param meanlog Mean of the underlying normal distribution (default: 0)
 * @param sdlog Standard deviation of the underlying normal distribution (default: 1)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function plnorm(
  q: number,
  meanlog: number = 0,
  sdlog: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_plnorm(q, meanlog, sdlog, lowerTail, logP);
}

/**
 * Log-normal distribution quantile function
 * @param p Probability
 * @param meanlog Mean of the underlying normal distribution (default: 0)
 * @param sdlog Standard deviation of the underlying normal distribution (default: 1)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qlnorm(
  p: number,
  meanlog: number = 0,
  sdlog: number = 1,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qlnorm(p, meanlog, sdlog, lowerTail, logP);
}

/**
 * Log-normal distribution random number generator
 * @param meanlog Mean of the underlying normal distribution (default: 0)
 * @param sdlog Standard deviation of the underlying normal distribution (default: 1)
 * @returns Random value from log-normal distribution
 */
export function rlnorm(
  meanlog: number = 0,
  sdlog: number = 1,
): number {
  return wasm_rlnorm(meanlog, sdlog);
}
