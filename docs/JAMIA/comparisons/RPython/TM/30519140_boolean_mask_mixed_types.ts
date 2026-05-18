/**
 * ID: SO#30519140
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Boolean mask on mixed-dtype DataFrame fails. Type inconsistency across columns.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({'A': [1, 2, 3], 'B': ['a', 'b', 'f']})
mask = df.isin([1, 3, 12, 'a'])
df[mask] = 30
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { a: 1, b: "a" },
  { a: 2, b: "b" },
  { a: 3, b: "f" },
]);

const mixed = df.mutate({ b: (r) => r.a === 1 ? 30 : r.b });

// @ts-expect-error — (string | number)[] is not assignable to number[]
s.mean(mixed.extract("b"));
