/**
 * ID: SO#29974535
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Character date column on x-axis gives wrong ordering. Typed x-axis mapping expects temporal or numeric for ordered axes.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(ggplot2)
library(scales)

Date <- seq(as.Date("2010/1/1"), as.Date("2014/1/1"), "week")
Y <- rnorm(length(Date), mean = 100, sd = 1)
df <- data.frame(Date, Y)
df$MonthDay <- format(df$Date, "%d-%b")

p <- ggplot(data = df, mapping = aes(x = MonthDay, y = Y)) + geom_point()
p + scale_x_date(labels = date_format("%d-%b"))
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { monthDay: "01-Jan", y: 100 },
  { monthDay: "08-Jan", y: 101 },
  { monthDay: "15-Jan", y: 99 },
  { monthDay: "22-Jan", y: 103 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("monthDay"));
