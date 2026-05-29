/**
 * ID: 3p
 * Category: Missing value
 * Label: null vs missing conflated
 * Intent: Distinguish 'lab result was null' from 'lab was not ordered' in downstream logic.
 */
import * as aq from "arquero";
import { labsNullA, labsNullB } from "../data.ts";
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
import numpy as np
df1 = pd.DataFrame({"id": ["P001"], "value": [np.nan]})
df2 = pd.DataFrame({"id": ["P002"]})
combined = pd.concat([df1, df2], ignore_index=True)
combined["upper"] = combined["value"].apply(lambda x: str(x).upper() if pd.notna(x) else x)
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
df1 <- tibble(id = "P001", value = NA_real_)
df2 <- tibble(id = "P002")
combined <- bind_rows(df1, df2)
combined <- combined %>% mutate(upper = toupper(as.character(value)))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
df1 = pl.DataFrame({"id": ["P001"], "value": [None]}).cast({"value": pl.Float64})
df2 = pl.DataFrame({"id": ["P002"]})
combined = pl.concat([df1, df2], how="diagonal")
combined = combined.with_columns(
    pl.col("value").map_elements(lambda x: str(x).upper() if x is not None else x, return_dtype=pl.Utf8).alias("upper")
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
    const df1 = aq.table({ id: ["P001"], value: [null] });
    const df2 = aq.table({ id: ["P002"] });
    return df1.concat(df2).derive({ upper: (d) => d.value.toUpperCase() });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const combined31 = labsNullA.bindRows(labsNullB);
runInProcess(
  "Tidy-TS",
  () =>
    combined31.mutate({
      // @ts-expect-error — Object is possibly 'null' or 'undefined'.
      upper: (r) => r.note.toUpperCase(),
    }),
  (df) => `rows=${df.nrows()}`,
);
