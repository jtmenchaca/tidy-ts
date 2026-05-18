import { z } from "zod";
import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { graph } from "@tidy-ts/graph";
import { dirname, fileURLToPath, resolve } from "@tidy-ts/shims";

// Resolve paths relative to this file so the script works from any cwd.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURE = resolve(__dirname, "fixtures", "penguins.csv");
const OUT_DIR = "/tmp";

// Schema — `readCSV` matches schema keys to CSV headers by name, so we use
// the exact fixture headers here (e.g. `studyname`, `delta15NOoo`) and
// rename the columns we plot to friendlier identifiers afterwards.
// Numeric columns are nullable because the fixture encodes missing as "NA"
// (handled by `naValues`).
const PenguinSchema = z.object({
  studyname: z.string(),
  sampleNumber: z.number(),
  species: z.string(),
  region: z.string(),
  island: z.string(),
  stage: z.string(),
  individualId: z.string(),
  clutchCompletion: z.string(),
  dateEgg: z.string(),
  culmenLengthMm: z.number().nullable(),
  culmenDepthMm: z.number().nullable(),
  flipperLengthMm: z.number().nullable(),
  bodyMassG: z.number().nullable(),
  sex: z.string().nullable(),
  delta15NOoo: z.number().nullable(),
  delta13COoo: z.number().nullable(),
  comments: z.string().nullable(),
});

const raw = await readCSV(FIXTURE, PenguinSchema, { naValues: ["NA"] });

// Trim down and shorten species name (fixture stores the full Linnaean form).
const penguins = raw
  .select(
    "species",
    "island",
    "sex",
    "culmenLengthMm",
    "flipperLengthMm",
    "bodyMassG",
  )
  .mutate({
    species: (r) => r.species.split(" ")[0],
  });

console.log(`Loaded ${penguins.nrows()} rows.`);
penguins.sliceHead(3).print();

// --- Chart 1: culmen length vs flipper length, colored by species ---------
// Classic species-separation scatter — shows that the three species form
// distinct clusters along these two morphological axes.
const chart1Df = penguins
  .removeNull("culmenLengthMm")
  .removeNull("flipperLengthMm");

const chart1 = graph({
  df: chart1Df,
  type: "scatter",
  mappings: {
    x: "culmenLengthMm",
    y: "flipperLengthMm",
    color: "species",
  },
  config: {
    layout: {
      title: "Penguin morphology: culmen length vs flipper length",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Culmen length (mm)" },
    yAxis: { label: "Flipper length (mm)" },
    color: { scheme: "vibrant" },
    legend: { show: true, position: "right" },
    grid: { show: true },
  },
});

const chart1Path = `${OUT_DIR}/penguins-culmen-vs-flipper.png`;
await chart1.savePNG({ filename: chart1Path, width: 800, height: 500, scale: 2 });

// --- Chart 2: flipper length vs body mass, colored by species, sized by
// culmen length -----------------------------------------------------------
// Multi-dimensional view — uses scatter's `size` channel to fold a third
// numeric column in. Useful for spotting whether bigger-billed birds are
// also heavier within each species.
const chart2Df = penguins
  .removeNull("flipperLengthMm")
  .removeNull("bodyMassG")
  .removeNull("culmenLengthMm");

const chart2 = graph({
  df: chart2Df,
  type: "scatter",
  mappings: {
    x: "flipperLengthMm",
    y: "bodyMassG",
    color: "species",
    size: "culmenLengthMm",
  },
  config: {
    layout: {
      title: "Flipper length vs body mass (point size = culmen length)",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Flipper length (mm)" },
    yAxis: { label: "Body mass (g)" },
    color: { scheme: "professional" },
    legend: { show: true, position: "right" },
    grid: { show: true },
  },
});

const chart2Path = `${OUT_DIR}/penguins-flipper-vs-mass.png`;
await chart2.savePNG({ filename: chart2Path, width: 800, height: 500, scale: 2 });

// --- Chart 3: stacked bar of species counts per island --------------------
// Categorical distribution — answers "which species live on which islands?"
// at a glance. Pre-aggregate with groupBy + count, then plot.
const speciesByIsland = penguins
  .groupBy("island", "species")
  .summarize({ count: (g) => g.nrows() })
  .ungroup()
  .arrange("island", "asc");

speciesByIsland.print();

const chart3 = graph({
  df: speciesByIsland,
  type: "bar",
  mappings: {
    x: "island",
    y: "count",
    series: "species",
  },
  config: {
    layout: {
      title: "Penguin species distribution by island",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Island" },
    yAxis: { label: "Count" },
    color: { scheme: "vibrant" },
    bar: { stacked: true, radius: 4 },
    legend: { show: true, position: "right" },
    grid: { show: true },
  },
});

const chart3Path = `${OUT_DIR}/penguins-species-by-island.png`;
await chart3.savePNG({ filename: chart3Path, width: 800, height: 500, scale: 2 });

// Quick summary stats so the script also prints something useful to stdout.
const summary = penguins
  .removeNull("bodyMassG")
  .removeNull("flipperLengthMm")
  .groupBy("species")
  .summarize({
    n: (g) => g.nrows(),
    meanBodyMassG: (g) => s.round(s.mean(g.bodyMassG), 1),
    meanFlipperMm: (g) => s.round(s.mean(g.flipperLengthMm), 1),
  })
  .ungroup()
  .arrange("species", "asc");

summary.print();

console.log("Saved charts:");
console.log(`  ${chart1Path}`);
console.log(`  ${chart2Path}`);
console.log(`  ${chart3Path}`);
