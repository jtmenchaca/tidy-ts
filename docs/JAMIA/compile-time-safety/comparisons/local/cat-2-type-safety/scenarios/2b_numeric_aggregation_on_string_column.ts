/**
 * ID: 2b
 * Category: Value type
 * Label: numeric aggregation on string column
 * Intent: Compute the mean of a lab test-name string column.
 */
import * as aq from "arquero";
import { stats as s } from "@tidy-ts/dataframe";
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
avg = labs.groupby("test_name")["test_name"].mean()
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
out <- labs %>% group_by(test_name) %>% summarise(avg = mean(test_name))
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
avg = labs.group_by("test_name").agg(pl.col("test_name").mean().alias("avg"))
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
      .groupby("test_name")
      .rollup({ avg: aq.op.mean("test_name") }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — No overload matches this call.
    labs.groupBy("test_name").summarize({ avg: (g) => s.mean(g.test_name) }),
  (df) => `rows=${df.nrows()}`,
);
