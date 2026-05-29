/**
 * ID: SO#4231190
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: numpy array of tuples needs structured dtype. Type specification error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np

ph, pw = 3, 3
anArray = np.zeros((ph, pw), dtype="O")
for h in range(ph):
    for w in range(pw):
        anArray[h][w] = (float(h), float(w), 1.0)

np.linalg.svd(anArray)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const anArray = createDataFrame([
  { c0: "(0.0, 0.0, 1.0)", c1: "(0.0, 1.0, 1.0)", c2: "(0.0, 2.0, 1.0)" },
  { c0: "(1.0, 0.0, 1.0)", c1: "(1.0, 1.0, 1.0)", c2: "(1.0, 2.0, 1.0)" },
  { c0: "(2.0, 0.0, 1.0)", c1: "(2.0, 1.0, 1.0)", c2: "(2.0, 2.0, 1.0)" },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(anArray.extract("c0"));
