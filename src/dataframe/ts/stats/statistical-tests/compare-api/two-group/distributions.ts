import { kolmogorovSmirnovTest } from "../../kolmogorov-smirnov.ts";
import { mannWhitneyTest } from "../../mann-whitney.ts";
import type {
  KolmogorovSmirnovTestResult,
  MannWhitneyTestResult,
} from "../../../../../lib/tidy_ts_dataframe.d.ts";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../../helpers.ts";
import { cleanNumeric, hasManyTies, smallSample2 } from "../helpers.ts";

/**
 * Compare the distributions of two independent groups.
 *
 * Can test either:
 * - Kolmogorov-Smirnov: Tests if two samples come from the same distribution (any difference)
 * - Mann-Whitney U: Tests if one distribution tends to be larger (stochastic dominance)
 *
 * @param x - First group's values
 * @param y - Second group's values
 * @param method - Test method: "ks" (distribution equality), "mann-whitney" (stochastic dominance), or "auto" (defaults to KS)
 * @param alternative - Direction of the test ("two-sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @returns Test result with appropriate statistic and properties
 */
export function distributionsToEachOther({
  x,
  y,
  method,
  alternative,
  alpha,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  method?: "auto" | "ks" | "mann-whitney";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): MannWhitneyTestResult | KolmogorovSmirnovTestResult;

export function distributionsToEachOther({
  x,
  y,
  method,
  alternative,
  alpha,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  method: "ks";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): KolmogorovSmirnovTestResult;

export function distributionsToEachOther({
  x,
  y,
  method,
  alternative,
  alpha,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  method: "mann-whitney";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): MannWhitneyTestResult;

export function distributionsToEachOther({
  x,
  y,
  method = "auto",
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  method?: "auto" | "ks" | "mann-whitney";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): MannWhitneyTestResult | KolmogorovSmirnovTestResult {
  // Convert data to regular arrays and filter out null/undefined/infinite values
  const cleanX = cleanNumeric(x);
  const cleanY = cleanNumeric(y);

  // ============================================================================
  // DECISION TREE: Two Groups Distributions to Each Other
  // ============================================================================
  // Decision logic from pseudocode:
  // 1. Auto mode: Choose best test based on sample size and what you want to test
  //    - For true distribution equality: Kolmogorov-Smirnov test
  //    - For stochastic dominance: Mann-Whitney U test
  // 2. KS test: Tests if two samples come from the same distribution (any difference)
  // 3. Mann-Whitney: Tests if one distribution tends to be larger (stochastic dominance)
  // ============================================================================

  if (method === "ks") {
    // Use Kolmogorov-Smirnov test for true distribution equality
    return kolmogorovSmirnovTest({
      x: cleanX,
      y: cleanY,
      alternative,
      alpha,
    });
  } else if (method === "mann-whitney") {
    // Use Mann-Whitney for stochastic dominance
    const useExact = smallSample2(cleanX, cleanY) &&
      !hasManyTies(cleanX, cleanY);
    return mannWhitneyTest({
      x: cleanX,
      y: cleanY,
      exact: useExact,
      continuityCorrection: true,
      alternative,
      alpha,
    });
  } else {
    // Auto mode: choose the most appropriate test
    // KS test is better for testing true distribution equality
    // Mann-Whitney is better for testing stochastic dominance/rank differences
    // Default to KS test since "distributions to each other" implies testing if they're the same
    return kolmogorovSmirnovTest({
      x: cleanX,
      y: cleanY,
      alternative,
      alpha,
    });
  }
}
