import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { graph } from "@tidy-ts/graph";
import { dirname, fileURLToPath, resolve } from "@tidy-ts/shims";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const csvPath = resolve(__dirname, "fixtures", "penguins.csv");

const PenguinSchema = z.object({
  species: z.string(),
  island: z.string(),
  sex: z.string().nullable(),
  culmenLengthMm: z.number().nullable(),
  flipperLengthMm: z.number().nullable(),
  bodyMassG: z.number().nullable(),
});

const raw = await readCSV(csvPath, PenguinSchema, { naValues: ["NA"] });

// Short species labels for legibility
const df = raw.mutate({
  speciesShort: (r) => r.species.split(" ")[0],
});

console.log(`Loaded ${df.nrows()} rows`);

// Clean frame for measurement charts (drop rows missing the numerics we plot)
const clean = df
  .removeNull("culmenLengthMm")
  .removeNull("flipperLengthMm")
  .removeNull("bodyMassG");

// ── Chart 1: scatter — culmen length vs flipper length, colored by species ──
// Classic separation plot for Palmer penguins; shows species clustering well.
const chart1 = graph({
  df: clean,
  type: "scatter",
  mappings: {
    x: "culmenLengthMm",
    y: "flipperLengthMm",
    color: "speciesShort",
  },
  config: {
    layout: {
      title: "Culmen Length vs Flipper Length by Species",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Culmen length (mm)" },
    yAxis: { label: "Flipper length (mm)" },
    color: { scheme: "vibrant" },
    legend: { show: true, position: "right" },
  },
});

const chart1Path = "/tmp/penguins-culmen-vs-flipper.png";
await chart1.savePNG({
  filename: chart1Path,
  width: 800,
  height: 500,
  scale: 2,
});

// ── Chart 2: bar — mean body mass by species & sex ──
// Aggregates into one bar per (species, sex) so we can see sexual dimorphism.
const massBySpeciesSex = df
  .removeNull("bodyMassG")
  .removeNull("sex")
  .filter((r) => r.sex === "MALE" || r.sex === "FEMALE")
  .groupBy("speciesShort", "sex")
  .summarize({
    meanBodyMassG: (g) => s.round(s.mean(g.bodyMassG, { removeNull: true }), 1),
    n: (g) => g.nrows(),
  })
  .arrange("speciesShort");

massBySpeciesSex.print();

const chart2 = graph({
  df: massBySpeciesSex,
  type: "bar",
  mappings: {
    x: "speciesShort",
    y: "meanBodyMassG",
    series: "sex",
  },
  config: {
    layout: {
      title: "Mean Body Mass by Species and Sex",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Species" },
    yAxis: { label: "Mean body mass (g)" },
    color: { scheme: "professional" },
    legend: { show: true, position: "right" },
  },
});

const chart2Path = "/tmp/penguins-mass-by-species-sex.png";
await chart2.savePNG({
  filename: chart2Path,
  width: 800,
  height: 500,
  scale: 2,
});

// ── Chart 3: scatter — flipper length vs body mass, color species, shape sex ──
// Two-feature regression-style view that also encodes sex; useful for spotting
// how body mass scales with flipper length within species.
const cleanWithSex = clean
  .removeNull("sex")
  .filter((r) => r.sex === "MALE" || r.sex === "FEMALE");

const chart3 = graph({
  df: cleanWithSex,
  type: "scatter",
  mappings: {
    x: "flipperLengthMm",
    y: "bodyMassG",
    color: "speciesShort",
    shape: "sex",
  },
  config: {
    layout: {
      title: "Flipper Length vs Body Mass (color = species, shape = sex)",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Flipper length (mm)" },
    yAxis: { label: "Body mass (g)" },
    color: { scheme: "vibrant" },
    legend: { show: true, position: "right" },
  },
});

const chart3Path = "/tmp/penguins-flipper-vs-mass.png";
await chart3.savePNG({
  filename: chart3Path,
  width: 800,
  height: 500,
  scale: 2,
});

console.log("Saved charts:");
console.log(`  1. ${chart1Path}`);
console.log(`  2. ${chart2Path}`);
console.log(`  3. ${chart3Path}`);
