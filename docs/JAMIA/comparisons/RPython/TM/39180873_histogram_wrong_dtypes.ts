/**
 * ID: SO#39180873
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Histogram on DataFrame with wrong dtypes. Numeric operation on non-numeric.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np
import pandas as pd

x_train = np.array(
    [
        ["0", "0", "0", "0", "0", "0"],
        ["1", "1", "0", "0", "0", "0"],
        ["0", "0", "0", "0", "0", "0"],
    ],
    dtype=object,
)

names = ["buying", "maint", "doors", "persons", "lug_boot", "safety"]
custom = pd.DataFrame(x_train)
custom.columns = names
np.histogram(custom['buying'].values)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const custom = createDataFrame([
  { buying: "0", maint: "0", doors: "0", persons: "0", lug_boot: "0", safety: "0" },
  { buying: "1", maint: "1", doors: "0", persons: "0", lug_boot: "0", safety: "0" },
  { buying: "0", maint: "0", doors: "0", persons: "0", lug_boot: "0", safety: "0" },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(custom.extract("buying"));
