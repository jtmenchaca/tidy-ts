/**
 * ID: SO#19864028
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Column contains 'na' string alongside numbers, preventing float conversion. Mixed types.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({
    'cap': ['5.2', 'na', '2.2', '7.6', '7.5', '3.0']
})

df['cap'] = df['cap'].astype(float)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { cap: "5.2" },
  { cap: "na" },
  { cap: "2.2" },
  { cap: "7.6" },
  { cap: "7.5" },
  { cap: "3.0" },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(df.extract("cap"));
