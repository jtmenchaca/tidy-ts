/**
 * ID: SO#48062499
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: IF
 * In study: Yes
 * Inclusion rationale: Y-axis data plotted as strings, not sorted numerically. String where number expected. Data processing error visible in output.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np

Solar = ["50.35", "41.01", "69.16", "94.5", "111.9",
         "103", "98.6", "36.45", "34.74", "34.17", "34.6"]

order = np.argsort(Solar)
sorted_solar = np.array(Solar)[order]
print(list(sorted_solar))
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { time: "07:00", solar: "50.35" },
  { time: "08:00", solar: "41.01" },
  { time: "09:00", solar: "69.16" },
  { time: "10:00", solar: "94.5" },
  { time: "11:00", solar: "111.9" },
  { time: "12:00", solar: "103" },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("solar"));
