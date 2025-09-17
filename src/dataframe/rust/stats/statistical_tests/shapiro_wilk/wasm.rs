//! WASM bindings for Shapiro-Wilk test

#![cfg(feature = "wasm")]

use crate::stats::core::types::{ShapiroWilkTestResult, TestStatistic, TestStatisticName};
use wasm_bindgen::prelude::*;

/// WASM export for Shapiro-Wilk normality test
#[wasm_bindgen]
pub fn shapiro_wilk_test(x: &[f64], alpha: f64) -> ShapiroWilkTestResult {
    use super::shapiro_wilk::ShapiroWilkTest;
    ShapiroWilkTest::new(x, alpha).unwrap_or_else(|e| ShapiroWilkTestResult {
        test_statistic: TestStatistic {
            value: f64::NAN,
            name: TestStatisticName::WStatistic.as_str().to_string(),
        },
        p_value: f64::NAN,
        test_name: "Shapiro-Wilk Test".to_string(),
        alpha,
        error_message: Some(e),
        sample_size: x.len(),
    })
}
