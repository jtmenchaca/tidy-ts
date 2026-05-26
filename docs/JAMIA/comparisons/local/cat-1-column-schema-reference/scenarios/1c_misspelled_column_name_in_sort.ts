/**
 * ID: 1c
 * Category: Column reference
 * Label: misspelled column name in sort
 * Intent: Sort encounters by admission date.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { labs } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
labs = pd.DataFrame({
    "lab_id": ["L001"],
    "patient_id": ["P001"],
    "result_value": [7.2],
})
sorted_labs = labs.sort_values("result_values", ascending=False)
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
labs <- tibble(
  lab_id = c("L001"),
  patient_id = c("P001"),
  result_value = c(7.2)
)
sorted_labs <- labs %>% arrange(desc(result_values))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
labs = pl.DataFrame({
    "lab_id": ["L001"],
    "patient_id": ["P001"],
    "result_value": [7.2],
})
sorted_labs = labs.sort("result_values", descending=True)
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
        lab_id: ["L001"],
        patient_id: ["P001"],
        result_value: [7.2],
      })
      .orderby("result_values"),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — 'result_values' is not a column on this DataFrame
    labs.arrange("result_values", "desc"),
  (df) => `rows=${df.nrows()}`,
);
