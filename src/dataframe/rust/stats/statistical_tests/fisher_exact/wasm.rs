//! WASM bindings for Fisher's exact test

#![cfg(feature = "wasm")]

use super::fishers_exact::fishers_exact_test;
use crate::stats::core::types::{FishersExactTestResult, TestStatistic, ConfidenceInterval};
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
) -> FishersExactTestResult {
    let table = vec![a, b, c, d];
    fishers_exact_test(&table, alternative, odds_ratio, alpha).unwrap_or_else(|e| {
        FishersExactTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: "T-Statistic".to_string(),
            },
            p_value: f64::NAN,
            test_name: "Fisher's exact test".to_string(),
            alpha,
            error_message: Some(e),
            confidence_interval: ConfidenceInterval {
                lower: f64::NAN,
                upper: f64::NAN,
                confidence_level: 1.0 - alpha,
            },
            odds_ratio: f64::NAN,
            method: alternative.to_string(),
        }
    })
}
