/**
 * ID: 2i
 * Category: Value type
 * Label: date compared to number
 * Intent: Filter encounters where admission date is greater than 100.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { encounters22 } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
df_dates = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "admit_date": pd.to_datetime(["2024-01-15", "2024-02-20"]),
    "los_days": [3, 7],
})
filtered = df_dates[df_dates["admit_date"] > 100]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
df_dates <- tibble(
  patient_id = c("P001", "P002"),
  admit_date = as.Date(c("2024-01-15", "2024-02-20")),
  los_days = c(3, 7)
)
filtered <- df_dates %>% filter(admit_date > 100)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
df_dates = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "admit_date": [pl.date(2024, 1, 15), pl.date(2024, 2, 20)],
    "los_days": [3, 7],
})
filtered = df_dates.filter(pl.col("admit_date") > 100)
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
        admit_date: [new Date("2024-01-15"), new Date("2024-02-20")],
        los_days: [3, 7],
      })
      .filter((d) => d.admit_date > 100),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — Operator '>' cannot be applied to types 'PlainDate' and 'number'.
    encounters22.filter((r) => r.admit_date > 100),
  (df) => `rows=${df.nrows()}`,
);
