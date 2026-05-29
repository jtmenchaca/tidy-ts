/**
 * ID: SO#37513355
 * Language: Python
 * Bug class: Data loading
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Spark schema inference fails on mixed types. Load-time type inference error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

df = pd.DataFrame({
    "id": ["10000001", "10000001", "10000002"],
    "status": ["OK", "OK", "PA"],
    "score": [543, 611, 691],
    "mixed_col": [1.5, "NA", 3.2],
})

result = df["mixed_col"].astype(float)
print(result)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { id: "10000001", status: "OK", score: 543, mixed_col: 1.5 as number | string },
  { id: "10000001", status: "OK", score: 611, mixed_col: "NA" as number | string },
  { id: "10000002", status: "PA", score: 691, mixed_col: 3.2 as number | string },
]);

// @ts-expect-error — (number | string)[] is not assignable to number[]
s.mean(df.extract("mixed_col"));
