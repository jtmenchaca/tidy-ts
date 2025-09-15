import {
  wasm_dbeta,
  wasm_pbeta,
  wasm_qbeta,
  wasm_rbeta,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               BETA DISTRIBUTION
// ===============================================================================

/**
 * Beta distribution density function
 * @param at - Point where density is evaluated
 * @param alpha - First shape parameter (α > 0)
 * @param beta - Second shape parameter (β > 0)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dbeta({
  at,
  alpha,
  beta,
  returnLog = false,
}: {
  at: number;
  alpha: number;
  beta: number;
  returnLog?: boolean;
}): number {
  return wasm_dbeta(at, alpha, beta, returnLog);
}

/**
 * Beta distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param alpha - First shape parameter (α > 0)
 * @param beta - Second shape parameter (β > 0)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pbeta({
  at,
  alpha,
  beta,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  alpha: number;
  beta: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pbeta(at, alpha, beta, lowerTail, returnLog);
}

/**
 * Beta distribution quantile function
 * @param probability - Probability value (0..1)
 * @param alpha - First shape parameter (α > 0)
 * @param beta - Second shape parameter (β > 0)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qbeta({
  probability,
  alpha,
  beta,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  alpha: number;
  beta: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qbeta(probability, alpha, beta, lowerTail, probabilityIsLog);
}

/**
 * Beta distribution random number generation
 * @param alpha - First shape parameter (α > 0)
 * @param beta - Second shape parameter (β > 0)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the beta distribution
 */
export function rbeta({
  alpha,
  beta,
}: {
  alpha: number;
  beta: number;
}): number;
export function rbeta({
  alpha,
  beta,
  sampleSize,
}: {
  alpha: number;
  beta: number;
  sampleSize: number;
}): number[];
export function rbeta({
  alpha,
  beta,
  sampleSize = 1,
}: {
  alpha: number;
  beta: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rbeta(alpha, beta);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rbeta(alpha, beta));
  }
  return results;
}
