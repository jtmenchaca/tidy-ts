import type { DunnTestResult, GamesHowellTestResult, KruskalWallisTestResult, OneWayAnovaTestResult, TukeyHsdTestResult, TwoWayAnovaTestResult, WelchAnovaTestResult } from "../../types.ts";
import type { PrettifyDeep } from "../../../../dataframe/types/utility-types.ts";
export interface OneWayAnovaWithPostHocResult extends OneWayAnovaTestResult {
    post_hoc?: TukeyHsdTestResult | GamesHowellTestResult | DunnTestResult;
}
export interface WelchAnovaWithPostHocResult extends WelchAnovaTestResult {
    post_hoc?: TukeyHsdTestResult | GamesHowellTestResult | DunnTestResult;
}
export interface KruskalWallisWithPostHocResult extends KruskalWallisTestResult {
    post_hoc?: TukeyHsdTestResult | GamesHowellTestResult | DunnTestResult;
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
 * - For ANOVA: Automatically detects equal/unequal variances using the Brown-Forsythe modification of Levene's test (unless `assumeEqualVariances` is provided)
 * - For Kruskal-Wallis: Data is continuous or ordinal
 * - Post-hoc tests automatically correct for multiple comparisons (Tukey HSD, Games-Howell, or Dunn's with Bonferroni)
 * - Null hypothesis: All groups have the same central tendency
 *
 * @param groups - Array of arrays, each containing values for one group
 * @param parametric - Use ANOVA (true) or Kruskal-Wallis (false)
 * @param alpha - Significance level (default: 0.05)
 * @param assumeEqualVariances - Assume equal variances for ANOVA (optional: if not provided, uses Brown-Forsythe Levene test to auto-detect)
 * @returns Test statistic (F or H), p-value, degrees of freedom, effect size, and post-hoc comparisons (if significant)
 */
export declare function centralTendencyToEachOther({ groups, parametric, alpha, assumeEqualVariances, }: {
    groups: number[][];
    parametric: "parametric";
    alpha?: number;
    assumeEqualVariances?: boolean;
}): PrettifyDeep<OneWayAnovaWithPostHocResult>;
export declare function centralTendencyToEachOther({ data, parametric, alpha, design, }: {
    data: number[][][];
    parametric: "parametric";
    design: "two-way";
    alpha?: number;
}): PrettifyDeep<TwoWayAnovaTestResult>;
export declare function centralTendencyToEachOther({ groups, parametric, alpha, }: {
    groups: number[][];
    parametric: "nonparametric";
    alpha?: number;
}): PrettifyDeep<KruskalWallisWithPostHocResult>;
export declare function centralTendencyToEachOther({ groups, parametric, alpha, assumeEqualVariances, }: {
    groups: number[][];
    parametric?: "parametric" | "nonparametric" | "auto";
    alpha?: number;
    assumeEqualVariances?: boolean;
}): PrettifyDeep<OneWayAnovaWithPostHocResult | KruskalWallisWithPostHocResult>;
