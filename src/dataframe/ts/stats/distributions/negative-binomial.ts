import {
  wasm_dnbinom,
  wasm_pnbinom,
  wasm_qnbinom,
  wasm_rnbinom,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               NEGATIVE BINOMIAL DISTRIBUTION
// ===============================================================================

/**
 * Negative binomial distribution probability mass function
 * @param at - Point where PMF is evaluated
 * @param numberOfSuccesses - Number of successes (r, must be positive)
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob < 1)
 * @param returnLog - If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export function dnbinom({
  at,
  numberOfSuccesses,
  probabilityOfSuccess,
  returnLog = false,
}: {
  at: number;
  numberOfSuccesses: number;
  probabilityOfSuccess: number;
  returnLog?: boolean;
}): number {
  return wasm_dnbinom(at, numberOfSuccesses, probabilityOfSuccess, returnLog);
}

/**
 * Negative binomial distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param numberOfSuccesses - Number of successes (r, must be positive)
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob < 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pnbinom({
  at,
  numberOfSuccesses,
  probabilityOfSuccess,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  numberOfSuccesses: number;
  probabilityOfSuccess: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pnbinom(
    at,
    numberOfSuccesses,
    probabilityOfSuccess,
    lowerTail,
    returnLog,
  );
}

/**
 * Negative binomial distribution quantile function
 * @param probability - Probability value (0..1)
 * @param numberOfSuccesses - Number of successes (r, must be positive)
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob < 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qnbinom({
  probability,
  numberOfSuccesses,
  probabilityOfSuccess,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  numberOfSuccesses: number;
  probabilityOfSuccess: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qnbinom(
    probability,
    numberOfSuccesses,
    probabilityOfSuccess,
    lowerTail,
    probabilityIsLog,
  );
}

/**
 * Negative binomial distribution random number generation
 * @param numberOfSuccesses - Number of successes (r, must be positive)
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob < 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the negative binomial distribution (integers)
 */
export function rnbinom({
  numberOfSuccesses,
  probabilityOfSuccess,
}: {
  numberOfSuccesses: number;
  probabilityOfSuccess: number;
}): number;
export function rnbinom({
  numberOfSuccesses,
  probabilityOfSuccess,
  sampleSize,
}: {
  numberOfSuccesses: number;
  probabilityOfSuccess: number;
  sampleSize: number;
}): number[];
export function rnbinom({
  numberOfSuccesses,
  probabilityOfSuccess,
  sampleSize = 1,
}: {
  numberOfSuccesses: number;
  probabilityOfSuccess: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rnbinom(numberOfSuccesses, probabilityOfSuccess);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rnbinom(numberOfSuccesses, probabilityOfSuccess));
  }
  return results;
}
