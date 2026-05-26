import {
  createDataFrame,
  readCSV,
  stats as s,
  writeCSV,
} from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  id: z.number(),
  rx: z.string(),
  sex: z.number(),
  age: z.number(),
  nodes: z.number().nullable(),
  status: z.number(),
  time: z.number(),
  etype: z.number(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/survival/cancer_colon.csv",
  schema,
);

console.log("Loaded rows:", df.nrows());

// ----- Task 1: unique patients overall and per arm -----
const uniquePatients = df.distinct("id").nrows();
console.log("\n--- Task 1 ---");
console.log("Unique patients:", uniquePatients);

const perArm = df
  .distinct("id", "rx")
  .groupBy("rx")
  .summarize({ patients: (g) => g.nrows() })
  .arrange("rx");
perArm.print("Patients per treatment arm");

// ----- Task 2: fraction with recurrence; fraction with death -----
const recurrenceRows = df.filter((r) => r.etype === 1);
const deathRows = df.filter((r) => r.etype === 2);

const nRecurred = recurrenceRows.filter((r) => r.status === 1).nrows();
const nDied = deathRows.filter((r) => r.status === 1).nrows();

const fracRecurred = nRecurred / uniquePatients;
const fracDied = nDied / uniquePatients;

console.log("\n--- Task 2 ---");
console.log(
  `Recurrence: ${nRecurred} / ${uniquePatients} = ${s.round(fracRecurred, 4)}`,
);
console.log(
  `Death:      ${nDied} / ${uniquePatients} = ${s.round(fracDied, 4)}`,
);

// ----- Task 3: recurrence rate per arm + significance test -----
const recurrenceByArm = recurrenceRows
  .groupBy("rx")
  .summarize({
    total: (g) => g.nrows(),
    recurred: (g) => s.sum(g.status),
  })
  .mutate({
    rate: (r) => r.recurred / r.total,
  })
  .arrange("rx");
recurrenceByArm.print("Recurrence rate by arm");

// Build a 2x3 contingency table: rows = [recurred, not_recurred], cols = arms
const arms = recurrenceByArm.extract("rx");
const recurredCounts = recurrenceByArm.extract("recurred");
const totalCounts = recurrenceByArm.extract("total");

const recurredRow = recurredCounts;
const notRecurredRow = totalCounts.map((t, i) => t - recurredCounts[i]);

const chi = s.test.categorical.chiSquare({
  contingencyTable: [recurredRow, notRecurredRow],
});

console.log("\n--- Task 3 ---");
console.log("Arms:", arms.join(", "));
console.log(
  `Chi-square: stat=${s.round(chi.testStatistic.value, 4)}, p=${
    s.round(chi.pValue, 6)
  }, df=${chi.degreesOfFreedom}`,
);
console.log(
  "Significant at alpha=0.05?",
  chi.pValue < (chi.alpha ?? 0.05),
);

// ----- Task 4: median time-to-recurrence per arm among recurred patients -----
const recurredOnly = recurrenceRows.filter((r) => r.status === 1);
const medianRecurTime = recurredOnly
  .groupBy("rx")
  .summarize({
    n_recurred: (g) => g.nrows(),
    median_time: (g) => s.median(g.time),
  })
  .arrange("rx");
console.log("\n--- Task 4 ---");
medianRecurTime.print("Median time-to-recurrence by arm");

// ----- Task 5: GLM on death subset for patients who died (status=1) -----
// Predict time ~ age + nodes + sex, gaussian/identity
const deathDied = deathRows
  .filter((r) => r.status === 1)
  .removeNull("nodes");

console.log("\n--- Task 5 ---");
console.log("n for GLM:", deathDied.nrows());

// GLM needs purely numeric columns; build a numeric-only frame
const glmDf = createDataFrame({
  columns: {
    time: deathDied.extract("time"),
    age: deathDied.extract("age"),
    nodes: deathDied.extract("nodes"),
    sex: deathDied.extract("sex"),
  },
});

const model = s.glm({
  formula: "time ~ age + nodes + sex",
  family: "gaussian",
  link: "identity",
  data: glmDf,
});
const summary = model.summary();

console.log("Coefficients:");
const { names, estimate, std_error, statistic, p_value } = summary.coefficients;
for (let i = 0; i < names.length; i++) {
  console.log(
    `  ${names[i].padEnd(12)} estimate=${
      s.round(estimate[i], 4)
    }, se=${s.round(std_error[i], 4)}, t=${
      s.round(statistic[i], 4)
    }, p=${s.round(p_value[i], 6)}`,
  );
}
console.log("R-squared:", s.round(summary.r_squared, 4));
console.log("Adjusted R-squared:", s.round(summary.adjusted_r_squared, 4));
console.log("n_observations:", summary.n_observations);

// ----- Task 6: write colon-recurrence-by-arm.csv -----
const outDf = recurrenceByArm
  .rename({ rx: "arm", total: "total_patients", recurred: "n_recurred" })
  .mutate({ recurrence_rate: (r) => r.rate })
  .select("arm", "total_patients", "n_recurred", "recurrence_rate");

await writeCSV(
  outDf,
  "/Users/jtmenchaca/tidy-ts/colon-recurrence-by-arm.csv",
);
console.log("\n--- Task 6 ---");
console.log("Wrote colon-recurrence-by-arm.csv");
outDf.print();
