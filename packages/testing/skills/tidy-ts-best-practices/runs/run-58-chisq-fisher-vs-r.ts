import { peekCSV, readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const path =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv";

// 1. Peek the file to confirm headers before writing the schema.
console.log(await peekCSV(path));

// 2. Schema covering only what we need; species/island as strings,
//    sex nullable (the file has "NA"), bill length (culmenLengthMm) nullable.
const schema = z.object({
  species: z.string(),
  island: z.string(),
  sex: z.string().nullable(),
  culmenLengthMm: z.number().nullable(),
});

const penguins = await readCSV(path, schema);
console.log(`Loaded ${penguins.nrows()} rows`);

// ---------------------------------------------------------------------------
// Q1: 3x3 chi-square — species x island association.
// Drop rows missing species or island. (In this CSV neither column has NAs,
// but the skill's stats-tests example pattern uses groupBy + summarize
// straight from a clean DataFrame.)
// ---------------------------------------------------------------------------
const cleanQ1 = penguins.removeNull("species", "island");

const counts = cleanQ1
  .groupBy("species", "island")
  .summarize({ n: (g) => g.nrows() })
  .pivotWider({ namesFrom: "island", valuesFrom: "n" });

const rowLabels = counts.species;
const colLabels = counts.columns().filter((c) => c !== "species");
const contingencyQ1: number[][] = counts
  .drop("species")
  .toRows()
  .map((row) =>
    colLabels.map((c) => (row[c as keyof typeof row] as number | undefined) ?? 0)
  );

console.log("\nQ1 contingency (rows = species, cols = island):");
console.log("cols:", colLabels);
for (let i = 0; i < rowLabels.length; i++) {
  console.log(`  ${rowLabels[i]}:`, contingencyQ1[i]);
}

const chi = s.test.categorical.chiSquare({ contingencyTable: contingencyQ1 });

// R reference values (from Rscript run against the same CSV):
const R_CHI = {
  stat: 299.550327431481946,
  df: 4,
  p: 1.354573829719264e-63,
};

// ---------------------------------------------------------------------------
// Q2: Fisher's exact (2x2) — among Chinstrap, sex vs bill > 50 mm.
// Drop rows with NA sex or NA bill length first.
// ---------------------------------------------------------------------------
const chinstrap = penguins
  .filter((r) => r.species === "Chinstrap penguin (Pygoscelis antarctica)")
  .removeNull("sex", "culmenLengthMm")
  .mutate({ over50: (r) => r.culmenLengthMm > 50 });

const counts2 = chinstrap
  .groupBy("sex", "over50")
  .summarize({ n: (g) => g.nrows() })
  .pivotWider({ namesFrom: "over50", valuesFrom: "n" });

console.log("\nQ2 contingency (rows = sex, cols = over50):");
counts2.print();

// Build the 2x2 in (FEMALE, MALE) x (FALSE, TRUE) order to match R's table().
const sexLabels = counts2.sex;
const over50ColLabels = counts2.columns().filter((c) => c !== "sex");
const contingencyQ2: number[][] = counts2
  .drop("sex")
  .toRows()
  .map((row) =>
    over50ColLabels.map(
      (c) => (row[c as keyof typeof row] as number | undefined) ?? 0,
    )
  );
console.log("Row labels:", sexLabels);
console.log("Col labels:", over50ColLabels);
console.log("Contingency:", contingencyQ2);

const fisher = s.test.categorical.fishersExact({
  contingencyTable: contingencyQ2,
});

// R reference values:
const R_FISH = {
  p: 1.730766902877242e-6,
  or: 15.264488499007024,
  ciLo: 4.212725039866607,
  ciHi: 67.218953912207382,
};

// ---------------------------------------------------------------------------
// Compare and report.
// ---------------------------------------------------------------------------
function cmp(name: string, got: number, want: number, tol: number) {
  const diff = Math.abs(got - want);
  const pass = diff <= tol;
  return {
    name,
    tidyts: got,
    R: want,
    absDiff: diff,
    tol,
    pass,
  };
}

const results = [
  cmp("Q1 chi-square X^2", chi.testStatistic.value, R_CHI.stat, 1e-6),
  cmp("Q1 chi-square df", chi.degreesOfFreedom, R_CHI.df, 1e-6),
  cmp("Q1 chi-square p", chi.pValue, R_CHI.p, 1e-6),
  // Fisher tolerances per task: 1e-6, fall back to 1e-4 on p if needed.
  cmp("Q2 Fisher p", fisher.pValue, R_FISH.p, 1e-6),
  // NOTE: stats-tests.md describes Fisher's result as "testStatistic (odds
  // ratio)", but at runtime the odds ratio lives on effectSize.value;
  // testStatistic.value is 0 / name "(none)". Read it from effectSize.
  cmp("Q2 Fisher OR", fisher.effectSize.value, R_FISH.or, 1e-6),
  cmp(
    "Q2 Fisher CI lower",
    fisher.confidenceInterval.lower,
    R_FISH.ciLo,
    1e-6,
  ),
  cmp(
    "Q2 Fisher CI upper",
    fisher.confidenceInterval.upper,
    R_FISH.ciHi,
    1e-6,
  ),
];

console.log("\n=== Pass/Fail Table ===");
console.log(
  "name".padEnd(28),
  "tidyts".padEnd(26),
  "R".padEnd(26),
  "absDiff".padEnd(14),
  "tol".padEnd(10),
  "pass",
);
for (const r of results) {
  console.log(
    r.name.padEnd(28),
    String(r.tidyts).padEnd(26),
    String(r.R).padEnd(26),
    r.absDiff.toExponential(3).padEnd(14),
    String(r.tol).padEnd(10),
    r.pass ? "PASS" : "FAIL",
  );
}

// If Fisher p fails 1e-6, try the looser 1e-4 tolerance as the task allows.
const fisherPRow = results.find((r) => r.name === "Q2 Fisher p")!;
if (!fisherPRow.pass) {
  const looser = Math.abs(fisher.pValue - R_FISH.p) <= 1e-4;
  console.log(
    `Note: Fisher p failed 1e-6 (abs diff ${fisherPRow.absDiff.toExponential(3)}); ` +
      `loosened tolerance 1e-4 → ${looser ? "PASS" : "FAIL"}`,
  );
}

const allPass = results.every((r) => r.pass);
console.log(`\nOverall: ${allPass ? "ALL PASS" : "FAILURES PRESENT"}`);
