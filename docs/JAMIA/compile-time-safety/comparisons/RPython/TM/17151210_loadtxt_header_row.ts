/**
 * ID: SO#17151210
 * Language: Python
 * Bug class: Data loading
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: numpy loadtxt fails on header/comment rows. Non-numeric content in numeric load.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np
import tempfile, os

content = """# Comment 1
# Comment 2
x,y,z
1,2,3
4,5,6
7,8,9
"""

tmpfile = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
tmpfile.write(content)
tmpfile.close()

try:
    FH = np.loadtxt(tmpfile.name, comments='#', delimiter=',', skiprows=1)
finally:
    os.unlink(tmpfile.name)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

// If the loader produced string columns (wrong skip rule, header parsed as data),
// downstream numeric operations are rejected by the type system.
const df = createDataFrame([
  { x: "x", y: "y", z: "z" },
  { x: "1", y: "2", z: "3" },
  { x: "4", y: "5", z: "6" },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(df.extract("x"));
