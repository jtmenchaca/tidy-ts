/**
 * ID: 3f
 * Category: Missing value
 * Label: mean on nullable column then arithmetic
 * Intent: Take the mean of a nullable lab column, then double the result.
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
avg = labs["ref_high"].mean()
doubled = avg * 2
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
doubled <- mean(labs$ref_high) * 2
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
avg = labs["ref_high"].mean()
doubled = avg * 2
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const agg = aq
      .table({
        test: ["BNP", "WBC"],
        value: [100, 200],
        ref_high: [120, null],
      })
      .rollup({ avg: aq.op.mean("ref_high") });
    const avg = agg.get("avg", 0) as number;
    return avg * 2;
  },
  (doubled) => `doubled=${doubled}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const meanResult = labs12.groupBy("test").summarize({
  avg: (g) => s.mean(g.ref_high),
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    meanResult.mutate({ doubled: (r) => r.avg * 2 }),
  (df) => `rows=${df.nrows()}`,
);
