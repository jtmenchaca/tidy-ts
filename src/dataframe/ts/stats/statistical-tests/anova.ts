import {
  anova_one_way_wasm,
  anova_two_way_factor_a_wasm,
  anova_two_way_factor_b_wasm,
  anova_two_way_interaction_wasm,
  anova_two_way_wasm,
  serializeTestResult,
  welch_anova_wasm,
} from "../../wasm/statistical-tests.ts";

import type {
  OneWayAnovaTestResult,
  TwoWayAnovaTestResult,
  WelchAnovaTestResult,
} from "../../../lib/tidy_ts_dataframe.d.ts";

/**
 * One-way ANOVA (WASM implementation)
 * @param groups Array of groups, where each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns ANOVA test results
 */
export function anovaOneWay(
  groups: number[][],
  alpha = 0.05,
): OneWayAnovaTestResult {
  if (groups.length < 2) {
    throw new Error("ANOVA requires at least 2 groups");
  }

  // Clean data and check group sizes
  const cleanGroups = groups.map((group) => group.filter((x) => isFinite(x)));
  const groupSizes = cleanGroups.map((group) => group.length);

  if (groupSizes.some((size) => size < 2)) {
    throw new Error("Each group must have at least 2 observations");
  }

  // Use WASM for the test
  const flatData = cleanGroups.flat();
  const result = anova_one_way_wasm(
    new Float64Array(flatData),
    new Uint32Array(groupSizes),
    alpha,
  );
  return serializeTestResult(result) as OneWayAnovaTestResult;
}

/**
 * Welch's one-way ANOVA (for unequal variances)
 * @param groups Array of groups, where each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns ANOVA test results using Welch's method that doesn't assume equal variances
 */
export function welchAnovaOneWay(
  groups: number[][],
  alpha = 0.05,
): WelchAnovaTestResult {
  if (groups.length < 2) {
    throw new Error("Welch ANOVA requires at least 2 groups");
  }

  // Clean data and check group sizes
  const cleanGroups = groups.map((group) => group.filter((x) => isFinite(x)));
  const groupSizes = cleanGroups.map((group) => group.length);

  if (groupSizes.some((size) => size < 2)) {
    throw new Error(
      "Each group must have at least 2 observations for Welch ANOVA",
    );
  }

  // Use WASM for the test
  const flatData = cleanGroups.flat();
  const result = welch_anova_wasm(
    new Float64Array(flatData),
    new Uint32Array(groupSizes),
    alpha,
  );
  return serializeTestResult(result) as WelchAnovaTestResult;
}

/**
 * Two-way ANOVA for factor A main effect
 *
 * @param data - 3D array where data[i][j] contains observations for level i of factor A and level j of factor B
 * @param alpha - Significance level (default: 0.05)
 * @returns TestResult for factor A main effect
 */
export function _twoWayAnovaFactorA({
  data,
  alpha = 0.05,
}: {
  data: number[][][];
  alpha?: number;
}): OneWayAnovaTestResult {
  if (data.length < 2) {
    throw new Error("Two-way ANOVA requires at least 2 levels for factor A");
  }

  const bLevels = data[0]?.length || 0;
  if (bLevels < 2) {
    throw new Error("Two-way ANOVA requires at least 2 levels for factor B");
  }

  // Validate structure and flatten data for WASM
  const flattenedData: number[] = [];
  const cellSizes: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].length !== bLevels) {
      throw new Error(
        `All levels of factor A must have ${bLevels} levels of factor B`,
      );
    }

    for (let j = 0; j < bLevels; j++) {
      const cellData = data[i][j];
      if (!cellData || cellData.length === 0) {
        throw new Error(`Cell A${i + 1}B${j + 1} is empty`);
      }

      // Validate numeric data
      for (const value of cellData) {
        if (!isFinite(value)) {
          throw new Error(`Cell A${i + 1}B${j + 1} contains non-finite values`);
        }
      }

      flattenedData.push(...cellData);
      cellSizes.push(cellData.length);
    }
  }

  const result = anova_two_way_factor_a_wasm(
    new Float64Array(flattenedData),
    data.length, // a_levels
    bLevels, // b_levels
    new Uint32Array(cellSizes),
    alpha,
  );
  return serializeTestResult(result) as OneWayAnovaTestResult;
}

/**
 * Two-way ANOVA for factor B main effect
 *
 * @param data - 3D array where data[i][j] contains observations for level i of factor A and level j of factor B
 * @param alpha - Significance level (default: 0.05)
 * @returns TestResult for factor B main effect
 */
export function _twoWayAnovaFactorB({
  data,
  alpha = 0.05,
}: {
  data: number[][][];
  alpha?: number;
}): OneWayAnovaTestResult {
  if (data.length < 2) {
    throw new Error("Two-way ANOVA requires at least 2 levels for factor A");
  }

  const bLevels = data[0]?.length || 0;
  if (bLevels < 2) {
    throw new Error("Two-way ANOVA requires at least 2 levels for factor B");
  }

  // Validate structure and flatten data for WASM
  const flattenedData: number[] = [];
  const cellSizes: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].length !== bLevels) {
      throw new Error(
        `All levels of factor A must have ${bLevels} levels of factor B`,
      );
    }

    for (let j = 0; j < bLevels; j++) {
      const cellData = data[i][j];
      if (!cellData || cellData.length === 0) {
        throw new Error(`Cell A${i + 1}B${j + 1} is empty`);
      }

      // Validate numeric data
      for (const value of cellData) {
        if (!isFinite(value)) {
          throw new Error(`Cell A${i + 1}B${j + 1} contains non-finite values`);
        }
      }

      flattenedData.push(...cellData);
      cellSizes.push(cellData.length);
    }
  }

  const result = anova_two_way_factor_b_wasm(
    new Float64Array(flattenedData),
    data.length, // a_levels
    bLevels, // b_levels
    new Uint32Array(cellSizes),
    alpha,
  );
  return serializeTestResult(result) as OneWayAnovaTestResult;
}

/**
 * Two-way ANOVA for A×B interaction effect
 *
 * @param data - 3D array where data[i][j] contains observations for level i of factor A and level j of factor B
 * @param alpha - Significance level (default: 0.05)
 * @returns TestResult for A×B interaction effect
 */
export function _twoWayAnovaInteraction({
  data,
  alpha = 0.05,
}: {
  data: number[][][];
  alpha?: number;
}): OneWayAnovaTestResult {
  if (data.length < 2) {
    throw new Error("Two-way ANOVA requires at least 2 levels for factor A");
  }

  const bLevels = data[0]?.length || 0;
  if (bLevels < 2) {
    throw new Error("Two-way ANOVA requires at least 2 levels for factor B");
  }

  // Validate structure and flatten data for WASM
  const flattenedData: number[] = [];
  const cellSizes: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].length !== bLevels) {
      throw new Error(
        `All levels of factor A must have ${bLevels} levels of factor B`,
      );
    }

    for (let j = 0; j < bLevels; j++) {
      const cellData = data[i][j];
      if (!cellData || cellData.length === 0) {
        throw new Error(`Cell A${i + 1}B${j + 1} is empty`);
      }

      // Validate numeric data
      for (const value of cellData) {
        if (!isFinite(value)) {
          throw new Error(`Cell A${i + 1}B${j + 1} contains non-finite values`);
        }
      }

      flattenedData.push(...cellData);
      cellSizes.push(cellData.length);
    }
  }

  const result = anova_two_way_interaction_wasm(
    new Float64Array(flattenedData),
    data.length, // a_levels
    bLevels, // b_levels
    new Uint32Array(cellSizes),
    alpha,
  );
  return serializeTestResult(result) as OneWayAnovaTestResult;
}

/**
 * Two-way ANOVA (complete analysis)
 *
 * @param data - 3D array where data[i][j] contains observations for level i of factor A and level j of factor B
 * @param alpha - Significance level (default: 0.05)
 * @returns Complete two-way ANOVA results including main effects and interaction
 */
export function twoWayAnova({
  data,
  alpha = 0.05,
}: {
  data: number[][][];
  alpha?: number;
}): TwoWayAnovaTestResult {
  if (data.length < 2) {
    throw new Error("Two-way ANOVA requires at least 2 levels for factor A");
  }

  const bLevels = data[0]?.length || 0;
  if (bLevels < 2) {
    throw new Error("Two-way ANOVA requires at least 2 levels for factor B");
  }

  // Validate structure and flatten data for WASM
  const flattenedData: number[] = [];
  const cellSizes: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].length !== bLevels) {
      throw new Error(
        `All levels of factor A must have ${bLevels} levels of factor B`,
      );
    }

    for (let j = 0; j < bLevels; j++) {
      const cellData = data[i][j];
      if (!cellData || cellData.length === 0) {
        throw new Error(`Cell A${i + 1}B${j + 1} is empty`);
      }

      // Validate numeric data
      for (const value of cellData) {
        if (!isFinite(value)) {
          throw new Error(`Cell A${i + 1}B${j + 1} contains non-finite values`);
        }
      }

      flattenedData.push(...cellData);
      cellSizes.push(cellData.length);
    }
  }

  const result = anova_two_way_wasm(
    new Float64Array(flattenedData),
    data.length, // a_levels
    bLevels, // b_levels
    new Uint32Array(cellSizes),
    alpha,
  );
  return serializeTestResult(result) as TwoWayAnovaTestResult;
}
