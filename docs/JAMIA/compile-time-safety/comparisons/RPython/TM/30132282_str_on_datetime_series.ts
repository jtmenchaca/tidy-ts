/**
 * ID: SO#30132282
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: .str accessor on datetime Series. Wrong accessor for column type.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

dates = pd.to_datetime(pd.Series(['20010101', '20010331']), format='%Y%m%d')
dates.str
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { date: new Date("2001-01-01"), amount: 100 },
  { date: new Date("2001-03-31"), amount: 200 },
]);

// @ts-expect-error — Date[] is not assignable to number[]
s.mean(df.extract("date"));
