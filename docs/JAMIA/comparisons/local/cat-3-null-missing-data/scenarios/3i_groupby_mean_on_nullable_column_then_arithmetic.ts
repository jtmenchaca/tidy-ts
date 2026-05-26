/**
 * ID: 3i
 * Category: Missing value
 * Label: groupby mean on nullable column then arithmetic
 * Intent: Group labs by patient, take the per-group mean of a nullable column, then double each.
 */
import * as aq from "arquero";
import { stats as s } from "@tidy-ts/dataframe";
import { labs12 } from "../data.ts";
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
labs = pd.DataFrame({
    "test": ["BNP", "WBC"],
    "value": [100, 200],
    "ref_high": [120, None],
})
grouped = labs.groupby("test")["ref_high"].mean()
inc = grouped + 1
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
labs <- tibble(
  test = c("BNP", "WBC"),
  value = c(100, 200),
  ref_high = c(120, NA)
)
out <- labs %>%
  group_by(test) %>%
  summarise(avg_ref = mean(ref_high)) %>%
  mutate(inc = avg_ref + 1)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
labs = pl.DataFrame({
    "test": ["BNP", "WBC"],
    "value": [100, 200],
    "ref_high": [120, None],
})
grouped = labs.group_by("test").agg(pl.col("ref_high").mean())
inc = grouped.with_columns((pl.col("ref_high") + 1).alias("ref_high_inc"))
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
        test: ["BNP", "WBC"],
        value: [100, 200],
        ref_high: [120, null],
      })
      .groupby("test")
      .rollup({ avg_ref: aq.op.mean("ref_high") })
      .derive({ inc: (d) => d.avg_ref + 1 }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const grouped12 = labs12.groupBy("test").summarize({
  avg: (g) => s.mean(g.ref_high),
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    grouped12.mutate({ plus1: (r) => r.avg + 1 }),
  (df) => `rows=${df.nrows()}`,
);
