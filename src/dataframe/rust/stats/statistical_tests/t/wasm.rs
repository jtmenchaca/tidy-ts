//! WASM bindings for t-tests

#![cfg(feature = "wasm")]

use super::{
    one_sample::t_test,
    sample_size::t_sample_size,
    two_sample::{t_test_ind, t_test_paired as t_test_paired_impl},
};
use crate::stats::core::TestResult;
use crate::stats::helpers::parse_alternative;
use wasm_bindgen::prelude::*;

/// WASM export for one-sample t-test
#[wasm_bindgen]
pub fn t_test_one_sample(x: &[f64], mu: f64, alpha: f64, alternative: &str) -> TestResult {
    let alternative_type = parse_alternative(alternative);
    t_test(x.iter().copied(), mu, alternative_type, alpha)
}

/// WASM export for independent two-sample t-test
#[wasm_bindgen]
pub fn t_test_two_sample_independent(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: &str,
    pooled: bool,
) -> TestResult {
    let alternative_type = parse_alternative(alternative);
    t_test_ind(
        x.iter().copied(),
        y.iter().copied(),
        alternative_type,
        alpha,
        pooled,
    )
}

/// WASM export for paired t-test
#[wasm_bindgen]
pub fn t_test_paired(x: &[f64], y: &[f64], alpha: f64, alternative: &str) -> TestResult {
    let alternative_type = parse_alternative(alternative);
    t_test_paired_impl(
        x.iter().copied(),
        y.iter().copied(),
        alternative_type,
        alpha,
    )
}

/// WASM export for t-test sample size calculation
#[wasm_bindgen]
pub fn t_sample_size_wasm(effect_size: f64, alpha: f64, power: f64, std_dev: f64) -> f64 {
    let alternative_type = parse_alternative("two-sided"); // Default to two-sided
    let tail = alternative_type.to_tail_type();
    t_sample_size(effect_size, alpha, power, std_dev, tail)
}
