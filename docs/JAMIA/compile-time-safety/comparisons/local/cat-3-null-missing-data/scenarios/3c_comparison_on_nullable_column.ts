/**
 * ID: 3c
 * Category: Missing value
 * Label: comparison on nullable column
 * Intent: Filter labs where the upper reference range is above 100.
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
critical = labs[labs["reference_high"] > 100]
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
critical <- labs %>% filter(reference_high > 100)
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
critical = labs.filter(pl.col("reference_high") > 100)
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
      .filter((d) => d.reference_high > 100),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — Object is possibly 'null'.
    labs05.filter((r) => r.reference_high > 100),
  (df) => `rows=${df.nrows()}`,
);
