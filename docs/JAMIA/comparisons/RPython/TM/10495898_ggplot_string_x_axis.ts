/**
 * ID: SO#10495898
 * Language: R
 * Bug class: Value type
 * Runtime consequence: IF
 * In study: Yes
 * Inclusion rationale: String column on x-axis for line chart causes wrong ordering. Typed line x mapping would flag non-ordinal type.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(ggplot2)

df_nok <- rbind(
  data.frame(x = c("four", "three", "two", "one"), y = rnorm(4), d = "d1"),
  data.frame(x = c("three", "two", "one"), y = rnorm(3), d = "d2")
)

p <- ggplot(df_nok, aes(x, y)) + geom_line(aes(colour = d))
built_labels <- ggplot_build(p)$layout$panel_params[[1]]$x$get_labels()
stopifnot(identical(built_labels, sort(built_labels)))
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df_nok = createDataFrame([
  { x: "four", y: -0.63, d: "d1" },
  { x: "three", y: 0.18, d: "d1" },
  { x: "two", y: -0.84, d: "d1" },
  { x: "one", y: 1.60, d: "d1" },
  { x: "three", y: 0.33, d: "d2" },
  { x: "two", y: -0.82, d: "d2" },
  { x: "one", y: 0.49, d: "d2" },
]);

// @ts-expect-error — Type '{ x: string; y: number; d: string; }' is not assignable to type 'Record<string, number>'
s.glm({ formula: "y ~ x", family: "gaussian", link: "identity", data: df_nok });
