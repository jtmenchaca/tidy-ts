/**
 * ID: SO#28730083
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: geom_area fails with categorical x-axis. Wrong type for continuous operation.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(ggplot2)

data <- data.frame(
  def.percent = c(6.4827843, 5.8232425, -2.4003260, -3.5994399),
  period = factor(c("1984-1985", "1985-1986", "1986-1987", "1987-1988")),
  valence = c("neg", "neg", "pos", "pos")
)

ggplot(data, aes(x = period, y = def.percent, group = 1)) +
  geom_area(aes(fill = valence)) +
  geom_line() +
  geom_point() +
  geom_hline(yintercept = 0)
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const data = createDataFrame([
  { def_percent: 6.48, period: "1984-1985", valence: "neg" },
  { def_percent: 5.82, period: "1985-1986", valence: "neg" },
  { def_percent: -2.4, period: "1986-1987", valence: "pos" },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(data.extract("period"));
