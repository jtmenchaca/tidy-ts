import {
  wasm_dweibull,
  wasm_pweibull,
  wasm_qweibull,
  wasm_rweibull,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               WEIBULL DISTRIBUTION
// ===============================================================================

/**
 * Weibull distribution density function
 * @param at - Point where density is evaluated
 * @param shape - Shape parameter (k > 0)
 * @param scale - Scale parameter (λ > 0, default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dweibull({
  at,
  shape,
  scale = 1,
  returnLog = false,
}: {
  at: number;
  shape: number;
  scale?: number;
  returnLog?: boolean;
}): number {
  return wasm_dweibull(at, shape, scale, returnLog);
}

/**
 * Weibull distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param shape - Shape parameter (k > 0)
 * @param scale - Scale parameter (λ > 0, default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pweibull({
  at,
  shape,
  scale = 1,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  shape: number;
  scale?: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pweibull(at, shape, scale, lowerTail, returnLog);
}

/**
 * Weibull distribution quantile function
 * @param probability - Probability value (0..1)
 * @param shape - Shape parameter (k > 0)
 * @param scale - Scale parameter (λ > 0, default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qweibull({
  probability,
  shape,
  scale = 1,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  shape: number;
  scale?: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qweibull(probability, shape, scale, lowerTail, probabilityIsLog);
}

/**
 * Weibull distribution random number generation
 * @param shape - Shape parameter (k > 0)
 * @param scale - Scale parameter (λ > 0, default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the Weibull distribution
 */
export function rweibull({
  shape,
  scale,
}: {
  shape: number;
  scale?: number;
}): number;
export function rweibull({
  shape,
  scale,
  sampleSize,
}: {
  shape: number;
  scale?: number;
  sampleSize: number;
}): number[];
export function rweibull({
  shape,
  scale = 1,
  sampleSize = 1,
}: {
  shape: number;
  scale?: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rweibull(shape, scale);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rweibull(shape, scale));
  }
  return results;
}
