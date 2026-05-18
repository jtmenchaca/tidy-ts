import { readCSV, stats as s, writeCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  Nest: z.string(),
  FoodTreatment: z.string(),
  SexParent: z.string(),
  ArrivalTime: z.number(),
  SiblingNegotiation: z.number(),
  BroodSize: z.number(),
  NegPerChick: z.number(),
  logBroodSize: z.number(),
});

const owls = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/Owls.csv",
  schema,
);

// Task 1: per FoodTreatment × SexParent — n visits and mean SiblingNegotiation
const grouped = owls
  .groupBy("FoodTreatment", "SexParent")
  .summarize({
    n_visits: (g) => g.nrows(),
    mean_sibneg: (g) => s.mean(g.SiblingNegotiation),
  })
  .arrange("FoodTreatment");

grouped.print("Per-treatment per-sex summary");

// Task 2: pivot to wide table: rows = FoodTreatment, cols = SexParent, cells = mean_sibneg
const wide = grouped
  .drop("n_visits")
  .pivotWider({
    namesFrom: "SexParent",
    valuesFrom: "mean_sibneg",
    expectedColumns: ["Female", "Male"],
  });

wide.print("Wide table (mean SiblingNegotiation)");

// Task 3: two-sample test — is mean SiblingNegotiation different between Deprived and Satiated?
const deprived = owls
  .filter((r) => r.FoodTreatment === "Deprived")
  .SiblingNegotiation;
const satiated = owls
  .filter((r) => r.FoodTreatment === "Satiated")
  .SiblingNegotiation;

// Use Welch's t-test (do not assume equal variances)
const tResult = s.test.t.independent({
  x: deprived,
  y: satiated,
  equalVar: false,
});

console.log("\nTwo-sample Welch t-test: Deprived vs Satiated");
console.log("  t =", tResult.testStatistic.value);
console.log("  df =", (tResult as { degreesOfFreedom?: number }).degreesOfFreedom);
console.log("  p-value =", tResult.pValue);
console.log("  alpha =", tResult.alpha);
console.log("  significant?", tResult.pValue < (tResult.alpha ?? 0.05));
console.log("  effectSize (", tResult.effectSize.name, ") =", tResult.effectSize.value);
console.log("  n Deprived =", deprived.length, ", n Satiated =", satiated.length);
console.log("  mean Deprived =", s.mean(deprived), ", mean Satiated =", s.mean(satiated));

// Task 4: regression — SiblingNegotiation ~ FoodTreatment + ArrivalTime
// Encode FoodTreatment as numeric (Deprived=1, Satiated=0)
const regData = owls.mutate({
  FoodTreatmentNum: (r) => (r.FoodTreatment === "Deprived" ? 1 : 0),
}).select("SiblingNegotiation", "FoodTreatmentNum", "ArrivalTime");

const model = s.glm({
  formula: "SiblingNegotiation ~ FoodTreatmentNum + ArrivalTime",
  family: "gaussian",
  link: "identity",
  data: regData,
});

const summary = model.summary();
console.log("\nGLM (gaussian, identity): SiblingNegotiation ~ FoodTreatmentNum + ArrivalTime");
console.log("  n_observations =", summary.n_observations);
console.log("  Coefficients:");
const coefs = summary.coefficients;
for (let i = 0; i < coefs.names.length; i++) {
  console.log(
    `    ${coefs.names[i].padEnd(20)}  estimate=${coefs.estimate[i]}  se=${coefs.std_error[i]}  t=${coefs.statistic[i]}  p=${coefs.p_value[i]}`,
  );
}
console.log("  r_squared =", summary.r_squared);
console.log("  adjusted_r_squared =", summary.adjusted_r_squared);
console.log("  F-statistic =", summary.f_statistic);
console.log("  F p-value =", summary.f_p_value);

// Task 5: write the wide table to CSV
await writeCSV(wide, "/Users/jtmenchaca/tidy-ts/owl-means.csv");
console.log("\nWrote /Users/jtmenchaca/tidy-ts/owl-means.csv");
