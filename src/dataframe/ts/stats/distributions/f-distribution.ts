import { wasm_df, wasm_pf, wasm_qf, wasm_rf } from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               F DISTRIBUTION
// ===============================================================================

/**
 * F distribution density function
 * @param x Value at which to evaluate density
 * @param df1 Numerator degrees of freedom (> 0)
 * @param df2 Denominator degrees of freedom (> 0)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function df_dist(
  x: number,
  df1: number,
  df2: number,
  giveLog: boolean = false,
): number {
  return wasm_df(x, df1, df2, giveLog);
}

/**
 * F distribution cumulative distribution function
 * @param q Quantile value
 * @param df1 Numerator degrees of freedom (> 0)
 * @param df2 Denominator degrees of freedom (> 0)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pf(
  q: number,
  df1: number,
  df2: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pf(q, df1, df2, lowerTail, logP);
}

/**
 * F distribution quantile function
 * @param p Probability
 * @param df1 Numerator degrees of freedom (> 0)
 * @param df2 Denominator degrees of freedom (> 0)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qf(
  p: number,
  df1: number,
  df2: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qf(p, df1, df2, lowerTail, logP);
}

/**
 * F distribution random number generator
 * @param df1 Numerator degrees of freedom (> 0)
 * @param df2 Denominator degrees of freedom (> 0)
 * @returns Random value from F distribution
 */
export function rf(
  df1: number,
  df2: number,
): number {
  return wasm_rf(df1, df2);
}
