/**
 * ID: 1k
 * Category: Column reference
 * Label: unselected column referenced after distinct
 * Intent: Deduplicate encounters by patient and access columns not specified in the deduplication keys.
 */
import * as aq from "arquero";
import { createDataFrame } from "@tidy-ts/dataframe";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
encounters = pd.DataFrame({
    "patient_id": ["P1", "P1", "P2"],
    "dept": ["Cardio", "Cardio", "ED"],
    "physician": ["Dr. Patel", "Dr. Lee", "Dr. Martinez"],
})
unique = encounters.drop_duplicates(subset=["patient_id", "dept"])
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
unique <- encounters %>% distinct(patient_id, dept, .keep_all = TRUE)
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
unique = encounters.unique(subset=["patient_id", "dept"])
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
      .dedupe("patient_id", "dept")
      .derive({ doc: (d) => d.physician }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const encountersDistinct = createDataFrame([
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Patel" },
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Lee" },
  { patient_id: "P2", dept: "ED", physician: "Dr. Martinez" },
]);
const unique = encountersDistinct.distinct("patient_id", "dept");
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — physician not in distinct result
    unique.mutate({ doc: (r) => r.physician }),
  (df) => `rows=${df.nrows()}`,
);
