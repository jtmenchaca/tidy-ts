/**
 * ID: SO#48719937
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: idxmax() on object-dtype column fails. Numeric reduction on wrong type.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

c_params = [0.01, 0.1, 1, 10, 100]
results = pd.DataFrame(index=range(len(c_params), 2), columns=['C_parameter', 'Mean recall score'])
results['C_parameter'] = c_params

recall_scores = [0.95, 0.90, 0.92, 0.92, 0.92]
for j, score in enumerate(recall_scores):
    results.iloc[j, 1] = score

best = results.loc[results['Mean recall score'].idxmax()]['C_parameter']
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const results = createDataFrame([
  { C_parameter: 0.01, mean_recall: "0.95" },
  { C_parameter: 0.1, mean_recall: "0.90" },
  { C_parameter: 1, mean_recall: "0.92" },
  { C_parameter: 10, mean_recall: "0.92" },
  { C_parameter: 100, mean_recall: "0.92" },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.max(results.extract("mean_recall"));
