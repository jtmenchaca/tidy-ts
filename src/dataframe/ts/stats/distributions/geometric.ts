import {
  wasm_dgeom,
  wasm_pgeom,
  wasm_qgeom,
  wasm_rgeom,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               GEOMETRIC DISTRIBUTION
// ===============================================================================

/**
 * Geometric distribution probability mass function
 * @param at - Point where PMF is evaluated
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob ≤ 1)
 * @param returnLog - If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export function dgeom({
  at,
  probabilityOfSuccess,
  returnLog = false,
}: {
  at: number;
  probabilityOfSuccess: number;
  returnLog?: boolean;
}): number {
  return wasm_dgeom(at, probabilityOfSuccess, returnLog);
}

/**
 * Geometric distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob ≤ 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pgeom({
  at,
  probabilityOfSuccess,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  probabilityOfSuccess: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pgeom(at, probabilityOfSuccess, lowerTail, returnLog);
}

/**
 * Geometric distribution quantile function
 * @param probability - Probability value (0..1)
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob ≤ 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qgeom({
  probability,
  probabilityOfSuccess,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  probabilityOfSuccess: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qgeom(
    probability,
    probabilityOfSuccess,
    lowerTail,
    probabilityIsLog,
  );
}

/**
 * Geometric distribution random number generation
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob ≤ 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the geometric distribution (integers)
 */
export function rgeom({
  probabilityOfSuccess,
}: {
  probabilityOfSuccess: number;
}): number;
export function rgeom({
  probabilityOfSuccess,
  sampleSize,
}: {
  probabilityOfSuccess: number;
  sampleSize: number;
}): number[];
export function rgeom({
  probabilityOfSuccess,
  sampleSize = 1,
}: {
  probabilityOfSuccess: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rgeom(probabilityOfSuccess);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rgeom(probabilityOfSuccess));
  }
  return results;
}
