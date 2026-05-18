/**
 * ID: SO#31521526
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Currency string "(1,234.56)" can't convert to float. String format vs numeric type.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({'Currency': ['$1.00', '$2,000.00', '(3,000.00)']})
df[['Currency']] = df[['Currency']].replace(r'[\\$,]', '', regex=True).astype(float)
print(df)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { currency: "$1.00" },
  { currency: "$2,000.00" },
  { currency: "(3,000.00)" },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.sum(df.extract("currency"));
