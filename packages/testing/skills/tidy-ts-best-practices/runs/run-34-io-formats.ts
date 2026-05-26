// Task: round-trip penguins.csv through JSON, Arrow IPC, and Parquet.
// Confirm row counts, columns, numeric types, and that mean body mass by
// species matches across all three formats.

import {
  readCSV,
  readJSON,
  writeJSON,
  stats as s,
} from "@tidy-ts/dataframe";
import { readArrow, writeArrow } from "@tidy-ts/arrow";
import { readParquet, writeParquet } from "@tidy-ts/parquet";
import { z } from "zod";

const CSV_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv";
const JSON_PATH = "/tmp/penguins-round-trip.json";
const ARROW_PATH = "/tmp/penguins-round-trip.arrow";
const PARQUET_PATH = "/tmp/penguins-round-trip.parquet";

// The fixture is the Palmer Penguins dataset with these actual headers:
// studyname,sampleNumber,species,region,island,stage,individualId,
// clutchCompletion,dateEgg,culmenLengthMm,culmenDepthMm,flipperLengthMm,
// bodyMassG,sex,delta15NOoo,delta13COoo,comments
// We only need a subset: species, island, the four numeric measurements,
// and sex. Numeric fields use `.nullable()` because the file contains "NA".
const schema = z.object({
  species: z.string(),
  island: z.string(),
  culmenLengthMm: z.number().nullable(),
  culmenDepthMm: z.number().nullable(),
  flipperLengthMm: z.number().nullable(),
  bodyMassG: z.number().nullable(),
  sex: z.string().nullable(),
});

const df = await readCSV(CSV_PATH, schema, { naValues: ["NA", ""] });

// Get column names from the first row's keys (skill doesn't expose a
// method for this; `df.colName` is the documented column-access pattern).
// deno-lint-ignore no-explicit-any
const colsOf = (frame: any): string[] => Object.keys(frame.toRows()[0] ?? {});

console.log("=== Source CSV ===");
console.log("rows:", df.nrows());
console.log("cols:", colsOf(df));
df.sliceHead(3).print();

// --- Task 1: JSON round-trip ---
await writeJSON(JSON_PATH, df);
const fromJSON = await readJSON(JSON_PATH, z.array(schema));

console.log("\n=== JSON round-trip ===");
console.log("rows:", fromJSON.nrows(), "(source", df.nrows() + ")");
console.log("cols:", colsOf(fromJSON));
console.log(
  "columns match:",
  JSON.stringify(colsOf(df)) === JSON.stringify(colsOf(fromJSON)),
);
console.log("first 3 rows from source:");
df.sliceHead(3).print();
console.log("first 3 rows from JSON:");
fromJSON.sliceHead(3).print();

// --- Task 2: Arrow IPC round-trip ---
await writeArrow(df, ARROW_PATH);
const fromArrow = await readArrow(ARROW_PATH, schema);

console.log("\n=== Arrow round-trip ===");
console.log("rows:", fromArrow.nrows());
console.log("cols:", colsOf(fromArrow));
const arrowMass = fromArrow.bodyMassG;
console.log(
  "bodyMassG is numeric:",
  arrowMass.every((v) => v === null || typeof v === "number"),
);
console.log(
  "flipperLengthMm is numeric:",
  fromArrow.flipperLengthMm.every((v) => v === null || typeof v === "number"),
);

// --- Task 3: Parquet round-trip ---
writeParquet(df, PARQUET_PATH);
const fromParquet = await readParquet(PARQUET_PATH, schema);

console.log("\n=== Parquet round-trip ===");
console.log("rows:", fromParquet.nrows());
console.log("cols:", colsOf(fromParquet));
console.log(
  "bodyMassG is numeric:",
  fromParquet.bodyMassG.every((v) => v === null || typeof v === "number"),
);
console.log(
  "flipperLengthMm is numeric:",
  fromParquet.flipperLengthMm.every((v) =>
    v === null || typeof v === "number"
  ),
);

// --- Task 4: mean body mass by species per format ---
function meanBodyMassBySpecies(
  // deno-lint-ignore no-explicit-any
  frame: any,
) {
  return frame
    .removeNull("bodyMassG")
    .groupBy("species")
    // deno-lint-ignore no-explicit-any
    .summarize({ mean_body_mass_g: (g: any) => s.mean(g.bodyMassG) })
    .arrange("species");
}

console.log("\n=== Mean body mass by species ===");
console.log("from CSV source:");
meanBodyMassBySpecies(df).print();
console.log("from JSON:");
meanBodyMassBySpecies(fromJSON).print();
console.log("from Arrow:");
meanBodyMassBySpecies(fromArrow).print();
console.log("from Parquet:");
meanBodyMassBySpecies(fromParquet).print();

// Cross-format consistency check
const csvMeans = meanBodyMassBySpecies(df).mean_body_mass_g as number[];
const jsonMeans = meanBodyMassBySpecies(fromJSON).mean_body_mass_g as number[];
const arrowMeans = meanBodyMassBySpecies(fromArrow)
  .mean_body_mass_g as number[];
const parquetMeans = meanBodyMassBySpecies(fromParquet)
  .mean_body_mass_g as number[];

const eq = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

console.log("\n=== Cross-format mean equality ===");
console.log("CSV == JSON:    ", eq(csvMeans, jsonMeans));
console.log("CSV == Arrow:   ", eq(csvMeans, arrowMeans));
console.log("CSV == Parquet: ", eq(csvMeans, parquetMeans));
