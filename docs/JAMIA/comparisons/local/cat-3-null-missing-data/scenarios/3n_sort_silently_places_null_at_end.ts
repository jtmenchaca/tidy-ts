/**
 * ID: 3n
 * Category: Missing value
 * Label: sort silently places null at end
 * Intent: Sort labs by result value, take the top 5.
 */
import * as aq from "arquero";
import { labs26 } from "../data.ts";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
import numpy as np
labs = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "result_value": [100, np.nan, 50],
})
sorted_df = labs.sort_values("result_value")
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
labs <- tibble(
  patient_id = c("P001", "P002", "P003"),
  result_value = c(100, NA, 50)
)
sorted_df <- labs %>% arrange(result_value)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
labs = pl.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "result_value": [100, None, 50],
})
sorted_df = labs.sort("result_value")
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () =>
    aq
      .table({
        patient_id: ["P001", "P002", "P003"],
        result_value: [100, null, 50],
      })
      .orderby("result_value"),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const sorted26 = labs26.arrange("result_value", "asc");
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    sorted26.mutate({ doubled: (r) => r.result_value * 2 }),
  (df) => `rows=${df.nrows()}`,
);
