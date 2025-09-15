import {
  wasm_dbinom,
  wasm_pbinom,
  wasm_qbinom,
  wasm_rbinom,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                             BINOMIAL DISTRIBUTION
// ===============================================================================

/**
 * Binomial distribution probability mass function
 * @param x Number of successes
 * @param size Number of trials
 * @param prob Probability of success
 * @param giveLog If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export function dbinom(
  x: number,
  size: number,
  prob: number,
  giveLog: boolean = false,
): number {
  return wasm_dbinom(x, size, prob, giveLog);
}

/**
 * Binomial distribution cumulative distribution function
 * @param q Quantile value (number of successes)
 * @param size Number of trials
 * @param prob Probability of success
 * @param lowerTail If true, return P(X ≤ q), otherwise P(X > q) (default: true)
 * @param logP If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pbinom(
  q: number,
  size: number,
  prob: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_pbinom(q, size, prob, lowerTail, logP);
}

/**
 * Binomial distribution quantile function
 * @param p Probability
 * @param size Number of trials
 * @param prob Probability of success
 * @param lowerTail If true, p is P(X ≤ x), otherwise P(X > x) (default: true)
 * @param logP If true, p is log probability (default: false)
 * @returns Quantile value
 */
export function qbinom(
  p: number,
  size: number,
  prob: number,
  lowerTail: boolean = true,
  logP: boolean = false,
): number {
  return wasm_qbinom(p, size, prob, lowerTail, logP);
}

/**
 * Binomial distribution random number generator
 * @param size Number of trials
 * @param prob Probability of success
 * @returns Random value from binomial distribution
 */
export function rbinom(
  size: number,
  prob: number,
): number {
  return wasm_rbinom(size, prob);
}
