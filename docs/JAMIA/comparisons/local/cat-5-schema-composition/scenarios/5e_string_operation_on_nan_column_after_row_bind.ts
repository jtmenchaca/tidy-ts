/**
 * ID: 5e
 * Category: Schema composition
 * Label: string operation on NaN/NA column after row bind
 * Intent: Combine two lab tables that share most columns; one has a `site` column the other lacks; then uppercase that column.
 */
import * as aq from "arquero";
import { labsA, labsB } from "../data.ts";
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
labs_a = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "test_name": ["BNP", "WBC"],
    "result_value": [1250, 15.2],
    "lab_site": ["Main", "Main"],
})
labs_b = pd.DataFrame({
    "patient_id": ["P003", "P004"],
    "test_name": ["HbA1c", "Glucose"],
    "result_value": [8.9, 210],
    "reference_range": ["4.0-5.6", "70-100"],
})
combined = pd.concat([labs_a, labs_b], ignore_index=True)
combined["site_upper"] = combined["lab_site"].str.upper()
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
labs_a <- tibble(
  patient_id = c("P001", "P002"),
  test_name = c("BNP", "WBC"),
  result_value = c(1250, 15.2),
  lab_site = c("Main", "Main")
)
labs_b <- tibble(
  patient_id = c("P003", "P004"),
  test_name = c("HbA1c", "Glucose"),
  result_value = c(8.9, 210),
  reference_range = c("4.0-5.6", "70-100")
)
combined <- bind_rows(labs_a, labs_b)
combined <- combined %>% mutate(site_upper = toupper(lab_site))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
labs_a = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "test_name": ["BNP", "WBC"],
    "result_value": [1250.0, 15.2],
    "lab_site": ["Main", "Main"],
})
labs_b = pl.DataFrame({
    "patient_id": ["P003", "P004"],
    "test_name": ["HbA1c", "Glucose"],
    "result_value": [8.9, 210.0],
    "reference_range": ["4.0-5.6", "70-100"],
})
combined = pl.concat([labs_a, labs_b], how="diagonal")
combined = combined.with_columns(
    pl.col("lab_site").str.to_uppercase().alias("site_upper")
)
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const labsATable = aq.table({
      patient_id: ["P001", "P002"],
      test_name: ["BNP", "WBC"],
      result_value: [1250, 15.2],
      lab_site: ["Main", "Main"],
    });
    const labsBTable = aq.table({
      patient_id: ["P003", "P004"],
      test_name: ["HbA1c", "Glucose"],
      result_value: [8.9, 210],
      reference_range: ["4.0-5.6", "70-100"],
    });
    return labsATable.concat(labsBTable).derive({
      site_upper: (d) => (d.lab_site ? aq.op.upper(d.lab_site) : d.lab_site),
    });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const combinedE = labsA.bindRows(labsB);
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — Object is possibly 'undefined'.
    combinedE.mutate({ upper: (r) => r.site.toUpperCase() }),
  (df) => `rows=${df.nrows()}`,
);
