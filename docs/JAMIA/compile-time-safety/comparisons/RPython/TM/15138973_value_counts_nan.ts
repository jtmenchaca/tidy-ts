/**
 * ID: SO#15138973
 * Language: Python
 * Bug class: Nullable
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: value_counts().max() fails because NaN in results. Missing values propagate into aggregation.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import numpy as np

df = pd.DataFrame({
    'item': ['apple', 'banana', 'apple', np.nan, 'banana', 'apple', np.nan],
})

items_counts = df['item'].value_counts()
max_item = items_counts.max()
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { item: "apple" as string | null },
  { item: "banana" },
  { item: "apple" },
  { item: null },
  { item: "banana" },
  { item: "apple" },
  { item: null },
]);

// @ts-expect-error — Type '(string | null)[]' is not assignable to type 'number[]'
s.mean(df.extract("item"));
