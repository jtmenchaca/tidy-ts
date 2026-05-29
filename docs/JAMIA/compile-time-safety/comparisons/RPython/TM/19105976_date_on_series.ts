/**
 * ID: SO#19105976
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: .date() called on Series instead of element. Typed mutate enforces value-level operations.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

dates = pd.to_datetime(pd.Series(['2023-01-15', '2023-02-20', '2023-03-25']))

result = dates.date()
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { created_date: "2023-01-15 10:30:00", amount: 100 },
  { created_date: "2023-02-20 14:15:00", amount: 200 },
  { created_date: "2023-03-25 09:45:00", amount: 300 },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(df.extract("created_date"));
