/**
 * ID: 5c
 * Category: Data loading
 * Label: empty cell in non-null column at load time
 * Intent: Load an encounters CSV where the patient ID column is declared non-null; one row has an empty cell.
 */
import * as aq from "arquero";
import { readCSV } from "@tidy-ts/dataframe";
import { LabSchema } from "../data.ts";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runInProcessAsync,
  runStaticChecker,
} from "../../../runners.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
import tempfile
import os
csv_empty = "lab_id,result_value\\nL1,100\\nL2,\\nL3,200\\n"
with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
    f.write(csv_empty)
    tmp_path = f.name
df = pd.read_csv(tmp_path)
os.unlink(tmp_path)
nan_count = int(df["result_value"].isna().sum())
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(readr))
tmp <- tempfile(fileext = ".csv")
writeLines(c("lab_id,result_value", "L1,100", "L2,", "L3,200"), tmp)
df <- read_csv(tmp, col_types = cols(lab_id = col_character(), result_value = col_double()))
na_count <- sum(is.na(df$result_value))
invisible(file.remove(tmp))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
import tempfile
import os
csv_empty = "lab_id,result_value\\nL1,100\\nL2,\\nL3,200\\n"
with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
    f.write(csv_empty)
    tmp_path = f.name
df = pl.read_csv(tmp_path)
os.unlink(tmp_path)
null_count = df["result_value"].null_count()
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => aq.fromCSV("lab_id,result_value\nL1,100\nL2,\nL3,200\n"),
  (table) => `rows=${table.numRows()} dtype=${typeof table.get("result_value", 0)}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
await runInProcessAsync(
  "Tidy-TS",
  () => readCSV("lab_id,result_value\nL1,100\nL2,\nL3,200\n", LabSchema),
  (df) => `rows=${df.nrows()}`,
);
