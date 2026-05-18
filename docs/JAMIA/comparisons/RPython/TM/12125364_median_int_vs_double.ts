/**
 * ID: SO#12125364
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: median() returns int for odd-length groups, double for even-length. data.table crashes on inconsistent return types across groups. Not verified with R runtime — .R file written from SO code.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(data.table)

dt <- data.table(
  patients = c(1:3, 1:2),
  weekdays = c("Mon", "Mon", "Mon", "Tue", "Tue")
)

dt[, median(patients), by = weekdays]
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const data = createDataFrame([
  { weekdays: "Mon", patients: 1 },
  { weekdays: "Mon", patients: 2 },
  { weekdays: "Mon", patients: 3 },
  { weekdays: "Tue", patients: 1 },
  { weekdays: "Tue", patients: 2 },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.median(data.extract("weekdays"));
