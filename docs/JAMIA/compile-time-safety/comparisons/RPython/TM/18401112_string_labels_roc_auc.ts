/**
 * ID: SO#18401112
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: String labels ('0','1') instead of int labels for roc_auc_score. Wrong type at data load.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np
from sklearn.metrics import roc_auc_score

y_scores = np.array([0.63, 0.53, 0.36, 0.02, 0.70, 1, 0.48, 0.46, 0.57])
y_true = np.array(['0', '1', '0', '0', '1', '1', '1', '1', '1'])

roc_auc_score(y_true, y_scores)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { score: 0.63, label: "0" },
  { score: 0.53, label: "1" },
  { score: 0.36, label: "0" },
  { score: 0.70, label: "1" },
  { score: 1.0, label: "1" },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(df.extract("label"));
