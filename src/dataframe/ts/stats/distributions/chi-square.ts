import {
  wasm_dchisq,
  wasm_pchisq,
  wasm_qchisq,
  wasm_rchisq,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                            CHI-SQUARED DISTRIBUTION
// ===============================================================================

/**
 * Chi-squared distribution density function
 * @param x Value at which to evaluate density
 * @param df Degrees of freedom (> 0)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dchisq(
  x: number,
  df: number,
  giveLog: boolean = false,
): number {
  return wasm_dchisq(x, df, giveLog);
}

/**
 * Chi-squared distribution cumulative distribution function
 * @param q Quantile value
 * @param df Degrees of freedom (> 0)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pchisq(
  q: number,
  df: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pchisq(q, df, lowerTail, logP);
}

/**
 * Chi-squared distribution quantile function
 * @param p Probability
 * @param df Degrees of freedom (> 0)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qchisq(
  p: number,
  df: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qchisq(p, df, lowerTail, logP);
}

/**
 * Chi-squared distribution random number generator
 * @param df Degrees of freedom (> 0)
 * @returns Random value from chi-squared distribution
 */
export function rchisq(
  df: number,
): number {
  return wasm_rchisq(df);
}
