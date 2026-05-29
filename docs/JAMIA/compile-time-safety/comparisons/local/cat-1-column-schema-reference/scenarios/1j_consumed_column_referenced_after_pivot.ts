/**
 * ID: 1j
 * Category: Column reference
 * Label: consumed column referenced after pivot
 * Intent: Pivot a long lab table wide, then access the column whose values were used as the new column names.
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
filtered = wide[wide["metric"] == "systolic"]
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
filtered <- wide %>% filter(metric == "systolic")
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
filtered = wide.filter(pl.col("metric") == "systolic")
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
      .filter((d) => d.metric === "systolic"),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — metric no longer exists after pivot
    wide.filter((r) => r.metric === "systolic"),
  (df) => `rows=${df.nrows()}`,
);
