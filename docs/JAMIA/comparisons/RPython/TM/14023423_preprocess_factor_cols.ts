/**
 * ID: SO#14023423
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: caret preProcess fails on factor columns. Numeric function on non-numeric type.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(earth)
library(caret)
data(etitanic)

a <- preProcess(etitanic, method = c("center", "scale"))
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const passengers = createDataFrame([
  { pclass: "1st", survived: 1, age: 29, sex: "female" },
  { pclass: "2nd", survived: 0, age: 35, sex: "male" },
  { pclass: "3rd", survived: 0, age: 22, sex: "male" },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(passengers.extract("pclass"));
