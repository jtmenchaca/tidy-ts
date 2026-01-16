import { centralTendencyToEachOther } from "./central-tendency.ts";
import { proportionsToEachOther } from "./proportions.ts";

/**
 * Multi-group statistical tests for comparing three or more independent samples.
 *
 * @example
 * ```typescript
 * import { multiGroups } from "@tidy-ts/dataframe/stats";
 *
 * // Compare central tendencies across multiple groups
 * multiGroups.centralTendency.toEachOther({ groups: [g1, g2, g3] });
 *
 * // Two-way ANOVA
 * multiGroups.centralTendency.toEachOther({
 *   data: twoWayData,
 *   design: "two-way",
 *   testType: "factorA"
 * });
 *
 * // Test independence in contingency table
 * multiGroups.proportions.toEachOther({ contingencyTable: [[10, 20], [15, 25]] });
 * ```
 */
export const multiGroups = {
  centralTendency: {
    toEachOther: centralTendencyToEachOther,
  },
  proportions: {
    toEachOther: proportionsToEachOther,
  },
};

// Re-export individual functions for flexibility
export { centralTendencyToEachOther } from "./central-tendency.ts";
export { proportionsToEachOther } from "./proportions.ts";
