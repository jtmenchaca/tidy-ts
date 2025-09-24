import {
  wasm_dexp,
  wasm_pexp,
  wasm_qexp,
  wasm_rexp,
} from "../../wasm/wasm-loader.ts";
import type { DataFrame } from "../../dataframe/index.ts";
import { createDistributionData } from "./data-helper.ts";

// ===============================================================================
//                            EXPONENTIAL DISTRIBUTION
// ===============================================================================

/**
 * Exponential distribution density function
 * @param at - Point where density is evaluated
 * @param rate - Rate parameter (λ > 0, default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dexp({
  at,
  rate = 1,
  returnLog = false,
}: {
  at: number;
  rate?: number;
  returnLog?: boolean;
}): number {
  return wasm_dexp(at, rate, returnLog);
}

/**
 * Exponential distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param rate - Rate parameter (λ > 0, default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pexp({
  at,
  rate = 1,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  rate?: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pexp(at, rate, lowerTail, returnLog);
}

/**
 * Exponential distribution quantile function
 * @param probability - Probability value (0..1)
 * @param rate - Rate parameter (λ > 0, default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qexp({
  probability,
  rate = 1,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  rate?: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qexp(probability, rate, lowerTail, probabilityIsLog);
}

/**
 * Exponential distribution random number generation
 * @param rate - Rate parameter (λ > 0, default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the exponential distribution
 */
export function rexp(): number;
export function rexp({
  rate,
  sampleSize,
}: {
  rate?: number;
  sampleSize: number;
}): number[];
export function rexp({
  rate = 1,
  sampleSize = 1,
}: {
  rate?: number;
  sampleSize?: number;
} = {}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rexp(rate);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rexp(rate));
  }
  return results;
}

/**
 * Generate data for Exponential distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export function exponentialData({
  rate,
  type,
  range,
  points,
}: {
  rate: number;
  type: "pdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; density: number }>;
export function exponentialData({
  rate,
  type,
  range,
  points,
}: {
  rate: number;
  type: "cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; probability: number }>;
export function exponentialData({
  rate,
  type,
  range,
  points,
}: {
  rate: number;
  type: "inverse_cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ probability: number; quantile: number }>;
export function exponentialData({
  rate,
  type,
  range,
  points = 100,
}: {
  rate: number;
  type: "pdf" | "cdf" | "inverse_cdf";
  range?: [number, number];
  points?: number;
}) {
  if (type === "pdf") {
    return createDistributionData({
      distribution: {
        density: dexp,
        probability: pexp,
        quantile: qexp,
      },
      params: { rate },
      type: "pdf",
      config: { range, points },
    });
  } else if (type === "cdf") {
    return createDistributionData({
      distribution: {
        density: dexp,
        probability: pexp,
        quantile: qexp,
      },
      params: { rate },
      type: "cdf",
      config: { range, points },
    });
  } else {
    return createDistributionData({
      distribution: {
        density: dexp,
        probability: pexp,
        quantile: qexp,
      },
      params: { rate },
      type: "inverse_cdf",
      config: { range, points },
    });
  }
}
