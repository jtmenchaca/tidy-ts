import { wasm_dt, wasm_pt, wasm_qt, wasm_rt } from "../../wasm/wasm-loader.ts";
import type { DataFrame } from "../../dataframe/index.ts";
import { createDistributionData } from "./data-helper.ts";

// ===============================================================================
//                            STUDENT'S T DISTRIBUTION
// ===============================================================================

/**
 * Student's t distribution density function
 * @param at - Point where density is evaluated
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dt({
  at,
  degreesOfFreedom,
  returnLog = false,
}: {
  at: number;
  degreesOfFreedom: number;
  returnLog?: boolean;
}): number {
  return wasm_dt(at, degreesOfFreedom, returnLog);
}

/**
 * Student's t distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pt({
  at,
  degreesOfFreedom,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  degreesOfFreedom: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pt(at, degreesOfFreedom, lowerTail, returnLog);
}

/**
 * Student's t distribution quantile function
 * @param probability - Probability value (0..1)
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qt({
  probability,
  degreesOfFreedom,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  degreesOfFreedom: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qt(probability, degreesOfFreedom, lowerTail, probabilityIsLog);
}

/**
 * Student's t distribution random number generation
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the t distribution
 */
export function rt({
  degreesOfFreedom,
}: {
  degreesOfFreedom: number;
}): number;
export function rt({
  degreesOfFreedom,
  sampleSize,
}: {
  degreesOfFreedom: number;
  sampleSize: number;
}): number[];
export function rt({
  degreesOfFreedom,
  sampleSize = 1,
}: {
  degreesOfFreedom: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rt(degreesOfFreedom);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rt(degreesOfFreedom));
  }
  return results;
}

/**
 * Generate data for t-distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export function tData({
  degreesOfFreedom,
  type,
  range,
  points,
}: {
  degreesOfFreedom: number;
  type: "pdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; density: number }>;
export function tData({
  degreesOfFreedom,
  type,
  range,
  points,
}: {
  degreesOfFreedom: number;
  type: "cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; probability: number }>;
export function tData({
  degreesOfFreedom,
  type,
  range,
  points,
}: {
  degreesOfFreedom: number;
  type: "inverse_cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ probability: number; quantile: number }>;
export function tData({
  degreesOfFreedom,
  type,
  range,
  points = 100,
}: {
  degreesOfFreedom: number;
  type: "pdf" | "cdf" | "inverse_cdf";
  range?: [number, number];
  points?: number;
}) {
  if (type === "pdf") {
    return createDistributionData({
      distribution: {
        density: dt,
        probability: pt,
        quantile: qt,
      },
      params: { degreesOfFreedom },
      type: "pdf",
      config: { range, points },
    });
  } else if (type === "cdf") {
    return createDistributionData({
      distribution: {
        density: dt,
        probability: pt,
        quantile: qt,
      },
      params: { degreesOfFreedom },
      type: "cdf",
      config: { range, points },
    });
  } else {
    return createDistributionData({
      distribution: {
        density: dt,
        probability: pt,
        quantile: qt,
      },
      params: { degreesOfFreedom },
      type: "inverse_cdf",
      config: { range, points },
    });
  }
}
