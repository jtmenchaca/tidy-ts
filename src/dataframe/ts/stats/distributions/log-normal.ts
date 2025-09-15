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
 * @param at - Point where density is evaluated
 * @param meanLog - Mean of the underlying normal distribution (default: 0)
 * @param standardDeviationLog - Standard deviation of the underlying normal distribution (default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dlnorm({
  at,
  meanLog = 0,
  standardDeviationLog = 1,
  returnLog = false,
}: {
  at: number;
  meanLog?: number;
  standardDeviationLog?: number;
  returnLog?: boolean;
}): number {
  return wasm_dlnorm(at, meanLog, standardDeviationLog, returnLog);
}

/**
 * Log-normal distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param meanLog - Mean of the underlying normal distribution (default: 0)
 * @param standardDeviationLog - Standard deviation of the underlying normal distribution (default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function plnorm({
  at,
  meanLog = 0,
  standardDeviationLog = 1,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  meanLog?: number;
  standardDeviationLog?: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_plnorm(at, meanLog, standardDeviationLog, lowerTail, returnLog);
}

/**
 * Log-normal distribution quantile function
 * @param probability - Probability value (0..1)
 * @param meanLog - Mean of the underlying normal distribution (default: 0)
 * @param standardDeviationLog - Standard deviation of the underlying normal distribution (default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qlnorm({
  probability,
  meanLog = 0,
  standardDeviationLog = 1,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  meanLog?: number;
  standardDeviationLog?: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qlnorm(
    probability,
    meanLog,
    standardDeviationLog,
    lowerTail,
    probabilityIsLog,
  );
}

/**
 * Log-normal distribution random number generation
 * @param meanLog - Mean of the underlying normal distribution (default: 0)
 * @param standardDeviationLog - Standard deviation of the underlying normal distribution (default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the log-normal distribution
 */
export function rlnorm(): number;
export function rlnorm({
  meanLog,
  standardDeviationLog,
  sampleSize,
}: {
  meanLog?: number;
  standardDeviationLog?: number;
  sampleSize: number;
}): number[];
export function rlnorm({
  meanLog = 0,
  standardDeviationLog = 1,
  sampleSize = 1,
}: {
  meanLog?: number;
  standardDeviationLog?: number;
  sampleSize?: number;
} = {}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rlnorm(meanLog, standardDeviationLog);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rlnorm(meanLog, standardDeviationLog));
  }
  return results;
}
