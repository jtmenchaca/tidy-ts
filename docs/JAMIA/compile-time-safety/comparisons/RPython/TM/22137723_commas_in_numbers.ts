/**
 * ID: SO#22137723
 * Language: Python
 * Bug class: Data loading
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Number strings with commas fail conversion. Data format vs expected type at load.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({'amount': ['1,200', '4,200', '7,000', '-0.03', '5', '0']})

df['amount'].astype(float)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { amount: "1,200" },
  { amount: "4,200" },
  { amount: "7,000" },
  { amount: "-0.03" },
  { amount: "5" },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.sum(df.extract("amount"));
