/**
 * RPython SO#20625982 — split-apply-combine on pandas timedelta column
 * Effect: DC (silent data corruption)
 * Bug class: Implicit column selection
 *
 * In pandas, groupby().mean() silently drops timedelta columns from output.
 * The column vanishes with no error or warning.
 *
 * In tidy-ts, summarize() requires explicitly specifying every output column.
 * There is no implicit column selection that could silently drop data.
 * Attempting to pass a string column to s.mean() is caught at compile time.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { f1: 0.99, f2: 0.95, td_ns: 3066000, group: "A" },
  { f1: 0.28, f2: 0.99, td_ns: 1443000, group: "B" },
  { f1: 0.02, f2: 0.58, td_ns: 9257000, group: "A" },
  { f1: 0.05, f2: 0.51, td_ns: 702000, group: "B" },
  { f1: 0.85, f2: 0.18, td_ns: 396000, group: "A" },
]);

// Each output column is explicitly named in summarize — nothing silently dropped
const result = data.groupBy("group").summarize({
  mean_f1: (g) => s.mean(g.extract("f1")),
  mean_f2: (g) => s.mean(g.extract("f2")),
  mean_td_ns: (g) => s.mean(g.extract("td_ns")),
});

// Passing the string group column to mean is caught
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(data.extract("group"));

result.print();
