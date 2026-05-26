import { readCSV, stats as s, writeCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const CSV_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/penguins.csv";

// Penguin CSV headers — note real headers are camelCase
// (e.g. bodyMassG, flipperLengthMm, culmenLengthMm, culmenDepthMm).
const schema = z.object({
  species: z.string(),
  culmenLengthMm: z.number().nullable(),
  culmenDepthMm: z.number().nullable(),
  flipperLengthMm: z.number().nullable(),
  bodyMassG: z.number().nullable(),
  sex: z.string().nullable(),
});

const raw = await readCSV(CSV_PATH, schema, { naValues: ["NA", ""] });

// Normalize species labels — file uses "Adelie Penguin (Pygoscelis adeliae)" etc.
const tagged = raw.mutate({
  speciesShort: (r) => {
    if (r.species.startsWith("Adelie")) return "Adelie";
    if (r.species.startsWith("Chinstrap")) return "Chinstrap";
    if (r.species.startsWith("Gentoo")) return "Gentoo";
    return r.species;
  },
});

// Task 1 — counts per species (before dropping null body mass)
const speciesCounts = tagged
  .groupBy("speciesShort")
  .summarize({ n: (g) => g.nrows() })
  .arrange("speciesShort");

console.log("=== Task 1: counts per species ===");
speciesCounts.print();

// Drop rows where bodyMassG is null for the rest of the analysis
const df = tagged.removeNull("bodyMassG");
console.log(`Rows after dropping null bodyMassG: ${df.nrows()}`);

// Extract per-species body mass arrays
const adelie = df.filter((r) => r.speciesShort === "Adelie");
const chinstrap = df.filter((r) => r.speciesShort === "Chinstrap");
const gentoo = df.filter((r) => r.speciesShort === "Gentoo");

const adelieMass = adelie.bodyMassG;
const chinstrapMass = chinstrap.bodyMassG;
const gentooMass = gentoo.bodyMassG;

// Task 2 — one-way ANOVA for body mass across the three species
console.log("\n=== Task 2: one-way ANOVA — body mass ~ species ===");
const anova = s.test.anova.oneWay([adelieMass, chinstrapMass, gentooMass]);
console.log(
  `F = ${anova.testStatistic.value.toFixed(4)} (${anova.testStatistic.name})`,
);
console.log(`p-value = ${anova.pValue}`);
console.log(
  `effect size (${anova.effectSize.name}) = ${
    anova.effectSize.value.toFixed(4)
  }`,
);
console.log(`alpha = ${anova.alpha}`);
console.log(`significant: ${anova.pValue < (anova.alpha ?? 0.05)}`);

// Task 3 — follow-up: Tukey HSD post-hoc for body mass
console.log("\n=== Task 3: Tukey HSD pairwise comparisons ===");
const tukey = s.compare.postHoc.tukey([
  adelieMass,
  chinstrapMass,
  gentooMass,
]);
// Group 1 = Adelie, Group 2 = Chinstrap, Group 3 = Gentoo (input order)
// Skill rule says labels are "Group 1", "Group 2", …; the live output uses
// "Group_1" (underscore). Accept either form.
const groupLabel = (label: string) => {
  if (label === "Group 1" || label === "Group_1") return "Adelie";
  if (label === "Group 2" || label === "Group_2") return "Chinstrap";
  if (label === "Group 3" || label === "Group_3") return "Gentoo";
  return label;
};
for (const c of tukey.comparisons) {
  const g1 = groupLabel(c.group1);
  const g2 = groupLabel(c.group2);
  console.log(
    `${g1} vs ${g2}: meanDiff = ${
      c.meanDifference.toFixed(2)
    }, raw p = ${c.pValue}, adjusted p = ${c.adjustedPValue}, significant: ${c.significant}`,
  );
}

// Task 4 — equal-variance assumption: Levene's test (Brown-Forsythe)
console.log("\n=== Task 4: Levene's test for equal variances (body mass) ===");
const levene = s.test.variance.levene([
  adelieMass,
  chinstrapMass,
  gentooMass,
]);
console.log(
  `${levene.testStatistic.name} = ${levene.testStatistic.value.toFixed(4)}`,
);
console.log(`p-value = ${levene.pValue}`);
console.log(
  `equal variances plausible (fail to reject): ${
    !(levene.pValue < (levene.alpha ?? 0.05))
  }`,
);

// Task 5 — repeat one-way ANOVA for flipper length
console.log("\n=== Task 5: one-way ANOVA — flipper length ~ species ===");
const dfFlip = tagged.removeNull("flipperLengthMm");
const adelieFlip = dfFlip.filter((r) => r.speciesShort === "Adelie")
  .flipperLengthMm;
const chinstrapFlip = dfFlip.filter((r) => r.speciesShort === "Chinstrap")
  .flipperLengthMm;
const gentooFlip = dfFlip.filter((r) => r.speciesShort === "Gentoo")
  .flipperLengthMm;

const anovaFlip = s.test.anova.oneWay([adelieFlip, chinstrapFlip, gentooFlip]);
console.log(
  `F = ${anovaFlip.testStatistic.value.toFixed(4)}, p-value = ${anovaFlip.pValue}`,
);
console.log(
  `significant: ${anovaFlip.pValue < (anovaFlip.alpha ?? 0.05)}`,
);

// Task 6 — one-row-per-species summary CSV
const summary = df
  .groupBy("speciesShort")
  .summarize({
    n: (g) => g.nrows(),
    mean_body_mass_g: (g) => s.mean(g.bodyMassG, { removeNull: true }),
    sd_body_mass_g: (g) => s.stdev(g.bodyMassG, { removeNull: true }),
  })
  .arrange("speciesShort")
  .rename({ speciesShort: "species" })
  .select("species", "n", "mean_body_mass_g", "sd_body_mass_g");

console.log("\n=== Task 6: per-species summary ===");
summary.print();

const OUT_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/penguin-mass-summary.csv";
await writeCSV(summary, OUT_PATH);
console.log(`\nWrote summary to ${OUT_PATH}`);
