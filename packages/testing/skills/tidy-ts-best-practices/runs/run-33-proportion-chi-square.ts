import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  species: z.string(),
  island: z.string(),
  sex: z.string().nullable(),
});

const raw = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv",
  schema,
  { naValues: ["NA", ""] },
);

// Drop rows missing sex (narrows row type so sex is non-null downstream).
const df = raw.removeNull("sex");

console.log(`Total rows (with sex): ${df.nrows()}`);
console.log(`Total rows (raw): ${raw.nrows()}`);

// ---------------------------------------------------------------------------
// Task 1: Is the proportion of male penguins different from 0.5?
// ---------------------------------------------------------------------------
const isMaleAll: boolean[] = df.sex.map((s) => s === "MALE");
const propMaleAll = isMaleAll.filter((b) => b).length / isMaleAll.length;

const t1 = s.test.proportion.oneSample({
  data: isMaleAll,
  hypothesizedProportion: 0.5,
});

console.log("\n=== Task 1: One-sample proportion test (male vs 0.5) ===");
console.log(`Observed proportion male: ${propMaleAll.toFixed(4)}`);
console.log(`n = ${isMaleAll.length}`);
console.log(`Test statistic (${t1.testStatistic.name}): ${t1.testStatistic.value.toFixed(4)}`);
console.log(`p-value: ${t1.pValue.toFixed(4)}`);
console.log(
  `Interpretation: ${
    t1.pValue < (t1.alpha ?? 0.05)
      ? "significantly different from 0.5"
      : "NOT significantly different from 0.5"
  }`,
);

// ---------------------------------------------------------------------------
// Task 2: Biscoe vs Dream — proportion male
// ---------------------------------------------------------------------------
const biscoe = df.filter((r) => r.island === "Biscoe");
const dream = df.filter((r) => r.island === "Dream");

const biscoeMale: boolean[] = biscoe.sex.map((s) => s === "MALE");
const dreamMale: boolean[] = dream.sex.map((s) => s === "MALE");

const propBiscoe = biscoeMale.filter((b) => b).length / biscoeMale.length;
const propDream = dreamMale.filter((b) => b).length / dreamMale.length;

const t2 = s.test.proportion.twoSample({
  data1: biscoeMale,
  data2: dreamMale,
});

console.log("\n=== Task 2: Two-sample proportion test (Biscoe vs Dream) ===");
console.log(`Biscoe: n=${biscoeMale.length}, proportion male=${propBiscoe.toFixed(4)}`);
console.log(`Dream:  n=${dreamMale.length}, proportion male=${propDream.toFixed(4)}`);
console.log(`Test statistic (${t2.testStatistic.name}): ${t2.testStatistic.value.toFixed(4)}`);
console.log(`p-value: ${t2.pValue.toFixed(4)}`);
console.log(
  `Interpretation: ${
    t2.pValue < (t2.alpha ?? 0.05)
      ? "Biscoe and Dream proportions differ significantly"
      : "no significant difference between Biscoe and Dream"
  }`,
);

// ---------------------------------------------------------------------------
// Build a contingency table from two categorical columns.
// ---------------------------------------------------------------------------
function contingencyTable(
  rows: ReadonlyArray<string>,
  cols: ReadonlyArray<string>,
): { rowLabels: string[]; colLabels: string[]; table: number[][] } {
  const rowLabels = Array.from(new Set(rows)).sort();
  const colLabels = Array.from(new Set(cols)).sort();
  const rowIdx = new Map(rowLabels.map((v, i) => [v, i]));
  const colIdx = new Map(colLabels.map((v, i) => [v, i]));
  const table: number[][] = rowLabels.map(() => colLabels.map(() => 0));
  for (let i = 0; i < rows.length; i++) {
    const r = rowIdx.get(rows[i])!;
    const c = colIdx.get(cols[i])!;
    table[r][c] += 1;
  }
  return { rowLabels, colLabels, table };
}

// ---------------------------------------------------------------------------
// Task 3: Chi-square — species × island (using full data; sex not required)
// ---------------------------------------------------------------------------
const speciesAll = raw.species;
const islandAll = raw.island;
const ct3 = contingencyTable(speciesAll, islandAll);

const t3 = s.test.categorical.chiSquare({ contingencyTable: ct3.table });

console.log("\n=== Task 3: Chi-square — species x island ===");
console.log(`Rows (species): ${ct3.rowLabels.join(", ")}`);
console.log(`Cols (island): ${ct3.colLabels.join(", ")}`);
for (let r = 0; r < ct3.table.length; r++) {
  console.log(`  ${ct3.rowLabels[r]}: ${ct3.table[r].join(", ")}`);
}
console.log(`Test statistic (${t3.testStatistic.name}): ${t3.testStatistic.value.toFixed(4)}`);
console.log(`Degrees of freedom: ${t3.degreesOfFreedom}`);
console.log(`p-value: ${t3.pValue.toExponential(4)}`);
console.log(
  `Interpretation: ${
    t3.pValue < (t3.alpha ?? 0.05)
      ? "significant association between species and island"
      : "no significant association between species and island"
  }`,
);

// ---------------------------------------------------------------------------
// Task 4: Chi-square — species × sex (dropping rows missing sex)
// ---------------------------------------------------------------------------
const ct4 = contingencyTable(df.species, df.sex);

const t4 = s.test.categorical.chiSquare({ contingencyTable: ct4.table });

console.log("\n=== Task 4: Chi-square — species x sex ===");
console.log(`Rows (species): ${ct4.rowLabels.join(", ")}`);
console.log(`Cols (sex): ${ct4.colLabels.join(", ")}`);
for (let r = 0; r < ct4.table.length; r++) {
  console.log(`  ${ct4.rowLabels[r]}: ${ct4.table[r].join(", ")}`);
}
console.log(`Test statistic (${t4.testStatistic.name}): ${t4.testStatistic.value.toFixed(4)}`);
console.log(`Degrees of freedom: ${t4.degreesOfFreedom}`);
console.log(`p-value: ${t4.pValue.toFixed(4)}`);
console.log(
  `Interpretation: ${
    t4.pValue < (t4.alpha ?? 0.05)
      ? "significant association between species and sex"
      : "no significant association between species and sex"
  }`,
);
