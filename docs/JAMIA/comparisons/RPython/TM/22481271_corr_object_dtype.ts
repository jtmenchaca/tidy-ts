/**
 * ID: SO#22481271
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: IF
 * In study: Yes
 * Inclusion rationale: corr() returns empty matrix on object-dtype columns. Numeric operation on string-typed data silently produces wrong result.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({
    "A": ["0.006", "-0.002", "0.010", "0.003", "0.002"],
    "B": ["-0.001", "-0.0005", "0.0003", "0.001", "-0.0002"],
    "C": ["0.003", "-0.002", "0.002", "-0.003", "0.002"],
})

result = df.corr(numeric_only=True)
print(result)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { A: " 0.006", B: "-0.001", C: " 0.003" },
  { A: " 0.002", B: "-0.001", C: "-0.002" },
  { A: " 0.010", B: " 0.000", C: " 0.002" },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(df.extract("A"));
