/**
 * ID: SO#12588986
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Inplace add on numpy object array with float64 fails. Type conflict in arithmetic.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np

b = np.zeros(1)
c = np.zeros(1)
c = c / 2**63

b += c
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

// Analogous shape: a frame mixing numeric and non-numeric columns to mimic
// numpy's silent object-dtype promotion.
const mixed = createDataFrame([
  { b: 0.0, label: "x" },
]);
const transposed = mixed.transpose({ numberOfRows: 1 });

// @ts-expect-error — Type '(string | number)[]' is not assignable to type 'number[]'
s.sum(transposed.extract("row_0"));
