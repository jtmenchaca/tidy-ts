/**
 * ID: SO#42013903
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: raw_input returns string, used in numpy multiply. String where number expected.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np

x = np.linspace(0., 9., 10)

a = "9.8"
v = "5.0"

y = v * x - 0.5 * a * x**2.
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { x: 0, acceleration: "9.8", velocity: "5.0" },
  { x: 1, acceleration: "9.8", velocity: "5.0" },
  { x: 2, acceleration: "9.8", velocity: "5.0" },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("acceleration"));
