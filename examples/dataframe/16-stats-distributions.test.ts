/**
 * Probability Distributions
 *
 * Demonstrates density/mass functions, cumulative distributions,
 * and quantile functions for various distributions.
 */

import { expect } from "@std/expect";
import { stats as s } from "@tidy-ts/dataframe";

Deno.test("Distributions - Normal Distribution", () => {
  // PDF: density at x=0 for standard normal
  const pdf = s.dist.normal.density({ at: 0, mean: 0, standardDeviation: 1 });
  expect(pdf).toBeCloseTo(0.3989, 3); // ≈ 1/√(2π)

  // CDF: probability below x=0 (50th percentile)
  const cdf = s.dist.normal.probability({
    at: 0,
    mean: 0,
    standardDeviation: 1,
  });
  expect(cdf).toBeCloseTo(0.5, 3);

  // Quantile: median of standard normal is 0
  const quantile = s.dist.normal.quantile({
    probability: 0.5,
    mean: 0,
    standardDeviation: 1,
  });
  expect(quantile).toBeCloseTo(0, 3);

  console.log("Normal Distribution:");
  console.log(`  PDF at 0: ${pdf.toFixed(4)}`);
  console.log(`  CDF at 0: ${cdf.toFixed(4)}`);
  console.log(`  Median: ${quantile.toFixed(4)}`);
});

Deno.test("Distributions - Beta Distribution", () => {
  const alpha = 2, beta = 2;

  const pdf = s.dist.beta.density({ at: 0.5, alpha, beta });
  expect(pdf).toBeCloseTo(1.5, 1);

  const cdf = s.dist.beta.probability({ at: 0.5, alpha, beta });
  expect(cdf).toBeCloseTo(0.5, 1); // Symmetric around 0.5

  const quantile = s.dist.beta.quantile({ probability: 0.5, alpha, beta });
  expect(quantile).toBeCloseTo(0.5, 1);

  console.log("\nBeta Distribution (α=2, β=2):");
  console.log(`  PDF at 0.5: ${pdf.toFixed(4)}`);
  console.log(`  CDF at 0.5: ${cdf.toFixed(4)}`);
  console.log(`  Median: ${quantile.toFixed(4)}`);
});

Deno.test("Distributions - Exponential Distribution", () => {
  const rate = 1;

  const pdf = s.dist.exponential.density({ at: 1, rate });
  expect(pdf).toBeCloseTo(1 / Math.E, 3); // e^(-1)

  const cdf = s.dist.exponential.probability({ at: 1, rate });
  expect(cdf).toBeCloseTo(1 - 1 / Math.E, 3);

  const quantile = s.dist.exponential.quantile({ probability: 0.5, rate });
  expect(quantile).toBeCloseTo(Math.log(2), 3); // ln(2)

  console.log("\nExponential Distribution (rate=1):");
  console.log(`  PDF at 1: ${pdf.toFixed(4)}`);
  console.log(`  CDF at 1: ${cdf.toFixed(4)}`);
  console.log(`  Median: ${quantile.toFixed(4)}`);
});

Deno.test("Distributions - Gamma Distribution", () => {
  const shape = 2, rate = 1;

  const pdf = s.dist.gamma.density({ at: 1, shape, rate });
  const cdf = s.dist.gamma.probability({ at: 1, shape, rate });
  const quantile = s.dist.gamma.quantile({ probability: 0.5, shape, rate });

  expect(pdf).toBeGreaterThan(0);
  expect(cdf).toBeGreaterThan(0);
  expect(cdf).toBeLessThan(1);
  expect(quantile).toBeGreaterThan(0);

  console.log("\nGamma Distribution (shape=2, rate=1):");
  console.log(`  PDF at 1: ${pdf.toFixed(4)}`);
  console.log(`  CDF at 1: ${cdf.toFixed(4)}`);
  console.log(`  Median: ${quantile.toFixed(4)}`);
});

Deno.test("Distributions - Chi-Squared Distribution", () => {
  const degreesOfFreedom = 2;

  const pdf = s.dist.chiSquare.density({ at: 1, degreesOfFreedom });
  const cdf = s.dist.chiSquare.probability({ at: 1, degreesOfFreedom });
  const quantile = s.dist.chiSquare.quantile({
    probability: 0.95,
    degreesOfFreedom,
  });

  expect(pdf).toBeGreaterThan(0);
  expect(cdf).toBeGreaterThan(0);
  expect(quantile).toBeGreaterThan(0);

  console.log("\nChi-Squared Distribution (df=2):");
  console.log(`  PDF at 1: ${pdf.toFixed(4)}`);
  console.log(`  CDF at 1: ${cdf.toFixed(4)}`);
  console.log(`  95th percentile: ${quantile.toFixed(4)}`);
});

Deno.test("Distributions - F Distribution", () => {
  const df1 = 5, df2 = 10;

  const pdf = s.dist.f.density({
    at: 1,
    numeratorDegreesOfFreedom: df1,
    denominatorDegreesOfFreedom: df2,
  });

  const cdf = s.dist.f.probability({
    at: 1,
    numeratorDegreesOfFreedom: df1,
    denominatorDegreesOfFreedom: df2,
  });

  const quantile = s.dist.f.quantile({
    probability: 0.95,
    numeratorDegreesOfFreedom: df1,
    denominatorDegreesOfFreedom: df2,
  });

  expect(pdf).toBeGreaterThan(0);
  expect(cdf).toBeGreaterThan(0);
  expect(quantile).toBeGreaterThan(1);

  console.log("\nF Distribution (df1=5, df2=10):");
  console.log(`  PDF at 1: ${pdf.toFixed(4)}`);
  console.log(`  CDF at 1: ${cdf.toFixed(4)}`);
  console.log(`  95th percentile: ${quantile.toFixed(4)}`);
});

Deno.test("Distributions - Poisson Distribution", () => {
  const rateLambda = 2;

  const pmf = s.dist.poisson.density({ at: 2, rateLambda });
  const cdf = s.dist.poisson.probability({ at: 2, rateLambda });
  const quantile = s.dist.poisson.quantile({ probability: 0.5, rateLambda });

  expect(pmf).toBeGreaterThan(0);
  expect(pmf).toBeLessThan(1);
  expect(Number.isInteger(quantile)).toBe(true);

  console.log("\nPoisson Distribution (λ=2):");
  console.log(`  PMF at 2: ${pmf.toFixed(4)}`);
  console.log(`  CDF at 2: ${cdf.toFixed(4)}`);
  console.log(`  Median: ${quantile}`);
});

Deno.test("Distributions - Binomial Distribution", () => {
  const trials = 10, probabilityOfSuccess = 0.5;

  const pmf = s.dist.binomial.density({ at: 5, trials, probabilityOfSuccess });
  const cdf = s.dist.binomial.probability({
    at: 5,
    trials,
    probabilityOfSuccess,
  });
  const quantile = s.dist.binomial.quantile({
    probability: 0.5,
    trials,
    probabilityOfSuccess,
  });

  expect(pmf).toBeGreaterThan(0);
  expect(cdf).toBeCloseTo(0.623, 2);
  expect(Number.isInteger(quantile)).toBe(true);

  console.log("\nBinomial Distribution (n=10, p=0.5):");
  console.log(`  PMF at 5: ${pmf.toFixed(4)}`);
  console.log(`  CDF at 5: ${cdf.toFixed(4)}`);
  console.log(`  Median: ${quantile}`);
});

Deno.test("Distributions - t-Distribution", () => {
  const degreesOfFreedom = 5;

  const pdf = s.dist.t.density({ at: 0, degreesOfFreedom });
  const cdf = s.dist.t.probability({ at: 0, degreesOfFreedom });
  const quantile = s.dist.t.quantile({
    probability: 0.95,
    degreesOfFreedom,
  });

  expect(pdf).toBeGreaterThan(0);
  expect(cdf).toBeCloseTo(0.5, 2);
  expect(quantile).toBeGreaterThan(0);

  console.log("\nt-Distribution (df=5):");
  console.log(`  PDF at 0: ${pdf.toFixed(4)}`);
  console.log(`  CDF at 0: ${cdf.toFixed(4)}`);
  console.log(`  95th percentile: ${quantile.toFixed(4)}`);
});

Deno.test("Distributions - Quantile/CDF Consistency", () => {
  // Verify that quantile is the inverse of CDF
  const p = 0.75;
  const q = s.dist.normal.quantile({
    probability: p,
    mean: 0,
    standardDeviation: 1,
  });
  const backToP = s.dist.normal.probability({
    at: q,
    mean: 0,
    standardDeviation: 1,
  });

  expect(backToP).toBeCloseTo(p, 3);

  console.log("\nQuantile-CDF Consistency:");
  console.log(`  Probability: ${p}`);
  console.log(`  Quantile: ${q.toFixed(4)}`);
  console.log(`  Back to probability: ${backToP.toFixed(4)}`);
});
