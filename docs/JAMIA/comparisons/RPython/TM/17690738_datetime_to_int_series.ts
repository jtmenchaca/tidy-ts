/**
 * ID: SO#17690738
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Assigning datetime to integer-indexed Series. Type mismatch on assignment.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

date_stngs = ('2008-12-20', '2008-12-21', '2008-12-22', '2008-12-23')

a = pd.Series(range(4), index=range(4))

for idx, date in enumerate(date_stngs):
    a[idx] = pd.to_datetime(date)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { idx: 0, date: "2008-12-20" },
  { idx: 1, date: "2008-12-21" },
  { idx: 2, date: "2008-12-22" },
  { idx: 3, date: "2008-12-23" },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(df.extract("date"));
