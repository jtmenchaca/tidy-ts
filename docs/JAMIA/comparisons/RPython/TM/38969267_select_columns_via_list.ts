/**
 * ID: SO#38969267
 * Language: Python
 * Bug class: Column ref
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Selecting columns via list fails when column doesn't exist. Column reference error.
 */
import { createDataFrame } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6], "c": [7, 8, 9]})
cols = ["a", "b", "missing_col"]
df_new = df[cols]
print(df_new)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);

if (false as boolean) {
  // @ts-expect-error — Argument of type '"missing_col"' is not assignable to parameter of type '"a" | "b" | "c"'.
  df.select("a", "b", "missing_col");
}
