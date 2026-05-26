// Analysis of the PBC dataset using only the tidy-ts-best-practices skill.

import { readCSV, stats as s, writeCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const csvPath =
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/survival/pbc_pbc.csv";

// Schema: keys must match CSV headers exactly. Lab columns with possible "NA"
// use .optional() so missing values come through as `undefined`. trt may also
// be NA per the prompt, so mark it optional too.
const schema = z.object({
  id: z.number(),
  time: z.number(),
  status: z.number(),
  trt: z.number().optional(),
  age: z.number(),
  sex: z.string(),
  bili: z.number(),
  chol: z.number().optional(),
  albumin: z.number(),
  copper: z.number().optional(),
  "alk.phos": z.number().optional(),
  ast: z.number().optional(),
  trig: z.number().optional(),
  platelet: z.number().optional(),
  protime: z.number().optional(),
  stage: z.number().optional(),
});

const df = await readCSV(csvPath, schema);

// Rename dotted column to a friendlier identifier for downstream use
const pbc = df.rename({ "alk.phos": "alk_phos" });

// ---- Task 1: total patients and non-missing chol count ----
const totalPatients = pbc.nrows();
const cholNonMissing = pbc.removeUndefined("chol").nrows();
console.log("Task 1: total patients =", totalPatients);
console.log("Task 1: non-missing chol =", cholNonMissing);

// ---- Task 2: median follow-up time among patients who died (status == 2) ----
const died = pbc.filter((r) => r.status === 2);
const medianFollowupDied = s.median(died.time);
console.log("Task 2: median follow-up (days) among status==2 =", medianFollowupDied);

// ---- Task 3: compare mean bilirubin between died and not-died ----
const notDied = pbc.filter((r) => r.status !== 2);
const meanBiliDied = s.mean(died.bili);
const meanBiliAlive = s.mean(notDied.bili);
console.log("Task 3: mean bili died =", meanBiliDied);
console.log("Task 3: mean bili not-died =", meanBiliAlive);

// Welch's two-sample t-test (do not assume equal variances)
const tResult = s.test.t.independent({
  x: died.bili,
  y: notDied.bili,
  equalVar: false,
});
console.log("Task 3: Welch t-test stat =", tResult.testStatistic.value);
console.log("Task 3: Welch t-test pValue =", tResult.pValue);
console.log(
  "Task 3: significant =",
  tResult.pValue < (tResult.alpha ?? 0.05),
);

// ---- Task 4: linear model albumin ~ age + bili + protime ----
// Drop rows missing any of the four columns. albumin/age/bili are non-missing
// in the schema, but protime is optional; remove rows where protime is
// undefined.
const lmDf = pbc.removeUndefined("protime").select(
  "albumin",
  "age",
  "bili",
  "protime",
);
const lm = s.glm({
  formula: "albumin ~ age + bili + protime",
  family: "gaussian",
  link: "identity",
  data: lmDf,
});
const lmSummary = lm.summary();
console.log("Task 4: n =", lmSummary.n_observations);
console.log("Task 4: R^2 =", lmSummary.r_squared);
console.log("Task 4: coefficients =");
const coefNames = lmSummary.coefficients.names;
for (let i = 0; i < coefNames.length; i++) {
  console.log(
    `  ${coefNames[i]}: estimate=${lmSummary.coefficients.estimate[i]}, ` +
      `p=${lmSummary.coefficients.p_value[i]}`,
  );
}

// ---- Task 5: Pearson correlation between chol and bili (non-missing chol) ----
const cholDf = pbc.removeUndefined("chol");
const corr = s.test.correlation.pearson({
  x: cholDf.chol,
  y: cholDf.bili,
});
console.log("Task 5: Pearson r =", corr.effectSize.value);
console.log("Task 5: p-value =", corr.pValue);
console.log("Task 5: n =", cholDf.nrows());

// ---- Task 6: per-sex summary CSV ----
const summary = pbc.groupBy("sex").summarize({
  n_total: (g) => g.nrows(),
  n_died: (g) => g.filter((r) => r.status === 2).nrows(),
  mean_age: (g) => s.mean(g.age),
  mean_bili: (g) => s.mean(g.bili),
});
summary.print("Per-sex summary:");

const outPath = "/Users/jtmenchaca/tidy-ts/pbc-died-summary.csv";
await writeCSV(summary, outPath);
console.log("Task 6: wrote", outPath);
