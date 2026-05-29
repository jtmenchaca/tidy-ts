/**
 * ID: SO#47333227
 * Language: Python
 * Bug class: Nullable
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: NaN in column prevents astype(int). Missing values block type conversion.
 */
import { createDataFrame } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import numpy as np

df = pd.DataFrame({
    'x': [1.0, 2.0, np.nan, 4.0, 5.0],
    'y': [10, 20, 30, 40, 50],
})

df[['x']] = df[['x']].astype(int)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { x: 1.0 as number | null, y: 10 },
  { x: 2.0, y: 20 },
  { x: null, y: 30 },
  { x: 4.0, y: 40 },
  { x: 5.0, y: 50 },
]);

// @ts-expect-error — 'x' is possibly 'null'
df.mutate({ x_int: (r) => Math.round(r.x) });
