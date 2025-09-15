/**
 * Kruskal-Wallis test implementation
 * Non-parametric alternative to one-way ANOVA
 */

import {
  kruskal_wallis_test_wasm,
  type TestResult,
} from "../../wasm/wasm-loader.ts";

/** Kruskal-Wallis test specific result with only relevant fields */
export type KruskalWallisTestResult = Pick<
  TestResult,
  | "test_type"
  | "test_statistic"
  | "p_value"
  | "confidence_interval_lower"
  | "confidence_interval_upper"
  | "confidence_level"
  | "effect_size"
  | "degrees_of_freedom"
  | "sample_size"
  | "sample_means"
  | "sample_std_devs"
  | "ranks"
  | "tie_correction"
  | "error_message"
>;

/**
 * Perform Kruskal-Wallis test using Rust WASM implementation
 * @param groups Array of groups, each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns Test result with statistic, p-value, and degrees of freedom
 */
export function kruskalWallisTest(
  groups: number[][],
  alpha: number = 0.05,
): KruskalWallisTestResult {
  // Validate input
  if (groups.length < 2) {
    throw new Error("Need at least 2 groups for Kruskal-Wallis test");
  }

  // Remove any empty groups
  const nonEmptyGroups = groups.filter((g) => g.length > 0);
  if (nonEmptyGroups.length < 2) {
    throw new Error("Need at least 2 non-empty groups");
  }

  // Combine all observations and track group sizes
  const combined: number[] = [];
  const groupSizes: number[] = [];

  for (const group of nonEmptyGroups) {
    combined.push(...group);
    groupSizes.push(group.length);
  }

  if (combined.length < 2) {
    throw new Error("Not enough observations");
  }

  // Call Rust WASM implementation
  return kruskal_wallis_test_wasm(
    new Float64Array(combined),
    new Uint32Array(groupSizes),
    alpha,
  ) as KruskalWallisTestResult;
}

/**
 * Alternative interface that accepts data and group labels
 */
export function kruskalWallisTestByGroup(
  data: number[],
  groups: (string | number)[],
  alpha: number = 0.05,
): KruskalWallisTestResult {
  if (data.length !== groups.length) {
    throw new Error("Data and groups must have the same length");
  }

  // Group data by labels
  const groupMap = new Map<string | number, number[]>();

  for (let i = 0; i < data.length; i++) {
    const group = groups[i];
    if (!groupMap.has(group)) {
      groupMap.set(group, []);
    }
    groupMap.get(group)!.push(data[i]);
  }

  // Convert to array of groups
  const groupArrays = Array.from(groupMap.values());

  return kruskalWallisTest(groupArrays, alpha);
}
