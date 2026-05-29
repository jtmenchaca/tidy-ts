/**
 * ID: 4f
 * Category: Join
 * Label: comparison silently excludes null rows
 * Intent: Left-join encounters with stays, then filter where length of stay is greater than 2.
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
long_stays = joined[joined["los_days"] > 2]
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
long_stays <- joined %>% filter(los_days > 2)
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
long_stays = joined.filter(pl.col("los_days") > 2)
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
    return joined.filter((d) => d.los_days > 2);
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const joined17 = patients17.leftJoin(encounters17, "patient_id");
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — los_days is number | undefined -- can't compare with >
    joined17.filter((r) => r.los_days > 2),
  (df) => `rows=${df.nrows()}`,
);
