/**
 * RPython SO#30063190 — dplyr with POSIXlt date columns
 * Effect: Crash
 * Bug class: Nullable type
 *
 * R bug: dplyr group_by/summarise on POSIXlt columns crashes because dplyr cannot
 * handle the list-of-lists internal structure of POSIXlt. The fix is as.POSIXct().
 *
 * In tidy-ts, date strings must be parsed to Temporal types before temporal operations.
 * Using unparsed date strings in numeric groupBy summaries is rejected at compile time.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { transaction_date: "01.01.2010", install_date: "01.01.2010", value: 10 },
  { transaction_date: "15.01.2010", install_date: "01.01.2010", value: 20 },
  { transaction_date: "01.02.2010", install_date: "01.01.2010", value: 15 },
]);

// The SO user's intent: group_by(install_date) then summarise transaction_date.
// dplyr crashes on POSIXlt internals.
// tidy-ts: correlating date strings with values requires numeric x.
// @ts-expect-error — string[] is not assignable to number[]
s.test.correlation.pearson({ x: df.extract("transaction_date"), y: df.extract("value") });
