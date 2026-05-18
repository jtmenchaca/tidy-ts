import {
  readXLSX,
  stats as s,
  writeCSV,
} from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  species: z.string(),
  bill_length_mm: z.number().nullable(),
  bill_depth_mm: z.number().nullable(),
  flipper_length_mm: z.number().nullable(),
});

const df = await readXLSX(
  "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/penguins.xlsx",
  schema,
);

// Per-species averages, ignoring nulls
const perSpecies = df
  .groupBy("species")
  .summarize({
    bill_length_mm: (g) => s.mean(g.bill_length_mm, { removeNull: true }),
    bill_depth_mm: (g) => s.mean(g.bill_depth_mm, { removeNull: true }),
    flipper_length_mm: (g) =>
      s.mean(g.flipper_length_mm, { removeNull: true }),
  })
  .arrange("species");

perSpecies.print();

// Reshape: rows are metrics (bill_length_mm, bill_depth_mm, flipper_length_mm),
// columns are species (Adelie, Chinstrap, Gentoo).
//
// Step 1: pivot wide-per-species into long form so we have (species, metric, value).
const longForm = perSpecies.pivotLonger({
  cols: ["bill_length_mm", "bill_depth_mm", "flipper_length_mm"],
  namesTo: "metric",
  valuesTo: "value",
});

// Step 2: pivot back to wide using species as columns and metric as the row key.
const speciesList = s.unique(perSpecies.species);
const wideByMetric = longForm.pivotWider({
  namesFrom: "species",
  valuesFrom: "value",
  expectedColumns: speciesList,
});

wideByMetric.print();

await writeCSV(
  wideByMetric,
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/species-metrics.csv",
);
