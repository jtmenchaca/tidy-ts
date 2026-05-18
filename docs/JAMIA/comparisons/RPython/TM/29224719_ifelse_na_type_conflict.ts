/**
 * RPython SO#29224719 — ifelse with NA causes logical vs numeric type conflict
 * Effect: Crash
 * Bug class: Nullable type
 *
 * R bug: ifelse(hits.diff <= 0, -hits.diff, 0) returns logical NA when all values
 * in a group are NA (because NA <= 0 is NA, so ifelse returns its "no" branch type
 * for the first two rows which are all NA → logical). When group_by produces a group
 * where some rows are numeric and the next group is logical, dplyr crashes:
 * "incompatible types, expecting a logical vector."
 *
 * In tidy-ts, a summarize/mutate that may return null produces a nullable type.
 * Using that nullable result in Math.round (which requires strict number) is caught.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df1 = createDataFrame([
  { crawlId: 1, groupId: "1", hitsDiff: null as number | null },
  { crawlId: 1, groupId: "2", hitsDiff: null as number | null },
  { crawlId: 2, groupId: "2", hitsDiff: 0 },
  { crawlId: 1, groupId: "3", hitsDiff: null as number | null },
  { crawlId: 1, groupId: "3", hitsDiff: null as number | null },
  { crawlId: 1, groupId: "3", hitsDiff: null as number | null },
]);

// The SO user's intent: compute hits.consumed = ifelse(hits.diff <= 0, -hits.diff, 0)
// per group. R crashes because NA propagates and changes the return type to logical.
// tidy-ts: the column is number | null. Mutating with a function that doesn't handle
// null produces number | null. Using that in Math.round is rejected.
const result = df1.mutate({
  hitsConsumed: (r) => (r.hitsDiff !== null && r.hitsDiff <= 0) ? -r.hitsDiff : null,
});

// The result column is number | null. Passing to Math.round (requires number) fails.
// @ts-expect-error — Argument of type 'number | null' is not assignable to parameter of type 'number'
result.mutate({ rounded: (r) => Math.round(r.hitsConsumed) });
