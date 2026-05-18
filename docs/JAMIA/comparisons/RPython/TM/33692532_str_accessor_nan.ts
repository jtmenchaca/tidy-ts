/**
 * ID: SO#33692532
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: .str accessor on column with NaN fails. Wrong accessor for column state (nullable).
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import numpy as np

df = pd.DataFrame({'data': ['100M', '5M', '75M', np.nan, '90M']})
result = df['data'].str.extract(r'(\\d+)').astype(float)
print(result)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { data: "100M" as string | null },
  { data: "5M" },
  { data: "75M" },
  { data: null },
  { data: "90M" },
]);

// @ts-expect-error — (string | null)[] is not assignable to number[]
s.mean(df.extract("data"));
