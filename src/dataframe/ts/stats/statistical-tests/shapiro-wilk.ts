import { shapiro_wilk_test, serializeTestResult } from "../../wasm/statistical-tests.ts";
import type { ShapiroWilkTestResult } from "../../../lib/tidy_ts_dataframe.internal.js";
export type { ShapiroWilkTestResult } from "../../../lib/tidy_ts_dataframe.internal.js";

/**
 * Test for normality using Shapiro-Wilk test
 */
export function shapiroWilkTest({
  data,
  alpha = 0.05,
}: {
  data: number[];
  alpha?: number;
}): ShapiroWilkTestResult {
  const cleanData = data.filter((x) => isFinite(x));

  if (cleanData.length < 3) {
    throw new Error("Shapiro-Wilk test requires at least 3 observations");
  }

  if (cleanData.length > 5000) {
    throw new Error("Shapiro-Wilk test is not reliable for n > 5000");
  }

  const result = shapiro_wilk_test(
    new Float64Array(cleanData),
    alpha,
  );
  return serializeTestResult(result) as ShapiroWilkTestResult;
}
