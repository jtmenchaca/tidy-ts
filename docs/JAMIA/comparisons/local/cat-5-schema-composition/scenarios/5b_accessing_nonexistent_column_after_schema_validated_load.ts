/**
 * ID: 5b
 * Category: Data loading
 * Label: accessing nonexistent column after schema-validated load
 * Intent: Load a lab CSV with a defined schema, then access a column that was not declared in the schema.
 */
import * as aq from "arquero";
import { labsDf } from "../data.ts";
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
df = pd.DataFrame({"lab_id": ["L3001", "L3002"], "result_value": [1250, 131]})
val = df["nonexistent_column"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
df <- tibble(lab_id = c("L3001", "L3002"), result_value = c(1250, 131))
df %>% mutate(x = nonexistent_column) %>% nrow()
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
df = pl.DataFrame({"lab_id": ["L3001", "L3002"], "result_value": [1250, 131]})
val = df["nonexistent_column"]
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const dt = aq.table({
      lab_id: ["L3001", "L3002"],
      result_value: [1250, 131],
    });
    return dt.array("nonexistent_column");
  },
  () => "accessed missing column",
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    labsDf.mutate({
      // @ts-expect-error — Property 'missing_col' does not exist on type
      x: (r) => r.missing_col,
    }),
  (df) => `rows=${df.nrows()}`,
);
