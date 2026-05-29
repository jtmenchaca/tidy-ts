/**
 * ID: 4g
 * Category: Join
 * Label: explicit suffix then access original name
 * Intent: Inner-join two tables with column collisions using an explicit suffix, then access the original column name.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { admissions, discharges } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
admissions = pd.DataFrame({
    "patient_id": ["P1"],
    "date": ["2024-01-15"],
    "department": ["ED"],
})
discharges = pd.DataFrame({
    "patient_id": ["P1"],
    "date": ["2024-01-18"],
    "disposition": ["Home"],
})
joined = admissions.merge(discharges, on="patient_id", suffixes=("_admit", "_discharge"))
val = joined["date"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
admissions <- tibble(
  patient_id = c("P1"),
  date = c("2024-01-15"),
  department = c("ED")
)
discharges <- tibble(
  patient_id = c("P1"),
  date = c("2024-01-18"),
  disposition = c("Home")
)
joined <- admissions %>%
  inner_join(discharges, by = "patient_id", suffix = c("_admit", "_discharge"))
joined %>% select(all_of("date"))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
admissions = pl.DataFrame({
    "patient_id": ["P1"],
    "date": ["2024-01-15"],
    "department": ["ED"],
})
discharges = pl.DataFrame({
    "patient_id": ["P1"],
    "date": ["2024-01-18"],
    "disposition": ["Home"],
})
joined = admissions.join(discharges, on="patient_id", suffix="_discharge")
val = joined["date"]
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const admissions = aq.table({
      patient_id: ["P1"],
      date: ["2024-01-15"],
      department: ["ED"],
    });
    const discharges = aq.table({
      patient_id: ["P1"],
      date: ["2024-01-18"],
      disposition: ["Home"],
    });
    const joined = admissions.join(discharges, ["patient_id", "patient_id"]);
    return joined.select("date");
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const withSuffixes = admissions.innerJoin(discharges, {
  keys: ["patient_id"],
  suffixes: { left: "_admit", right: "_discharge" },
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — date no longer exists after suffixed join
    withSuffixes.mutate({ d: (r) => r.date }),
  (df) => `rows=${df.nrows()}`,
);
