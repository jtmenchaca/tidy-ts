import {
  wasm_dgamma,
  wasm_pgamma,
  wasm_qgamma,
  wasm_rgamma,
} from "../../wasm/wasm-loader.ts";
import type { DataFrame } from "../../dataframe/index.ts";
import { createDistributionData } from "./data-helper.ts";

// ===============================================================================
//                               GAMMA DISTRIBUTION
// ===============================================================================

/**
 * Gamma distribution density function
 * @param at - Point where density is evaluated
 * @param shape - Shape parameter (α > 0)
 * @param rate - Rate parameter (β > 0, default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dgamma({
  at,
  shape,
  rate = 1,
  returnLog = false,
}: {
  at: number;
  shape: number;
  rate?: number;
  returnLog?: boolean;
}): number {
  return wasm_dgamma(at, shape, rate, returnLog);
}

/**
 * Gamma distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param shape - Shape parameter (α > 0)
 * @param rate - Rate parameter (β > 0, default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pgamma({
  at,
  shape,
  rate = 1,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  shape: number;
  rate?: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pgamma(at, shape, rate, lowerTail, returnLog);
}

/**
 * Gamma distribution quantile function
 * @param probability - Probability value (0..1)
 * @param shape - Shape parameter (α > 0)
 * @param rate - Rate parameter (β > 0, default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qgamma({
  probability,
  shape,
  rate = 1,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  shape: number;
  rate?: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qgamma(probability, shape, rate, lowerTail, probabilityIsLog);
}

/**
 * Gamma distribution random number generation
 * @param shape - Shape parameter (α > 0)
 * @param rate - Rate parameter (β > 0, default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the gamma distribution
 */
export function rgamma({
  shape,
  rate,
}: {
  shape: number;
  rate?: number;
}): number;
export function rgamma({
  shape,
  rate,
  sampleSize,
}: {
  shape: number;
  rate?: number;
  sampleSize: number;
}): number[];
export function rgamma({
  shape,
  rate = 1,
  sampleSize = 1,
}: {
  shape: number;
  rate?: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rgamma(shape, rate);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rgamma(shape, rate));
  }
  return results;
}

/**
 * Generate data for Gamma distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export function gammaData({
  shape,
  rate,
  type,
  range,
  points,
}: {
  shape: number;
  rate: number;
  type: "pdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; density: number }>;
export function gammaData({
  shape,
  rate,
  type,
  range,
  points,
}: {
  shape: number;
  rate: number;
  type: "cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; probability: number }>;
export function gammaData({
  shape,
  rate,
  type,
  range,
  points,
}: {
  shape: number;
  rate: number;
  type: "inverse_cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ probability: number; quantile: number }>;
export function gammaData({
  shape,
  rate,
  type,
  range,
  points = 100,
}: {
  shape: number;
  rate: number;
  type: "pdf" | "cdf" | "inverse_cdf";
  range?: [number, number];
  points?: number;
}) {
  if (type === "pdf") {
    return createDistributionData({
      distribution: {
        density: dgamma,
        probability: pgamma,
        quantile: qgamma,
      },
      params: { shape, rate },
      type: "pdf",
      config: { range, points },
    });
  } else if (type === "cdf") {
    return createDistributionData({
      distribution: {
        density: dgamma,
        probability: pgamma,
        quantile: qgamma,
      },
      params: { shape, rate },
      type: "cdf",
      config: { range, points },
    });
  } else {
    return createDistributionData({
      distribution: {
        density: dgamma,
        probability: pgamma,
        quantile: qgamma,
      },
      params: { shape, rate },
      type: "inverse_cdf",
      config: { range, points },
    });
  }
}
