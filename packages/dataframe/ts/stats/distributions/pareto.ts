import type { DataFrame } from "../../dataframe/index.ts";
import { createDistributionData } from "./data-helper.ts";

// ===============================================================================
//                               PARETO DISTRIBUTION
// ===============================================================================

/**
 * Pareto distribution density function
 * @param at - Point where density is evaluated
 * @param scale - Scale parameter (xm > 0) - minimum possible value
 * @param shape - Shape parameter (α > 0)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export function dpareto({
  at,
  scale,
  shape,
  returnLog = false,
}: {
  at: number;
  scale: number;
  shape: number;
  returnLog?: boolean;
}): number {
  if (scale <= 0 || shape <= 0) {
    return NaN;
  }

  if (at < scale) {
    return returnLog ? -Infinity : 0;
  }

  // f(x) = (α * xm^α) / x^(α+1)
  // log(f(x)) = log(α) + α*log(xm) - (α+1)*log(x)
  const logDensity = Math.log(shape) + shape * Math.log(scale) -
    (shape + 1) * Math.log(at);

  return returnLog ? logDensity : Math.exp(logDensity);
}

/**
 * Pareto distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param scale - Scale parameter (xm > 0)
 * @param shape - Shape parameter (α > 0)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function ppareto({
  at,
  scale,
  shape,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  scale: number;
  shape: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  if (scale <= 0 || shape <= 0) {
    return NaN;
  }

  if (at < scale) {
    const p = direction === "below" ? 0 : 1;
    return returnLog ? Math.log(p) : p;
  }

  // F(x) = 1 - (xm/x)^α
  // S(x) = (xm/x)^α  (survival function, i.e., above)
  const lowerTail = direction === "below";
  const logSurvival = shape * (Math.log(scale) - Math.log(at)); // log((xm/x)^α)

  if (!lowerTail) {
    // P(X > at) = (xm/at)^α
    return returnLog ? logSurvival : Math.exp(logSurvival);
  } else {
    // P(X <= at) = 1 - (xm/at)^α
    const survival = Math.exp(logSurvival);
    const p = 1 - survival;
    return returnLog ? Math.log(p) : p;
  }
}

/**
 * Pareto distribution quantile function
 * @param probability - Probability value (0..1)
 * @param scale - Scale parameter (xm > 0)
 * @param shape - Shape parameter (α > 0)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qpareto({
  probability,
  scale,
  shape,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  scale: number;
  shape: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  if (scale <= 0 || shape <= 0) {
    return NaN;
  }

  const p = probabilityIsLog ? Math.exp(probability) : probability;

  if (p < 0 || p > 1) {
    return NaN;
  }

  // If direction is "above", then p is P(X > x) = (xm/x)^α
  // If direction is "below", then p is P(X <= x) = 1 - (xm/x)^α -> 1-p = (xm/x)^α

  const lowerTail = direction === "below";
  const tailProb = lowerTail ? 1 - p : p;

  // tailProb = (xm/x)^α
  // log(tailProb) = α * (log(xm) - log(x))
  // log(tailProb)/α = log(xm) - log(x)
  // log(x) = log(xm) - log(tailProb)/α
  // x = xm * tailProb^(-1/α)

  // Avoid numerical issues with 1-p when p is close to 1 by using tail probability directly if possible
  // but here we just use standard formula.

  if (tailProb === 0) return Infinity;
  if (tailProb === 1) return scale;

  return scale * Math.pow(tailProb, -1 / shape);
}

/**
 * Pareto distribution random number generation
 * @param scale - Scale parameter (xm > 0)
 * @param shape - Shape parameter (α > 0)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the pareto distribution
 */
export function rpareto({
  scale,
  shape,
}: {
  scale: number;
  shape: number;
}): number;
export function rpareto({
  scale,
  shape,
  sampleSize,
}: {
  scale: number;
  shape: number;
  sampleSize: number;
}): number[];
export function rpareto({
  scale,
  shape,
  sampleSize = 1,
}: {
  scale: number;
  shape: number;
  sampleSize?: number;
}): number | number[] {
  const generateOne = () => {
    // Inverse transform sampling:
    // U ~ Uniform(0,1)
    // X = xm / (1-U)^(1/α)  or more simply X = xm / U^(1/α) since U and 1-U are both Uniform(0,1)
    const u = Math.random();
    return scale / Math.pow(u, 1 / shape);
  };

  if (sampleSize === 1) {
    return generateOne();
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(generateOne());
  }
  return results;
}

/**
 * Generate data for Pareto distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export function paretoData({
  scale,
  shape,
  type,
  range,
  points,
}: {
  scale: number;
  shape: number;
  type: "pdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; density: number }>;
export function paretoData({
  scale,
  shape,
  type,
  range,
  points,
}: {
  scale: number;
  shape: number;
  type: "cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; probability: number }>;
export function paretoData({
  scale,
  shape,
  type,
  range,
  points,
}: {
  scale: number;
  shape: number;
  type: "inverse_cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ probability: number; quantile: number }>;
export function paretoData({
  scale,
  shape,
  type,
  range,
  points = 100,
}: {
  scale: number;
  shape: number;
  type: "pdf" | "cdf" | "inverse_cdf";
  range?: [number, number];
  points?: number;
}) {
  const defaultRange: [number, number] = [
    scale,
    scale + 3 * (scale / (shape - 1)),
  ]; // Heuristic for range if mean exists

  if (type === "pdf") {
    return createDistributionData({
      distribution: {
        density: dpareto,
        probability: ppareto,
        quantile: qpareto,
      },
      params: { scale, shape },
      type: "pdf",
      config: { range: range ?? defaultRange, points },
    });
  } else if (type === "cdf") {
    return createDistributionData({
      distribution: {
        density: dpareto,
        probability: ppareto,
        quantile: qpareto,
      },
      params: { scale, shape },
      type: "cdf",
      config: { range: range ?? defaultRange, points },
    });
  } else {
    return createDistributionData({
      distribution: {
        density: dpareto,
        probability: ppareto,
        quantile: qpareto,
      },
      params: { scale, shape },
      type: "inverse_cdf",
      config: { range, points },
    });
  }
}
