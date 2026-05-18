/**
 * ID: SO#33199193
 * Language: Python
 * Bug class: Nullable
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: NaN in list-type column can't be filled with empty list. Missing value handling type mismatch.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "date": ["2011-04-23", "2011-04-24", "2011-04-25", "2011-04-26", "2011-04-27"],
    "ids": [[0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], np.nan, [0, 1, 2, 3]],
})

result = df.fillna([])
print(result)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { date: "2011-04-23", ids: [0, 1, 2, 3] as number[] | null },
  { date: "2011-04-24", ids: [0, 1, 2, 3] as number[] | null },
  { date: "2011-04-25", ids: [0, 1, 2, 3] as number[] | null },
  { date: "2011-04-26", ids: null as number[] | null },
  { date: "2011-04-27", ids: [0, 1, 2, 3] as number[] | null },
]);

// @ts-expect-error — (number[] | null)[] is not assignable to number[]
s.mean(df.extract("ids"));
