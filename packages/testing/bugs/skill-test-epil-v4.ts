// Skill test: analyze epil2.csv using only @tidy-ts/dataframe APIs documented
// in the tidy-ts-best-practices skill.
import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  y: z.number(),
  trt: z.string(),
  base: z.number(),
  age: z.number(),
  V4: z.number(),
  subject: z.number(),
  period: z.number(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/epil2.csv",
  schema,
);

df.sliceHead(5).print("First 5 rows:");

// --- Task 1: unique patients and visits per patient ---
const uniquePatients = s.uniqueCount(df.subject);
const visitsPerPatient = df
  .groupBy("subject")
  .summarize({ n_visits: (g) => g.nrows() });

const visitCounts = s.unique(visitsPerPatient.n_visits);
console.log(`\nTask 1: unique patients = ${uniquePatients}`);
console.log(`Distinct visit counts per patient = ${JSON.stringify(visitCounts)}`);
console.log(`Total patient-visits (rows) = ${df.nrows()}`);

// --- Task 2: per-patient cumulative seizure count sorted by period ---
const withCumulative = df
  .arrange("period")
  .groupBy("subject")
  .mutateOverGroup({
    cum_seizures: (g) => s.cumsum(g.y),
  })
  .arrange("subject");

withCumulative.sliceHead(8).print("\nTask 2: cumulative seizures (first 8 rows):");

// --- Task 3: by treatment, mean + median seizure count, n patient-visits ---
const byTrt = df.groupBy("trt").summarize({
  mean_y: (g) => s.mean(g.y),
  median_y: (g) => s.median(g.y),
  n_patient_visits: (g) => g.nrows(),
});
byTrt.print("\nTask 3: by treatment group:");

// --- Task 4: per-patient (visit-4 count - base), then average within trt ---
const visit4 = df.filter((r) => r.period === 4);

const change = visit4.mutate({
  change_from_base: (r) => r.y - r.base,
});

const changeByTrt = change.groupBy("trt").summarize({
  mean_change: (g) => s.mean(g.change_from_base),
  n_patients: (g) => g.nrows(),
});
changeByTrt.print("\nTask 4: average change from baseline by treatment:");

// --- Task 5: is the average change different between treatment groups? ---
const placeboChange = change.filter((r) => r.trt === "placebo").change_from_base;
const progabideChange = change
  .filter((r) => r.trt === "progabide").change_from_base;

console.log(
  `\nTask 5 setup: placebo n=${placeboChange.length}, progabide n=${progabideChange.length}`,
);

// Check normality first (n is small-ish, Shapiro-Wilk is appropriate).
const swPlacebo = s.test.normality.shapiroWilk({ data: placeboChange });
const swProgabide = s.test.normality.shapiroWilk({ data: progabideChange });
console.log(
  `Shapiro-Wilk placebo: W=${swPlacebo.testStatistic.value.toFixed(4)}, p=${swPlacebo.pValue.toExponential(3)}`,
);
console.log(
  `Shapiro-Wilk progabide: W=${swProgabide.testStatistic.value.toFixed(4)}, p=${swProgabide.pValue.toExponential(3)}`,
);

const normalAlpha = 0.05;
const bothNormal = swPlacebo.pValue >= normalAlpha &&
  swProgabide.pValue >= normalAlpha;

if (bothNormal) {
  // Levene for equal variances, then independent t-test (Welch if unequal).
  const lev = s.test.variance.levene([placeboChange, progabideChange]);
  console.log(
    `Levene: stat=${lev.testStatistic.value.toFixed(4)}, p=${lev.pValue.toFixed(4)}`,
  );
  const equalVar = lev.pValue >= 0.05;
  const t = s.test.t.independent({
    x: placeboChange,
    y: progabideChange,
    equalVar,
  });
  console.log(
    `Two-sample t-test (equalVar=${equalVar}): t=${t.testStatistic.value.toFixed(4)}, p=${t.pValue.toFixed(4)}`,
  );
  console.log(
    `Significant at alpha=${t.alpha ?? 0.05}: ${t.pValue < (t.alpha ?? 0.05)}`,
  );
} else {
  // Non-normal → Mann-Whitney U.
  const mw = s.test.nonparametric.mannWhitney({
    x: placeboChange,
    y: progabideChange,
  });
  console.log(
    `Mann-Whitney U: stat=${mw.testStatistic.value.toFixed(4)}, p=${mw.pValue.toFixed(4)}`,
  );
  console.log(
    `Significant at alpha=${mw.alpha ?? 0.05}: ${mw.pValue < (mw.alpha ?? 0.05)}`,
  );
}
