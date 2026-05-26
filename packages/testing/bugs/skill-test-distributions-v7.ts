// Skill test: probability distributions and simulation.
// Source of API knowledge: tidy-ts-best-practices SKILL.md + rules/stats-distributions.md +
// rules/stats-descriptive.md + rules/dataframe-pipeline.md + rules/io.md.

import { createDataFrame, stats as s, writeCSV } from "@tidy-ts/dataframe";

// SKILL GAP: the skill's stats-distributions.md does not document a `seed`
// parameter on `.random({ ... })`, and adding `seed: 42` is rejected by the
// types (TS2769 — 'seed' does not exist in type '{ mean?, standardDeviation?,
// sampleSize: number }'). The skill does show seeded `df.sliceSample(5, 42)`,
// but that does not help with distribution sampling. Proceeding without a
// seed — the moments below will be reproducible only in distribution, not
// in exact value.

// SKILL BUG: stats-distributions.md says
//   `s.dist.normal.random({ ..., sampleSize: 100 })  // number[]`
// but with the current overloads TypeScript resolves this call to the
// scalar overload (returns `number`), not `number[]`. The runtime DOES
// return an array — the bug is purely at the type level. Verified in
// isolation: `const a: number[] = s.dist.normal.random({ sampleSize: 100 })`
// fails with `TS2322 Type 'number' is not assignable to type 'number[]'`.
// Workaround: cast to `number[]`.

// --------------------------------------------------------------------------
// Task 1: 10,000 draws from standard normal (mean 0, sd 1).
// --------------------------------------------------------------------------
const normalDraws = s.dist.normal.random({
  mean: 0,
  standardDeviation: 1,
  sampleSize: 10_000,
}) as unknown as number[];
const normalDF = createDataFrame({ columns: { x: normalDraws } });

const normalSampleMean = s.mean(normalDF.x);
const normalSampleSD = s.stdev(normalDF.x);
console.log("Task 1 — Standard normal, n=10,000 (unseeded; see skill-gap note above)");
console.log("  sample mean:", normalSampleMean);
console.log("  sample sd:  ", normalSampleSD);

// --------------------------------------------------------------------------
// Task 2: P(Z > 1.96) for standard normal.
// --------------------------------------------------------------------------
const pAbove196 = s.dist.normal.probability({ at: 1.96, direction: "above" });
console.log("\nTask 2 — P(Z > 1.96) =", pAbove196);

// --------------------------------------------------------------------------
// Task 3: 97.5th percentile of standard normal.
// --------------------------------------------------------------------------
const z975 = s.dist.normal.quantile({ probability: 0.975 });
console.log("\nTask 3 — 97.5th percentile (z) =", z975);

// --------------------------------------------------------------------------
// Task 4: 5,000 Poisson draws, lambda = 3.2.
// --------------------------------------------------------------------------
// SKILL BUG: stats-distributions.md table says `s.dist.poisson | at, lambda`
// but the actual TypeScript parameter is `rateLambda` (verified in isolation:
// `s.dist.poisson.density({ at: 3, lambda: 3.2 })` produces TS2353 — 'lambda'
// does not exist in type '{ at: number; rateLambda: number; ... }'). Using
// `rateLambda` here.
const poissonDraws = s.dist.poisson.random({
  rateLambda: 3.2,
  sampleSize: 5_000,
}) as unknown as number[];
const poissonDF = createDataFrame({ columns: { count: poissonDraws } });
const poissonMean = s.mean(poissonDF.count);
const poissonSD = s.stdev(poissonDF.count);
const zeroProportion = s.countValue(poissonDF.count, 0) / poissonDF.nrows();
console.log("\nTask 4 — Poisson(λ=3.2), n=5,000");
console.log("  sample mean:        ", poissonMean);
console.log("  P(count = 0) (obs): ", zeroProportion);

// --------------------------------------------------------------------------
// Task 5: 5,000 Binomial draws, n=20, p=0.3.
// --------------------------------------------------------------------------
const binomDraws = s.dist.binomial.random({
  trials: 20,
  probabilityOfSuccess: 0.3,
  sampleSize: 5_000,
}) as unknown as number[];
const binomDF = createDataFrame({ columns: { successes: binomDraws } });
const binomMean = s.mean(binomDF.successes);
const binomSD = s.stdev(binomDF.successes);
console.log("\nTask 5 — Binomial(n=20, p=0.3), n=5,000");
console.log("  sample mean:", binomMean);
console.log("  sample sd:  ", binomSD);

// --------------------------------------------------------------------------
// Task 6: summary DataFrame, print and write to CSV.
// --------------------------------------------------------------------------
// Theoretical moments:
//   normal(0, 1):       mean = 0,    sd = 1
//   poisson(3.2):       mean = 3.2,  sd = sqrt(3.2)
//   binomial(20, 0.3):  mean = n*p = 6, sd = sqrt(n*p*(1-p)) = sqrt(4.2)
const summary = createDataFrame([
  {
    distribution: "normal(0, 1)",
    sample_mean: normalSampleMean,
    sample_sd: normalSampleSD,
    theoretical_mean: 0,
    theoretical_sd: 1,
  },
  {
    distribution: "poisson(3.2)",
    sample_mean: poissonMean,
    sample_sd: poissonSD,
    theoretical_mean: 3.2,
    theoretical_sd: Math.sqrt(3.2),
  },
  {
    distribution: "binomial(20, 0.3)",
    sample_mean: binomMean,
    sample_sd: binomSD,
    theoretical_mean: 20 * 0.3,
    theoretical_sd: Math.sqrt(20 * 0.3 * 0.7),
  },
]);

summary.print("Distribution summary");

await writeCSV(summary, "distributions-summary.csv");
console.log("\nWrote distributions-summary.csv");
