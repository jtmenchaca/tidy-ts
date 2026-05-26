// Skill-test: flchain analysis using only the tidy-ts-best-practices skill docs.
import { readCSV, stats as s, writeCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const path =
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/survival/flchain.csv";

// Schema matches the CSV headers verbatim (dots included).
const schema = z.object({
  age: z.number(),
  sex: z.string(),
  "sample.yr": z.number(),
  kappa: z.number(),
  lambda: z.number(),
  "flc.grp": z.number(),
  creatinine: z.number().nullable(), // has NA values
  mgus: z.number(),
  futime: z.number(),
  death: z.number(),
  chapter: z.string(),
});

const df = await readCSV(path, schema);

// --- Task 1: total + breakdown by sex
const total = df.nrows();
console.log(`\nTask 1 — total rows: ${total}`);
const bySex = df
  .groupBy("sex")
  .summarize({ count: (g) => g.nrows() })
  .arrange("count", "desc");
bySex.print("Breakdown by sex");

// --- Task 2: kappa/lambda ratio, mean+median overall and by sex
const withRatio = df.mutate({
  ratio: (r) => r.kappa / r.lambda,
});

const overallMean = s.mean(withRatio.ratio);
const overallMedian = s.median(withRatio.ratio);
console.log(
  `\nTask 2 — kappa/lambda ratio overall: mean=${overallMean?.toFixed(4)}, median=${overallMedian?.toFixed(4)}`,
);

const ratioBySex = withRatio
  .groupBy("sex")
  .summarize({
    mean_ratio: (g) => s.round(s.mean(g.ratio), 4),
    median_ratio: (g) => s.round(s.median(g.ratio), 4),
    n: (g) => g.nrows(),
  });
ratioBySex.print("Kappa/lambda ratio by sex");

// --- Task 3: correlation age vs creatinine (drop missing creatinine)
const clean = df.removeNull("creatinine");
console.log(
  `\nTask 3 — rows after dropping null creatinine: ${clean.nrows()}`,
);
const corr = s.test.correlation.pearson({
  x: clean.age,
  y: clean.creatinine,
});
console.log(
  `Pearson r = ${corr.effectSize.value.toFixed(4)}, p-value = ${corr.pValue.toExponential(4)}`,
);

// --- Task 4: two-sample test on kappa, died vs survived
const died = df.filter((r) => r.death === 1).kappa;
const survived = df.filter((r) => r.death === 0).kappa;
console.log(
  `\nTask 4 — died n=${died.length}, survived n=${survived.length}`,
);
// Welch's t-test (do not assume equal variance)
const tTest = s.test.t.independent({
  x: died,
  y: survived,
  equalVar: false,
});
console.log(
  `Welch's t: t=${tTest.testStatistic.value.toFixed(4)}, p-value=${tTest.pValue.toExponential(4)}`,
);
console.log(
  `Died mean kappa=${s.mean(died)?.toFixed(4)}, Survived mean kappa=${
    s.mean(survived)?.toFixed(4)
  }`,
);

// --- Task 5: death rate by flc.grp, sorted desc
const byGrp = df
  .groupBy("flc.grp")
  .summarize({
    n: (g) => g.nrows(),
    deaths: (g) => s.sum(g.death),
    death_rate: (g) => s.round(s.mean(g.death), 4),
  })
  .arrange("death_rate", "desc");
byGrp.print("Task 5 — Death rate by flc.grp");

// --- Task 6: top 5 cause-of-death chapters among the dead
const topCauses = df
  .filter((r) => r.death === 1)
  .groupBy("chapter")
  .summarize({ count: (g) => g.nrows() })
  .arrange("count", "desc")
  .sliceHead(5);
topCauses.print("Task 6 — top 5 causes of death");

await writeCSV(topCauses, "flchain-top-death-causes.csv");
console.log("\nWrote flchain-top-death-causes.csv");
