/**
 * Kruskal-Wallis test implementation
 * Non-parametric alternative to one-way ANOVA
 */

import { kruskal_wallis_test_wasm, serializeTestResult } from "../../wasm/statistical-tests.ts";
import type { KruskalWallisTestResult } from "../../../lib/tidy_ts_dataframe.internal.js";
export type { KruskalWallisTestResult } from "../../../lib/tidy_ts_dataframe.internal.js";

/**
 * Perform Kruskal-Wallis test using Rust WASM implementation
 * @param groups Array of groups, each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns Test result with statistic, p-value, and degrees of freedom
 */
export function kruskalWallisTest(
  groups: number[][],
  alpha = 0.05,
): KruskalWallisTestResult {
  // Validate input
  if (groups.length < 2) {
    throw new Error("Need at least 2 groups for Kruskal-Wallis test");
  }

  // Clean groups: filter out NaN/infinite values
  const cleanGroups = groups.map(group => 
    group.filter(v => typeof v === "number" && Number.isFinite(v))
  );
  
  // Remove any empty groups after cleaning
  const nonEmptyGroups = cleanGroups.filter((g) => g.length > 0);
  if (nonEmptyGroups.length < 2) {
    throw new Error("Need at least 2 non-empty groups with valid values");
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
  const result = kruskal_wallis_test_wasm(
    new Float64Array(combined),
    new Uint32Array(groupSizes),
    alpha,
  );
  return serializeTestResult(result) as KruskalWallisTestResult;
}


/**
 * Alternative interface that accepts data and group labels
 */
export function kruskalWallisTestByGroup({
  data,
  groups,
  alpha = 0.05,
}: {
  data: number[];
  groups: (string | number)[];
  alpha?: number;
}): KruskalWallisTestResult {
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
