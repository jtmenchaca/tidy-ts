/**
 * ID: 1p
 * Category: Column reference
 * Label: access non-summarized column after summarize
 * Intent: Group labs by patient and summarize mean value, then access an original lab column on the summarized result (symmetric to 1h via a different access path).
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
import { labsGrouped } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
labs = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "test_name": ["BNP", "WBC", "BNP", "WBC"],
    "result_value": [1250, 15, 450, 8],
})
summary = labs.groupby("patient_id").agg(mean_val=("result_value", "mean")).reset_index()
summary["t"] = summary["test_name"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
labs <- tibble(
  patient_id = c("P001", "P001", "P002", "P002"),
  test_name = c("BNP", "WBC", "BNP", "WBC"),
  result_value = c(1250, 15, 450, 8)
)
summary <- labs %>% group_by(patient_id) %>%
  summarise(mean_val = mean(result_value))
summary <- summary %>% mutate(t = test_name)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
labs = pl.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "test_name": ["BNP", "WBC", "BNP", "WBC"],
    "result_value": [1250, 15, 450, 8],
})
summary = labs.group_by("patient_id").agg(pl.col("result_value").mean().alias("mean_val"))
summary = summary.with_columns(pl.col("test_name").alias("t"))
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
        patient_id: ["P001", "P001", "P002", "P002"],
        test_name: ["BNP", "WBC", "BNP", "WBC"],
        result_value: [1250, 15, 450, 8],
      })
      .groupby("patient_id")
      .rollup({ mean_val: aq.op.mean("result_value") })
      .derive({ t: (d) => d.test_name }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const summaryP = labsGrouped.groupBy("patient_id").summarize({
  mean_val: (g) => s.mean(g.result_value),
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — test_name not in summarize result
    summaryP.mutate({ t: (r) => r.test_name }),
  (df) => `rows=${df.nrows()}`,
);
