/**
 * ID: SO#27828850
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: POSIXlt column breaks dplyr group_by. Same temporal type consistency pattern.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(dplyr)

setAs("character", "POSIXlt", function(from) {
  strptime(from, format = "%m/%d/%y %H:%M")
})

df <- data.frame(
  Start.Date = c("01/15/14 10:00", "01/15/14 11:00", "01/16/14 09:00"),
  BikeNo = c(1, 2, 1),
  stringsAsFactors = FALSE
)
df$Start.Date <- as(df$Start.Date, "POSIXlt")

d <- df %>%
  mutate(Weekday = factor(weekdays(Start.Date))) %>%
  group_by(Weekday) %>%
  summarise(Total = n())

print(d)
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const d = createDataFrame([
  { startDate: "01/15/14 10:00", bikeNo: 1 },
  { startDate: "01/15/14 11:00", bikeNo: 2 },
  { startDate: "01/16/14 09:00", bikeNo: 3 },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(d.extract("startDate"));
