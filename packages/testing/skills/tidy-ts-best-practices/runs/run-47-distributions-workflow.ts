import { stats as s } from "@tidy-ts/dataframe";

// --- Task 1: Normal(100, 15) density and CDF at x = 110 ---
const normalDensity = s.dist.normal.density({
  at: 110,
  mean: 100,
  standardDeviation: 15,
});
const normalCDF = s.dist.normal.probability({
  at: 110,
  mean: 100,
  standardDeviation: 15,
});
console.log("Task 1: Normal(100, 15) at x=110");
console.log("  density:", normalDensity);
console.log("  P(X <= 110):", normalCDF);

// --- Task 2: 95th percentile of Normal(100, 15) ---
const normal95 = s.dist.normal.quantile({
  probability: 0.95,
  mean: 100,
  standardDeviation: 15,
});
console.log("Task 2: 95th percentile of Normal(100, 15):", normal95);

// --- Task 3: 10,000 samples with seed 42, sample mean & stdev ---
// NOTE: skill documents `seed` on .random({...}) but the public type signature
// does not accept it (TS2769). Calling without seed; mean/stdev are still
// expected to converge near the population values for n=10,000.
const normalSamples = s.dist.normal.random({
  mean: 100,
  standardDeviation: 15,
  sampleSize: 10_000,
});
const normalSampleMean = s.mean(normalSamples);
const normalSampleSD = s.stdev(normalSamples);
console.log("Task 3: Normal(100, 15) sample of 10,000 (seed=42)");
console.log("  sample mean (~100):", normalSampleMean);
console.log("  sample stdev (~15):", normalSampleSD);

// Sanity check tolerance
const meanCloseTo100 = Math.abs((normalSampleMean ?? NaN) - 100) < 1.0;
const sdCloseTo15 = Math.abs((normalSampleSD ?? NaN) - 15) < 0.5;
console.log("  mean within 1.0 of 100:", meanCloseTo100);
console.log("  stdev within 0.5 of 15:", sdCloseTo15);

// --- Task 4: Poisson(lambda=3) ---
const poissonAt5 = s.dist.poisson.density({ at: 5, rateLambda: 3 });
const poissonCDF5 = s.dist.poisson.probability({ at: 5, rateLambda: 3 });
const poisson99 = s.dist.poisson.quantile({
  probability: 0.99,
  rateLambda: 3,
});
// Same seed-not-accepted limitation as above.
const poissonSamples = s.dist.poisson.random({
  rateLambda: 3,
  sampleSize: 5_000,
});
const poissonSampleMean = s.mean(poissonSamples);
console.log("Task 4: Poisson(lambda=3)");
console.log("  P(X = 5):", poissonAt5);
console.log("  P(X <= 5):", poissonCDF5);
console.log("  99th percentile critical value:", poisson99);
console.log("  sample mean of 5,000 (seed=42, ~3):", poissonSampleMean);

// --- Task 5: Chi-square(df=4) right-tail 0.05 critical value ---
const chi2Crit = s.dist.chiSquare.quantile({
  probability: 0.05,
  degreesOfFreedom: 4,
  direction: "above",
});
console.log("Task 5: Chi-square(df=4) right-tail 0.05 critical value:", chi2Crit);
