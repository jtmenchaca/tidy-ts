// Two-way factorial ANOVA: bodyMassG ~ species * sex (Palmer Penguins)
// Validate tidy-ts s.test.anova.twoWay against R's aov().

import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  species: z.string(),
  sex: z.string().nullable(),
  bodyMassG: z.number().nullable(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv",
  schema,
  { naValues: ["NA", ""] },
);

// Drop nulls in any of the three columns. Only MALE/FEMALE for sex.
const clean = df
  .removeNull("bodyMassG", "sex")
  .filter((r) => r.sex === "MALE" || r.sex === "FEMALE");

console.log("N (clean):", clean.nrows());

// Levels (alphabetical, same as R's default factor)
const speciesLevels = [...new Set(clean.species)].sort();
const sexLevels = [...new Set(clean.sex)].sort();
console.log("species levels:", speciesLevels);
console.log("sex levels:", sexLevels);

// Build data[factorA=species][factorB=sex] = observations
const data: number[][][] = speciesLevels.map((sp) =>
  sexLevels.map((sx) =>
    clean
      .filter((r) => r.species === sp && r.sex === sx)
      .bodyMassG as number[],
  )
);

// Cell sizes
for (let i = 0; i < speciesLevels.length; i++) {
  for (let j = 0; j < sexLevels.length; j++) {
    console.log(
      `cell[${speciesLevels[i]} x ${sexLevels[j]}]: n=${data[i][j].length}`,
    );
  }
}

const result = s.test.anova.twoWay({ data });
console.log("\n--- Raw result keys ---");
console.log(Object.keys(result));
console.log("\n--- Full result ---");
console.log(JSON.stringify(result, null, 2));

// R reference values (full precision via options(digits=17))
const R = {
  species: {
    df: 2,
    ss: 145190219.1132223010,
    ms: 72595109.5566111505,
    F: 758.3580716956017795,
    p: 1.5402067464135764e-123,
  },
  sex: {
    df: 1,
    ss: 37090261.7815264091,
    ms: 37090261.7815264091,
    F: 387.4599759559407630,
    p: 1.9022727256436999e-57,
  },
  interaction: {
    df: 2,
    ss: 1676556.7364377463,
    ms: 838278.3682188732,
    F: 8.7569971413963721,
    p: 1.9734888388433372e-4,
  },
  residual: {
    df: 327,
    ss: 31302628.2847297415,
    ms: 95726.6920022316,
  },
};

// Pull out tidy-ts numbers. The skill says result shape is
// { factorA, factorB, interaction } each with its own pValue.
// Inspect the actual sub-shape via JSON above; then map.
type TermResult = {
  testStatistic?: { value: number; name: string };
  pValue: number;
  dfBetween?: number;
  dfWithin?: number;
  sumOfSquares?: number;
  meanSquare?: number;
  F?: number;
  fStatistic?: number;
  df?: number;
  ss?: number;
  ms?: number;
};

// deno-lint-ignore no-explicit-any
const r = result as any;
const factorA: TermResult = r.factorA;
const factorB: TermResult = r.factorB;
const interaction: TermResult = r.interaction;

function getF(term: TermResult): number | undefined {
  return term.testStatistic?.value ?? term.F ?? term.fStatistic;
}
function getDf(term: TermResult): number | undefined {
  // The real key on the returned object is `degreesOfFreedom`.
  // deno-lint-ignore no-explicit-any
  return (term as any).degreesOfFreedom ?? term.dfBetween ?? term.df;
}
function getSS(term: TermResult): number | undefined {
  return term.sumOfSquares ?? term.ss;
}
function getMS(term: TermResult): number | undefined {
  return term.meanSquare ?? term.ms;
}

const TOL = 1e-6;
type Row = {
  term: string;
  metric: string;
  tidy: number | undefined;
  r: number;
  absDiff: number | undefined;
  pass: boolean;
};
const rows: Row[] = [];

function check(
  term: string,
  metric: string,
  tidy: number | undefined,
  rVal: number,
) {
  const absDiff = tidy === undefined ? undefined : Math.abs(tidy - rVal);
  const pass = absDiff !== undefined && absDiff < TOL;
  rows.push({ term, metric, tidy, r: rVal, absDiff, pass });
}

// species (factorA)
check("species", "F", getF(factorA), R.species.F);
check("species", "p", factorA.pValue, R.species.p);
check("species", "SS", getSS(factorA), R.species.ss);
check("species", "MS", getMS(factorA), R.species.ms);
check("species", "df", getDf(factorA), R.species.df);

// sex (factorB)
check("sex", "F", getF(factorB), R.sex.F);
check("sex", "p", factorB.pValue, R.sex.p);
check("sex", "SS", getSS(factorB), R.sex.ss);
check("sex", "MS", getMS(factorB), R.sex.ms);
check("sex", "df", getDf(factorB), R.sex.df);

// interaction
check("species:sex", "F", getF(interaction), R.interaction.F);
check("species:sex", "p", interaction.pValue, R.interaction.p);
check("species:sex", "SS", getSS(interaction), R.interaction.ss);
check("species:sex", "MS", getMS(interaction), R.interaction.ms);
check("species:sex", "df", getDf(interaction), R.interaction.df);

// Residual: actual returned shape has `dfError`, `msError`, and
// `sumOfSquares: [SS_A, SS_B, SS_AxB, SS_Error]` (so [3] is the residual SS).
const dfWithin = r.dfError;
const residualSS = (r.sumOfSquares as number[])[3];
const residualMS = r.msError;
check("residual", "df", dfWithin, R.residual.df);
check("residual", "SS", residualSS, R.residual.ss);
check("residual", "MS", residualMS, R.residual.ms);

console.log("\n=== Pass/Fail Table ===");
console.log(
  "term".padEnd(14),
  "metric".padEnd(8),
  "tidy-ts".padEnd(28),
  "R".padEnd(28),
  "abs diff".padEnd(14),
  "pass",
);
for (const row of rows) {
  console.log(
    row.term.padEnd(14),
    row.metric.padEnd(8),
    String(row.tidy ?? "undefined").padEnd(28),
    String(row.r).padEnd(28),
    String(row.absDiff ?? "n/a").padEnd(14),
    row.pass ? "PASS" : "FAIL",
  );
}

const failed = rows.filter((row) => !row.pass);
console.log(`\nTotal: ${rows.length}, passed: ${rows.length - failed.length}, failed: ${failed.length}`);
if (failed.length > 0) {
  console.log("FAILURES:");
  for (const row of failed) {
    console.log(
      `  ${row.term} / ${row.metric}: tidy=${row.tidy}, R=${row.r}, absDiff=${row.absDiff}`,
    );
  }
}
