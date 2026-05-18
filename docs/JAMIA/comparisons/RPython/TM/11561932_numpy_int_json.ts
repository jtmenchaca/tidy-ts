/**
 * ID: SO#11561932
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: numpy int32 in list not JSON serializable. Same native type pattern.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import json
import numpy as np

arr = np.arange(5)
json.dumps(list(arr))
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { idx: 0, label: "a" },
  { idx: 1, label: "b" },
  { idx: 2, label: "c" },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.sum(df.extract("label"));
