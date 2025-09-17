import { oneGroup } from "./one-group/index.ts";
import { twoGroups } from "./two-group/index.ts";
import { multiGroups } from "./multi-group/index.ts";
import { postHoc } from "./post-hoc.ts";

/**
 * Hierarchical statistical test API that organizes tests by comparison type.
 *
 * @example
 * ```typescript
 * import { testsV2 } from "@tidy-ts/dataframe/stats";
 *
 * // One group comparisons
 * testsV2.compare.oneGroup.centralTendency.toValue({ data, hypothesizedValue: 0 });
 * testsV2.compare.oneGroup.proportions.toValue({ data: [true, false, true], p: 0.5 });
 * testsV2.compare.oneGroup.distribution.toNormal({ data });
 *
 * // Two groups comparisons
 * testsV2.compare.twoGroups.centralTendency.toEachOther({ x: group1, y: group2 });
 * testsV2.compare.twoGroups.association.toEachOther({ x, y, method: "pearson" });
 *
 * // Multiple groups comparisons
 * testsV2.compare.multiGroups.centralTendency.toEachOther({ groups: [g1, g2, g3] });
 * testsV2.compare.multiGroups.centralTendency.toEachOther({ data: twoWayData, design: "two-way", testType: "factorA" });
 *
 * // Post-hoc analyses after significant omnibus tests
 * testsV2.compare.postHoc.for({ groups: [g1, g2, g3], originalTest: "anova" });
 * ```
 */
export const compare = {
  oneGroup,
  twoGroups,
  multiGroups,
  postHoc,
};

// Re-export individual components for flexibility
export { oneGroup } from "./one-group/index.ts";
export { twoGroups } from "./two-group/index.ts";
export { multiGroups } from "./multi-group/index.ts";
