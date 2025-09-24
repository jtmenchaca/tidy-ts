import {
  wasm_dpois,
  wasm_ppois,
  wasm_qpois,
  wasm_rpois,
} from "../../wasm/wasm-loader.ts";
import type { DataFrame } from "../../dataframe/index.ts";
import { createDistributionData } from "./data-helper.ts";

// ===============================================================================
//                              POISSON DISTRIBUTION
// ===============================================================================

/**
 * Poisson distribution probability mass function
 * @param at - Point where PMF is evaluated (count k)
 * @param rateLambda - Rate parameter (λ > 0)
 * @param returnLog - If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export function dpois({
  at,
  rateLambda,
  returnLog = false,
}: {
  at: number;
  rateLambda: number;
  returnLog?: boolean;
}): number {
  return wasm_dpois(at, rateLambda, returnLog);
}

/**
 * Poisson distribution cumulative distribution function
 * @param at - Point where CDF is evaluated (count k)
 * @param rateLambda - Rate parameter (λ > 0)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function ppois({
  at,
  rateLambda,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  rateLambda: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_ppois(at, rateLambda, lowerTail, returnLog);
}

/**
 * Poisson distribution quantile function
 * @param probability - Probability value (0..1)
 * @param rateLambda - Rate parameter (λ > 0)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qpois({
  probability,
  rateLambda,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  rateLambda: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qpois(probability, rateLambda, lowerTail, probabilityIsLog);
}

/**
 * Poisson distribution random number generation
 * @param rateLambda - Rate parameter (λ > 0)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the Poisson distribution (integers)
 */
export function rpois({
  rateLambda,
}: {
  rateLambda: number;
}): number;
export function rpois({
  rateLambda,
  sampleSize,
}: {
  rateLambda: number;
  sampleSize: number;
}): number[];
export function rpois({
  rateLambda,
  sampleSize = 1,
}: {
  rateLambda: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rpois(rateLambda);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rpois(rateLambda));
  }
  return results;
}

/**
 * Generate data for Poisson distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export function poissonData({
  rateLambda,
  type,
  range,
  points,
}: {
  rateLambda: number;
  type: "pdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; density: number }>;
export function poissonData({
  rateLambda,
  type,
  range,
  points,
}: {
  rateLambda: number;
  type: "cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; probability: number }>;
export function poissonData({
  rateLambda,
  type,
  range,
  points,
}: {
  rateLambda: number;
  type: "inverse_cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ probability: number; quantile: number }>;
export function poissonData({
  rateLambda,
  type,
  range,
  points = 100,
}: {
  rateLambda: number;
  type: "pdf" | "cdf" | "inverse_cdf";
  range?: [number, number];
  points?: number;
}) {
  if (type === "pdf") {
    return createDistributionData({
      distribution: {
        density: dpois,
        probability: ppois,
        quantile: qpois,
      },
      params: { rateLambda },
      type: "pdf",
      config: { range, points },
    });
  } else if (type === "cdf") {
    return createDistributionData({
      distribution: {
        density: dpois,
        probability: ppois,
        quantile: qpois,
      },
      params: { rateLambda },
      type: "cdf",
      config: { range, points },
    });
  } else {
    return createDistributionData({
      distribution: {
        density: dpois,
        probability: ppois,
        quantile: qpois,
      },
      params: { rateLambda },
      type: "inverse_cdf",
      config: { range, points },
    });
  }
}
