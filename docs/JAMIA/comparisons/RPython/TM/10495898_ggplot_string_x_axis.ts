/**
 * RPython SO#10495898 — ggplot with Strings on x-Axis
 * Effect: IF (wrong line connections; string x treated as unordered factor)
 * Bug class: Type coercion
 *
 * R bug: x = c("four","three","two","one") in geom_line — ggplot2 connects points
 * in alphabetical factor order, not the intended sequence (4,3,2,1). The fix is to
 * convert x to numeric via factor levels: as.numeric(factor(x, levels=...)).
 *
 * In tidy-ts, if the user intended x as a numeric position (for proper line ordering
 * or regression), passing string[] to a numeric function is a compile-time error.
 * The user must map labels to numbers explicitly, matching R's factor→numeric fix.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df_nok = createDataFrame([
  { x: "four", y: -0.63, d: "d1" },
  { x: "three", y: 0.18, d: "d1" },
  { x: "two", y: -0.84, d: "d1" },
  { x: "one", y: 1.60, d: "d1" },
  { x: "three", y: 0.33, d: "d2" },
  { x: "two", y: -0.82, d: "d2" },
  { x: "one", y: 0.49, d: "d2" },
]);

// The SO user wants geom_line to connect points in logical order (one→two→three→four).
// With string x, lines connect alphabetically (four→one→three→two) — wrong.
// The R fix: convert to numeric. In tidy-ts, fitting a model through these points
// requires all-numeric columns. The string x/d columns fail Record<string, number>.
// @ts-expect-error — Type '{ x: string; y: number; d: string }' does not satisfy 'Record<string, number>'
s.glm({ formula: "y ~ x", family: "gaussian", link: "identity", data: df_nok });
