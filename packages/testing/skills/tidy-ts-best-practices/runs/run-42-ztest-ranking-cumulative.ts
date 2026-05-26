// Run 42: one-sample z-test on Adelie body mass + per-species ranking + cumulative count
// Tests the tidy-ts-best-practices skill: readCSV + Zod schema, removeNull, s.test.z.oneSample,
// mutateOverGroup with s.rank (min ties), s.denseRank with desc, and s.cumsum for cumulative
// row counts.

import { createDataFrame, readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

// Schema — only the columns we need. nullable on bodyMassG because the file uses "NA".
const schema = z.object({
  species: z.string(),
  island: z.string(),
  bodyMassG: z.number().nullable(),
  sex: z.string().nullable(),
});

const csvPath =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv";

const raw = await readCSV(csvPath, schema, { naValues: ["NA", ""] });

console.log(`Loaded ${raw.nrows()} rows from penguins.csv`);

// ----- Task 1: one-sample z-test on Adelie body mass against mu=3700, sigma=460 -----

// Species in this file is the full Latin form "Adelie Penguin (Pygoscelis adeliae)".
// Filter on substring so we capture every Adelie row.
const adelie = raw
  .filter((r) => r.species.startsWith("Adelie"))
  .removeNull("bodyMassG");

const adelieMean = s.mean(adelie.bodyMassG);
const zResult = s.test.z.oneSample({
  data: adelie.bodyMassG,
  popMean: 3700,
  popStd: 460,
});

console.log("\n--- Task 1: z-test (Adelie body mass vs mu=3700, sigma=460) ---");
console.log(`n              = ${adelie.nrows()}`);
console.log(`observed mean  = ${s.round(adelieMean, 4)} g`);
console.log(`test statistic = ${s.round(zResult.testStatistic.value, 6)} (${zResult.testStatistic.name})`);
console.log(`p-value        = ${zResult.pValue}`);
console.log(
  `significant?   = ${zResult.pValue < (zResult.alpha ?? 0.05)} (alpha=${zResult.alpha})`,
);

// ----- Task 2 & 3: per-species rank by body mass (heaviest = 1) -----
// Task 2: tied penguins share a rank, the next penguin "skips over" the tied positions
//         → "min" method with skipping = standard min rank (1, 2, 2, 4) descending.
// Task 3: unique integer rank, no ties — first-encountered gets the lower rank.
//         → use s.lag-like behavior? No: s.rank doesn't have a "first" tie-breaker option
//           per the skill. Use a manual stable sort by (-bodyMassG, originalIndex) to assign
//           1..n unique ranks. We do that per group via mutateOverGroup.

// Pre-narrow nulls so the row type is non-null for the ranking columns.
const clean = raw.removeNull("bodyMassG");

const ranked = clean
  .groupBy("species")
  .mutateOverGroup({
    // Task 2: standard ("min") ranking, descending — heaviest = 1, ties share, next skips.
    rankBodyMassSkipping: (g) => s.rank([...g.bodyMassG], { ties: "min", desc: true }),
    // Task 3: unique integer ranks — "first" tie-breaker assigns 1..n with ties broken by
    // encounter order (added to s.rank after run-42).
    rankBodyMassUnique: (g) => s.rank([...g.bodyMassG], { ties: "first", desc: true }),
  });

console.log("\n--- Task 2 & 3: example rows per species ---");
const speciesList = s.unique(ranked.species);
for (const sp of speciesList) {
  console.log(`\nSpecies: ${sp}`);
  ranked
    .filter((r) => r.species === sp)
    .select("species", "island", "bodyMassG", "rankBodyMassSkipping", "rankBodyMassUnique")
    .sliceHead(3)
    .print();
}

// ----- Task 4: cumulative count of penguins observed per species in row order -----
// Per the skill (stats-window.md), s.cumsum on an array of 1s gives a running count.
// Apply within each species group via mutateOverGroup.

const withCum = clean.groupBy("species").mutateOverGroup({
  cumCountSpecies: (g) => s.cumsum(new Array(g.nrows()).fill(1)),
});

console.log("\n--- Task 4: last row per species (should equal that species' total) ---");

// Use sliceTail(1) per group to get the last row of each species.
withCum
  .groupBy("species")
  .sliceTail(1)
  .select("species", "bodyMassG", "cumCountSpecies")
  .print();

// Cross-check: independent counts per species.
const totals = clean
  .groupBy("species")
  .summarize({ total: (g) => g.nrows() });

console.log("\n--- Task 4 cross-check: independent species counts ---");
totals.print();

// Sanity self-check on tied ranking using s.rank in array mode directly (skill: stats-window).
// Expect [1, 2, 2, 4] for descending min-rank on [100, 90, 90, 80].
const probeRanks = s.rank([100, 90, 90, 80], { ties: "min", desc: true });
console.log("\n--- Sanity: s.rank([100,90,90,80],{ties:'min',desc:true}) =", probeRanks, "(expect [1,2,2,4]) ---");

// Keep createDataFrame imported and used for symmetry with the skill's 80% example.
const _ignored = createDataFrame([{ x: 1 }]);
void _ignored;
