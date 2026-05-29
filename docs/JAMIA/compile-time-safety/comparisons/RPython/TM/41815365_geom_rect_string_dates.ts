/**
 * ID: SO#41815365
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: date_trans requires Date class, got character. String where date expected.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(ggplot2)
library(scales)

Data <- data.frame(
  Date = as.Date(c("2002-05-23", "2002-05-29", "2002-05-31")),
  Well = c("MW-3", "MW-3", "MW-3"),
  Elev = c(929.04, 929.39, 929.37)
)

p <- ggplot(data = Data, aes(x = Date, y = Elev)) +
  geom_line() +
  scale_x_date() +
  geom_rect(aes(xmin = "2004-04-29", xmax = "2004-12-20", ymin = -Inf, ymax = Inf), fill = "gray")

ggplot_build(p)
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const Data = createDataFrame([
  { date: "2002-05-23", well: "MW-3", elev: 929.04 },
  { date: "2002-05-29", well: "MW-3", elev: 929.39 },
  { date: "2002-06-15", well: "MW-1", elev: 930.12 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(Data.extract("date"));
