import { chi_square_independence, serializeTestResult } from "../../wasm/statistical-tests.ts";
import type { ChiSquareIndependenceTestResult } from "../../../lib/tidy_ts_dataframe.internal.js";
export type { ChiSquareIndependenceTestResult } from "../../../lib/tidy_ts_dataframe.internal.js";

/**
 * Chi-square test of independence for categorical data
 */
export function chiSquareTest({
  contingencyTable,
  alpha = 0.05,
}: {
  contingencyTable: number[][];
  alpha?: number;
}): ChiSquareIndependenceTestResult {
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
  return serializeTestResult(result) as ChiSquareIndependenceTestResult;
}
