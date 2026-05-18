import { createDataFrame, readCSV, stats as s } from "@tidy-ts/dataframe";
import { dirname, fileURLToPath, resolve } from "@tidy-ts/shims";
import { z } from "zod";

// Resolve the fixture path relative to this file so it works from any cwd.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const csvPath = resolve(__dirname, "fixtures", "penguins.csv");

// Schema mirrors the penguins.csv columns. Numeric columns are nullable
// because the source uses "NA" for missing values.
const penguinSchema = z.object({
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
  sex: z.string(),
  delta15NOoo: z.string(),
  delta13COoo: z.string(),
  comments: z.string(),
});

const penguins = await readCSV(csvPath, penguinSchema, { naValues: ["NA"] });

penguins.print("Penguins (head)");

// --- Operation A -------------------------------------------------------------
// Group by species + island, summarise mean body mass, mean flipper length,
// and row count. Round means to 1 decimal. Sort by mean body mass descending.
const speciesIslandSummary = penguins
  .groupBy("species", "island")
  .summarize({
    mean_body_mass_g: (g) =>
      s.round(s.mean(g.bodyMassG, { removeNull: true }), 1),
    mean_flipper_mm: (g) =>
      s.round(s.mean(g.flipperLengthMm, { removeNull: true }), 1),
    n: (g) => g.nrows(),
  })
  .arrange("mean_body_mass_g", "desc");

speciesIslandSummary.print(
  "Operation A: mean body mass + flipper length by species and island",
);

// --- Operation B -------------------------------------------------------------
// Pearson correlation between flipper length and body mass.
// Use removeNull (not filter) so the row type narrows to non-null numbers.
// Stats tests accept readonly number[], so direct column access works.
const flipperVsMass = penguins.removeNull("flipperLengthMm", "bodyMassG");

const corr = s.test.correlation.pearson({
  x: flipperVsMass.flipperLengthMm,
  y: flipperVsMass.bodyMassG,
});

const corrReport = createDataFrame([
  {
    test: "Pearson r: flipperLengthMm vs bodyMassG",
    n: flipperVsMass.nrows(),
    correlation: s.round(corr.effectSize.value, 4),
    p_value: s.round(corr.pValue, 4),
    significant_at_alpha_0_05: corr.pValue < (corr.alpha ?? 0.05),
  },
]);

corrReport.print(
  "Operation B: Pearson correlation between flipper length and body mass",
);

// --- Operation C -------------------------------------------------------------
// GLM (gaussian / identity) predicting body mass from flipper length and
// culmen length. Drop nulls on all three columns first so the row type
// narrows to non-null numbers — required by s.glm (numeric columns only).
const glmData = penguins
  .removeNull("bodyMassG", "flipperLengthMm", "culmenLengthMm")
  .select("bodyMassG", "flipperLengthMm", "culmenLengthMm");

const model = s.glm({
  formula: "bodyMassG ~ flipperLengthMm + culmenLengthMm",
  family: "gaussian",
  link: "identity",
  data: glmData,
});

const glmSummary = model.summary();

console.log(
  "Operation C: GLM summary — bodyMassG ~ flipperLengthMm + culmenLengthMm (gaussian, identity)",
);
console.log(glmSummary);
