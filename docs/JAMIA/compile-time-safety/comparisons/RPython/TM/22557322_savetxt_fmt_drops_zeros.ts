/**
 * ID: SO#22557322
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: IF
 * In study: Yes
 * Inclusion rationale: numpy savetxt fmt='%i' on float array silently drops zeroes. Format/type mismatch produces wrong output.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np
import io

result = np.array([
    [1.0, 2.0],
    [2.0, 0.0],
    [3.0, 9.0],
    [4.0, 0.0],
    [5.0, 3.0],
])

buf = io.BytesIO()
np.savetxt(buf, result, fmt='%i', delimiter=',')
print(buf.getvalue().decode())
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { col1: 1.0, col2: 2.0 },
  { col1: 2.0, col2: 0.0 },
  { col1: 3.0, col2: 9.0 },
  { col1: 4.0, col2: 0.0 },
  { col1: 5.0, col2: 3.0 },
]);

const formatted = df.mutate({ col2_str: (r) => r.col2.toFixed(0) });

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.sum(formatted.extract("col2_str"));
