//! WASM bindings for Mann-Whitney U test

#![cfg(feature = "wasm")]

use super::mann_whitney_u::MannWhitneyConfig;
use crate::stats::core::TestResult;
use wasm_bindgen::prelude::*;

/// WASM export for Mann-Whitney U test
#[wasm_bindgen]
pub fn mann_whitney_test(x: &[f64], y: &[f64], alpha: f64, alternative: &str) -> TestResult {
    use super::mann_whitney_u::MannWhitneyUTest;
    MannWhitneyUTest::independent(x, y, alpha, alternative)
}

/// WASM export for Mann-Whitney U test with configuration
#[wasm_bindgen]
pub fn mann_whitney_test_with_config(
    x: &[f64],
    y: &[f64],
    exact: bool,
    continuity_correction: bool,
    alpha: f64,
    alternative: &str,
) -> TestResult {
    use super::mann_whitney_u::MannWhitneyUTest;
    let config = MannWhitneyConfig {
        exact,
        continuity_correction,
        alternative: alternative.to_string(),
    };
    MannWhitneyUTest::independent_with_config(x, y, config, alpha, alternative)
}
