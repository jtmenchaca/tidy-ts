import { centralTendencyToValue } from "./central-tendency.ts";
import { proportionsToValue } from "./proportions.ts";
import { distributionToNormal } from "./distribution.ts";

/**
 * One-group statistical tests for comparing a single sample against a known value or distribution.
 *
 * @example
 * ```typescript
 * import { oneGroup } from "@tidy-ts/dataframe/stats";
 *
 * // Test if group mean differs from 0
 * oneGroup.centralTendency.toValue({ data: [1, 2, 3, 4, 5], hypothesizedValue: 0 });
 *
 * // Test if proportion differs from 0.5
 * oneGroup.proportions.toValue({ data: [true, false, true, true], p: 0.5 });
 *
 * // Test if data is normally distributed
 * oneGroup.distribution.toNormal({ data: [1, 2, 3, 4, 5] });
 * ```
 */
export const oneGroup = {
  centralTendency: {
    toValue: centralTendencyToValue,
  },
  proportions: {
    toValue: proportionsToValue,
  },
  distribution: {
    toNormal: distributionToNormal,
  },
};
