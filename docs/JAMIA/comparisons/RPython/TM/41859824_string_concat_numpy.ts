/**
 * ID: SO#41859824
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: String concatenation with numpy numeric types fails. Arithmetic on wrong type. Original 'add' bug fixed in modern numpy; reproduced with 'multiply' variant which still crashes.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np

vals = np.array(['5.0', '9.8'])
x = np.linspace(0., 9., 10)

y = vals[0] * x
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { distance: "1.0", d_prob: "0.2", efficiency: "0.8", e_prob: "0.1" },
  { distance: "2.0", d_prob: "0.3", efficiency: "0.6", e_prob: "0.2" },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("distance"));
