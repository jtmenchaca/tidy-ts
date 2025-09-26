import { tTestIndependent } from "../../t-tests.ts";
import { mannWhitneyTest } from "../../mann-whitney.ts";
import type {
  MannWhitneyTestResult,
  TwoSampleTTestResult,
} from "../../../../../lib/tidy_ts_dataframe.d.ts";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../../helpers.ts";
import {
  cleanNumeric,
  hasEqualVariances,
  hasManyTies,
  normalityOK,
  residuals_twoSample,
  smallSample2,
} from "../helpers.ts";

/**
 * Compare the central tendencies of two independent groups.
 *
 * Tests whether two groups differ in their central tendency using either
 * parametric (t-test) or non-parametric (Mann-Whitney U) methods.
 *
 * Assumptions:
 * - Samples are independent and randomly drawn
 * - For parametric: Data in each group is approximately normally distributed
 * - For parametric: Automatically detects equal/unequal variances using the Brown-Forsythe modification of Levene's test (unless `assumeEqualVariances` is provided)
 * - For non-parametric: Tests stochastic dominance (whether one distribution tends to have larger values)
 *   Note: Only tests medians specifically when distributions have the same shape
 * - Auto mode: Defaults to t-test; switches to Mann-Whitney only if both groups show clear non-normality (p < 0.05)
 *
 * @param x - First group's values
 * @param y - Second group's values
 * @param parametric - Use t-test (true), Mann-Whitney U test (false), or "auto" (default: "auto")
 * @param assumeEqualVariances - Assume equal variances for t-test (optional: if not provided, uses Brown-Forsythe Levene test to auto-detect)
 * @param alternative - Direction of the test ("two-sided", "less", "greater"), where "greater" means x > y
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with statistic, p-value, and effect size
 */
export function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  alternative,
  alpha,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric: "parametric";
  assumeEqualVariances?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleTTestResult;

export function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  alternative,
  alpha,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric: "nonparametric";
  assumeEqualVariances?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): MannWhitneyTestResult;

export function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  alternative,
  alpha,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric?: "parametric" | "nonparametric" | "auto";
  assumeEqualVariances?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleTTestResult | MannWhitneyTestResult;

export function centralTendencyToEachOther({
  x,
  y,
  parametric = "auto",
  assumeEqualVariances,
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
  parametric?: "parametric" | "nonparametric" | "auto";
  assumeEqualVariances?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleTTestResult | MannWhitneyTestResult {
  // Convert data to regular arrays and filter out null/undefined/infinite values
  const cleanX = cleanNumeric(x);
  const cleanY = cleanNumeric(y);

  // ============================================================================
  // DECISION TREE: Two Groups Central Tendency (Evidence-Based Approach)
  // ============================================================================
  // IF parametric == "auto":
  //   (rx, ry) = residuals_twoSample(x, y)
  //   nmin = min(length(x), length(y))
  //   IF nmin > N_MODERATE_MAX:
  //     equalVar = (assumeEqualVariances provided) ? assumeEqualVariances
  //                                                : hasEqualVariances([x, y], α=ALPHA)
  //     RETURN tTest_independent(x, y, equalVariances=equalVar)
  //   nonNormal = (!normalityOK(rx)) OR (!normalityOK(ry))
  //   IF nonNormal:
  //     IF nmin >= 20: RETURN yuenT_twoSample(x, y, trim=TRIM_PROP)
  //     ELSE:          RETURN mannWhitney(x, y)
  //   equalVar = (assumeEqualVariances provided) ? assumeEqualVariances
  //                                              : hasEqualVariances([x, y], α=ALPHA)
  //   RETURN tTest_independent(x, y, equalVariances=equalVar)
  // ============================================================================

  const nmin = Math.min(cleanX.length, cleanY.length);

  // Determine whether to use parametric test
  let useParametric: boolean;
  if (parametric === "auto") {
    // For large samples (nmin > N_MODERATE_MAX), default to parametric regardless of normality
    if (nmin > 300) { // N_MODERATE_MAX
      useParametric = true;
    } else {
      // For smaller samples, test normality on residuals from each group's mean
      const { rx, ry } = residuals_twoSample(cleanX, cleanY);
      const nonNormal = !normalityOK(rx) || !normalityOK(ry);

      // Use parametric unless both groups show clear non-normality
      useParametric = !nonNormal;
    }
  } else {
    useParametric = parametric === "parametric";
  }

  if (useParametric) {
    // Determine variance equality
    const equalVar = assumeEqualVariances !== undefined
      ? assumeEqualVariances
      : hasEqualVariances([cleanX, cleanY], 0.05);

    // Use independent samples t-test for parametric data
    return tTestIndependent({
      x: cleanX,
      y: cleanY,
      equalVar,
      alternative,
      alpha,
    });
  } else {
    // Use Mann-Whitney U test for non-parametric data
    // Use exact test for small samples without ties
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
  }
}
