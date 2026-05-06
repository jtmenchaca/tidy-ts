//! WASM and NAPI bindings for probability distribution functions

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

use super::*;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(any(feature = "wasm", feature = "napi-rs"))]
use rand::thread_rng;

// ============================================================================
// BETA DISTRIBUTION
// ============================================================================

/// WASM export for beta density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dbeta(x: f64, shape1: f64, shape2: f64, give_log: bool) -> f64 {
    dbeta(x, shape1, shape2, give_log)
}

/// NAPI export for beta density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dbeta_napi(x: f64, shape1: f64, shape2: f64, give_log: bool) -> f64 {
    dbeta(x, shape1, shape2, give_log)
}

/// WASM export for beta cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pbeta(x: f64, shape1: f64, shape2: f64, lower_tail: bool, log_p: bool) -> f64 {
    pbeta(x, shape1, shape2, lower_tail, log_p)
}

/// NAPI export for beta cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pbeta_napi(x: f64, shape1: f64, shape2: f64, lower_tail: bool, log_p: bool) -> f64 {
    pbeta(x, shape1, shape2, lower_tail, log_p)
}

/// WASM export for beta quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qbeta(p: f64, shape1: f64, shape2: f64, lower_tail: bool, log_p: bool) -> f64 {
    qbeta(p, shape1, shape2, lower_tail, log_p)
}

/// NAPI export for beta quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qbeta_napi(p: f64, shape1: f64, shape2: f64, lower_tail: bool, log_p: bool) -> f64 {
    qbeta(p, shape1, shape2, lower_tail, log_p)
}

/// WASM export for beta random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rbeta(shape1: f64, shape2: f64) -> f64 {
    let mut rng = thread_rng();
    rbeta(shape1, shape2, &mut rng)
}

/// NAPI export for beta random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rbeta_napi(shape1: f64, shape2: f64) -> f64 {
    let mut rng = thread_rng();
    rbeta(shape1, shape2, &mut rng)
}

// ============================================================================
// NORMAL DISTRIBUTION
// ============================================================================

/// WASM export for normal density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dnorm(x: f64, mean: f64, sd: f64, give_log: bool) -> f64 {
    dnorm(x, mean, sd, give_log)
}

/// NAPI export for normal density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dnorm_napi(x: f64, mean: f64, sd: f64, give_log: bool) -> f64 {
    dnorm(x, mean, sd, give_log)
}

/// WASM export for normal cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pnorm(x: f64, mean: f64, sd: f64, lower_tail: bool, log_p: bool) -> f64 {
    pnorm(x, mean, sd, lower_tail, log_p)
}

/// NAPI export for normal cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pnorm_napi(x: f64, mean: f64, sd: f64, lower_tail: bool, log_p: bool) -> f64 {
    pnorm(x, mean, sd, lower_tail, log_p)
}

/// WASM export for normal quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qnorm(p: f64, mean: f64, sd: f64, lower_tail: bool, log_p: bool) -> f64 {
    qnorm(p, mean, sd, lower_tail, log_p)
}

/// NAPI export for normal quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qnorm_napi(p: f64, mean: f64, sd: f64, lower_tail: bool, log_p: bool) -> f64 {
    qnorm(p, mean, sd, lower_tail, log_p)
}

/// WASM export for normal random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rnorm(mean: f64, sd: f64) -> f64 {
    let mut rng = thread_rng();
    rnorm(mean, sd, &mut rng)
}

/// NAPI export for normal random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rnorm_napi(mean: f64, sd: f64) -> f64 {
    let mut rng = thread_rng();
    rnorm(mean, sd, &mut rng)
}

// ============================================================================
// GAMMA DISTRIBUTION
// ============================================================================

/// WASM export for gamma density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dgamma(x: f64, shape: f64, rate: f64, give_log: bool) -> f64 {
    dgamma(x, shape, rate, give_log)
}

/// NAPI export for gamma density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dgamma_napi(x: f64, shape: f64, rate: f64, give_log: bool) -> f64 {
    dgamma(x, shape, rate, give_log)
}

/// WASM export for gamma cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pgamma(x: f64, shape: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    pgamma(x, shape, rate, lower_tail, log_p)
}

/// NAPI export for gamma cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pgamma_napi(x: f64, shape: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    pgamma(x, shape, rate, lower_tail, log_p)
}

/// WASM export for gamma quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qgamma(p: f64, shape: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    qgamma(p, shape, rate, lower_tail, log_p)
}

/// NAPI export for gamma quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qgamma_napi(p: f64, shape: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    qgamma(p, shape, rate, lower_tail, log_p)
}

/// WASM export for gamma random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rgamma(shape: f64, rate: f64) -> f64 {
    let mut rng = thread_rng();
    rgamma(shape, rate, &mut rng)
}

/// NAPI export for gamma random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rgamma_napi(shape: f64, rate: f64) -> f64 {
    let mut rng = thread_rng();
    rgamma(shape, rate, &mut rng)
}

// ============================================================================
// EXPONENTIAL DISTRIBUTION
// ============================================================================

/// WASM export for exponential density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dexp(x: f64, rate: f64, give_log: bool) -> f64 {
    dexp(x, rate, give_log)
}

/// NAPI export for exponential density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dexp_napi(x: f64, rate: f64, give_log: bool) -> f64 {
    dexp(x, rate, give_log)
}

/// WASM export for exponential cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pexp(x: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    pexp(x, rate, lower_tail, log_p)
}

/// NAPI export for exponential cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pexp_napi(x: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    pexp(x, rate, lower_tail, log_p)
}

/// WASM export for exponential quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qexp(p: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    qexp(p, rate, lower_tail, log_p)
}

/// NAPI export for exponential quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qexp_napi(p: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    qexp(p, rate, lower_tail, log_p)
}

/// WASM export for exponential random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rexp(rate: f64) -> f64 {
    let mut rng = thread_rng();
    rexp(rate, &mut rng)
}

/// NAPI export for exponential random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rexp_napi(rate: f64) -> f64 {
    let mut rng = thread_rng();
    rexp(rate, &mut rng)
}

// ============================================================================
// CHI-SQUARED DISTRIBUTION
// ============================================================================

/// WASM export for chi-squared density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dchisq(x: f64, df: f64, give_log: bool) -> f64 {
    dchisq(x, df, give_log)
}

/// NAPI export for chi-squared density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dchisq_napi(x: f64, df: f64, give_log: bool) -> f64 {
    dchisq(x, df, give_log)
}

/// WASM export for chi-squared cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pchisq(x: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    pchisq(x, df, lower_tail, log_p)
}

/// NAPI export for chi-squared cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pchisq_napi(x: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    pchisq(x, df, lower_tail, log_p)
}

/// WASM export for chi-squared quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qchisq(p: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    qchisq(p, df, lower_tail, log_p)
}

/// NAPI export for chi-squared quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qchisq_napi(p: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    qchisq(p, df, lower_tail, log_p)
}

/// WASM export for chi-squared random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rchisq(df: f64) -> f64 {
    let mut rng = thread_rng();
    rchisq(df, &mut rng)
}

/// NAPI export for chi-squared random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rchisq_napi(df: f64) -> f64 {
    let mut rng = thread_rng();
    rchisq(df, &mut rng)
}

// ============================================================================
// F DISTRIBUTION
// ============================================================================

/// WASM export for F density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_df(x: f64, df1: f64, df2: f64, give_log: bool) -> f64 {
    df(x, df1, df2, give_log)
}

/// NAPI export for F density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_df_napi(x: f64, df1: f64, df2: f64, give_log: bool) -> f64 {
    df(x, df1, df2, give_log)
}

/// WASM export for F cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pf(x: f64, df1: f64, df2: f64, lower_tail: bool, log_p: bool) -> f64 {
    pf(x, df1, df2, lower_tail, log_p)
}

/// NAPI export for F cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pf_napi(x: f64, df1: f64, df2: f64, lower_tail: bool, log_p: bool) -> f64 {
    pf(x, df1, df2, lower_tail, log_p)
}

/// WASM export for F quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qf(p: f64, df1: f64, df2: f64, lower_tail: bool, log_p: bool) -> f64 {
    qf(p, df1, df2, lower_tail, log_p)
}

/// NAPI export for F quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qf_napi(p: f64, df1: f64, df2: f64, lower_tail: bool, log_p: bool) -> f64 {
    qf(p, df1, df2, lower_tail, log_p)
}

/// WASM export for F distribution random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rf(df1: f64, df2: f64) -> f64 {
    let mut rng = thread_rng();
    rf(df1, df2, &mut rng)
}

/// NAPI export for F distribution random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rf_napi(df1: f64, df2: f64) -> f64 {
    let mut rng = thread_rng();
    rf(df1, df2, &mut rng)
}

// ============================================================================
// STUDENT'S T DISTRIBUTION
// ============================================================================

/// WASM export for t density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dt(x: f64, df: f64, give_log: bool) -> f64 {
    dt(x, df, give_log)
}

/// NAPI export for t density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dt_napi(x: f64, df: f64, give_log: bool) -> f64 {
    dt(x, df, give_log)
}

/// WASM export for t cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pt(x: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    pt(x, df, lower_tail, log_p)
}

/// NAPI export for t cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pt_napi(x: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    pt(x, df, lower_tail, log_p)
}

/// WASM export for t quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qt(p: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    qt(p, df, lower_tail, log_p)
}

/// NAPI export for t quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qt_napi(p: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    qt(p, df, lower_tail, log_p)
}

/// WASM export for t distribution random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rt(df: f64) -> f64 {
    let mut rng = thread_rng();
    rt(df, &mut rng)
}

/// NAPI export for t distribution random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rt_napi(df: f64) -> f64 {
    let mut rng = thread_rng();
    rt(df, &mut rng)
}

// ============================================================================
// POISSON DISTRIBUTION
// ============================================================================

/// WASM export for Poisson density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dpois(x: f64, lambda: f64, give_log: bool) -> f64 {
    dpois(x, lambda, give_log)
}

/// NAPI export for Poisson density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dpois_napi(x: f64, lambda: f64, give_log: bool) -> f64 {
    dpois(x, lambda, give_log)
}

/// WASM export for Poisson cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_ppois(x: f64, lambda: f64, lower_tail: bool, log_p: bool) -> f64 {
    ppois(x, lambda, lower_tail, log_p)
}

/// NAPI export for Poisson cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_ppois_napi(x: f64, lambda: f64, lower_tail: bool, log_p: bool) -> f64 {
    ppois(x, lambda, lower_tail, log_p)
}

/// WASM export for Poisson quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qpois(p: f64, lambda: f64, lower_tail: bool, log_p: bool) -> f64 {
    qpois(p, lambda, lower_tail, log_p)
}

/// NAPI export for Poisson quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qpois_napi(p: f64, lambda: f64, lower_tail: bool, log_p: bool) -> f64 {
    qpois(p, lambda, lower_tail, log_p)
}

/// WASM export for Poisson random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rpois(lambda: f64) -> f64 {
    let mut rng = thread_rng();
    rpois(lambda, &mut rng)
}

/// NAPI export for Poisson random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rpois_napi(lambda: f64) -> f64 {
    let mut rng = thread_rng();
    rpois(lambda, &mut rng)
}

// ============================================================================
// BINOMIAL DISTRIBUTION
// ============================================================================

/// WASM export for binomial density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dbinom(x: f64, size: f64, prob: f64, give_log: bool) -> f64 {
    dbinom(x, size, prob, give_log)
}

/// NAPI export for binomial density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dbinom_napi(x: f64, size: f64, prob: f64, give_log: bool) -> f64 {
    dbinom(x, size, prob, give_log)
}

/// WASM export for binomial cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pbinom(x: f64, size: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    pbinom(x, size, prob, lower_tail, log_p)
}

/// NAPI export for binomial cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pbinom_napi(x: f64, size: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    pbinom(x, size, prob, lower_tail, log_p)
}

/// WASM export for binomial quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qbinom(p: f64, size: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    qbinom(p, size, prob, lower_tail, log_p)
}

/// NAPI export for binomial quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qbinom_napi(p: f64, size: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    qbinom(p, size, prob, lower_tail, log_p)
}

/// WASM export for binomial random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rbinom(size: f64, prob: f64) -> f64 {
    let mut rng = thread_rng();
    rbinom(size, prob, &mut rng)
}

/// NAPI export for binomial random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rbinom_napi(size: f64, prob: f64) -> f64 {
    let mut rng = thread_rng();
    rbinom(size, prob, &mut rng)
}

// ============================================================================
// UNIFORM DISTRIBUTION
// ============================================================================

/// WASM export for uniform density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dunif(x: f64, min: f64, max: f64, give_log: bool) -> f64 {
    dunif(x, min, max, give_log)
}

/// NAPI export for uniform density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dunif_napi(x: f64, min: f64, max: f64, give_log: bool) -> f64 {
    dunif(x, min, max, give_log)
}

/// WASM export for uniform cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_punif(x: f64, min: f64, max: f64, lower_tail: bool, log_p: bool) -> f64 {
    punif(x, min, max, lower_tail, log_p)
}

/// NAPI export for uniform cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_punif_napi(x: f64, min: f64, max: f64, lower_tail: bool, log_p: bool) -> f64 {
    punif(x, min, max, lower_tail, log_p)
}

/// WASM export for uniform quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qunif(p: f64, min: f64, max: f64, lower_tail: bool, log_p: bool) -> f64 {
    qunif(p, min, max, lower_tail, log_p)
}

/// NAPI export for uniform quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qunif_napi(p: f64, min: f64, max: f64, lower_tail: bool, log_p: bool) -> f64 {
    qunif(p, min, max, lower_tail, log_p)
}

/// WASM export for uniform random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_runif(min: f64, max: f64) -> f64 {
    let mut rng = thread_rng();
    runif(min, max, &mut rng)
}

/// NAPI export for uniform random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_runif_napi(min: f64, max: f64) -> f64 {
    let mut rng = thread_rng();
    runif(min, max, &mut rng)
}

// ============================================================================
// WEIBULL DISTRIBUTION
// ============================================================================

/// WASM export for Weibull density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dweibull(x: f64, shape: f64, scale: f64, give_log: bool) -> f64 {
    dweibull(x, shape, scale, give_log)
}

/// NAPI export for Weibull density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dweibull_napi(x: f64, shape: f64, scale: f64, give_log: bool) -> f64 {
    dweibull(x, shape, scale, give_log)
}

/// WASM export for Weibull cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pweibull(x: f64, shape: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    pweibull(x, shape, scale, lower_tail, log_p)
}

/// NAPI export for Weibull cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pweibull_napi(x: f64, shape: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    pweibull(x, shape, scale, lower_tail, log_p)
}

/// WASM export for Weibull quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qweibull(p: f64, shape: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    qweibull(p, shape, scale, lower_tail, log_p)
}

/// NAPI export for Weibull quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qweibull_napi(p: f64, shape: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    qweibull(p, shape, scale, lower_tail, log_p)
}

/// WASM export for Weibull random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rweibull(shape: f64, scale: f64) -> f64 {
    let mut rng = thread_rng();
    rweibull(shape, scale, &mut rng)
}

/// NAPI export for Weibull random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rweibull_napi(shape: f64, scale: f64) -> f64 {
    let mut rng = thread_rng();
    rweibull(shape, scale, &mut rng)
}

// ============================================================================
// GEOMETRIC DISTRIBUTION
// ============================================================================

/// WASM export for geometric density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dgeom(x: f64, prob: f64, give_log: bool) -> f64 {
    dgeom(x, prob, give_log)
}

/// NAPI export for geometric density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dgeom_napi(x: f64, prob: f64, give_log: bool) -> f64 {
    dgeom(x, prob, give_log)
}

/// WASM export for geometric cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pgeom(x: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    pgeom(x, prob, lower_tail, log_p)
}

/// NAPI export for geometric cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pgeom_napi(x: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    pgeom(x, prob, lower_tail, log_p)
}

/// WASM export for geometric quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qgeom(p: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    qgeom(p, prob, lower_tail, log_p)
}

/// NAPI export for geometric quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qgeom_napi(p: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    qgeom(p, prob, lower_tail, log_p)
}

/// WASM export for geometric random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rgeom(prob: f64) -> f64 {
    let mut rng = thread_rng();
    rgeom(prob, &mut rng)
}

/// NAPI export for geometric random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rgeom_napi(prob: f64) -> f64 {
    let mut rng = thread_rng();
    rgeom(prob, &mut rng)
}

// ============================================================================
// HYPERGEOMETRIC DISTRIBUTION
// ============================================================================

/// WASM export for hypergeometric density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dhyper(x: f64, m: f64, n: f64, k: f64, give_log: bool) -> f64 {
    dhyper(x, m, n, k, give_log)
}

/// NAPI export for hypergeometric density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dhyper_napi(x: f64, m: f64, n: f64, k: f64, give_log: bool) -> f64 {
    dhyper(x, m, n, k, give_log)
}

/// WASM export for hypergeometric cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_phyper(x: f64, m: f64, n: f64, k: f64, lower_tail: bool, log_p: bool) -> f64 {
    phyper(x, m, n, k, lower_tail, log_p)
}

/// NAPI export for hypergeometric cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_phyper_napi(x: f64, m: f64, n: f64, k: f64, lower_tail: bool, log_p: bool) -> f64 {
    phyper(x, m, n, k, lower_tail, log_p)
}

/// WASM export for hypergeometric quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qhyper(p: f64, m: f64, n: f64, k: f64, lower_tail: bool, log_p: bool) -> f64 {
    qhyper(p, m, n, k, lower_tail, log_p)
}

/// NAPI export for hypergeometric quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qhyper_napi(p: f64, m: f64, n: f64, k: f64, lower_tail: bool, log_p: bool) -> f64 {
    qhyper(p, m, n, k, lower_tail, log_p)
}

/// WASM export for hypergeometric random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rhyper(m: f64, n: f64, k: f64) -> f64 {
    let mut rng = thread_rng();
    rhyper(m, n, k, &mut rng)
}

/// NAPI export for hypergeometric random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rhyper_napi(m: f64, n: f64, k: f64) -> f64 {
    let mut rng = thread_rng();
    rhyper(m, n, k, &mut rng)
}

// ============================================================================
// LOG-NORMAL DISTRIBUTION
// ============================================================================

/// WASM export for log-normal density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dlnorm(x: f64, meanlog: f64, sdlog: f64, give_log: bool) -> f64 {
    dlnorm(x, meanlog, sdlog, give_log)
}

/// NAPI export for log-normal density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dlnorm_napi(x: f64, meanlog: f64, sdlog: f64, give_log: bool) -> f64 {
    dlnorm(x, meanlog, sdlog, give_log)
}

/// WASM export for log-normal cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_plnorm(x: f64, meanlog: f64, sdlog: f64, lower_tail: bool, log_p: bool) -> f64 {
    plnorm(x, meanlog, sdlog, lower_tail, log_p)
}

/// NAPI export for log-normal cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_plnorm_napi(x: f64, meanlog: f64, sdlog: f64, lower_tail: bool, log_p: bool) -> f64 {
    plnorm(x, meanlog, sdlog, lower_tail, log_p)
}

/// WASM export for log-normal quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qlnorm(p: f64, meanlog: f64, sdlog: f64, lower_tail: bool, log_p: bool) -> f64 {
    qlnorm(p, meanlog, sdlog, lower_tail, log_p)
}

/// NAPI export for log-normal quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qlnorm_napi(p: f64, meanlog: f64, sdlog: f64, lower_tail: bool, log_p: bool) -> f64 {
    qlnorm(p, meanlog, sdlog, lower_tail, log_p)
}

/// WASM export for log-normal random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rlnorm(meanlog: f64, sdlog: f64) -> f64 {
    let mut rng = thread_rng();
    rlnorm(meanlog, sdlog, &mut rng)
}

/// NAPI export for log-normal random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rlnorm_napi(meanlog: f64, sdlog: f64) -> f64 {
    let mut rng = thread_rng();
    rlnorm(meanlog, sdlog, &mut rng)
}

// ============================================================================
// NEGATIVE BINOMIAL DISTRIBUTION
// ============================================================================

/// WASM export for negative binomial density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dnbinom(x: f64, r: f64, p: f64, give_log: bool) -> f64 {
    dnbinom(x, r, p, give_log)
}

/// NAPI export for negative binomial density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dnbinom_napi(x: f64, r: f64, p: f64, give_log: bool) -> f64 {
    dnbinom(x, r, p, give_log)
}

/// WASM export for negative binomial cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pnbinom(x: f64, r: f64, p: f64, lower_tail: bool, log_p: bool) -> f64 {
    pnbinom(x, r, p, lower_tail, log_p)
}

/// NAPI export for negative binomial cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pnbinom_napi(x: f64, r: f64, p: f64, lower_tail: bool, log_p: bool) -> f64 {
    pnbinom(x, r, p, lower_tail, log_p)
}

/// WASM export for negative binomial quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qnbinom(p: f64, r: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    qnbinom(p, r, prob, lower_tail, log_p)
}

/// NAPI export for negative binomial quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qnbinom_napi(p: f64, r: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    qnbinom(p, r, prob, lower_tail, log_p)
}

/// WASM export for negative binomial random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rnbinom(r: f64, prob: f64) -> f64 {
    let mut rng = thread_rng();
    rnbinom(r, prob, &mut rng)
}

/// NAPI export for negative binomial random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rnbinom_napi(r: f64, prob: f64) -> f64 {
    let mut rng = thread_rng();
    rnbinom(r, prob, &mut rng)
}

// ============================================================================
// WILCOXON DISTRIBUTION
// ============================================================================

/// WASM export for Wilcoxon density function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dwilcox(x: f64, m: f64, n: f64, give_log: bool) -> f64 {
    dwilcox(x, m, n, give_log)
}

/// NAPI export for Wilcoxon density function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dwilcox_napi(x: f64, m: f64, n: f64, give_log: bool) -> f64 {
    dwilcox(x, m, n, give_log)
}

/// WASM export for Wilcoxon cumulative distribution function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pwilcox(q: f64, m: f64, n: f64, lower_tail: bool, log_p: bool) -> f64 {
    pwilcox(q, m, n, lower_tail, log_p)
}

/// NAPI export for Wilcoxon cumulative distribution function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pwilcox_napi(q: f64, m: f64, n: f64, lower_tail: bool, log_p: bool) -> f64 {
    pwilcox(q, m, n, lower_tail, log_p)
}

/// WASM export for Wilcoxon quantile function
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qwilcox(p: f64, m: f64, n: f64, lower_tail: bool, log_p: bool) -> f64 {
    qwilcox(p, m, n, lower_tail, log_p)
}

/// NAPI export for Wilcoxon quantile function
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qwilcox_napi(p: f64, m: f64, n: f64, lower_tail: bool, log_p: bool) -> f64 {
    qwilcox(p, m, n, lower_tail, log_p)
}

/// WASM export for Wilcoxon random number generation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rwilcox(m: f64, n: f64) -> f64 {
    let mut rng = thread_rng();
    rwilcox(m, n, &mut rng)
}

/// NAPI export for Wilcoxon random number generation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rwilcox_napi(m: f64, n: f64) -> f64 {
    let mut rng = thread_rng();
    rwilcox(m, n, &mut rng)
}

// ============================================================================
// EV1 (GUMBEL MAXIMUM) DISTRIBUTION
// ============================================================================

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dev1(x: f64, location: f64, scale: f64, give_log: bool) -> f64 {
    dev1(x, location, scale, give_log)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dev1_napi(x: f64, location: f64, scale: f64, give_log: bool) -> f64 {
    dev1(x, location, scale, give_log)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pev1(x: f64, location: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    pev1(x, location, scale, lower_tail, log_p)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pev1_napi(x: f64, location: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    pev1(x, location, scale, lower_tail, log_p)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qev1(p: f64, location: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    qev1(p, location, scale, lower_tail, log_p)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qev1_napi(p: f64, location: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    qev1(p, location, scale, lower_tail, log_p)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rev1(location: f64, scale: f64) -> f64 {
    let mut rng = thread_rng();
    rev1(location, scale, &mut rng)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rev1_napi(location: f64, scale: f64) -> f64 {
    let mut rng = thread_rng();
    rev1(location, scale, &mut rng)
}

// ============================================================================
// ZIPF DISTRIBUTION
// ============================================================================

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dzipf(x: f64, n: f64, s: f64, give_log: bool) -> f64 {
    dzipf(x, n, s, give_log)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dzipf_napi(x: f64, n: f64, s: f64, give_log: bool) -> f64 {
    dzipf(x, n, s, give_log)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pzipf(x: f64, n: f64, s: f64, lower_tail: bool, log_p: bool) -> f64 {
    pzipf(x, n, s, lower_tail, log_p)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pzipf_napi(x: f64, n: f64, s: f64, lower_tail: bool, log_p: bool) -> f64 {
    pzipf(x, n, s, lower_tail, log_p)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qzipf(p: f64, n: f64, s: f64, lower_tail: bool, log_p: bool) -> f64 {
    qzipf(p, n, s, lower_tail, log_p)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qzipf_napi(p: f64, n: f64, s: f64, lower_tail: bool, log_p: bool) -> f64 {
    qzipf(p, n, s, lower_tail, log_p)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rzipf(n: f64, s: f64) -> f64 {
    let mut rng = thread_rng();
    rzipf(n, s, &mut rng)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rzipf_napi(n: f64, s: f64) -> f64 {
    let mut rng = thread_rng();
    rzipf(n, s, &mut rng)
}

// ============================================================================
// DIRAC DELTA DISTRIBUTION
// ============================================================================

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_ddirac(x: f64, location: f64, give_log: bool) -> f64 {
    ddirac(x, location, give_log)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_ddirac_napi(x: f64, location: f64, give_log: bool) -> f64 {
    ddirac(x, location, give_log)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_pdirac(x: f64, location: f64, lower_tail: bool, log_p: bool) -> f64 {
    pdirac(x, location, lower_tail, log_p)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_pdirac_napi(x: f64, location: f64, lower_tail: bool, log_p: bool) -> f64 {
    pdirac(x, location, lower_tail, log_p)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qdirac(p: f64, location: f64, lower_tail: bool, log_p: bool) -> f64 {
    qdirac(p, location, lower_tail, log_p)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qdirac_napi(p: f64, location: f64, lower_tail: bool, log_p: bool) -> f64 {
    qdirac(p, location, lower_tail, log_p)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rdirac(location: f64) -> f64 {
    let mut rng = thread_rng();
    rdirac(location, &mut rng)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rdirac_napi(location: f64) -> f64 {
    let mut rng = thread_rng();
    rdirac(location, &mut rng)
}

// ============================================================================
// PARETO DISTRIBUTION
// ============================================================================

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_dpareto(x: f64, scale: f64, shape: f64, give_log: bool) -> f64 {
    dpareto(x, scale, shape, give_log)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_dpareto_napi(x: f64, scale: f64, shape: f64, give_log: bool) -> f64 {
    dpareto(x, scale, shape, give_log)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_ppareto(x: f64, scale: f64, shape: f64, lower_tail: bool, log_p: bool) -> f64 {
    ppareto(x, scale, shape, lower_tail, log_p)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_ppareto_napi(x: f64, scale: f64, shape: f64, lower_tail: bool, log_p: bool) -> f64 {
    ppareto(x, scale, shape, lower_tail, log_p)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_qpareto(p: f64, scale: f64, shape: f64, lower_tail: bool, log_p: bool) -> f64 {
    qpareto(p, scale, shape, lower_tail, log_p)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_qpareto_napi(p: f64, scale: f64, shape: f64, lower_tail: bool, log_p: bool) -> f64 {
    qpareto(p, scale, shape, lower_tail, log_p)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_rpareto(scale: f64, shape: f64) -> f64 {
    let mut rng = thread_rng();
    rpareto(scale, shape, &mut rng)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wasm_rpareto_napi(scale: f64, shape: f64) -> f64 {
    let mut rng = thread_rng();
    rpareto(scale, shape, &mut rng)
}
