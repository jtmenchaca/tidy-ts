/**
 * ID: 3h
 * Category: Missing value
 * Label: min on nullable column then arithmetic
 * Intent: Take the min of a nullable lab column, then double the result.
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
mn = labs["ref_high"].min()
doubled = mn * 2
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
doubled <- min(labs$ref_high) * 2
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
mn = labs["ref_high"].min()
doubled = mn * 2
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
      .rollup({ mn: aq.op.min("ref_high") });
    const mn = agg.get("mn", 0) as number;
    return mn * 2;
  },
  (doubled) => `doubled=${doubled}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const minResult = labs12.groupBy("test").summarize({
  minimum: (g) => s.min(g.ref_high),
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    minResult.mutate({ doubled: (r) => r.minimum * 2 }),
  (df) => `rows=${df.nrows()}`,
);
