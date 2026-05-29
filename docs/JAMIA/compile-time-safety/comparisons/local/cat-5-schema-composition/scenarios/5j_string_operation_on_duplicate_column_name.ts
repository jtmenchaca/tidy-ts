/**
 * ID: 5j
 * Category: Schema composition
 * Label: string operation on duplicate column name
 * Intent: Construct a DataFrame from row literals containing a duplicate column name, then operate on that column.
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
df = pd.DataFrame([[1, "Alice", "ED"]], columns=["id", "name", "name"])
upper = df["name"].str.upper()
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
df <- tibble(id = 1, name = "Alice", name = "ED")
df %>% mutate(upper = toupper(name))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
df = pl.DataFrame({"id": [1], "name": ["Alice"], "name_dup": ["ED"]}).rename({"name_dup": "name"})
upper = df["name"].str.to_uppercase()
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
      .from([{ id: 1, name: "Alice", name_2: "ED" }])
      .rename({ name_2: "name" })
      .derive({ name: (d) => aq.op.upper(d.name) }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () => {
    // @ts-expect-error — An object literal cannot have multiple properties with the same name.
    const df = createDataFrame([{ id: 1, name: "Alice", name: "ED" }]);
    return df.mutate({ upper: (r) => r.name.toUpperCase() });
  },
  (df) => `rows=${df.nrows()}`,
);
