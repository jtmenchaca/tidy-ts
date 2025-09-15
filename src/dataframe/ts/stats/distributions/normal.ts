import {
  wasm_dnorm,
  wasm_pnorm,
  wasm_qnorm,
  wasm_rnorm,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                              NORMAL DISTRIBUTION
// ===============================================================================

/**
 * Normal distribution density function
 * @param at - Point where density is evaluated
 * @param mean - Mean of the distribution (default: 0)
 * @param standardDeviation - Standard deviation (default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dnorm({
  at,
  mean = 0,
  standardDeviation = 1,
  returnLog = false,
}: {
  at: number;
  mean?: number;
  standardDeviation?: number;
  returnLog?: boolean;
}): number {
  return wasm_dnorm(at, mean, standardDeviation, returnLog);
}

/**
 * Normal distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param mean - Mean of the distribution (default: 0)
 * @param standardDeviation - Standard deviation (default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pnorm({
  at,
  mean = 0,
  standardDeviation = 1,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  mean?: number;
  standardDeviation?: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pnorm(at, mean, standardDeviation, lowerTail, returnLog);
}

/**
 * Normal distribution quantile function
 * @param probability - Probability value (0..1)
 * @param mean - Mean of the distribution (default: 0)
 * @param standardDeviation - Standard deviation (default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qnorm({
  probability,
  mean = 0,
  standardDeviation = 1,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  mean?: number;
  standardDeviation?: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qnorm(
    probability,
    mean,
    standardDeviation,
    lowerTail,
    probabilityIsLog,
  );
}

/**
 * Normal distribution random number generation
 * @param mean - Mean of the distribution (default: 0)
 * @param standardDeviation - Standard deviation (default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the normal distribution
 */
export function rnorm(): number;
export function rnorm({
  mean,
  standardDeviation,
  sampleSize,
}: {
  mean?: number;
  standardDeviation?: number;
  sampleSize?: number;
}): number;
export function rnorm({
  mean,
  standardDeviation,
  sampleSize,
}: {
  mean?: number;
  standardDeviation?: number;
  sampleSize: number;
}): number[];
export function rnorm({
  mean = 0,
  standardDeviation = 1,
  sampleSize = 1,
}: {
  mean?: number;
  standardDeviation?: number;
  sampleSize?: number;
} = {}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rnorm(mean, standardDeviation);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rnorm(mean, standardDeviation));
  }
  return results;
}
