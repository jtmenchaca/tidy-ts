/**
 * ID: 4d
 * Category: Join
 * Label: string method on join-introduced null
 * Intent: Left-join encounters with patient details, then uppercase the patient name column.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { encounters17, patients17 } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
patients = pd.DataFrame({
    "patient_id": ["P1", "P2"],
    "name": ["Alice", "Bob"],
})
encounters = pd.DataFrame({
    "patient_id": ["P1"],
    "department": ["ED"],
    "los_days": [3],
})
joined = patients.merge(encounters, on="patient_id", how="left")
joined["dept_upper"] = joined["department"].str.upper()
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
patients <- tibble(
  patient_id = c("P1", "P2"),
  name = c("Alice", "Bob")
)
encounters <- tibble(
  patient_id = c("P1"),
  department = c("ED"),
  los_days = c(3)
)
joined <- patients %>% left_join(encounters, by = "patient_id")
joined <- joined %>% mutate(dept_upper = toupper(department))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
patients = pl.DataFrame({
    "patient_id": ["P1", "P2"],
    "name": ["Alice", "Bob"],
})
encounters = pl.DataFrame({
    "patient_id": ["P1"],
    "department": ["ED"],
    "los_days": [3],
})
joined = patients.join(encounters, on="patient_id", how="left")
joined = joined.with_columns(pl.col("department").str.to_uppercase().alias("dept_upper"))
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const patients = aq.table({
      patient_id: ["P1", "P2"],
      name: ["Alice", "Bob"],
    });
    const encounters = aq.table({
      patient_id: ["P1"],
      department: ["ED"],
      los_days: [3],
    });
    const joined = patients.join_left(encounters, ["patient_id", "patient_id"]);
    return joined.derive({ dept_upper: (d) => d.department.toUpperCase() });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const joined17 = patients17.leftJoin(encounters17, "patient_id");
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — department is string | undefined
    joined17.mutate({ upper: (r) => r.department.toUpperCase() }),
  (df) => `rows=${df.nrows()}`,
);
