import { wasm_df, wasm_pf, wasm_qf, wasm_rf } from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                               F DISTRIBUTION
// ===============================================================================

/**
 * F distribution density function
 * @param at - Point where density is evaluated
 * @param numeratorDegreesOfFreedom - Numerator degrees of freedom (> 0)
 * @param denominatorDegreesOfFreedom - Denominator degrees of freedom (> 0)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export function df({
  at,
  numeratorDegreesOfFreedom,
  denominatorDegreesOfFreedom,
  returnLog = false,
}: {
  at: number;
  numeratorDegreesOfFreedom: number;
  denominatorDegreesOfFreedom: number;
  returnLog?: boolean;
}): number {
  return wasm_df(
    at,
    numeratorDegreesOfFreedom,
    denominatorDegreesOfFreedom,
    returnLog,
  );
}

/**
 * F distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param numeratorDegreesOfFreedom - Numerator degrees of freedom (> 0)
 * @param denominatorDegreesOfFreedom - Denominator degrees of freedom (> 0)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export function pf({
  at,
  numeratorDegreesOfFreedom,
  denominatorDegreesOfFreedom,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  numeratorDegreesOfFreedom: number;
  denominatorDegreesOfFreedom: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pf(
    at,
    numeratorDegreesOfFreedom,
    denominatorDegreesOfFreedom,
    lowerTail,
    returnLog,
  );
}

/**
 * F distribution quantile function
 * @param probability - Probability value (0..1)
 * @param numeratorDegreesOfFreedom - Numerator degrees of freedom (> 0)
 * @param denominatorDegreesOfFreedom - Denominator degrees of freedom (> 0)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export function qf({
  probability,
  numeratorDegreesOfFreedom,
  denominatorDegreesOfFreedom,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  numeratorDegreesOfFreedom: number;
  denominatorDegreesOfFreedom: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qf(
    probability,
    numeratorDegreesOfFreedom,
    denominatorDegreesOfFreedom,
    lowerTail,
    probabilityIsLog,
  );
}

/**
 * F distribution random number generation
 * @param numeratorDegreesOfFreedom - Numerator degrees of freedom (> 0)
 * @param denominatorDegreesOfFreedom - Denominator degrees of freedom (> 0)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the F distribution
 */
export function rf({
  numeratorDegreesOfFreedom,
  denominatorDegreesOfFreedom,
}: {
  numeratorDegreesOfFreedom: number;
  denominatorDegreesOfFreedom: number;
}): number;
export function rf({
  numeratorDegreesOfFreedom,
  denominatorDegreesOfFreedom,
  sampleSize,
}: {
  numeratorDegreesOfFreedom: number;
  denominatorDegreesOfFreedom: number;
  sampleSize: number;
}): number[];
export function rf({
  numeratorDegreesOfFreedom,
  denominatorDegreesOfFreedom,
  sampleSize = 1,
}: {
  numeratorDegreesOfFreedom: number;
  denominatorDegreesOfFreedom: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) {
    return wasm_rf(numeratorDegreesOfFreedom, denominatorDegreesOfFreedom);
  }

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(
      wasm_rf(numeratorDegreesOfFreedom, denominatorDegreesOfFreedom),
    );
  }
  return results;
}
