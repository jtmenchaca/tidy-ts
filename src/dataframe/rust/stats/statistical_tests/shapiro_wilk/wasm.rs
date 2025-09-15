//! WASM bindings for Shapiro-Wilk test

#![cfg(feature = "wasm")]

use crate::stats::core::TestResult;
use wasm_bindgen::prelude::*;

/// WASM export for Shapiro-Wilk normality test
#[wasm_bindgen]
pub fn shapiro_wilk_test(x: &[f64], alpha: f64) -> TestResult {
    use super::shapiro_wilk::ShapiroWilkTest;
    ShapiroWilkTest::new(x, alpha)
}
