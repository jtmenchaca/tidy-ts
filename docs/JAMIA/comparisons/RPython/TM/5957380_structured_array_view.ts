/**
 * ID: SO#5957380
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Structured array to regular ndarray conversion fails. Type conversion error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np

data = np.array(
    [
        (0.01479368, 0.00668112, 0.0, 0.0),
        (0.01479368, 0.00668112, 0.0, 0.0),
    ],
    dtype=[("a_soil", "<f4"), ("b_soil", "<f4"), ("Ea_V", "<f4"), ("Kcc", "<f4")],
)

data_array = data.view(np.float64).reshape(data.shape + (-1,))
print(data_array)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const data = createDataFrame([
  { a_soil: 0.01479368, b_soil: 0.00668112, Ea_V: 0.0, Kcc: 0.0 },
  { a_soil: 0.01479368, b_soil: 0.00668112, Ea_V: 0.0, Kcc: 0.0 },
]);

// @ts-expect-error — object[] is not assignable to number[]
s.mean(data.toRows());
