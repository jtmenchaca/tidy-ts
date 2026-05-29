/**
 * ID: 3g
 * Category: Missing value
 * Label: sum on nullable column then arithmetic
 * Intent: Sum a nullable lab column, then double the result.
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
total = labs["ref_high"].sum()
doubled = total * 2
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
doubled <- sum(labs$ref_high) * 2
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
total = labs["ref_high"].sum()
doubled = total * 2
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
      .rollup({ total: aq.op.sum("ref_high") });
    const total = agg.get("total", 0) as number;
    return total * 2;
  },
  (doubled) => `doubled=${doubled}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const sumResult = labs12.groupBy("test").summarize({
  total: (g) => s.sum(g.ref_high),
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    sumResult.mutate({ doubled: (r) => r.total * 2 }),
  (df) => `rows=${df.nrows()}`,
);
