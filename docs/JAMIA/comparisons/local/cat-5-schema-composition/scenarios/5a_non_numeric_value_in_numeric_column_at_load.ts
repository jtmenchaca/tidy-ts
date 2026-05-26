/**
 * ID: 5a
 * Category: Data loading
 * Label: non-numeric value in numeric column at load time
 * Intent: Load a lab CSV where the value column is declared numeric in the schema; a row contains 'pending'.
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
csv_bad_type = "lab_id,result_value\\nL1,100\\nL2,pending\\nL3,200\\n"
with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
    f.write(csv_bad_type)
    tmp_path = f.name
df = pd.read_csv(tmp_path)
os.unlink(tmp_path)
dtype = str(df["result_value"].dtype)
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(readr))
tmp <- tempfile(fileext = ".csv")
writeLines(c("lab_id,result_value", "L1,100", "L2,pending", "L3,200"), tmp)
df <- read_csv(tmp, col_types = cols(lab_id = col_character(), result_value = col_double()))
invisible(file.remove(tmp))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
import tempfile
import os
csv_bad_type = "lab_id,result_value\\nL1,100\\nL2,pending\\nL3,200\\n"
with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
    f.write(csv_bad_type)
    tmp_path = f.name
df = pl.read_csv(tmp_path)
os.unlink(tmp_path)
dtype = str(df["result_value"].dtype)
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => aq.fromCSV("lab_id,result_value\nL1,100\nL2,pending\nL3,200\n"),
  (table) => `rows=${table.numRows()} dtype=${typeof table.get("result_value", 0)}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
await runInProcessAsync(
  "Tidy-TS",
  () => readCSV("lab_id,result_value\nL1,100\nL2,pending\nL3,200\n", LabSchema),
  (df) => `rows=${df.nrows()}`,
);
