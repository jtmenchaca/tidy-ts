import { oneGroup } from "./one-group/index.ts";
import { twoGroups } from "./two-group/index.ts";
import { multiGroups } from "./multi-group/index.ts";
import { dunnTest, gamesHowellTest, tukeyHSD } from "../post-hoc/index.ts";

/**
 * Hierarchical statistical test API that organizes tests by comparison type.
 *
 * @example
 * ```typescript
 * import { s } from "@tidy-ts/dataframe/stats";
 *
 * // One group comparisons
 * s.compare.oneGroup.centralTendency.toValue({ data, hypothesizedValue: 0 });
 * s.compare.oneGroup.proportions.toValue({ data: [true, false, true], p: 0.5 });
 * s.compare.oneGroup.distribution.toNormal({ data });
 *
 * // Two groups comparisons
 * s.compare.twoGroups.centralTendency.toEachOther({ x: group1, y: group2 });
 * s.compare.twoGroups.association.toEachOther({ x, y, method: "pearson" });
 *
 * // Multiple groups comparisons
 * s.compare.multiGroups.centralTendency.toEachOther({ groups: [g1, g2, g3] });
 * s.compare.multiGroups.centralTendency.toEachOther({ data: twoWayData, design: "two-way", testType: "factorA" });
 *
 * // Post-hoc analyses after significant omnibus tests
 * s.compare.postHoc.dunn({ groups: [g1, g2, g3] });
 * ```
 */
export const compare = {
  oneGroup,
  twoGroups,
  multiGroups,
  postHoc: {
    dunn: dunnTest,
    gamesHowell: gamesHowellTest,
    tukey: tukeyHSD,
  },
};

// Re-export individual components for flexibility
export { oneGroup } from "./one-group/index.ts";
export { twoGroups } from "./two-group/index.ts";
export { multiGroups } from "./multi-group/index.ts";
