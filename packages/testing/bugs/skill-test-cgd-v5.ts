// Skill-test: clinical CGD trial data analysis.
// Loads cgd_cgd.csv, computes per-patient infection summaries,
// compares baseline weights, and tabulates quarterly enrollment.

import { readCSV, stats as s, writeCSV } from "@tidy-ts/dataframe";
import { zPlainDate } from "@tidy-ts/shims";
import { z } from "zod";

const csvPath =
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/survival/cgd_cgd.csv";

// Schema — only columns we need; `random` parsed as Temporal.PlainDate.
const schema = z.object({
  id: z.number(),
  center: z.string(),
  random: zPlainDate, // "1989-06-07" -> Temporal.PlainDate
  treat: z.string(),
  sex: z.string(),
  age: z.number(),
  weight: z.number(),
  height: z.number(),
  tstart: z.number(),
  tstop: z.number(),
  status: z.number(),
});

const df = await readCSV(csvPath, schema);

console.log(`Loaded ${df.nrows()} rows.`);
df.sliceHead(3).print("First 3 rows:");

// --- 1) Confirm `random` is date-like, not a string ------------------------
const firstDate = df.extractNth("random", 0);
console.log(
  `\nType of first 'random' value: ${typeof firstDate} ` +
    `(constructor: ${firstDate?.constructor.name})`,
);

// --- 2) Unique patients per treatment group --------------------------------
const patientsPerTreat = df
  .distinct("id", "treat")
  .groupBy("treat")
  .summarize({
    unique_patients: (g) => g.nrows(),
  });
patientsPerTreat.print("Unique patients per treatment group:");

// --- 3) Mean infections per patient by treatment ---------------------------
// First, count status==1 events per patient (keeping their treat).
const infectionsPerPatient = df
  .groupBy("id", "treat")
  .summarize({
    infections: (g) => s.sum(g.status), // status is 0/1, so sum = event count
  })
  .ungroup();

infectionsPerPatient.sliceHead(5).print("First 5 per-patient infection counts:");

const meanInfections = infectionsPerPatient
  .groupBy("treat")
  .summarize({
    n_patients: (g) => g.nrows(),
    mean_infections: (g) => s.mean(g.infections),
    total_infections: (g) => s.sum(g.infections),
  });
meanInfections.print("Mean infections per patient by treatment:");

// --- 4) Baseline weight comparison between treatment groups ----------------
// "First observation" per patient: lowest tstart row per id.
const baseline = df
  .groupBy("id")
  .sliceMin("tstart", 1)
  .ungroup();

const baselineByTreat = baseline
  .groupBy("treat")
  .summarize({
    n: (g) => g.nrows(),
    mean_weight: (g) => s.mean(g.weight),
    sd_weight: (g) => s.stdev(g.weight),
  });
baselineByTreat.print("Baseline weight by treatment:");

// Split the baseline weights into the two arms for a t-test.
const treatLevels = baseline.extractUnique("treat");
console.log(`Treatment levels: ${treatLevels.join(", ")}`);
const [arm1, arm2] = treatLevels;

const weightArm1 = baseline.filter((r) => r.treat === arm1).weight;
const weightArm2 = baseline.filter((r) => r.treat === arm2).weight;

const tResult = s.test.t.independent({
  x: weightArm1,
  y: weightArm2,
  equalVar: false,
});
console.log(
  `\nWelch's t-test on baseline weight (${arm1} vs ${arm2}):` +
    `\n  t = ${tResult.testStatistic.value.toFixed(4)}` +
    `, df = ${tResult.degreesOfFreedom?.toFixed(2) ?? "n/a"}` +
    `, p = ${tResult.pValue.toFixed(4)}` +
    `, alpha = ${tResult.alpha}` +
    `\n  Significant at alpha=${tResult.alpha}? ` +
    `${tResult.pValue < (tResult.alpha ?? 0.05)}`,
);

// --- 5) Quarterly enrollment table -----------------------------------------
// One row per patient (their `random` is the same across rows), then bucket
// to calendar quarter using Temporal.PlainDate's month.
const enrollment = df.distinct("id", "random");

const withQuarter = enrollment.mutate({
  year: (r) => r.random.year,
  quarter: (r) => Math.ceil(r.random.month / 3),
  yq: (r) => `${r.random.year}-Q${Math.ceil(r.random.month / 3)}`,
});

const quarterly = withQuarter
  .groupBy("yq")
  .summarize({
    n_patients: (g) => g.nrows(),
  })
  .arrange("yq");

quarterly.print("Quarterly enrollment (by random date):");

// --- 6) Write per-patient infection counts to CSV --------------------------
const outPath = "cgd-infections-by-patient.csv";
await writeCSV(infectionsPerPatient, outPath);
console.log(`\nWrote per-patient infection counts to ${outPath}`);
