import {
  chi_square_independence,
  type TestResult,
} from "../../wasm/wasm-loader.ts";

/** Chi-square test specific result with only relevant fields */
export type ChiSquareTestResult = Pick<
  TestResult,
  | "test_type"
  | "test_statistic"
  | "p_value"
  | "confidence_interval_lower"
  | "confidence_interval_upper"
  | "confidence_level"
  | "effect_size"
  | "cramers_v"
  | "phi_coefficient"
  | "degrees_of_freedom"
  | "sample_size"
  | "chi_square_expected"
  | "residuals"
  | "error_message"
>;

/**
 * Chi-square test of independence for categorical data
 */
export function chiSquareTest(
  contingencyTable: number[][],
  alpha: number = 0.05,
): ChiSquareTestResult {
  if (contingencyTable.length < 2 || contingencyTable[0].length < 2) {
    throw new Error("Contingency table must be at least 2x2");
  }

  // Flatten the 2D array for WASM
  const rows = contingencyTable.length;
  const cols = contingencyTable[0].length;
  const flatData = contingencyTable.flat();

  return chi_square_independence(
    new Float64Array(flatData),
    rows,
    cols,
    alpha,
  ) as ChiSquareTestResult;
}
