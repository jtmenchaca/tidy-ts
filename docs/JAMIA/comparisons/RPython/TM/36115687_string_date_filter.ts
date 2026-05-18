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
from datetime import datetime, timedelta

df = pd.DataFrame({
    "date": [
        "2015-07-02T11:22:21.050Z",
        "2015-06-01T11:22:21.050Z",
        "2016-03-20T21:00:00.000Z",
    ],
})

last_week = (datetime.today() - timedelta(days=7)).strftime("%Y-%m-%d")
result = df[df["date"] >= last_week]
print(result)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { date: "2015-07-02T11:22:21.050Z", value: 10 },
  { date: "2015-06-01T11:22:21.050Z", value: 20 },
  { date: "2016-03-20T21:00:00.000Z", value: 30 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("date"));
