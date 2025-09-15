import { expect } from "@std/expect";
import {
  dbeta,
  dbinom,
  dchisq,
  dexp,
  df_dist,
  dgamma,
  dnorm,
  dpois,
  dt,
  pbeta,
  pbinom,
  pchisq,
  pexp,
  pf,
  pgamma,
  pnorm,
  ppois,
  pt,
  qbeta,
  qbinom,
  qchisq,
  qexp,
  qf,
  qgamma,
  qnorm,
  qpois,
  qt,
} from "./index.ts";

Deno.test("Normal Distribution - basic usage", () => {
  // Standard normal distribution
  const pdf = dnorm(0, 0, 1); // x=0, mean=0, std=1
  expect(pdf).toBeCloseTo(0.3989, 3); // ≈ 1/√(2π)

  const cdf = pnorm(0, 0, 1); // x=0, mean=0, std=1
  expect(cdf).toBeCloseTo(0.5, 3); // 50th percentile

  const quantile = qnorm(0.5, 0, 1); // p=0.5, mean=0, std=1
  expect(quantile).toBeCloseTo(0, 3); // median = mean for normal
});

Deno.test("Beta Distribution - basic usage", () => {
  const pdf = dbeta(0.5, 2, 2); // x=0.5, alpha=2, beta=2
  expect(pdf).toBeCloseTo(1.5, 1); // Should be > 1 for these parameters

  const cdf = pbeta(0.5, 2, 2); // x=0.5, alpha=2, beta=2
  expect(cdf).toBeCloseTo(0.5, 1); // Symmetric around 0.5

  const quantile = qbeta(0.5, 2, 2); // p=0.5, alpha=2, beta=2
  expect(quantile).toBeCloseTo(0.5, 1); // Median for symmetric beta
});

Deno.test("Gamma Distribution - basic usage", () => {
  const pdf = dgamma(1, 2, 1); // x=1, shape=2, scale=1
  expect(pdf).toBeGreaterThan(0);

  const cdf = pgamma(1, 2, 1); // x=1, shape=2, scale=1
  expect(cdf).toBeGreaterThan(0);
  expect(cdf).toBeLessThan(1);

  const quantile = qgamma(0.5, 2, 1); // p=0.5, shape=2, scale=1
  expect(quantile).toBeGreaterThan(0);
});

Deno.test("Exponential Distribution - basic usage", () => {
  const rate = 1;

  const pdf = dexp(1, rate); // x=1, rate=1
  expect(pdf).toBeCloseTo(1 / Math.E, 3); // e^(-1) ≈ 0.368

  const cdf = pexp(1, rate); // x=1, rate=1
  expect(cdf).toBeCloseTo(1 - 1 / Math.E, 3); // 1 - e^(-1) ≈ 0.632

  const quantile = qexp(0.5, rate); // p=0.5, rate=1
  expect(quantile).toBeCloseTo(Math.log(2), 3); // ln(2) ≈ 0.693
});

Deno.test("Chi-Squared Distribution - basic usage", () => {
  const df = 2;

  const pdf = dchisq(1, df); // x=1, df=2
  expect(pdf).toBeGreaterThan(0);

  const cdf = pchisq(1, df); // x=1, df=2
  expect(cdf).toBeGreaterThan(0);
  expect(cdf).toBeLessThan(1);

  const quantile = qchisq(0.95, df); // p=0.95, df=2
  expect(quantile).toBeGreaterThan(0);
});

Deno.test("F Distribution - basic usage", () => {
  const df1 = 5, df2 = 10;

  const pdf = df_dist(1, df1, df2); // x=1, df1=5, df2=10
  expect(pdf).toBeGreaterThan(0);

  const cdf = pf(1, df1, df2); // x=1, df1=5, df2=10
  expect(cdf).toBeGreaterThan(0);
  expect(cdf).toBeLessThan(1);

  const quantile = qf(0.95, df1, df2); // p=0.95, df1=5, df2=10
  expect(quantile).toBeGreaterThan(1);
});

Deno.test("Poisson Distribution - basic usage", () => {
  const lambda = 2;

  const pmf = dpois(2, lambda); // k=2, lambda=2
  expect(pmf).toBeGreaterThan(0);
  expect(pmf).toBeLessThan(1);

  const cdf = ppois(2, lambda); // k=2, lambda=2
  expect(cdf).toBeGreaterThan(0);
  expect(cdf).toBeLessThan(1);

  const quantile = qpois(0.5, lambda); // p=0.5, lambda=2
  expect(quantile).toBeGreaterThanOrEqual(0);
  expect(Number.isInteger(quantile)).toBe(true); // Should be integer
});

Deno.test("Binomial Distribution - basic usage", () => {
  const n = 10, p = 0.5;

  const pmf = dbinom(5, n, p); // k=5, n=10, p=0.5
  expect(pmf).toBeGreaterThan(0);
  expect(pmf).toBeLessThan(1);

  const cdf = pbinom(5, n, p); // k=5, n=10, p=0.5
  expect(cdf).toBeCloseTo(0.623, 2); // Should be around 0.623

  const quantile = qbinom(0.5, n, p); // p=0.5, n=10, p=0.5
  expect(quantile).toBeGreaterThanOrEqual(0);
  expect(quantile).toBeLessThanOrEqual(n);
  expect(Number.isInteger(quantile)).toBe(true); // Should be integer
});

Deno.test("t-Distribution - basic usage", () => {
  const df = 5;

  const pdf = dt(0, df); // x=0, df=5
  expect(pdf).toBeGreaterThan(0);

  const cdf = pt(0, df); // x=0, df=5
  expect(cdf).toBeCloseTo(0.5, 2); // Symmetric around 0

  const quantile = qt(0.95, df); // p=0.95, df=5
  expect(quantile).toBeGreaterThan(0); // Positive for upper tail
});

Deno.test("Distribution Properties - comprehensive check", () => {
  // Test that CDFs are monotonic increasing
  const x1 = pnorm(0, 0, 1);
  const x2 = pnorm(1, 0, 1);
  expect(x2).toBeGreaterThan(x1);

  // Test that PDFs are non-negative
  expect(dnorm(0, 0, 1)).toBeGreaterThan(0);
  expect(dgamma(1, 2, 1)).toBeGreaterThan(0);
  expect(dbeta(0.5, 2, 2)).toBeGreaterThan(0);

  // Test that CDFs are between 0 and 1
  const cdf_values = [
    pnorm(0, 0, 1),
    pexp(1, 1),
    pchisq(1, 2),
    pt(0, 5),
  ];

  for (const cdf of cdf_values) {
    expect(cdf).toBeGreaterThanOrEqual(0);
    expect(cdf).toBeLessThanOrEqual(1);
  }

  // Test quantile-CDF consistency (quantile should be inverse of CDF)
  const p = 0.75;
  const q = qnorm(p, 0, 1);
  const back_to_p = pnorm(q, 0, 1);
  expect(back_to_p).toBeCloseTo(p, 3);
});
