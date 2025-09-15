import { wasm_dt, wasm_pt, wasm_qt, wasm_rt } from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                            STUDENT'S T DISTRIBUTION
// ===============================================================================

/**
 * Student's t distribution density function
 * @param x Value at which to evaluate density
 * @param df Degrees of freedom (> 0)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dt(
  x: number,
  df: number,
  giveLog: boolean = false,
): number {
  return wasm_dt(x, df, giveLog);
}

/**
 * Student's t distribution cumulative distribution function
 * @param q Quantile value
 * @param df Degrees of freedom (> 0)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pt(
  q: number,
  df: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pt(q, df, lowerTail, logP);
}

/**
 * Student's t distribution quantile function
 * @param p Probability
 * @param df Degrees of freedom (> 0)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qt(
  p: number,
  df: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qt(p, df, lowerTail, logP);
}

/**
 * Student's t distribution random number generator
 * @param df Degrees of freedom (> 0)
 * @returns Random value from t distribution
 */
export function rt(
  df: number,
): number {
  return wasm_rt(df);
}
