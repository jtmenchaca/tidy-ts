/**
 * ID: SO#31269216
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: str.upper() on mixed-type column fails. String method on non-string data.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import numpy as np

df = pd.DataFrame({'ID': ['abc', 'def', 123, np.nan, 'ghi']})
df['ID'] = list(map(str.upper, df['ID']))
print(df)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { id: "abc" as string | number | null },
  { id: "def" as string | number | null },
  { id: 123 as string | number | null },
  { id: null as string | number | null },
  { id: "ghi" as string | number | null },
]);

// @ts-expect-error — (string | number | null)[] is not assignable to number[]
s.mean(df.extract("id"));
