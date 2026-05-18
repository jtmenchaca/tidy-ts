/**
 * ID: SO#29643820
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Assigning mean() (double) to integer column in data.table fails. Type of aggregation result doesn't match column type. Not verified with R runtime — .R file written from SO code.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(data.table)

db <- data.table(id = rep(1:2, each = 5), x = 1:10, y = runif(10))
db[, x := mean(y), by = id]
print(db)
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const db = createDataFrame([
  { id: "1", x: 1, y: 0.47 },
  { id: "1", x: 2, y: 0.03 },
  { id: "1", x: 3, y: 0.57 },
  { id: "2", x: 6, y: 0.83 },
  { id: "2", x: 7, y: 0.11 },
  { id: "2", x: 8, y: 0.23 },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(db.extract("id"));
