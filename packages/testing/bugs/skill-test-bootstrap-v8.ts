// Bootstrap SE / CI of the mean mpg from mtcars, using only what
// the tidy-ts-best-practices skill documents.
//
// Approach:
//   - readCSV with a Zod schema (skill rule: io.md).
//   - Observed mean & sd from s.mean / s.stdev (skill: stats-descriptive.md).
//   - Bootstrap via seeded uniform draws (skill: stats-distributions.md —
//     "For Monte Carlo simulations, bootstrap resampling..."): draw 5000 * 32
//     uniform reals in [0, n), floor to get resample indices, reshape into
//     5000 resamples of size 32, compute the mean of each.
//   - 95% percentile CI via s.quantile (skill: stats-descriptive.md).
//   - Write results with writeCSV.

import { readCSV, writeCSV, createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const mtcarsSchema = z.object({
  model: z.string(),
  mpg: z.number(),
  cyl: z.number(),
  disp: z.number(),
  hp: z.number(),
  drat: z.number(),
  wt: z.number(),
  qsec: z.number(),
  vs: z.number(),
  am: z.number(),
  gear: z.number(),
  carb: z.number(),
});

const mtcars = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/mtcars.csv",
  mtcarsSchema,
);

const mpg = mtcars.mpg;
const n = mpg.length;

// Task 1: observed mean & sd
const observedMean = s.mean(mpg);
const observedSd = s.stdev(mpg);

console.log(`n = ${n}`);
console.log(`observed mean mpg = ${observedMean}`);
console.log(`observed sd mpg   = ${observedSd}`);

// Bootstrap helper: returns { se, ciLow, ciHigh, means } for a given seed.
function bootstrap(seed: number, nResamples: number) {
  // One big seeded uniform draw of length nResamples * n in [0, n).
  // The skill says one RNG state advances across all draws within the call,
  // so this whole sequence is determined by `seed`.
  const draws = s.dist.uniform.random({
    minimum: 0,
    maximum: n,
    sampleSize: nResamples * n,
    seed,
  });

  const means: number[] = new Array(nResamples);
  for (let b = 0; b < nResamples; b++) {
    let total = 0;
    const base = b * n;
    for (let i = 0; i < n; i++) {
      // Math.floor gives an integer index in [0, n-1] (uniform max is exclusive
      // per the standard Rand uniform; if it ever produced n exactly we'd clip).
      let idx = Math.floor(draws[base + i]!);
      if (idx >= n) idx = n - 1;
      total += mpg[idx]!;
    }
    means[b] = total / n;
  }

  // SE = sd of bootstrap means; 95% CI = 2.5 / 97.5 percentiles
  const se = s.stdev(means);
  const [ciLow, ciHigh] = s.quantile(means, [0.025, 0.975]);
  return { se, ciLow, ciHigh, means };
}

const N_RESAMPLES = 5000;
const SEED_1 = 12345;
const SEED_2 = 67890;

// Task 2 & 3: first bootstrap with seed 1
const run1 = bootstrap(SEED_1, N_RESAMPLES);
console.log(`bootstrap SE (seed ${SEED_1})      = ${run1.se}`);
console.log(`bootstrap 95% CI (seed ${SEED_1})  = [${run1.ciLow}, ${run1.ciHigh}]`);

// Task 4: same seed → identical results
const run1b = bootstrap(SEED_1, N_RESAMPLES);
const sameSE = run1.se === run1b.se;
const sameLow = run1.ciLow === run1b.ciLow;
const sameHigh = run1.ciHigh === run1b.ciHigh;
console.log(
  `replay with same seed: identical SE=${sameSE}, ciLow=${sameLow}, ciHigh=${sameHigh}`,
);
if (!(sameSE && sameLow && sameHigh)) {
  throw new Error("Same-seed reproducibility FAILED");
}

// Task 5: different seed → close but not identical
const run2 = bootstrap(SEED_2, N_RESAMPLES);
console.log(`bootstrap SE (seed ${SEED_2})      = ${run2.se}`);
const seDiff = Math.abs((run2.se ?? 0) - (run1.se ?? 0));
console.log(`|SE(seed1) - SE(seed2)| = ${seDiff}`);
const differentButClose =
  run1.se !== run2.se && seDiff < 0.2; // both should be near the analytic SE
console.log(`different-but-close: ${differentButClose}`);

// Task 6: write the CSV
const summary = createDataFrame([
  { quantity: "observed_mean", value: observedMean },
  { quantity: "observed_sd", value: observedSd },
  { quantity: "bootstrap_se_seed1", value: run1.se },
  { quantity: "bootstrap_ci_low", value: run1.ciLow },
  { quantity: "bootstrap_ci_high", value: run1.ciHigh },
]);

summary.print("Bootstrap summary");

await writeCSV(
  summary,
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/mtcars-bootstrap.csv",
);

console.log("wrote mtcars-bootstrap.csv");
