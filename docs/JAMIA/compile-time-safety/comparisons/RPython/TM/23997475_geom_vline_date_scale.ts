/**
 * ID: SO#23997475
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Character date value for geom_vline position. Typed position spec requires numeric/temporal.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(lubridate)
library(ggplot2)

df <- data.frame(
  date = dmy(c("2/6/2014", "3/6/2014", "4/6/2014", "5/6/2014")),
  value = 1:4
)

ggplot(data = df, aes(x = date, y = value)) +
  geom_vline(xintercept = as.numeric(dmy("3/6/2014")), linetype = 4) +
  geom_line()
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { date: "2014-06-02", value: 1 },
  { date: "2014-06-03", value: 2 },
  { date: "2014-06-04", value: 3 },
  { date: "2014-06-05", value: 4 },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(df.extract("date"));
