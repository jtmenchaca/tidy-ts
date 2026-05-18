/**
 * ID: SO#16988526
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: IF
 * In study: Yes
 * Inclusion rationale: CSV reader infers '1234E5' as float instead of string. Silent wrong type at load. Original bug fixed in pandas 0.11.1, but same class of bug reproduced with leading-zero identifiers ('007' → 7).
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import tempfile, os

csv_content = "id,value\\n007,hello\\n042,world\\n100,foo\\n"
path = tempfile.mktemp(suffix='.csv')
with open(path, 'w') as f:
    f.write(csv_content)

df = pd.read_csv(path)
assert pd.api.types.is_integer_dtype(df['id'].dtype) and df['id'].iloc[0] == 7
os.unlink(path)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { id: "007", value: "hello" },
  { id: "042", value: "world" },
  { id: "100", value: "foo" },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(df.extract("id"));
