import { createDataFrame, readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

// Schema — only the columns we need. `model` is a string identifier, the rest are numeric.
const schema = z.object({
  model: z.string(),
  mpg: z.number(),
  hp: z.number(),
  wt: z.number(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/mtcars.csv",
  schema,
);

// GLM requires all numeric columns. Build a numeric-only DataFrame for fitting.
const numericDf = df.select("mpg", "hp", "wt");

// Task 1: Fit mpg ~ wt + hp (gaussian/identity for continuous outcome)
const model = s.glm({
  formula: "mpg ~ wt + hp",
  family: "gaussian",
  link: "identity",
  data: numericDf,
});

const summary = model.summary();
console.log("=== Task 1: Model summary ===");
console.log("Coefficient names:", summary.coefficients.names);
console.log("Estimates:", summary.coefficients.estimate);
console.log("Std errors:", summary.coefficients.std_error);

const ci = model.confint({ level: 0.95 });
console.log("95% confidence intervals:", ci);

// Find the wt index in the coefficient names
const wtIdx = summary.coefficients.names.indexOf("wt");
console.log(`\nwt coefficient: ${summary.coefficients.estimate[wtIdx]}`);
console.log(`wt std error: ${summary.coefficients.std_error[wtIdx]}`);
console.log(`wt 95% CI: [${ci.lower[wtIdx]}, ${ci.upper[wtIdx]}]`);

// Task 2: Predict for three new cars
const newCars = createDataFrame([
  { wt: 2.5, hp: 100 },
  { wt: 3.5, hp: 200 },
  { wt: 4.5, hp: 300 },
]);
const predictions = model.predict(newCars, { type: "response" });
console.log("\n=== Task 2: Predictions for new cars ===");
console.log("(wt=2.5, hp=100):", predictions[0]);
console.log("(wt=3.5, hp=200):", predictions[1]);
console.log("(wt=4.5, hp=300):", predictions[2]);

// Task 3: Residuals — observed mpg minus fitted predictions
const fitted = model.predict(undefined, { type: "response" });
const observedMpg = df.mpg;
const modelNames = df.model;

const residuals: { model: string; residual: number }[] = [];
for (let i = 0; i < observedMpg.length; i++) {
  residuals.push({
    model: modelNames[i],
    residual: observedMpg[i] - fitted[i],
  });
}

const residualsDf = createDataFrame(residuals);
const maxRow = residualsDf.sliceMax("residual", 1).toRows()[0];
const minRow = residualsDf.sliceMin("residual", 1).toRows()[0];

console.log("\n=== Task 3: Residual extremes ===");
console.log(`Max residual: ${maxRow.residual} — ${maxRow.model}`);
console.log(`Min residual: ${minRow.residual} — ${minRow.model}`);

// Task 4: Variance-covariance matrix
const vcov = model.vcov();
console.log("\n=== Task 4: vcov matrix ===");
console.log("vcov:", vcov);
// Diagonal entries = variances of each coefficient
const names = summary.coefficients.names;
console.log("\nDiagonal (variances of each coefficient):");
for (let i = 0; i < names.length; i++) {
  // vcov is a 2D array
  const row = vcov[i] as number[];
  console.log(`  Var(${names[i]}) = ${row[i]}`);
}
