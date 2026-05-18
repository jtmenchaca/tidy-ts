/**
 * ID: SO#17950374
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Concatenating int column with string fails. Type mismatch in string operation.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({
    'id': [1, 2, 3],
    'prefix': ['A', 'B', 'C'],
})

df['combined'] = df['prefix'] + df['id']
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { id: 1, prefix: "A" },
  { id: 2, prefix: "B" },
  { id: 3, prefix: "C" },
]);

const result = df.mutate({ combined: (r) => r.prefix + r.id });

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(result.extract("combined"));
