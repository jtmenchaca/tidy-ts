import {
  wasm_dunif,
  wasm_punif,
  wasm_qunif,
  wasm_runif,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               UNIFORM DISTRIBUTION
// ===============================================================================

/**
 * Uniform distribution density function
 * @param at - Point where density is evaluated
 * @param minimum - Lower bound (default: 0)
 * @param maximum - Upper bound (default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dunif({
  at,
  minimum = 0,
  maximum = 1,
  returnLog = false,
}: {
  at: number;
  minimum?: number;
  maximum?: number;
  returnLog?: boolean;
}): number {
  return wasm_dunif(at, minimum, maximum, returnLog);
}

/**
 * Uniform distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param minimum - Lower bound (default: 0)
 * @param maximum - Upper bound (default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function punif({
  at,
  minimum = 0,
  maximum = 1,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  minimum?: number;
  maximum?: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_punif(at, minimum, maximum, lowerTail, returnLog);
}

/**
 * Uniform distribution quantile function
 * @param probability - Probability value (0..1)
 * @param minimum - Lower bound (default: 0)
 * @param maximum - Upper bound (default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qunif({
  probability,
  minimum = 0,
  maximum = 1,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  minimum?: number;
  maximum?: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qunif(probability, minimum, maximum, lowerTail, probabilityIsLog);
}

/**
 * Uniform distribution random number generation
 * @param minimum - Lower bound (default: 0)
 * @param maximum - Upper bound (default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the uniform distribution
 */
export function runif(): number;
export function runif({
  minimum,
  maximum,
  sampleSize,
}: {
  minimum?: number;
  maximum?: number;
  sampleSize: number;
}): number[];
export function runif({
  minimum = 0,
  maximum = 1,
  sampleSize = 1,
}: {
  minimum?: number;
  maximum?: number;
  sampleSize?: number;
} = {}): number | number[] {
  if (sampleSize === 1) {
    return wasm_runif(minimum, maximum);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_runif(minimum, maximum));
  }
  return results;
}
