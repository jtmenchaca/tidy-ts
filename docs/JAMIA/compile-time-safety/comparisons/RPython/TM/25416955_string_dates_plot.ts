/**
 * ID: SO#25416955
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Matplotlib date axis from string column not parsed. String where date expected.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({
    'time': ['2014-07-10 11:49:14', '2014-07-10 11:50:14', '2014-07-10 11:51:14'],
    'amount': [45, 45, 21],
})

diff = df['time'].iloc[1] - df['time'].iloc[0]
print(f"diff: {diff}")
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { time: "2014-07-10 11:49:14", amount: 45 },
  { time: "2014-07-10 11:50:14", amount: 45 },
  { time: "2014-07-10 11:51:14", amount: 21 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("time"));
