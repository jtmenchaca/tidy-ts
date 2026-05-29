/**
 * ID: SO#29298577
 * Language: Python
 * Bug class: Data loading
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: String 'nan' in date column fails to_datetime. Mixed content at load boundary.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import datetime as dt

df = pd.DataFrame({
    'Date': ['2014-10-20 10:44:31', '2014-10-23 09:33:46', 'nan', '2014-10-01 09:38:45']
})

df['Date'] = df['Date'].apply(lambda x: dt.datetime.strptime(x, '%Y-%m-%d %H:%M:%S'))
print(df)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { date: "2014-10-20 10:44:31" },
  { date: "2014-10-23 09:33:46" },
  { date: "nan" },
  { date: "2014-10-01 09:38:45" },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(df.extract("date"));
