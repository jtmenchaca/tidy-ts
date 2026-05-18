/**
 * ID: SO#27413843
 * Language: Python
 * Bug class: Data loading
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: read_table fails with wrong separator — loads as single column. Schema mismatch at load.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import tempfile
import os

content = """Investment Data
17.749000   0.66007000    0.15122000   0.33150000
3.9480000   0.52889000    0.11523000   0.56233000
14.810000    3.7480300    0.57099000   0.12111000
"""

tmpfile = tempfile.NamedTemporaryFile(mode='w', suffix='.dat', delete=False)
tmpfile.write(content)
tmpfile.close()

df = pd.read_table(tmpfile.name, skiprows=[0], sep="")
print(df)

os.unlink(tmpfile.name)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { line: "17.749000   0.66007000    0.15122000   0.33150000" },
  { line: "3.9480000   0.52889000    0.11523000   0.56233000" },
  { line: "14.810000    3.7480300    0.57099000   0.12111000" },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(df.extract("line"));
