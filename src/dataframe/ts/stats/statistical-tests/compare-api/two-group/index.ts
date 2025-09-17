import { centralTendencyToEachOther } from "./central-tendency.ts";
import { proportionsToEachOther } from "./proportions.ts";
import { associationToEachOther } from "./association.ts";
import { distributionsToEachOther } from "./distributions.ts";

/**
 * Two-group statistical tests for comparing two independent samples.
 *
 * @example
 * ```typescript
 * import { twoGroups } from "@tidy-ts/dataframe/stats";
 *
 * // Compare central tendencies
 * twoGroups.centralTendency.toEachOther({ x: group1, y: group2 });
 *
 * // Test association between variables
 * twoGroups.association.toEachOther({ x, y, method: "pearson" });
 *
 * // Compare proportions
 * twoGroups.proportions.toEachOther({ data1: [true, false], data2: [true, true] });
 *
 * // Compare distributions
 * twoGroups.distributions.toEachOther({ x, y, method: "ks" });
 * ```
 */
export const twoGroups = {
  centralTendency: {
    toEachOther: centralTendencyToEachOther,
  },
  proportions: {
    toEachOther: proportionsToEachOther,
  },
  association: {
    toEachOther: associationToEachOther,
  },
  distributions: {
    toEachOther: distributionsToEachOther,
  },
};
