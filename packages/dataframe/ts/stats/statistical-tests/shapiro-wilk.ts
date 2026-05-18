import {
  shapiro_wilk_test,
} from "../../wasm/statistical-tests.ts";
import type { ShapiroWilkTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
export type { ShapiroWilkTestResult } from "./types.ts";

/**
 * Test for normality using Shapiro-Wilk test
 */
export function shapiroWilkTest({
  data,
  alpha = 0.05,
}: {
  data: readonly number[];
  alpha?: number;
}): PrettifyDeep<ShapiroWilkTestResult> {
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
  return result as ShapiroWilkTestResult;
}
