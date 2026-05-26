// Probability distributions module

import { initWasm, wasmInternal } from "./wasm-init.ts";

// Normal Distribution
export function wasm_dnorm(
  x: number,
  mean: number,
  sd: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dnorm(x, mean, sd, giveLog);
}

export function wasm_pnorm(
  x: number,
  mean: number,
  sd: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pnorm(x, mean, sd, lowerTail, giveLog);
}

export function wasm_qnorm(
  p: number,
  mean: number,
  sd: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qnorm(p, mean, sd, lowerTail, giveLog);
}

export function wasm_rnorm(
  mean: number,
  sd: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rnorm(mean, sd, n, seed);
}

// Beta Distribution
export function wasm_dbeta(
  x: number,
  shape1: number,
  shape2: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dbeta(x, shape1, shape2, giveLog);
}

export function wasm_pbeta(
  x: number,
  shape1: number,
  shape2: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pbeta(x, shape1, shape2, lowerTail, giveLog);
}

export function wasm_qbeta(
  p: number,
  shape1: number,
  shape2: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qbeta(p, shape1, shape2, lowerTail, giveLog);
}

export function wasm_rbeta(
  shape1: number,
  shape2: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rbeta(shape1, shape2, n, seed);
}

// Gamma Distribution
export function wasm_dgamma(
  x: number,
  shape: number,
  rate: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dgamma(x, shape, rate, giveLog);
}

export function wasm_pgamma(
  x: number,
  shape: number,
  rate: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pgamma(x, shape, rate, lowerTail, giveLog);
}

export function wasm_qgamma(
  p: number,
  shape: number,
  rate: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qgamma(p, shape, rate, lowerTail, giveLog);
}

export function wasm_rgamma(
  shape: number,
  rate: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rgamma(shape, rate, n, seed);
}

// Chi-Squared Distribution
export function wasm_dchisq(x: number, df: number, giveLog: boolean): number {
  initWasm();
  return wasmInternal.wasm_dchisq(x, df, giveLog);
}

export function wasm_pchisq(
  x: number,
  df: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pchisq(x, df, lowerTail, giveLog);
}

export function wasm_qchisq(
  p: number,
  df: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qchisq(p, df, lowerTail, giveLog);
}

export function wasm_rchisq(
  df: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rchisq(df, n, seed);
}

// F Distribution
export function wasm_df(
  x: number,
  df1: number,
  df2: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_df(x, df1, df2, giveLog);
}

export function wasm_pf(
  x: number,
  df1: number,
  df2: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pf(x, df1, df2, lowerTail, giveLog);
}

export function wasm_qf(
  p: number,
  df1: number,
  df2: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qf(p, df1, df2, lowerTail, giveLog);
}

export function wasm_rf(
  df1: number,
  df2: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rf(df1, df2, n, seed);
}

// Student's t Distribution
export function wasm_dt(x: number, df: number, giveLog: boolean): number {
  initWasm();
  return wasmInternal.wasm_dt(x, df, giveLog);
}

export function wasm_pt(
  x: number,
  df: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pt(x, df, lowerTail, giveLog);
}

export function wasm_qt(
  p: number,
  df: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qt(p, df, lowerTail, giveLog);
}

export function wasm_rt(
  df: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rt(df, n, seed);
}

// Exponential Distribution
export function wasm_dexp(x: number, rate: number, giveLog: boolean): number {
  initWasm();
  return wasmInternal.wasm_dexp(x, rate, giveLog);
}

export function wasm_pexp(
  x: number,
  rate: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pexp(x, rate, lowerTail, giveLog);
}

export function wasm_qexp(
  p: number,
  rate: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qexp(p, rate, lowerTail, giveLog);
}

export function wasm_rexp(
  rate: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rexp(rate, n, seed);
}

// Poisson Distribution
export function wasm_dpois(
  x: number,
  lambda: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dpois(x, lambda, giveLog);
}

export function wasm_ppois(
  x: number,
  lambda: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_ppois(x, lambda, lowerTail, giveLog);
}

export function wasm_qpois(
  p: number,
  lambda: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qpois(p, lambda, lowerTail, giveLog);
}

export function wasm_rpois(
  lambda: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rpois(lambda, n, seed);
}

// Binomial Distribution
export function wasm_dbinom(
  x: number,
  size: number,
  prob: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dbinom(x, size, prob, giveLog);
}

export function wasm_pbinom(
  x: number,
  size: number,
  prob: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pbinom(x, size, prob, lowerTail, giveLog);
}

export function wasm_qbinom(
  p: number,
  size: number,
  prob: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qbinom(p, size, prob, lowerTail, giveLog);
}

export function wasm_rbinom(
  size: number,
  prob: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rbinom(size, prob, n, seed);
}

// Uniform Distribution
export function wasm_dunif(
  x: number,
  min: number,
  max: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dunif(x, min, max, giveLog);
}

export function wasm_punif(
  x: number,
  min: number,
  max: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_punif(x, min, max, lowerTail, giveLog);
}

export function wasm_qunif(
  p: number,
  min: number,
  max: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qunif(p, min, max, lowerTail, giveLog);
}

export function wasm_runif(
  min: number,
  max: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_runif(min, max, n, seed);
}

// Weibull Distribution
export function wasm_dweibull(
  x: number,
  shape: number,
  scale: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dweibull(x, shape, scale, giveLog);
}

export function wasm_pweibull(
  x: number,
  shape: number,
  scale: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pweibull(x, shape, scale, lowerTail, giveLog);
}

export function wasm_qweibull(
  p: number,
  shape: number,
  scale: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qweibull(p, shape, scale, lowerTail, giveLog);
}

export function wasm_rweibull(
  shape: number,
  scale: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rweibull(shape, scale, n, seed);
}

// Geometric Distribution
export function wasm_dgeom(
  x: number,
  prob: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dgeom(x, prob, giveLog);
}

export function wasm_pgeom(
  x: number,
  prob: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pgeom(x, prob, lowerTail, giveLog);
}

export function wasm_qgeom(
  p: number,
  prob: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qgeom(p, prob, lowerTail, giveLog);
}

export function wasm_rgeom(
  prob: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rgeom(prob, n, seed);
}

// Hypergeometric Distribution
export function wasm_dhyper(
  x: number,
  m: number,
  n: number,
  k: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dhyper(x, m, n, k, giveLog);
}

export function wasm_phyper(
  x: number,
  m: number,
  n: number,
  k: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_phyper(x, m, n, k, lowerTail, giveLog);
}

export function wasm_qhyper(
  p: number,
  m: number,
  n: number,
  k: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qhyper(p, m, n, k, lowerTail, giveLog);
}

export function wasm_rhyper(
  m: number,
  n: number,
  k: number,
  count: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rhyper(m, n, k, count, seed);
}

// Log-normal Distribution
export function wasm_dlnorm(
  x: number,
  meanlog: number,
  sdlog: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dlnorm(x, meanlog, sdlog, giveLog);
}

export function wasm_plnorm(
  x: number,
  meanlog: number,
  sdlog: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_plnorm(x, meanlog, sdlog, lowerTail, giveLog);
}

export function wasm_qlnorm(
  p: number,
  meanlog: number,
  sdlog: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qlnorm(p, meanlog, sdlog, lowerTail, giveLog);
}

export function wasm_rlnorm(
  meanlog: number,
  sdlog: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rlnorm(meanlog, sdlog, n, seed);
}

// Negative Binomial Distribution
export function wasm_dnbinom(
  x: number,
  r: number,
  p: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dnbinom(x, r, p, giveLog);
}

export function wasm_pnbinom(
  x: number,
  r: number,
  p: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pnbinom(x, r, p, lowerTail, giveLog);
}

export function wasm_qnbinom(
  p: number,
  r: number,
  prob: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qnbinom(p, r, prob, lowerTail, giveLog);
}

export function wasm_rnbinom(
  r: number,
  prob: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rnbinom(r, prob, n, seed);
}

// Wilcoxon Distribution
export function wasm_dwilcox(
  x: number,
  m: number,
  n: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dwilcox(x, m, n, giveLog);
}

export function wasm_pwilcox(
  q: number,
  m: number,
  n: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pwilcox(q, m, n, lowerTail, giveLog);
}

export function wasm_qwilcox(
  p: number,
  m: number,
  n: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qwilcox(p, m, n, lowerTail, giveLog);
}

export function wasm_rwilcox(
  m: number,
  n: number,
  count: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rwilcox(m, n, count, seed);
}

// EV1 (Gumbel Maximum) Distribution
export function wasm_dev1(
  x: number,
  location: number,
  scale: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dev1(x, location, scale, giveLog);
}

export function wasm_pev1(
  x: number,
  location: number,
  scale: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pev1(x, location, scale, lowerTail, giveLog);
}

export function wasm_qev1(
  p: number,
  location: number,
  scale: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qev1(p, location, scale, lowerTail, giveLog);
}

export function wasm_rev1(
  location: number,
  scale: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rev1(location, scale, n, seed);
}

// Zipf Distribution
export function wasm_dzipf(
  x: number,
  n: number,
  s: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dzipf(x, n, s, giveLog);
}

export function wasm_pzipf(
  x: number,
  n: number,
  s: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pzipf(x, n, s, lowerTail, giveLog);
}

export function wasm_qzipf(
  p: number,
  n: number,
  s: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qzipf(p, n, s, lowerTail, giveLog);
}

export function wasm_rzipf(
  n: number,
  s: number,
  count: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rzipf(n, s, count, seed);
}

// Dirac Delta Distribution
export function wasm_ddirac(
  x: number,
  location: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_ddirac(x, location, giveLog);
}

export function wasm_pdirac(
  x: number,
  location: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pdirac(x, location, lowerTail, giveLog);
}

export function wasm_qdirac(
  p: number,
  location: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qdirac(p, location, lowerTail, giveLog);
}

export function wasm_rdirac(
  location: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rdirac(location, n, seed);
}

// Pareto Distribution
export function wasm_dpareto(
  x: number,
  scale: number,
  shape: number,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dpareto(x, scale, shape, giveLog);
}

export function wasm_ppareto(
  x: number,
  scale: number,
  shape: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_ppareto(x, scale, shape, lowerTail, giveLog);
}

export function wasm_qpareto(
  p: number,
  scale: number,
  shape: number,
  lowerTail: boolean,
  giveLog: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qpareto(p, scale, shape, lowerTail, giveLog);
}

export function wasm_rpareto(
  scale: number,
  shape: number,
  n: number,
  seed?: number,
): number[] {
  initWasm();
  return wasmInternal.wasm_rpareto(scale, shape, n, seed);
}
