/**
 * ID: SO#36115687
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: IF
 * In study: Yes
 * Inclusion rationale: PySpark filtering dates stored as strings — comparison uses string ordering not date ordering. Silent wrong results.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({
    'date': ['1/15/2015', '2/3/2015', '12/1/2014', '7/20/2015', '11/5/2015'],
    'value': [100, 200, 300, 400, 500],
})

cutoff = '6/30/2015'
filtered = df[df['date'] > cutoff]
print(filtered)

true_dates = pd.to_datetime(df['date'])
true_cutoff = pd.to_datetime(cutoff)
expected_count = int((true_dates > true_cutoff).sum())
assert len(filtered) < expected_count, "string compare silently drops dates after cutoff"
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { date: "1/15/2015", value: 100 },
  { date: "2/3/2015", value: 200 },
  { date: "12/1/2014", value: 300 },
  { date: "7/20/2015", value: 400 },
  { date: "11/5/2015", value: 500 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("date"));
