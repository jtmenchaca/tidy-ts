import { readCSV, stats as s, writeCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  id: z.number(),
  start: z.number(),
  stop: z.number(),
  event: z.number(),
  transplant: z.number(),
  age: z.number(),
  year: z.number(),
  surgery: z.number(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/survival/heart_jasa1.csv",
  schema,
);

// ---- Task 1: unique patients & total rows ----
const totalRows = df.nrows();
const uniquePatients = s.uniqueCount(df.id);
console.log("Task 1: total rows =", totalRows, "unique patients =", uniquePatients);

// ---- Task 2: per-patient follow-up time ----
// First-row-per-patient (smallest start) gives first_start; last-row gives last_stop.
const firstRowPerPatient = df.groupBy("id").sliceMin("start", 1).ungroup();
const lastRowPerPatient = df.groupBy("id").sliceMax("stop", 1).ungroup();

// Summarise per-patient flags
const perPatient = df.groupBy("id").summarize({
  first_start: (g) => s.min(g.start),
  last_stop: (g) => s.max(g.stop),
  ever_transplant: (g) => s.max(g.transplant),
  ever_died: (g) => s.max(g.event),
});

const followup = perPatient.first_start.map((fs, i) => {
  const ls = perPatient.last_stop[i];
  return (ls ?? 0) - (fs ?? 0);
});

const meanFollowup = s.mean(followup, { removeNull: true });
const medianFollowup = s.median(followup, { removeNull: true });
const sdFollowup = s.stdev(followup, { removeNull: true });
console.log(
  "Task 2: follow-up mean =",
  s.round(meanFollowup, 2),
  "median =",
  s.round(medianFollowup, 2),
  "sd =",
  s.round(sdFollowup, 2),
);

// ---- Task 3: death rate by ever-transplant ----
const everTRows = perPatient.filter((r) => r.ever_transplant === 1);
const neverTRows = perPatient.filter((r) => r.ever_transplant === 0);

// ever_died is 0/1 numeric; treat as proportion via mean.
const everTDied = everTRows.ever_died.map((v) => (v ?? 0));
const neverTDied = neverTRows.ever_died.map((v) => (v ?? 0));
const everTRate = s.mean(everTDied);
const neverTRate = s.mean(neverTDied);
console.log(
  "Task 3: ever-transplant death rate =",
  s.round(everTRate, 4),
  `(${s.sum(everTDied)}/${everTRows.nrows()})`,
  " never-transplant death rate =",
  s.round(neverTRate, 4),
  `(${s.sum(neverTDied)}/${neverTRows.nrows()})`,
);

// ---- Task 4: age at enrollment, died vs survived ----
// Join the "first row" age onto ever_died flag.
// firstRowPerPatient already has age from the first row.
// Get died flag by re-summarising or join.
const patientStatus = perPatient.select("id", "ever_died");
const firstRowsWithStatus = firstRowPerPatient.innerJoin(patientStatus, "id");

const diedAge = firstRowsWithStatus
  .filter((r) => r.ever_died === 1)
  .age;
const survivedAge = firstRowsWithStatus
  .filter((r) => r.ever_died === 0)
  .age;

const cmp = s.compare.twoGroups.centralTendency.toEachOther({
  x: diedAge,
  y: survivedAge,
  parametric: "auto",
});
console.log(
  "Task 4: age test =",
  cmp.testStatistic.name,
  "stat =",
  s.round(cmp.testStatistic.value, 4),
  "p =",
  s.round(cmp.pValue, 4),
  "alpha =",
  cmp.alpha,
  "significant =",
  cmp.pValue < (cmp.alpha ?? 0.05),
);
console.log(
  "  died age: n =",
  diedAge.length,
  "mean =",
  s.round(s.mean(diedAge), 3),
  "sd =",
  s.round(s.stdev(diedAge), 3),
);
console.log(
  "  survived age: n =",
  survivedAge.length,
  "mean =",
  s.round(s.mean(survivedAge), 3),
  "sd =",
  s.round(s.stdev(survivedAge), 3),
);

// ---- Task 5: write first-row of each died patient ----
const diedFirstRow = firstRowsWithStatus
  .filter((r) => r.ever_died === 1)
  .drop("ever_died");

await writeCSV(diedFirstRow, "heart-deaths-first-row.csv");
console.log(
  "Task 5: wrote heart-deaths-first-row.csv with",
  diedFirstRow.nrows(),
  "rows",
);
diedFirstRow.sliceHead(5).print("first 5 rows of died-first-row");
