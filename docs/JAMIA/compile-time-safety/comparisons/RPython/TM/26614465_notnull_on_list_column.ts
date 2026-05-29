/**
 * ID: SO#26614465
 * Language: Python
 * Bug class: Nullable
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: pd.notnull on list returns array, breaks if-condition. Null-check returns unexpected type.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "A": ["one", "two", "three"],
    "C": [["foo", "bar"], np.nan, ["baz"]],
})

def my_func(row):
    pass

df[['A', 'C']].apply(
    lambda x: my_func(x) if pd.notnull(x.iloc[1]) else x, axis=1
)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { a: "one", c: [1, 2, 3] as number[] | null },
  { a: "two", c: null as number[] | null },
  { a: "three", c: [4, 5] as number[] | null },
]);

// @ts-expect-error — Argument of type '(number[] | null)[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(df.extract("c"));
