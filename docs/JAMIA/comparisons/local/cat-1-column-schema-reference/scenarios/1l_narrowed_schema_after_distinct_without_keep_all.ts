/**
 * ID: 1l
 * Category: Column reference
 * Label: narrowed schema after distinct without keep-all
 * Intent: Reduce a wide table to distinct rows on a subset of columns, then access the unselected columns.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { encountersDistinct } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
encounters = pd.DataFrame({
    "patient_id": ["P1", "P1", "P2"],
    "dept": ["Cardio", "Cardio", "ED"],
    "physician": ["Dr. Patel", "Dr. Lee", "Dr. Martinez"],
})
unique = encounters.drop_duplicates(subset=["patient_id"])
unique["doc"] = unique["physician"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
encounters <- tibble(
  patient_id = c("P1", "P1", "P2"),
  dept = c("Cardio", "Cardio", "ED"),
  physician = c("Dr. Patel", "Dr. Lee", "Dr. Martinez")
)
unique <- encounters %>% distinct(patient_id, .keep_all = TRUE)
unique <- unique %>% mutate(doc = physician)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
encounters = pl.DataFrame({
    "patient_id": ["P1", "P1", "P2"],
    "dept": ["Cardio", "Cardio", "ED"],
    "physician": ["Dr. Patel", "Dr. Lee", "Dr. Martinez"],
})
unique = encounters.unique(subset=["patient_id"])
unique = unique.with_columns(pl.col("physician").alias("doc"))
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
        patient_id: ["P1", "P1", "P2"],
        dept: ["Cardio", "Cardio", "ED"],
        physician: ["Dr. Patel", "Dr. Lee", "Dr. Martinez"],
      })
      .dedupe("patient_id")
      .derive({ doc: (d) => d.physician }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const byPatient = encountersDistinct.distinct("patient_id");
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — physician not in distinct result
    byPatient.mutate({ doc: (r) => r.physician }),
  (df) => `rows=${df.nrows()}`,
);
