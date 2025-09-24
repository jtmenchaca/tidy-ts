import {
  wasm_dbinom,
  wasm_pbinom,
  wasm_qbinom,
  wasm_rbinom,
} from "../../wasm/wasm-loader.ts";
import type { DataFrame } from "../../dataframe/index.ts";
import { createDistributionData } from "./data-helper.ts";

// ===============================================================================
//                             BINOMIAL DISTRIBUTION
// ===============================================================================

/**
 * Binomial distribution probability mass function
 * @param at - Point where PMF is evaluated (number of successes)
 * @param trials - Number of trials
 * @param probabilityOfSuccess - Probability of success
 * @param returnLog - If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export function dbinom({
  at,
  trials,
  probabilityOfSuccess,
  returnLog = false,
}: {
  at: number;
  trials: number;
  probabilityOfSuccess: number;
  returnLog?: boolean;
}): number {
  return wasm_dbinom(at, trials, probabilityOfSuccess, returnLog);
}

/**
 * Binomial distribution cumulative distribution function
 * @param at - Point where CDF is evaluated (number of successes)
 * @param trials - Number of trials
 * @param probabilityOfSuccess - Probability of success
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pbinom({
  at,
  trials,
  probabilityOfSuccess,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  trials: number;
  probabilityOfSuccess: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pbinom(at, trials, probabilityOfSuccess, lowerTail, returnLog);
}

/**
 * Binomial distribution quantile function
 * @param probability - Probability value (0..1)
 * @param trials - Number of trials
 * @param probabilityOfSuccess - Probability of success
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qbinom({
  probability,
  trials,
  probabilityOfSuccess,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  trials: number;
  probabilityOfSuccess: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qbinom(
    probability,
    trials,
    probabilityOfSuccess,
    lowerTail,
    probabilityIsLog,
  );
}

/**
 * Binomial distribution random number generation
 * @param trials - Number of trials
 * @param probabilityOfSuccess - Probability of success
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the binomial distribution (integers)
 */
export function rbinom({
  trials,
  probabilityOfSuccess,
}: {
  trials: number;
  probabilityOfSuccess: number;
}): number;
export function rbinom({
  trials,
  probabilityOfSuccess,
  sampleSize,
}: {
  trials: number;
  probabilityOfSuccess: number;
  sampleSize: number;
}): number[];
export function rbinom({
  trials,
  probabilityOfSuccess,
  sampleSize = 1,
}: {
  trials: number;
  probabilityOfSuccess: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rbinom(trials, probabilityOfSuccess);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rbinom(trials, probabilityOfSuccess));
  }
  return results;
}

/**
 * Generate data for Binomial distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export function binomialData({
  trials,
  probabilityOfSuccess,
  type,
  range,
  points,
}: {
  trials: number;
  probabilityOfSuccess: number;
  type: "pdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; density: number }>;
export function binomialData({
  trials,
  probabilityOfSuccess,
  type,
  range,
  points,
}: {
  trials: number;
  probabilityOfSuccess: number;
  type: "cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; probability: number }>;
export function binomialData({
  trials,
  probabilityOfSuccess,
  type,
  range,
  points,
}: {
  trials: number;
  probabilityOfSuccess: number;
  type: "inverse_cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ probability: number; quantile: number }>;
export function binomialData({
  trials,
  probabilityOfSuccess,
  type,
  range,
  points = 100,
}: {
  trials: number;
  probabilityOfSuccess: number;
  type: "pdf" | "cdf" | "inverse_cdf";
  range?: [number, number];
  points?: number;
}) {
  if (type === "pdf") {
    return createDistributionData({
      distribution: {
        density: dbinom,
        probability: pbinom,
        quantile: qbinom,
      },
      params: { trials, probabilityOfSuccess },
      type: "pdf",
      config: { range, points },
    });
  } else if (type === "cdf") {
    return createDistributionData({
      distribution: {
        density: dbinom,
        probability: pbinom,
        quantile: qbinom,
      },
      params: { trials, probabilityOfSuccess },
      type: "cdf",
      config: { range, points },
    });
  } else {
    return createDistributionData({
      distribution: {
        density: dbinom,
        probability: pbinom,
        quantile: qbinom,
      },
      params: { trials, probabilityOfSuccess },
      type: "inverse_cdf",
      config: { range, points },
    });
  }
}
