import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  species: z.string(),
  island: z.string(),
  bodyMassG: z.number().nullable(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv",
  schema,
  { naValues: ["NA", ""] },
);

// Normalize species to short label
const penguins = df
  .removeNull("bodyMassG")
  .mutate({
    speciesShort: (r) =>
      r.species.includes("Adelie")
        ? "Adelie"
        : r.species.includes("Chinstrap")
        ? "Chinstrap"
        : r.species.includes("Gentoo")
        ? "Gentoo"
        : "Other",
  });

penguins
  .groupBy("speciesShort")
  .summarize({
    n: (g) => g.nrows(),
    mean_mass: (g) => s.round(s.mean(g.bodyMassG), 1),
  })
  .print("Sample sizes & mean mass by species");

// ---------------------------------------------------------------------------
// Task 1: Chinstrap mean body mass vs 3700 g reference
// ---------------------------------------------------------------------------
const chinstrap = penguins.filter((r) => r.speciesShort === "Chinstrap");
const chinstrapMass = chinstrap.bodyMassG;

const task1 = s.compare.oneGroup.centralTendency.toValue({
  data: chinstrapMass,
  hypothesizedValue: 3700,
  comparator: "not equal to",
});

console.log("\n=== Task 1: Chinstrap body mass vs 3700g reference ===");
console.log(`n = ${chinstrapMass.length}`);
console.log(`observed mean = ${s.round(s.mean(chinstrapMass), 2)} g`);
console.log(`test statistic name = ${task1.testStatistic.name}`);
console.log(`test statistic value = ${task1.testStatistic.value}`);
console.log(`p-value = ${task1.pValue}`);
console.log(`alpha = ${task1.alpha}`);
console.log(
  `significant (different from 3700)? ${
    task1.pValue < (task1.alpha ?? 0.05)
  }`,
);

// ---------------------------------------------------------------------------
// Task 2: Body mass across the three species
// ---------------------------------------------------------------------------
const adelieMass = penguins
  .filter((r) => r.speciesShort === "Adelie")
  .bodyMassG;
const gentooMass = penguins
  .filter((r) => r.speciesShort === "Gentoo")
  .bodyMassG;

const task2 = s.compare.multiGroups.centralTendency.toEachOther({
  groups: [adelieMass, chinstrapMass, gentooMass],
  parametric: "auto",
});

console.log("\n=== Task 2: Body mass differs by species? ===");
console.log(`test statistic name = ${task2.testStatistic.name}`);
console.log(`test statistic value = ${task2.testStatistic.value}`);
console.log(`p-value = ${task2.pValue}`);
console.log(`alpha = ${task2.alpha}`);
console.log(
  `significant difference among species? ${
    task2.pValue < (task2.alpha ?? 0.05)
  }`,
);

// ---------------------------------------------------------------------------
// Task 3: Adelie body mass by island (Torgersen vs Biscoe vs Dream)
// ---------------------------------------------------------------------------
const adelie = penguins.filter((r) => r.speciesShort === "Adelie");

const torgersen = adelie.filter((r) => r.island === "Torgersen").bodyMassG;
const biscoe = adelie.filter((r) => r.island === "Biscoe").bodyMassG;
const dream = adelie.filter((r) => r.island === "Dream").bodyMassG;

console.log("\n=== Task 3: Adelie body mass by island ===");
console.log(
  `n: Torgersen=${torgersen.length}, Biscoe=${biscoe.length}, Dream=${dream.length}`,
);

const task3 = s.compare.multiGroups.centralTendency.toEachOther({
  groups: [torgersen, biscoe, dream],
  parametric: "auto",
});

console.log(`test statistic name = ${task3.testStatistic.name}`);
console.log(`test statistic value = ${task3.testStatistic.value}`);
console.log(`p-value = ${task3.pValue}`);
console.log(`alpha = ${task3.alpha}`);
console.log(
  `significant difference across Adelie islands? ${
    task3.pValue < (task3.alpha ?? 0.05)
  }`,
);

// ---------------------------------------------------------------------------
// Task 4: Pairwise species comparisons with multiple-comparison correction.
// s.compare.multiGroups.* auto-runs post-hoc when the main test is significant.
// ---------------------------------------------------------------------------
console.log("\n=== Task 4: Pairwise species comparisons (post-hoc) ===");
// Task 2 used Welch's ANOVA (unequal variances). Per the skill's decision
// guide, that pairs with Games-Howell post-hoc. Call the post-hoc directly
// (the auto post-hoc is also available on `result.postHoc` when significant).
const postHoc = s.compare.postHoc.gamesHowell([
  adelieMass,
  chinstrapMass,
  gentooMass,
]);
const labels = ["Adelie", "Chinstrap", "Gentoo"];
console.log(
  `post-hoc: ${postHoc.testName} (correction: ${postHoc.correctionMethod})`,
);
for (const c of postHoc.comparisons) {
  const i1 = Number(c.group1.replace("Group_", "")) - 1;
  const i2 = Number(c.group2.replace("Group_", "")) - 1;
  const name1 = labels[i1] ?? c.group1;
  const name2 = labels[i2] ?? c.group2;
  console.log(
    `${name1} vs ${name2}: adjusted p = ${c.adjustedPValue}, significant = ${c.significant}`,
  );
}
