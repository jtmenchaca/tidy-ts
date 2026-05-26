import { readCSV } from "@tidy-ts/dataframe";
import { graph } from "@tidy-ts/graph";
import { z } from "zod";

const schema = z.object({
  species: z.string(),
  flipperLengthMm: z.number().nullable(),
  bodyMassG: z.number().nullable(),
});

const penguins = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv",
  schema,
  { naValues: ["NA", ""] },
);

const clean = penguins
  .removeNull("flipperLengthMm", "bodyMassG");

// Task 1: scatter — flipper length (y) vs body mass (x), colored by species.
const scatter = graph({
  df: clean,
  type: "scatter",
  mappings: {
    x: "bodyMassG",
    y: "flipperLengthMm",
    color: "species",
  },
  config: {
    layout: {
      title: "Penguin Flipper Length vs Body Mass by Species",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Body Mass (g)" },
    yAxis: { label: "Flipper Length (mm)" },
    legend: { show: true, position: "right" },
  },
});

await scatter.savePNG({
  filename: "/tmp/penguins-scatter.png",
  width: 800,
  height: 500,
  scale: 2,
});

// Task 2: same chart with a custom tooltip showing species, body mass, flipper length.
const scatterTooltip = graph({
  df: clean,
  type: "scatter",
  mappings: {
    x: "bodyMassG",
    y: "flipperLengthMm",
    color: "species",
  },
  config: {
    layout: {
      title: "Penguin Flipper Length vs Body Mass by Species",
      width: 800,
      height: 500,
    },
    xAxis: { label: "Body Mass (g)" },
    yAxis: { label: "Flipper Length (mm)" },
    legend: { show: true, position: "right" },
  },
  tooltip: {
    fields: ["species", "bodyMassG", "flipperLengthMm"],
    format: {
      species: (v) => `Species: ${String(v)}`,
      bodyMassG: (v) => `Body mass: ${Number(v)} g`,
      flipperLengthMm: (v) => `Flipper length: ${Number(v)} mm`,
    },
  },
});

await scatterTooltip.savePNG({
  filename: "/tmp/penguins-scatter-tooltip.png",
  width: 800,
  height: 500,
  scale: 2,
});

console.log(`/tmp/penguins-scatter.png — ${clean.nrows()} rows`);
console.log(`/tmp/penguins-scatter-tooltip.png — ${clean.nrows()} rows`);
