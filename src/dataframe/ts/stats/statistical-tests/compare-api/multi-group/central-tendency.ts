import {
  anovaOneWay,
  twoWayAnovaFactorA,
  twoWayAnovaFactorB,
  twoWayAnovaInteraction,
  welchAnovaOneWay,
} from "../../anova.ts";
import { kruskalWallisTest } from "../../kruskal-wallis.ts";
import { cleanNumeric, hasEqualVariances, isNonNormal } from "../helpers.ts";
import { dunnTest, gamesHowellTest, tukeyHSD } from "../../post-hoc/index.ts";
import type {
  DunnTestResult,
  GamesHowellTestResult,
  KruskalWallisTestResult,
  OneWayAnovaTestResult,
  TukeyHsdTestResult,
  WelchAnovaTestResult,
} from "../../../../../lib/tidy_ts_dataframe.d.ts";

// Extended result types that include post-hoc tests
export interface OneWayAnovaWithPostHocResult extends OneWayAnovaTestResult {
  post_hoc?: TukeyHsdTestResult | GamesHowellTestResult | DunnTestResult;
}

export interface WelchAnovaWithPostHocResult extends WelchAnovaTestResult {
  post_hoc?: TukeyHsdTestResult | GamesHowellTestResult | DunnTestResult;
}

export interface KruskalWallisWithPostHocResult
  extends KruskalWallisTestResult {
  post_hoc?: TukeyHsdTestResult | GamesHowellTestResult | DunnTestResult;
}

/**
 * Automatically runs appropriate post-hoc test based on the main test result
 */
function runPostHocTest(
  testType: "anova" | "welch_anova" | "kruskal_wallis",
  groups: number[][],
  mainResult:
    | OneWayAnovaTestResult
    | WelchAnovaTestResult
    | KruskalWallisTestResult,
  alpha: number,
): TukeyHsdTestResult | GamesHowellTestResult | DunnTestResult | undefined {
  // Only run post-hoc if main test is significant and we have 3+ groups
  if (groups.length < 3 || (mainResult.p_value || 1) >= alpha) {
    return undefined;
  }

  try {
    switch (testType) {
      case "anova":
        return tukeyHSD(groups, alpha);
      case "welch_anova":
        return gamesHowellTest(groups, alpha);
      case "kruskal_wallis":
        return dunnTest(groups, alpha);
      default:
        return undefined;
    }
  } catch (error) {
    // If post-hoc fails, return undefined rather than breaking the main result
    console.warn(`Post-hoc test failed: ${error}`);
    return undefined;
  }
}

/**
 * Compare central tendencies across three or more independent groups.
 *
 * Tests whether the means (ANOVA) or medians (Kruskal-Wallis) differ
 * significantly among multiple groups.
 *
 * Assumptions:
 * - Groups are independent
 * - For ANOVA: Data in each group is approximately normally distributed
 * - For ANOVA: Automatically detects equal/unequal variances using Levene's test (unless `assumeEqualVariances` is provided)
 * - For Kruskal-Wallis: Data is continuous or ordinal
 * - Null hypothesis: All groups have the same central tendency
 *
 * @param groups - Array of arrays, each containing values for one group
 * @param parametric - Use ANOVA (true) or Kruskal-Wallis (false)
 * @param alpha - Significance level (default: 0.05)
 * @param assumeEqualVariances - Assume equal variances for ANOVA (optional: if not provided, uses Levene's test to auto-detect)
 * @returns Test statistic (F or H), p-value, degrees of freedom, and effect size
 */
export function centralTendencyToEachOther({
  groups,
  parametric,
  alpha,
  assumeEqualVariances,
}: {
  groups: number[][];
  parametric: "parametric";
  alpha?: number;
  assumeEqualVariances?: boolean;
}): OneWayAnovaWithPostHocResult;

// Two-way ANOVA overloads
export function centralTendencyToEachOther({
  data,
  parametric,
  alpha,
  design,
  testType,
}: {
  data: number[][][];
  parametric: "parametric";
  design: "two-way";
  testType: "factorA";
  alpha?: number;
}): OneWayAnovaWithPostHocResult;

export function centralTendencyToEachOther({
  data,
  parametric,
  alpha,
  design,
  testType,
}: {
  data: number[][][];
  parametric: "parametric";
  design: "two-way";
  testType: "factorB";
  alpha?: number;
}): OneWayAnovaWithPostHocResult;

export function centralTendencyToEachOther({
  data,
  parametric,
  alpha,
  design,
  testType,
}: {
  data: number[][][];
  parametric: "parametric";
  design: "two-way";
  testType: "interaction";
  alpha?: number;
}): OneWayAnovaWithPostHocResult;

export function centralTendencyToEachOther({
  groups,
  parametric,
  alpha,
}: {
  groups: number[][];
  parametric: "nonparametric";
  alpha?: number;
}): KruskalWallisWithPostHocResult;

export function centralTendencyToEachOther({
  groups,
  parametric,
  alpha,
  assumeEqualVariances,
}: {
  groups: number[][];
  parametric?: "parametric" | "nonparametric" | "auto";
  alpha?: number;
  assumeEqualVariances?: boolean;
}): OneWayAnovaWithPostHocResult | KruskalWallisWithPostHocResult;

export function centralTendencyToEachOther({
  groups,
  data,
  parametric = "parametric",
  alpha = 0.05,
  design,
  testType,
  assumeEqualVariances,
}: {
  groups?: number[][];
  data?: number[][][];
  parametric?: "parametric" | "nonparametric" | "auto";
  alpha?: number;
  design?: "one-way" | "two-way";
  testType?: "factorA" | "factorB" | "interaction";
  assumeEqualVariances?: boolean;
}):
  | OneWayAnovaWithPostHocResult
  | WelchAnovaWithPostHocResult
  | KruskalWallisWithPostHocResult {
  // Handle two-way ANOVA
  if (design === "two-way" && data) {
    if (parametric !== "parametric") {
      throw new Error("Two-way ANOVA requires parametric=true");
    }

    switch (testType) {
      case "factorA":
        return twoWayAnovaFactorA({ data, alpha });
      case "factorB":
        return twoWayAnovaFactorB({ data, alpha });
      case "interaction":
        return twoWayAnovaInteraction({ data, alpha });
      default:
        throw new Error(
          "testType must be 'factorA', 'factorB', or 'interaction' for two-way ANOVA",
        );
    }
  }

  // Handle one-way ANOVA or Kruskal-Wallis
  if (!groups) {
    throw new Error("groups parameter is required for one-way analysis");
  }

  // Determine variance equality if not explicitly specified
  let equalVariances: boolean;
  if (assumeEqualVariances === undefined && parametric !== "nonparametric") {
    // Use simple variance ratio to determine variance equality
    equalVariances = hasEqualVariances(groups);
  } else {
    // Use the provided value or default to true for nonparametric
    equalVariances = assumeEqualVariances ?? true;
  }

  if (parametric === "parametric") {
    // Use one-way ANOVA or Welch ANOVA for parametric data
    if (equalVariances) {
      const result = anovaOneWay(groups, alpha);
      const postHoc = runPostHocTest("anova", groups, result, alpha);
      return Object.assign(result, {
        post_hoc: postHoc,
      }) as OneWayAnovaWithPostHocResult;
    } else {
      const result = welchAnovaOneWay(groups, alpha);
      const postHoc = runPostHocTest("welch_anova", groups, result, alpha);
      // Result is already serialized by welchAnovaOneWay, so it's safe to assign
      return Object.assign(result, {
        post_hoc: postHoc,
      }) as WelchAnovaWithPostHocResult;
    }
  } else if (parametric === "nonparametric") {
    // Use Kruskal-Wallis test for non-parametric data
    const result = kruskalWallisTest(groups, alpha);
    const postHoc = runPostHocTest("kruskal_wallis", groups, result, alpha);
    return Object.assign(result, {
      post_hoc: postHoc,
    }) as KruskalWallisWithPostHocResult;
  } else if (parametric === "auto") {
    // Test normality in each group and decide
    const cleanGroups = groups.map((g) => cleanNumeric(g));
    const anyNonNormal = cleanGroups.some((group) => isNonNormal(group, 0.05));

    if (anyNonNormal) {
      const result = kruskalWallisTest(groups, alpha);
      const postHoc = runPostHocTest("kruskal_wallis", groups, result, alpha);
      return Object.assign(result, {
        post_hoc: postHoc,
      }) as KruskalWallisWithPostHocResult;
    } else {
      // Use ANOVA or Welch ANOVA based on variance assumption
      if (equalVariances) {
        const result = anovaOneWay(groups, alpha);
        const postHoc = runPostHocTest("anova", groups, result, alpha);
        return Object.assign(result, {
          post_hoc: postHoc,
        }) as OneWayAnovaWithPostHocResult;
      } else {
        const result = welchAnovaOneWay(groups, alpha);
        const postHoc = runPostHocTest("welch_anova", groups, result, alpha);
        return {
          ...result,
          post_hoc: postHoc,
        } as WelchAnovaWithPostHocResult;
      }
    }
  } else {
    // Default to parametric for backwards compatibility
    if (equalVariances ?? true) { // Default to equal variances if not determined
      const result = anovaOneWay(groups, alpha);
      const postHoc = runPostHocTest("anova", groups, result, alpha);
      return Object.assign(result, {
        post_hoc: postHoc,
      }) as OneWayAnovaWithPostHocResult;
    } else {
      const result = welchAnovaOneWay(groups, alpha);
      const postHoc = runPostHocTest("welch_anova", groups, result, alpha);
      // Result is already serialized by welchAnovaOneWay, so it's safe to assign
      return Object.assign(result, {
        post_hoc: postHoc,
      }) as WelchAnovaWithPostHocResult;
    }
  }
}
