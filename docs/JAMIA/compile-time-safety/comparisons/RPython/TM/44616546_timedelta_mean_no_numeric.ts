/**
 * ID: SO#44616546
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: DC
 * In study: Yes
 * Inclusion rationale: timedelta column mean() fails "no numeric types to aggregate". On modern pandas, silently drops column instead of crashing (DC behavior).
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({
    'bank': ['Bank of Japan', 'Bank of Japan', 'Fed', 'Fed'],
    'diff': pd.to_timedelta(['57s', '21s', '8 days', '2 days']),
})

means = df.groupby('bank').mean(numeric_only=True)
print(list(means.columns))
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { bank: "Bank of Japan", diff: "57s" },
  { bank: "Bank of Japan", diff: "21s" },
  { bank: "Fed", diff: "8 days" },
  { bank: "Fed", diff: "2 days" },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("diff"));
