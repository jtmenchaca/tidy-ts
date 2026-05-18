/**
 * ID: SO#16067144
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: DC
 * In study: Yes
 * Inclusion rationale: fillna on float column with string requires astype(object), silently converting all columns to object dtype.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import io
import pandas as pd

csv = """a,a,,a
b,b,,b
c,c,,c"""

df = pd.read_csv(io.StringIO(csv), header=None)
bad = df.fillna({2: "UNKNOWN"})
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { col0: "a", col1: "a", col2: null, col3: "a" },
  { col0: "b", col1: "b", col2: null, col3: "b" },
  { col0: "c", col1: "c", col2: null, col3: "c" },
]);

const corrupted = df.replaceNull({ col2: "UNKNOWN" });

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(corrupted.extract("col2"));
