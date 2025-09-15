//! WASM bindings for Fisher's exact test

#![cfg(feature = "wasm")]

use super::fishers_exact::fishers_exact_test;
use crate::stats::core::TestResult;
use wasm_bindgen::prelude::*;

/// WASM export for Fisher's exact test
#[wasm_bindgen]
pub fn fishers_exact_test_wasm(
    a: f64,
    b: f64,
    c: f64,
    d: f64,
    alternative: &str,
    odds_ratio: f64,
    alpha: f64,
) -> TestResult {
    let table = vec![a, b, c, d];
    fishers_exact_test(&table, alternative, odds_ratio, alpha)
}
