import {
  chi_square_independence,
  chi_square_goodness_of_fit,
} from "../../wasm/statistical-tests.ts";
import type {
  ChiSquareIndependenceTestResult,
  ChiSquareGoodnessOfFitTestResult,
} from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";

/**
 * Chi-square test of independence for categorical data
 */
export function chiSquareTest({
  contingencyTable,
  alpha = 0.05,
}: {
  contingencyTable: number[][];
  alpha?: number;
}): PrettifyDeep<ChiSquareIndependenceTestResult> {
  if (contingencyTable.length < 2 || contingencyTable[0].length < 2) {
    throw new Error("Contingency table must be at least 2x2");
  }

  // Validate input: must be rectangular with non-negative, finite numbers
  const cols = contingencyTable[0].length;
  for (const row of contingencyTable) {
    if (row.length !== cols) {
      throw new Error("Contingency table must be rectangular");
    }
    if (!row.every((v) => Number.isFinite(v) && v >= 0)) {
      throw new Error("All observed values must be non-negative numbers");
    }
  }

  // Flatten the 2D array for WASM
  const rows = contingencyTable.length;
  const flatData = contingencyTable.flat();

  const result = chi_square_independence(
    new Float64Array(flatData),
    rows,
    cols,
    alpha,
  );
  return result as ChiSquareIndependenceTestResult;
}

/**
 * Chi-square goodness-of-fit test
 */
export function chiSquareGoodnessOfFitTest({
  observed,
  expected,
  alpha = 0.05,
}: {
  observed: number[];
  expected: number[];
  alpha?: number;
}): PrettifyDeep<ChiSquareGoodnessOfFitTestResult> {
  if (observed.length !== expected.length) {
    throw new Error("Observed and expected arrays must have the same length");
  }
  if (observed.length < 2) {
    throw new Error("At least 2 categories are required");
  }
  if (!observed.every((v) => Number.isFinite(v) && v >= 0)) {
    throw new Error("All observed values must be non-negative numbers");
  }
  if (!expected.every((v) => Number.isFinite(v) && v > 0)) {
    throw new Error("All expected values must be positive numbers");
  }

  const result = chi_square_goodness_of_fit(
    new Float64Array(observed),
    new Float64Array(expected),
    alpha,
  );
  return result as ChiSquareGoodnessOfFitTestResult;
}
