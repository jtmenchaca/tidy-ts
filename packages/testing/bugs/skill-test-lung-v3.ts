import { readCSV, writeCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  inst: z.number().optional(),
  time: z.number(),
  status: z.number(),
  age: z.number(),
  sex: z.number(),
  "ph.ecog": z.number().optional(),
  "ph.karno": z.number().optional(),
  "pat.karno": z.number().optional(),
  "meal.cal": z.number().optional(),
  "wt.loss": z.number().optional(),
});

const csvPath =
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/survival/cancer_lung.csv";

const df = await readCSV(csvPath, schema, { naValues: ["NA", ""] });

// Task 1: confirm missing cells come through as undefined.
console.log("=== Task 1: first 5 rows ===");
df.sliceHead(5).print();

console.log("\nFirst 5 wt.loss values (should include `undefined`):");
console.log(df["wt.loss"].slice(0, 5));

// Task 2: how many patients total, how many with a complete wt.loss?
const totalPatients = df.nrows();
const withWtLoss = df.removeUndefined("wt.loss").nrows();
console.log("\n=== Task 2 ===");
console.log("Total patients:", totalPatients);
console.log("Patients with non-missing wt.loss:", withWtLoss);

// Task 3: compare mean age between male (sex == 1) and female (sex == 2).
const maleAge = df.filter((r) => r.sex === 1).age;
const femaleAge = df.filter((r) => r.sex === 2).age;

const ageCompare = s.compare.twoGroups.centralTendency.toEachOther({
  x: maleAge,
  y: femaleAge,
  parametric: "auto",
});

console.log("\n=== Task 3: age by sex ===");
console.log("Male n   =", maleAge.length, " mean age =", s.mean(maleAge));
console.log("Female n =", femaleAge.length, " mean age =", s.mean(femaleAge));
console.log("Test:", ageCompare.testStatistic.name);
console.log("test statistic =", ageCompare.testStatistic.value);
console.log("p-value =", ageCompare.pValue);
console.log("alpha =", ageCompare.alpha);
console.log(
  "significant?",
  ageCompare.pValue < (ageCompare.alpha ?? 0.05),
);

// Task 4: for each ph.ecog, count + mean age + mean survival time.
//          drop rows where ph.ecog is missing first.
console.log("\n=== Task 4: by ph.ecog ===");
const byEcog = df
  .removeUndefined("ph.ecog")
  .groupBy("ph.ecog")
  .summarize({
    n: (g) => g.nrows(),
    mean_age: (g) => s.mean(g.age),
    mean_time: (g) => s.mean(g.time),
  })
  .arrange("ph.ecog");

byEcog.print();

// Task 5: write rows where wt.loss > 10 to lung-weightloss.csv.
const highLoss = df.filter((r) => r["wt.loss"] !== undefined && r["wt.loss"] > 10);
await writeCSV(highLoss, "lung-weightloss.csv");
console.log("\n=== Task 5 ===");
console.log("Wrote lung-weightloss.csv with", highLoss.nrows(), "rows.");
