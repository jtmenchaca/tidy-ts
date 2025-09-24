// Probability distributions module

import * as wasmInternal from "../../lib/tidy_ts_dataframe.js";
import { initWasm } from "./wasm-init.ts";

// Normal Distribution
export function wasm_dnorm(
  x: number,
  mean: number,
  sd: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dnorm(x, mean, sd, give_log);
}

export function wasm_pnorm(
  x: number,
  mean: number,
  sd: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pnorm(x, mean, sd, lower_tail, give_log);
}

export function wasm_qnorm(
  p: number,
  mean: number,
  sd: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qnorm(p, mean, sd, lower_tail, give_log);
}

export function wasm_rnorm(mean: number, sd: number): number {
  initWasm();
  return wasmInternal.wasm_rnorm(mean, sd);
}

// Beta Distribution
export function wasm_dbeta(
  x: number,
  shape1: number,
  shape2: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dbeta(x, shape1, shape2, give_log);
}

export function wasm_pbeta(
  x: number,
  shape1: number,
  shape2: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pbeta(x, shape1, shape2, lower_tail, give_log);
}

export function wasm_qbeta(
  p: number,
  shape1: number,
  shape2: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qbeta(p, shape1, shape2, lower_tail, give_log);
}

export function wasm_rbeta(shape1: number, shape2: number): number {
  initWasm();
  return wasmInternal.wasm_rbeta(shape1, shape2);
}

// Gamma Distribution
export function wasm_dgamma(
  x: number,
  shape: number,
  rate: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dgamma(x, shape, rate, give_log);
}

export function wasm_pgamma(
  x: number,
  shape: number,
  rate: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pgamma(x, shape, rate, lower_tail, give_log);
}

export function wasm_qgamma(
  p: number,
  shape: number,
  rate: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qgamma(p, shape, rate, lower_tail, give_log);
}

export function wasm_rgamma(shape: number, rate: number): number {
  initWasm();
  return wasmInternal.wasm_rgamma(shape, rate);
}

// Chi-Squared Distribution
export function wasm_dchisq(x: number, df: number, give_log: boolean): number {
  initWasm();
  return wasmInternal.wasm_dchisq(x, df, give_log);
}

export function wasm_pchisq(
  x: number,
  df: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pchisq(x, df, lower_tail, give_log);
}

export function wasm_qchisq(
  p: number,
  df: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qchisq(p, df, lower_tail, give_log);
}

export function wasm_rchisq(df: number): number {
  initWasm();
  return wasmInternal.wasm_rchisq(df);
}

// F Distribution
export function wasm_df(
  x: number,
  df1: number,
  df2: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_df(x, df1, df2, give_log);
}

export function wasm_pf(
  x: number,
  df1: number,
  df2: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pf(x, df1, df2, lower_tail, give_log);
}

export function wasm_qf(
  p: number,
  df1: number,
  df2: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qf(p, df1, df2, lower_tail, give_log);
}

export function wasm_rf(df1: number, df2: number): number {
  initWasm();
  return wasmInternal.wasm_rf(df1, df2);
}

// Student's t Distribution
export function wasm_dt(x: number, df: number, give_log: boolean): number {
  initWasm();
  return wasmInternal.wasm_dt(x, df, give_log);
}

export function wasm_pt(
  x: number,
  df: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pt(x, df, lower_tail, give_log);
}

export function wasm_qt(
  p: number,
  df: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qt(p, df, lower_tail, give_log);
}

export function wasm_rt(df: number): number {
  initWasm();
  return wasmInternal.wasm_rt(df);
}

// Exponential Distribution
export function wasm_dexp(x: number, rate: number, give_log: boolean): number {
  initWasm();
  return wasmInternal.wasm_dexp(x, rate, give_log);
}

export function wasm_pexp(
  x: number,
  rate: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pexp(x, rate, lower_tail, give_log);
}

export function wasm_qexp(
  p: number,
  rate: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qexp(p, rate, lower_tail, give_log);
}

export function wasm_rexp(rate: number): number {
  initWasm();
  return wasmInternal.wasm_rexp(rate);
}

// Poisson Distribution
export function wasm_dpois(
  x: number,
  lambda: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dpois(x, lambda, give_log);
}

export function wasm_ppois(
  x: number,
  lambda: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_ppois(x, lambda, lower_tail, give_log);
}

export function wasm_qpois(
  p: number,
  lambda: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qpois(p, lambda, lower_tail, give_log);
}

export function wasm_rpois(lambda: number): number {
  initWasm();
  return wasmInternal.wasm_rpois(lambda);
}

// Binomial Distribution
export function wasm_dbinom(
  x: number,
  size: number,
  prob: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dbinom(x, size, prob, give_log);
}

export function wasm_pbinom(
  x: number,
  size: number,
  prob: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pbinom(x, size, prob, lower_tail, give_log);
}

export function wasm_qbinom(
  p: number,
  size: number,
  prob: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qbinom(p, size, prob, lower_tail, give_log);
}

export function wasm_rbinom(size: number, prob: number): number {
  initWasm();
  return wasmInternal.wasm_rbinom(size, prob);
}

// Uniform Distribution
export function wasm_dunif(
  x: number,
  min: number,
  max: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dunif(x, min, max, give_log);
}

export function wasm_punif(
  x: number,
  min: number,
  max: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_punif(x, min, max, lower_tail, give_log);
}

export function wasm_qunif(
  p: number,
  min: number,
  max: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qunif(p, min, max, lower_tail, give_log);
}

export function wasm_runif(min: number, max: number): number {
  initWasm();
  return wasmInternal.wasm_runif(min, max);
}

// Weibull Distribution
export function wasm_dweibull(
  x: number,
  shape: number,
  scale: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dweibull(x, shape, scale, give_log);
}

export function wasm_pweibull(
  x: number,
  shape: number,
  scale: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pweibull(x, shape, scale, lower_tail, give_log);
}

export function wasm_qweibull(
  p: number,
  shape: number,
  scale: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qweibull(p, shape, scale, lower_tail, give_log);
}

export function wasm_rweibull(shape: number, scale: number): number {
  initWasm();
  return wasmInternal.wasm_rweibull(shape, scale);
}

// Geometric Distribution
export function wasm_dgeom(
  x: number,
  prob: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dgeom(x, prob, give_log);
}

export function wasm_pgeom(
  x: number,
  prob: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pgeom(x, prob, lower_tail, give_log);
}

export function wasm_qgeom(
  p: number,
  prob: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qgeom(p, prob, lower_tail, give_log);
}

export function wasm_rgeom(prob: number): number {
  initWasm();
  return wasmInternal.wasm_rgeom(prob);
}

// Hypergeometric Distribution
export function wasm_dhyper(
  x: number,
  m: number,
  n: number,
  k: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dhyper(x, m, n, k, give_log);
}

export function wasm_phyper(
  x: number,
  m: number,
  n: number,
  k: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_phyper(x, m, n, k, lower_tail, give_log);
}

export function wasm_qhyper(
  p: number,
  m: number,
  n: number,
  k: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qhyper(p, m, n, k, lower_tail, give_log);
}

export function wasm_rhyper(m: number, n: number, k: number): number {
  initWasm();
  return wasmInternal.wasm_rhyper(m, n, k);
}

// Log-normal Distribution
export function wasm_dlnorm(
  x: number,
  meanlog: number,
  sdlog: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dlnorm(x, meanlog, sdlog, give_log);
}

export function wasm_plnorm(
  x: number,
  meanlog: number,
  sdlog: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_plnorm(x, meanlog, sdlog, lower_tail, give_log);
}

export function wasm_qlnorm(
  p: number,
  meanlog: number,
  sdlog: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qlnorm(p, meanlog, sdlog, lower_tail, give_log);
}

export function wasm_rlnorm(meanlog: number, sdlog: number): number {
  initWasm();
  return wasmInternal.wasm_rlnorm(meanlog, sdlog);
}

// Negative Binomial Distribution
export function wasm_dnbinom(
  x: number,
  r: number,
  p: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dnbinom(x, r, p, give_log);
}

export function wasm_pnbinom(
  x: number,
  r: number,
  p: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pnbinom(x, r, p, lower_tail, give_log);
}

export function wasm_qnbinom(
  p: number,
  r: number,
  prob: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qnbinom(p, r, prob, lower_tail, give_log);
}

export function wasm_rnbinom(r: number, prob: number): number {
  initWasm();
  return wasmInternal.wasm_rnbinom(r, prob);
}

// Wilcoxon Distribution
export function wasm_dwilcox(
  x: number,
  m: number,
  n: number,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_dwilcox(x, m, n, give_log);
}

export function wasm_pwilcox(
  q: number,
  m: number,
  n: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_pwilcox(q, m, n, lower_tail, give_log);
}

export function wasm_qwilcox(
  p: number,
  m: number,
  n: number,
  lower_tail: boolean,
  give_log: boolean,
): number {
  initWasm();
  return wasmInternal.wasm_qwilcox(p, m, n, lower_tail, give_log);
}

export function wasm_rwilcox(m: number, n: number): number {
  initWasm();
  return wasmInternal.wasm_rwilcox(m, n);
}
