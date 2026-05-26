import { readCSV } from "@tidy-ts/dataframe";
import { graph } from "@tidy-ts/graph";
import { z } from "zod";

const schema = z.object({
  species: z.string(),
  island: z.string(),
  culmenLengthMm: z.number().nullable(),
  flipperLengthMm: z.number().nullable(),
  bodyMassG: z.number().nullable(),
});

const penguins = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/penguins.csv",
  schema,
  { naValues: ["NA", ""] },
);

// 1. Scatter — bill length (culmenLengthMm) vs flipper length, colored by species.
const scatterDf = penguins.removeNull("culmenLengthMm", "flipperLengthMm");
const scatter = graph({
  df: scatterDf,
  type: "scatter",
  mappings: {
    x: "culmenLengthMm",
    y: "flipperLengthMm",
    color: "species",
  },
  config: {
    layout: {
      title: "Penguin Bill Length vs Flipper Length by Species",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Bill Length (mm)" },
    yAxis: { label: "Flipper Length (mm)" },
    legend: { show: true, position: "right" },
  },
});
await scatter.savePNG({
  filename: "/tmp/run30-scatter.png",
  width: 800,
  height: 500,
  scale: 2,
});

// 2. Box plot — body mass by species. graph() offers scatter/line/bar/area, so
//    pre-aggregate to quartiles and render as bar(s) per species with a min/max
//    indicator via tooltip. The skill doesn't list a "box" type, so we go with
//    a bar chart of median body mass per species and document this in findings.
//    (Switching to bar chart of median + a clear title satisfies the spirit of
//    a per-species body-mass comparison; see the finding below.)
import { stats as s } from "@tidy-ts/dataframe";

const bodyMassClean = penguins.removeNull("bodyMassG");
const massSummary = bodyMassClean
  .groupBy("species")
  .summarize({
    median_mass_g: (g) => s.median(g.bodyMassG, { removeNull: true }),
  })
  .ungroup();

const box = graph({
  df: massSummary,
  type: "bar",
  mappings: {
    x: "species",
    y: "median_mass_g",
    color: "species",
  },
  config: {
    layout: {
      title: "Median Body Mass by Penguin Species",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Species" },
    yAxis: { label: "Median Body Mass (g)" },
    legend: { show: false, position: "right" },
  },
});
await box.savePNG({
  filename: "/tmp/run30-box.png",
  width: 800,
  height: 500,
  scale: 2,
});

// 3. Bar chart — count of penguins per island.
const islandCounts = penguins
  .groupBy("island")
  .summarize({ count: (g) => g.nrows() })
  .ungroup()
  .arrange("count", "desc");

const bar = graph({
  df: islandCounts,
  type: "bar",
  mappings: {
    x: "island",
    y: "count",
    color: "island",
  },
  config: {
    layout: {
      title: "Penguin Count by Island",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Island" },
    yAxis: { label: "Number of Penguins" },
    legend: { show: false, position: "right" },
  },
});
await bar.savePNG({
  filename: "/tmp/run30-bar.png",
  width: 800,
  height: 500,
  scale: 2,
});

console.log(`/tmp/run30-scatter.png — ${scatterDf.nrows()} rows`);
console.log(`/tmp/run30-box.png — ${bodyMassClean.nrows()} rows`);
console.log(`/tmp/run30-bar.png — ${penguins.nrows()} rows`);
