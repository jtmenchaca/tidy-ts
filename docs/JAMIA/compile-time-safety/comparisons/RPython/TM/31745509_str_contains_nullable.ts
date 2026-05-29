/**
 * ID: SO#31745509
 * Language: Python
 * Bug class: Nullable
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: str.contains on nullable column returns NaN, bitwise NOT fails on NaN. Missing values break operations.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import numpy as np

df = pd.DataFrame({'V': ['File corruption', 'Registry error', np.nan, 'File missing', 'Other issue']})
filtered = df[~df['V'].str.contains("File|Registry")]
print(filtered)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { v: "File corruption" as string | null },
  { v: "Registry error" },
  { v: null },
  { v: "File missing" },
  { v: "Other issue" },
]);

// @ts-expect-error — (string | null)[] is not assignable to number[]
s.mean(df.extract("v"));
