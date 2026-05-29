/**
 * ID: 2c
 * Category: Value type
 * Label: number compared to string literal
 * Intent: Filter labs where result value equals the string `"high"`.
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
    "patient_id": ["P001", "P002"],
    "test_name": ["BNP", "WBC"],
    "result_value": [7.2, 140],
})
filtered = labs[labs["result_value"] == "high"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
labs <- tibble(
  patient_id = c("P001", "P002"),
  test_name = c("BNP", "WBC"),
  result_value = c(7.2, 140)
)
out <- labs %>% filter(result_value == "high")
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
labs = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "test_name": ["BNP", "WBC"],
    "result_value": [7.2, 140],
})
filtered = labs.filter(pl.col("result_value") == "high")
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
        test_name: ["BNP", "WBC"],
        result_value: [7.2, 140],
      })
      .filter((d) => d.result_value === "high"),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — This comparison appears to be unintentional because the types 'number' and 'string' have no overlap.
    labs.filter((r) => r.result_value === "high"),
  (df) => `rows=${df.nrows()}`,
);
