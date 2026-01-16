import {
  fishers_exact_test_wasm,
  serializeTestResult,
} from "../../wasm/statistical-tests.ts";
import type { FishersExactTestResult } from "../../../lib/tidy_ts_dataframe.js";

/**
 * Fisher's exact test for 2x2 contingency tables.
 *
 * Note: Both p_value and exact_p_value are provided by WASM and contain identical values
 * since Fisher's exact test always computes exact p-values (no asymptotic approximation).
 */
export function fishersExactTest({
  contingencyTable,
  alternative = "two-sided",
  oddsRatio = 1.0,
  alpha = 0.05,
}: {
  contingencyTable: number[][];
  alternative?: "two-sided" | "less" | "greater";
  oddsRatio?: number;
  alpha?: number;
}): FishersExactTestResult {
  if (
    contingencyTable.length !== 2 || contingencyTable[0].length !== 2 ||
    contingencyTable[1].length !== 2
  ) {
    throw new Error("Fisher's exact test requires a 2x2 contingency table");
  }

  // Validate all entries are non-negative integers
  const flatData = contingencyTable.flat();
  if (flatData.some((x) => x < 0 || !Number.isInteger(x))) {
    throw new Error("All table entries must be non-negative integers");
  }

  // Extract 2x2 table values: [[a, b], [c, d]]
  const a = contingencyTable[0][0];
  const b = contingencyTable[0][1];
  const c = contingencyTable[1][0];
  const d = contingencyTable[1][1];

  const result = fishers_exact_test_wasm(
    a,
    b,
    c,
    d,
    alternative,
    oddsRatio,
    alpha,
  );
  return serializeTestResult(result) as FishersExactTestResult;
}
