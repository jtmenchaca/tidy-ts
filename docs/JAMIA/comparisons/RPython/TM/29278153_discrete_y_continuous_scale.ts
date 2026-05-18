/**
 * ID: SO#29278153
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: String/factor column passed to continuous y-axis. Typed y mapping requires `number \| null \| undefined`.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(ggplot2)

meltDF <- data.frame(
  MW = c(3.9, 6.4, 7.4, 8.1, 9, 9.4, 3.9, 6.4),
  variable = factor(
    c("10", "10", "33.95", "33.95", "58.66", "58.66", "84.42", "84.42"),
    levels = c("10", "33.95", "58.66", "84.42")
  ),
  value = c(1, 1, 1, 1, 0, 0, 0, 0)
)

ggplot(meltDF[meltDF$value == 1, ], aes(x = MW, y = variable)) +
  geom_point() +
  scale_x_continuous(limits = c(0, 1200), breaks = c(0, 400, 800, 1200)) +
  scale_y_continuous(limits = c(0, 1200), breaks = c(0, 400, 800, 1200))
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const meltDF = createDataFrame([
  { mw: 3.9, variable: "10", value: 1 },
  { mw: 6.4, variable: "33.95", value: 1 },
  { mw: 5.2, variable: "20", value: 2 },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(meltDF.extract("variable"));
