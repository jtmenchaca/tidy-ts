/**
 * ID: SO#50916422
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: numpy int64 extracted from DataFrame not JSON serializable. Tidy-ts values are native JS types.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import json

df = pd.DataFrame({'store': ['A', 'B', 'C'], 'count': [10, 12, 5]})

record = {'name': df['store'].iloc[0], 'count': df['count'].iloc[0]}
json.dumps(record)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { store: "A", count: 10 },
  { store: "B", count: 12 },
  { store: "C", count: 5 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.sum(df.extract("store"));
