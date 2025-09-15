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
 * Negative binomial distribution density function
 * @param x Number of failures
 * @param r Number of successes (must be positive)
 * @param prob Probability of success on each trial (0 < prob < 1)
 * @param giveLog If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dnbinom(
  x: number,
  r: number,
  prob: number,
  giveLog: boolean = false,
): number {
  return wasm_dnbinom(x, r, prob, giveLog);
}

/**
 * Negative binomial distribution cumulative distribution function
 * @param q Quantile value
 * @param r Number of successes (must be positive)
 * @param prob Probability of success on each trial (0 < prob < 1)
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pnbinom(
  q: number,
  r: number,
  prob: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pnbinom(q, r, prob, lowerTail, logP);
}

/**
 * Negative binomial distribution quantile function
 * @param p Probability
 * @param r Number of successes (must be positive)
 * @param prob Probability of success on each trial (0 < prob < 1)
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qnbinom(
  p: number,
  r: number,
  prob: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qnbinom(p, r, prob, lowerTail, logP);
}

/**
 * Negative binomial distribution random number generator
 * @param r Number of successes (must be positive)
 * @param prob Probability of success on each trial (0 < prob < 1)
 * @returns Random value from negative binomial distribution
 */
export function rnbinom(
  r: number,
  prob: number,
): number {
  return wasm_rnbinom(r, prob);
}
