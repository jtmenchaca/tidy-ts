/**
 * ID: 2h
 * Category: Value type
 * Label: invalid date string parse
 * Intent: Parse a date string column to a Date type.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { rawEncounters } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
dates = pd.to_datetime(["2024-01-15", "not-a-date", "2024-02-20"], errors="coerce")
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
dates <- as.Date(c("2024-01-15", "not-a-date", "2024-02-20"))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
dates = pl.Series(["2024-01-15", "not-a-date", "2024-02-20"]).str.to_date(strict=False)
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const dates = ["2024-01-15", "not-a-date", "2024-02-20"].map((s) => {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    });
    return dates;
  },
  (dates) => `nulls=${dates.filter((d) => d === null).length}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
// Compile-time catch N/A (harness TS_COMPILE "—"); runtime-only via Temporal.
runInProcess(
  "Tidy-TS",
  () =>
    rawEncounters.mutate({
      parsed: (r) => Temporal.PlainDate.from(r.admit_date),
    }),
  (df) => `rows=${df.nrows()}`,
);
