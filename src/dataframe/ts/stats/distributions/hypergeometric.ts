import {
  wasm_dhyper,
  wasm_phyper,
  wasm_qhyper,
  wasm_rhyper,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               HYPERGEOMETRIC DISTRIBUTION
// ===============================================================================

/**
 * Hypergeometric distribution probability mass function
 * @param at - Point where PMF is evaluated (successes in sample)
 * @param populationSuccesses - Number of success items in population (m)
 * @param populationFailures - Number of failure items in population (n)
 * @param drawSize - Sample size (k)
 * @param returnLog - If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export function dhyper({
  at,
  populationSuccesses,
  populationFailures,
  drawSize,
  returnLog = false,
}: {
  at: number;
  populationSuccesses: number;
  populationFailures: number;
  drawSize: number;
  returnLog?: boolean;
}): number {
  return wasm_dhyper(
    at,
    populationSuccesses,
    populationFailures,
    drawSize,
    returnLog,
  );
}

/**
 * Hypergeometric distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param populationSuccesses - Number of success items in population (m)
 * @param populationFailures - Number of failure items in population (n)
 * @param drawSize - Sample size (k)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function phyper({
  at,
  populationSuccesses,
  populationFailures,
  drawSize,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  populationSuccesses: number;
  populationFailures: number;
  drawSize: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_phyper(
    at,
    populationSuccesses,
    populationFailures,
    drawSize,
    lowerTail,
    returnLog,
  );
}

/**
 * Hypergeometric distribution quantile function
 * @param probability - Probability value (0..1)
 * @param populationSuccesses - Number of success items in population (m)
 * @param populationFailures - Number of failure items in population (n)
 * @param drawSize - Sample size (k)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qhyper({
  probability,
  populationSuccesses,
  populationFailures,
  drawSize,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  populationSuccesses: number;
  populationFailures: number;
  drawSize: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qhyper(
    probability,
    populationSuccesses,
    populationFailures,
    drawSize,
    lowerTail,
    probabilityIsLog,
  );
}

/**
 * Hypergeometric distribution random number generation
 * @param populationSuccesses - Number of success items in population (m)
 * @param populationFailures - Number of failure items in population (n)
 * @param drawSize - Sample size (k)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the hypergeometric distribution (integers)
 */
export function rhyper({
  populationSuccesses,
  populationFailures,
  drawSize,
}: {
  populationSuccesses: number;
  populationFailures: number;
  drawSize: number;
}): number;
export function rhyper({
  populationSuccesses,
  populationFailures,
  drawSize,
  sampleSize,
}: {
  populationSuccesses: number;
  populationFailures: number;
  drawSize: number;
  sampleSize: number;
}): number[];
export function rhyper({
  populationSuccesses,
  populationFailures,
  drawSize,
  sampleSize = 1,
}: {
  populationSuccesses: number;
  populationFailures: number;
  drawSize: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rhyper(populationSuccesses, populationFailures, drawSize);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(
      wasm_rhyper(populationSuccesses, populationFailures, drawSize),
    );
  }
  return results;
}
