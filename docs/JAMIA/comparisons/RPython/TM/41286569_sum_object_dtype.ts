/**
 * ID: SO#41286569
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: DC
 * In study: Yes
 * Inclusion rationale: df.sum() on object-dtype column concatenates strings instead of adding numbers. Numeric op on wrong type.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({
    'X': ['A', 'B', 'C', 'D'],
    'MyColumn': ['84', '76', '28', '19'],
    'Y': [13.0, 77.0, 69.0, 20.0],
})

result = df['MyColumn'].sum()
print(f"sum() result: {result!r}")
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { X: "A", MyColumn: "84", Y: 13.0 },
  { X: "B", MyColumn: "76", Y: 77.0 },
  { X: "C", MyColumn: "28", Y: 69.0 },
  { X: "D", MyColumn: "19", Y: 20.0 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.sum(df.extract("MyColumn"));
