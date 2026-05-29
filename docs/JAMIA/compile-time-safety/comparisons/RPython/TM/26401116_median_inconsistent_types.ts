/**
 * ID: SO#26401116
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Same int/double inconsistency from median() in data.table groupby. Not verified with R runtime — .R file written from SO code.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(data.table)

DT <- data.table(
  V1 = c(2L, 3L, 1L, 1L, 1L, 0L),
  V2 = c(1L, 2L, 1L, 2L, 1L, 1L),
  V7 = factor(c(1, 2, 3, 2, 3, 3))
)

DT[, lapply(.SD, median), by = V7]
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const DT = createDataFrame([
  { v1: 2, v2: 1, group: "1" },
  { v1: 3, v2: 2, group: "2" },
  { v1: 1, v2: 1, group: "3" },
  { v1: 1, v2: 2, group: "2" },
  { v1: 1, v2: 1, group: "3" },
  { v1: 0, v2: 1, group: "3" },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.median(DT.extract("group"));
