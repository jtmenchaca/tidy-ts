import { expect } from "@std/expect";
import {
  dbeta,
  dbinom,
  dchisq,
  dexp,
  df,
  dgamma,
  dnorm,
  dpareto,
  dpois,
  dt,
  pbeta,
  pbinom,
  pchisq,
  pexp,
  pf,
  pgamma,
  pnorm,
  ppareto,
  ppois,
  pt,
  qbeta,
  qbinom,
  qchisq,
  qexp,
  qf,
  qgamma,
  qnorm,
  qpareto,
  qpois,
  qt,
} from "./index.ts";

Deno.test("Normal Distribution - basic usage", () => {
  // Standard normal distribution
  const pdf = dnorm({ at: 0, mean: 0, standardDeviation: 1 }); // x=0, mean=0, std=1
  expect(pdf).toBeCloseTo(0.3989, 3); // ≈ 1/√(2π)

  const cdf = pnorm({ at: 0, mean: 0, standardDeviation: 1 }); // x=0, mean=0, std=1
  expect(cdf).toBeCloseTo(0.5, 3); // 50th percentile

  const quantile = qnorm({ probability: 0.5, mean: 0, standardDeviation: 1 }); // p=0.5, mean=0, std=1
  expect(quantile).toBeCloseTo(0, 3); // median = mean for normal
});

Deno.test("Beta Distribution - basic usage", () => {
  const alpha = 2, beta = 2;
  const pdf = dbeta({ at: 0.5, alpha: alpha, beta: beta }); // x=0.5, alpha=2, beta=2
  expect(pdf).toBeCloseTo(1.5, 1); // Should be > 1 for these parameters

  const cdf = pbeta({ at: 0.5, alpha: alpha, beta: beta }); // x=0.5, alpha=2, beta=2
  expect(cdf).toBeCloseTo(0.5, 1); // Symmetric around 0.5

  const quantile = qbeta({ probability: 0.5, alpha: alpha, beta: beta }); // p=0.5, alpha=2, beta=2
  expect(quantile).toBeCloseTo(0.5, 1); // Median for symmetric beta
});

Deno.test("Gamma Distribution - basic usage", () => {
  const shape = 2, rate = 1;
  const pdf = dgamma({ at: 1, shape: shape, rate: rate }); // x=1, shape=2, scale=1
  expect(pdf).toBeGreaterThan(0);

  const cdf = pgamma({ at: 1, shape: shape, rate: rate }); // x=1, shape=2, scale=1
  expect(cdf).toBeGreaterThan(0);
  expect(cdf).toBeLessThan(1);

  const quantile = qgamma({ probability: 0.5, shape: shape, rate: rate }); // p=0.5, shape=2, scale=1
  expect(quantile).toBeGreaterThan(0);
});

Deno.test("Exponential Distribution - basic usage", () => {
  const rate = 1;

  const pdf = dexp({ at: 1, rate: rate }); // x=1, rate=1
  expect(pdf).toBeCloseTo(1 / Math.E, 3); // e^(-1) ≈ 0.368

  const cdf = pexp({ at: 1, rate: rate }); // x=1, rate=1
  expect(cdf).toBeCloseTo(1 - 1 / Math.E, 3); // 1 - e^(-1) ≈ 0.632

  const quantile = qexp({ probability: 0.5, rate: rate }); // p=0.5, rate=1
  expect(quantile).toBeCloseTo(Math.log(2), 3); // ln(2) ≈ 0.693
});

Deno.test("Chi-Squared Distribution - basic usage", () => {
  const df = 2;

  const pdf = dchisq({ at: 1, degreesOfFreedom: df }); // x=1, df=2
  expect(pdf).toBeGreaterThan(0);

  const cdf = pchisq({ at: 1, degreesOfFreedom: df }); // x=1, df=2
  expect(cdf).toBeGreaterThan(0);
  expect(cdf).toBeLessThan(1);

  const quantile = qchisq({ probability: 0.95, degreesOfFreedom: df }); // p=0.95, df=2
  expect(quantile).toBeGreaterThan(0);
});

Deno.test("F Distribution - basic usage", () => {
  const df1 = 5, df2 = 10;

  const pdf = df({
    at: 1,
    numeratorDegreesOfFreedom: df1,
    denominatorDegreesOfFreedom: df2,
  }); // x=1, df1=5, df2=10
  expect(pdf).toBeGreaterThan(0);

  const cdf = pf({
    at: 1,
    numeratorDegreesOfFreedom: df1,
    denominatorDegreesOfFreedom: df2,
  }); // x=1, df1=5, df2=10
  expect(cdf).toBeGreaterThan(0);
  expect(cdf).toBeLessThan(1);

  const quantile = qf({
    probability: 0.95,
    numeratorDegreesOfFreedom: df1,
    denominatorDegreesOfFreedom: df2,
  }); // p=0.95, df1=5, df2=10
  expect(quantile).toBeGreaterThan(1);
});

Deno.test("Poisson Distribution - basic usage", () => {
  const lambda = 2;

  const pmf = dpois({ at: 2, rateLambda: lambda }); // k=2, lambda=2
  expect(pmf).toBeGreaterThan(0);
  expect(pmf).toBeLessThan(1);

  const cdf = ppois({ at: 2, rateLambda: lambda }); // k=2, lambda=2
  expect(cdf).toBeGreaterThan(0);
  expect(cdf).toBeLessThan(1);

  const quantile = qpois({ probability: 0.5, rateLambda: lambda }); // p=0.5, lambda=2
  expect(quantile).toBeGreaterThanOrEqual(0);
  expect(Number.isInteger(quantile)).toBe(true); // Should be integer
});

Deno.test("Binomial Distribution - basic usage", () => {
  const n = 10, p = 0.5;

  const pmf = dbinom({ at: 5, trials: n, probabilityOfSuccess: p }); // k=5, n=10, p=0.5
  expect(pmf).toBeGreaterThan(0);
  expect(pmf).toBeLessThan(1);

  const cdf = pbinom({ at: 5, trials: n, probabilityOfSuccess: p }); // k=5, n=10, p=0.5
  expect(cdf).toBeCloseTo(0.623, 2); // Should be around 0.623

  const quantile = qbinom({
    probability: 0.5,
    trials: n,
    probabilityOfSuccess: p,
  }); // p=0.5, n=10, p=0.5
  expect(quantile).toBeGreaterThanOrEqual(0);
  expect(quantile).toBeLessThanOrEqual(n);
  expect(Number.isInteger(quantile)).toBe(true); // Should be integer
});

Deno.test("t-Distribution - basic usage", () => {
  const df = 5;

  const pdf = dt({ at: 0, degreesOfFreedom: df }); // q=0, df=5
  expect(pdf).toBeGreaterThan(0);

  const cdf = pt({ at: 0, degreesOfFreedom: df }); // q=0, df=5
  expect(cdf).toBeCloseTo(0.5, 2); // Symmetric around 0

  const quantile = qt({ probability: 0.95, degreesOfFreedom: df }); // p=0.95, df=5
  expect(quantile).toBeGreaterThan(0); // Positive for upper tail
});

Deno.test("Pareto Distribution - basic usage", () => {
  const scale = 1, shape = 2;

  const pdf = dpareto({ at: 2, scale, shape }); // x=2, xm=1, alpha=2
  expect(pdf).toBeCloseTo(0.25, 3); // 2*1^2 / 2^3 = 0.25

  const cdf = ppareto({ at: 2, scale, shape }); // x=2, xm=1, alpha=2
  expect(cdf).toBeCloseTo(0.75, 3); // 1 - (1/2)^2 = 0.75

  const quantile = qpareto({ probability: 0.75, scale, shape }); // p=0.75, xm=1, alpha=2
  expect(quantile).toBeCloseTo(2, 3); // Inverse of CDF
});

Deno.test("Distribution Properties - comprehensive check", () => {
  // Test that CDFs are monotonic increasing
  const x1 = pnorm({ at: 0, mean: 0, standardDeviation: 1 });
  const x2 = pnorm({ at: 1, mean: 0, standardDeviation: 1 });
  expect(x2).toBeGreaterThan(x1);

  // Test that PDFs are non-negative
  expect(dnorm({ at: 0, mean: 0, standardDeviation: 1 })).toBeGreaterThan(0);
  expect(dgamma({ at: 1, shape: 2, rate: 1 })).toBeGreaterThan(0);
  expect(dbeta({ at: 0.5, alpha: 2, beta: 2 })).toBeGreaterThan(0);

  // Test that CDFs are between 0 and 1
  const cdf_values = [
    pnorm({ at: 0, mean: 0, standardDeviation: 1 }),
    pexp({ at: 1, rate: 1 }),
    pchisq({ at: 1, degreesOfFreedom: 2 }),
    pt({ at: 0, degreesOfFreedom: 5 }),
  ];

  for (const cdf of cdf_values) {
    expect(cdf).toBeGreaterThanOrEqual(0);
    expect(cdf).toBeLessThanOrEqual(1);
  }

  // Test quantile-CDF consistency (quantile should be inverse of CDF)
  const p = 0.75;
  const q = qnorm({ probability: p, mean: 0, standardDeviation: 1 });
  const back_to_p = pnorm({ at: q, mean: 0, standardDeviation: 1 });
  expect(back_to_p).toBeCloseTo(p, 3);
});
