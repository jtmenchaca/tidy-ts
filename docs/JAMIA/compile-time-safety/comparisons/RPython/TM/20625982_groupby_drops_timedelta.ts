/**
 * ID: SO#20625982
 * Language: Python
 * Bug class: Column ref
 * Runtime consequence: DC
 * In study: Yes
 * Inclusion rationale: groupby.mean() silently drops timedelta column from output. Column vanishes with no error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import numpy as np

np.random.seed(42)
data = pd.DataFrame(np.random.rand(10, 2), columns=['f1', 'f2'])
data['td'] = pd.to_timedelta(np.random.rand(10) * 1e7, unit='ns')
data['group'] = ['A', 'B'] * 5

result = data.groupby('group').mean(numeric_only=True)
assert "td" not in result.columns
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const data = createDataFrame([
  { f1: 0.99, f2: 0.95, td_ns: 3066000, group: "A" },
  { f1: 0.28, f2: 0.99, td_ns: 1443000, group: "B" },
  { f1: 0.02, f2: 0.58, td_ns: 9257000, group: "A" },
  { f1: 0.05, f2: 0.51, td_ns: 702000, group: "B" },
  { f1: 0.85, f2: 0.18, td_ns: 396000, group: "A" },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(data.extract("group"));
