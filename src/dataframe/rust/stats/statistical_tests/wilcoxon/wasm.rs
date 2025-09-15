//! WASM bindings for Wilcoxon tests

#![cfg(feature = "wasm")]

use crate::stats::core::TestResult;
use wasm_bindgen::prelude::*;

/// WASM export for Wilcoxon W test (paired)
#[wasm_bindgen]
pub fn wilcoxon_w_test(x: &[f64], y: &[f64], alpha: f64, alternative: &str) -> TestResult {
    use super::wilcoxon_w::WilcoxonWTest;
    WilcoxonWTest::paired(x, y, alpha, alternative)
}
