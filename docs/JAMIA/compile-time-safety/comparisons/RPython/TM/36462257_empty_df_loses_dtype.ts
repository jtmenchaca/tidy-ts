/**
 * ID: SO#36462257
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Empty DataFrame loses dtype specification. Schema lost through operation.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame(
    index=['pbp'],
    columns=['contract', 'state', 'membership', 'raf'],
    dtype=['str', 'str', 'int', 'float']
)
print(df)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { contract: "H1234", state: "CA", membership: 500, raf: 1.05 },
  { contract: "H5678", state: "TX", membership: 300, raf: 0.92 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("contract"));
