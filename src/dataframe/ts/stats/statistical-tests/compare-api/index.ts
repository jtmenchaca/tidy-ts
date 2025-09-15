import { oneGroup } from "./one-group.ts";
import { twoGroups } from "./two-groups.ts";
import { multiGroups } from "./multi-groups.ts";

/**
 * Hierarchical statistical test API that organizes tests by comparison type.
 *
 * @example
 * ```typescript
 * import { testsV2 } from "@tidy-ts/dataframe/stats";
 *
 * // One group comparisons
 * testsV2.compare.oneGroup.centralTendency.toValue({ data, mu: 0 });
 * testsV2.compare.oneGroup.proportions.toValue({ successes: 10, n: 20, p: 0.5 });
 * testsV2.compare.oneGroup.distribution.toNormal({ data });
 *
 * // Two groups comparisons
 * testsV2.compare.twoGroups.centralTendency.toEachOther({ x: group1, y: group2 });
 * testsV2.compare.twoGroups.association.toEachOther({ x, y, method: "pearson" });
 *
 * // Multiple groups comparisons
 * testsV2.compare.multiGroups.centralTendency.toEachOther({ groups: [g1, g2, g3] });
 * ```
 */
export const compare = {
  oneGroup,
  twoGroups,
  multiGroups,
};

// Re-export individual components for flexibility
export { oneGroup } from "./one-group.ts";
export { twoGroups } from "./two-groups.ts";
export { multiGroups } from "./multi-groups.ts";
