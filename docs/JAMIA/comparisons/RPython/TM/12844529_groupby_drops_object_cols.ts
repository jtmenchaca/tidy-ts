/**
 * ID: SO#12844529
 * Language: Python
 * Bug class: Column ref
 * Runtime consequence: DC
 * In study: Yes
 * Inclusion rationale: groupby aggregate silently drops object-dtype columns. Output missing columns, no warning.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({
    'city': ['NYC', 'NYC', 'LA', 'LA'],
    'temp': ['72', '75', '80', '82'],
    'humidity': ['45', '50', '60', '55'],
})

result = df.groupby('city').mean(numeric_only=True)
assert "temp" not in result.columns and "humidity" not in result.columns
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { city: "NYC", temp: "72", humidity: "45" },
  { city: "NYC", temp: "75", humidity: "50" },
  { city: "LA", temp: "80", humidity: "60" },
  { city: "LA", temp: "82", humidity: "55" },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.mean(df.extract("temp"));
