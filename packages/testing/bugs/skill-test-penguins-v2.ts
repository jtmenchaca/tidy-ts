import {
  peekCSV,
  readCSV,
  stats as s,
  writeCSV,
} from "@tidy-ts/dataframe";
import { z } from "zod";

const path = "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/penguins.csv";

// Peek first to validate structure
const info = await peekCSV(path);
console.log(info);

// Schema: only load the columns we need. Use .nullable() + naValues for NA strings.
const schema = z.object({
  species: z.string(),
  island: z.string(),
  flipperLengthMm: z.number().nullable(),
  bodyMassG: z.number().nullable(),
  sex: z.string().nullable(),
});

const penguins = await readCSV(path, schema, { naValues: ["NA", ""] });

console.log("\n=== Loaded rows:", penguins.nrows(), "===");

// --- Q1: Count by species x island ---
const countsByIsland = penguins
  .groupBy("species", "island")
  .summarize({ count: (g) => g.nrows() })
  .arrange("species")
  .arrange("island");

console.log("\n=== Q1: Counts by species and island ===");
countsByIsland.print();

// --- Q4: Write the table to CSV ---
const outPath = "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/penguins-counts.csv";
await writeCSV(countsByIsland, outPath);
console.log("\nWrote counts to:", outPath);

// --- Q2: Adelie flipper-length difference between MALE and FEMALE ---
// The species column is the full Linnaean name; filter on that.
const adelie = penguins
  .filter((r) => r.species === "Adelie Penguin (Pygoscelis adeliae)")
  .removeNull("flipperLengthMm", "sex");

const males = adelie.filter((r) => r.sex === "MALE").flipperLengthMm;
const females = adelie.filter((r) => r.sex === "FEMALE").flipperLengthMm;

console.log("\n=== Q2: Adelie flipper-length, MALE vs FEMALE ===");
console.log(`n(MALE)=${males.length}, n(FEMALE)=${females.length}`);
console.log(`mean(MALE)=${s.round(s.mean(males), 2)} mm`);
console.log(`mean(FEMALE)=${s.round(s.mean(females), 2)} mm`);

// Welch's t-test (don't assume equal variances)
const t = s.test.t.independent({ x: males, y: females, equalVar: false });
console.log(
  `Welch's t: t=${s.round(t.testStatistic.value, 3)}, p=${t.pValue.toExponential(3)}, df≈${
    s.round(t.degreesOfFreedom ?? 0, 2)
  }`,
);
console.log(
  `Significant at alpha=${t.alpha}? ${t.pValue < (t.alpha ?? 0.05)}`,
);

// --- Q3: Body mass mean and stdev by species ---
const massBySpecies = penguins
  .removeNull("bodyMassG")
  .groupBy("species")
  .summarize({
    n: (g) => g.nrows(),
    mean_bodyMassG: (g) => s.round(s.mean(g.bodyMassG), 2),
    stdev_bodyMassG: (g) => s.round(s.stdev(g.bodyMassG), 2),
  });

console.log("\n=== Q3: Body mass by species ===");
massBySpecies.print();
