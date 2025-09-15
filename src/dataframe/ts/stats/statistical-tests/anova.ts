import {
  anova_one_way,
  anova_two_way_factor_a_wasm,
  anova_two_way_factor_b_wasm,
  anova_two_way_interaction_wasm,
  type TestResult,
} from "../../wasm/wasm-loader.ts";
import type { TestName } from "../../wasm/statistical-tests.ts";

/** ANOVA test specific result with only relevant fields */
export type AnovaTestResult =
  & Pick<
    TestResult,
    | "test_type"
    | "confidence_interval_lower"
    | "confidence_interval_upper"
    | "confidence_level"
    | "sample_size"
    | "sample_means"
    | "sample_std_devs"
    | "sum_of_squares"
    | "r_squared"
    | "adjusted_r_squared"
    | "error_message"
  >
  & {
    test_statistic: number;
    p_value: number;
    effect_size: number;
    eta_squared: number;
    f_statistic: number;
    degrees_of_freedom: number;
    test_name: TestName;
  };

/**
 * One-way ANOVA for comparing means across multiple groups
 * @param groups Variadic groups, where each group is an array of numbers
 * @returns F-statistic, p-value, and effect size
 */
export function oneWayAnova(
  groups: number[][],
  alpha: number,
): AnovaTestResult {
  return oneWayAnovaWithOptions({ groups, alpha });
}

/**
 * One-way ANOVA with options
 * @param {Object} obj - Object containing parameters
 * @param {number[][]} obj.groups - Array of groups, where each group is an array of numbers
 * @param {number} [obj.alpha=0.05] - Significance level
 * @returns {AnovaTestResult} ANOVA test results
 */
export function oneWayAnovaWithOptions({
  groups,
  alpha = 0.05,
}: {
  groups: number[][];
  alpha?: number;
}): AnovaTestResult {
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
  return anova_one_way(
    new Float64Array(flatData),
    new Uint32Array(groupSizes),
    alpha,
  ) as AnovaTestResult;
}

/**
 * One-way ANOVA (simple WASM implementation)
 * @param groups Variadic groups, where each group is an array of numbers
 * @returns ANOVA test results
 */
export function anovaOneWay(
  groups: number[][],
  alpha: number,
): AnovaTestResult {
  return anovaOneWayWithOptions({ groups, alpha });
}

/**
 * One-way ANOVA with options
 */
export function anovaOneWayWithOptions({
  groups,
  alpha = 0.05,
}: {
  groups: number[][];
  alpha?: number;
}): AnovaTestResult {
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
  return anova_one_way(
    new Float64Array(flatData),
    new Uint32Array(groupSizes),
    alpha,
  ) as AnovaTestResult;
}

/**
 * Two-way ANOVA for factor A main effect
 *
 * @param data - 3D array where data[i][j] contains observations for level i of factor A and level j of factor B
 * @param alpha - Significance level (default: 0.05)
 * @returns TestResult for factor A main effect
 */
export function twoWayAnovaFactorA({
  data,
  alpha = 0.05,
}: {
  data: number[][][];
  alpha?: number;
}): AnovaTestResult {
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

  return anova_two_way_factor_a_wasm(
    new Float64Array(flattenedData),
    data.length, // a_levels
    bLevels, // b_levels
    new Uint32Array(cellSizes),
    alpha,
  ) as AnovaTestResult;
}

/**
 * Two-way ANOVA for factor B main effect
 *
 * @param data - 3D array where data[i][j] contains observations for level i of factor A and level j of factor B
 * @param alpha - Significance level (default: 0.05)
 * @returns TestResult for factor B main effect
 */
export function twoWayAnovaFactorB({
  data,
  alpha = 0.05,
}: {
  data: number[][][];
  alpha?: number;
}): AnovaTestResult {
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

  return anova_two_way_factor_b_wasm(
    new Float64Array(flattenedData),
    data.length, // a_levels
    bLevels, // b_levels
    new Uint32Array(cellSizes),
    alpha,
  ) as AnovaTestResult;
}

/**
 * Two-way ANOVA for A×B interaction effect
 *
 * @param data - 3D array where data[i][j] contains observations for level i of factor A and level j of factor B
 * @param alpha - Significance level (default: 0.05)
 * @returns TestResult for A×B interaction effect
 */
export function twoWayAnovaInteraction({
  data,
  alpha = 0.05,
}: {
  data: number[][][];
  alpha?: number;
}): AnovaTestResult {
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

  return anova_two_way_interaction_wasm(
    new Float64Array(flattenedData),
    data.length, // a_levels
    bLevels, // b_levels
    new Uint32Array(cellSizes),
    alpha,
  ) as AnovaTestResult;
}
