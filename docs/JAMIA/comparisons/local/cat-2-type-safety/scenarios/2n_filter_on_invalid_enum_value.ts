/**
 * ID: 2n
 * Category: Value type
 * Label: filter on invalid enum value
 * Intent: Filter encounters where status equals `"unknown"` when Status is a closed enum.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { encounters34 } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
encounters = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "status": pd.Categorical(["admitted", "discharged"],
                              categories=["admitted", "discharged", "transferred"]),
})
filtered = encounters[encounters["status"] == "unknown"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
encounters <- tibble(
  patient_id = c("P001", "P002"),
  status = factor(c("admitted", "discharged"),
                  levels = c("admitted", "discharged", "transferred"))
)
filtered <- encounters %>% filter(status == "unknown")
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
encounters = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "status": pl.Series(["admitted", "discharged"]).cast(pl.Enum(["admitted", "discharged", "transferred"])),
})
filtered = encounters.filter(pl.col("status") == "unknown")
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
        status: ["admitted", "discharged"],
      })
      .filter((d) => d.status === "unknown"),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — This comparison appears to be unintentional because the types 'Status' and '"unknown"' have no overlap.
    encounters34.filter((r) => r.status === "unknown"),
  (df) => `rows=${df.nrows()}`,
);
