/**
 * ID: 3b
 * Category: Missing value
 * Label: arithmetic on nullable column
 * Intent: Compute the difference between each lab result value and the upper reference range.
 */
import * as aq from "arquero";
import { labs05 } from "../data.ts";
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
labs = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "result_value": [100, 200],
    "reference_high": [120, None],
})
labs["deviation"] = labs["result_value"] - labs["reference_high"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
labs <- tibble(
  patient_id = c("P001", "P002"),
  result_value = c(100, 200),
  reference_high = c(120, NA)
)
labs <- labs %>% mutate(deviation = result_value - reference_high)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
labs = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "result_value": [100, 200],
    "reference_high": [120, None],
})
labs = labs.with_columns((pl.col("result_value") - pl.col("reference_high")).alias("deviation"))
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
        patient_id: ["P001", "P002"],
        result_value: [100, 200],
        reference_high: [120, null],
      })
      .derive({ deviation: (d) => d.result_value - d.reference_high }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    labs05.mutate({ deviation: (r) => r.result_value - r.reference_high }),
  (df) => `rows=${df.nrows()}`,
);
