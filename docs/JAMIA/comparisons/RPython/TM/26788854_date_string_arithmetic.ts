/**
 * ID: SO#26788854
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Date string "03011979" used in datetime arithmetic. String where temporal type expected.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
from datetime import datetime

df = pd.DataFrame({
    'name': ['DOE', 'BOURNE', 'GRINCH'],
    'dob': ['03011979', '06111978', '12131988'],
})

now = datetime.now()

df['age'] = now - df['dob']
print(df)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { name: "DOE", dob: "03011979" },
  { name: "BOURNE", dob: "06111978" },
  { name: "GRINCH", dob: "12131988" },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(df.extract("dob"));
