/**
 * ID: SO#7920688
 * Language: R
 * Bug class: Join
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: data.table join key type mismatch (int vs double). Join key types must match.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(data.table)

dt1 <- data.table(A1 = letters[1:10], B1 = sample(1:5, 10, replace = TRUE))
dt2 <- data.table(A2 = letters[c(1:5, 11:15)], B2 = sample(1:5, 10, replace = TRUE))

setkey(dt1, A1)
setkey(dt2, A2)

positions <- dt1[dt2, which = TRUE]
dt1[-positions]
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const dt1 = createDataFrame([
  { a: "a", b: 1 },
  { a: "b", b: 4 },
  { a: "c", b: 2 },
  { a: "f", b: 2 },
  { a: "g", b: 3 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.sum(dt1.extract("a"));
