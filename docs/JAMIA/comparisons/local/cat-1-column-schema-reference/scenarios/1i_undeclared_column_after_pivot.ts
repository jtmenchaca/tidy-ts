/**
 * ID: 1i
 * Category: Column reference
 * Label: undeclared column after pivot
 * Intent: Pivot a long lab table wide, then access an output column whose name depends on data values.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { wide } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
vitals = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "metric": ["systolic", "diastolic", "systolic", "diastolic"],
    "value": [130, 85, 145, 92],
})
wide = vitals.pivot(index="patient_id", columns="metric", values="value").reset_index()
wide.columns.name = None
wide["fever"] = wide["temperature"] > 100
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(tidyr))
suppressPackageStartupMessages(library(dplyr))
vitals <- tibble(
  patient_id = c("P001", "P001", "P002", "P002"),
  metric = c("systolic", "diastolic", "systolic", "diastolic"),
  value = c(130, 85, 145, 92)
)
wide <- vitals %>% pivot_wider(names_from = metric, values_from = value)
wide <- wide %>% mutate(fever = temperature > 100.4)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
vitals = pl.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "metric": ["systolic", "diastolic", "systolic", "diastolic"],
    "value": [130, 85, 145, 92],
})
wide = vitals.pivot(on="metric", index="patient_id", values="value")
wide = wide.with_columns((pl.col("temperature") > 100).alias("fever"))
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
        metric: ["systolic", "diastolic", "systolic", "diastolic"],
        value: [130, 85, 145, 92],
      })
      .pivot("metric", { value: aq.op.any("value") })
      .derive({ fever: (d) => d.temperature > 100 }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — temperature not in expectedColumns
    wide.mutate({ fever: (r) => r.temperature > 100 }),
  (df) => `rows=${df.nrows()}`,
);
