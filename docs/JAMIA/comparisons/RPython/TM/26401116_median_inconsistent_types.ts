/**
 * RPython SO#26401116 — Median returning an error when using data.table in R
 * Effect: Crash
 * Bug class: Int/double distinction
 *
 * Same pattern as 12125364. In R, median() returns different types depending on
 * group size. data.table requires consistent types across groups.
 *
 * In tidy-ts, number is number — no int/double distinction exists.
 * The type system still catches passing non-numeric columns to median.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const DT = createDataFrame([
  { v1: 2, v2: 1, group: "1" },
  { v1: 3, v2: 2, group: "2" },
  { v1: 1, v2: 1, group: "3" },
  { v1: 1, v2: 2, group: "2" },
  { v1: 1, v2: 1, group: "3" },
  { v1: 0, v2: 1, group: "3" },
]);

const result = DT.groupBy("group").summarize({
  median_v1: (g) => s.median(g.extract("v1")),
  median_v2: (g) => s.median(g.extract("v2")),
});

// Passing the group column (string) to median is caught
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.median(DT.extract("group"));

result.print();
