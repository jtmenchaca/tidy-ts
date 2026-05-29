/**
 * ID: 3q
 * Category: Missing value
 * Label: conditional fill on null vs missing
 * Intent: Fill missing reference ranges with a default, distinguishing semantic null from absent field.
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
filled = combined["value"].apply(lambda x: "inconclusive" if pd.isna(x) else x)
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
df1 <- tibble(id = "P001", value = NA_real_)
df2 <- tibble(id = "P002")
combined <- bind_rows(df1, df2)
filled <- combined %>% mutate(value = ifelse(is.na(value), "inconclusive", value))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
df1 = pl.DataFrame({"id": ["P001"], "value": [None]}).cast({"value": pl.Float64})
df2 = pl.DataFrame({"id": ["P002"]})
combined = pl.concat([df1, df2], how="diagonal")
filled = combined.with_columns(
    pl.when(pl.col("value").is_null())
    .then(pl.lit("inconclusive"))
    .otherwise(pl.col("value").cast(pl.Utf8))
    .alias("value")
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
    return df1.concat(df2).derive({
      value: (d) => (d.value == null ? "inconclusive" : d.value),
    });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const combined31q = labsNullA.bindRows(labsNullB);
runInProcess(
  "Tidy-TS",
  () =>
    combined31q.mutate({
      // @ts-expect-error — Object is possibly 'undefined'.
      filled: (r) => r.note === null ? "inconclusive" : r.note.toUpperCase(),
    }),
  (df) => `rows=${df.nrows()}`,
);
