/**
 * ID: 5g
 * Category: Schema composition
 * Label: arithmetic on mixed-type column after coerced row bind
 * Intent: Combine two prescription tables with mixed numeric/string dose columns; then multiply dose by 2.
 */
import * as aq from "arquero";
import { numericDoses, textDoses } from "../data.ts";
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
numeric_doses = pd.DataFrame({"drug": ["Aspirin", "Lisinopril"], "dose": [325, 10]})
text_doses = pd.DataFrame({"drug": ["Insulin", "Warfarin"], "dose": ["sliding scale", "per INR"]})
combined_doses = pd.concat([numeric_doses, text_doses], ignore_index=True)
combined_doses["doubled"] = combined_doses["dose"] * 2
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
a <- tibble(patient = "P001", critical = TRUE)
b <- tibble(patient = "P002", critical = 2)
combined <- bind_rows(a, b)
class(combined$critical)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
numeric_doses = pl.DataFrame({"drug": ["Aspirin", "Lisinopril"], "dose": [325, 10]})
text_doses = pl.DataFrame({"drug": ["Insulin", "Warfarin"], "dose": ["sliding scale", "per INR"]})
combined_doses = pl.concat([numeric_doses, text_doses], how="diagonal")
doubled = combined_doses.with_columns((pl.col("dose") * 2).alias("doubled"))
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const numeric = aq.table({
      drug: ["Aspirin", "Lisinopril"],
      dose: [325, 10],
    });
    const text = aq.table({
      drug: ["Insulin", "Warfarin"],
      dose: ["sliding scale", "per INR"],
    });
    return numeric.concat(text).derive({ doubled: (d) => d.dose * 2 });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const combinedG = numericDoses.bindRows(textDoses);
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    combinedG.mutate({ doubled: (r) => r.dose * 2 }),
  (df) => `rows=${df.nrows()}`,
);
