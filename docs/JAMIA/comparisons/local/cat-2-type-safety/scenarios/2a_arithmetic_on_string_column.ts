/**
 * ID: 2a
 * Category: Value type
 * Label: arithmetic on string column
 * Intent: Multiply a lab test-name string column by 10.
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
labs["adjusted"] = labs["test_name"] + 10
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
labs <- labs %>% mutate(adjusted = test_name + 10)
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
labs = labs.with_columns((pl.col("test_name") + 10).alias("adjusted"))
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
      .derive({ adjusted: (d) => d.test_name + 10 }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    labs.mutate({
      // @ts-expect-error — The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
      adjusted: (r) => r.test_name * 10,
    }),
  (df) => `rows=${df.nrows()}`,
);
