/**
 * ID: SO#14992644
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Histogram on string DataFrame columns fails. Numeric operation on string data.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import numpy as np

df = pd.DataFrame({
    's1': ['a', 'b', 'a', 'c', 'a', 'b'],
    's2': ['a', 'f', 'a', 'd', 'a', 'f'],
})

counts, bins = np.histogram(df['s1'].values)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { s1: "a", s2: "a" },
  { s1: "b", s2: "f" },
  { s1: "a", s2: "a" },
  { s1: "c", s2: "d" },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(df.extract("s1"));
