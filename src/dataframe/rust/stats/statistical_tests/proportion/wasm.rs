//! WASM bindings for proportion tests

#![cfg(feature = "wasm")]

use super::{
    chi_square_test::{chi_square_test_one_sample, chi_square_test_two_sample},
    sample_size::prop_sample_size,
};
use crate::stats::core::types::{
    ConfidenceInterval, OneSampleProportionTestResult, TestStatistic, TwoSampleProportionTestResult,
};
use crate::stats::helpers::parse_alternative;
use wasm_bindgen::prelude::*;

/// WASM export for one-sample proportion test (chi-square approach, matches R)
#[wasm_bindgen]
pub fn proportion_test_one_sample(
    x: f64,
    n: f64,
    p0: f64,
    alpha: f64,
    alternative: &str,
) -> OneSampleProportionTestResult {
    let alternative_type = parse_alternative(alternative);

    match chi_square_test_one_sample(x, n, p0, alternative_type, alpha, true) {
        Ok(result) => result,
        Err(e) => OneSampleProportionTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: "X-squared".to_string(),
            },
            p_value: f64::NAN,
            test_name: "One-sample proportion test".to_string(),
            alpha,
            error_message: Some(format!("Test failed: {}", e)),
            confidence_interval: ConfidenceInterval {
                lower: f64::NAN,
                upper: f64::NAN,
                confidence_level: 1.0 - alpha,
            },
            sample_proportion: f64::NAN,
        },
    }
}

/// WASM export for two-sample proportion test (chi-square approach, matches R)
#[wasm_bindgen]
pub fn proportion_test_two_sample(
    x1: f64,
    n1: f64,
    x2: f64,
    n2: f64,
    alpha: f64,
    alternative: &str,
    _pooled: bool, // R's prop.test always uses pooled approach
) -> TwoSampleProportionTestResult {
    let alternative_type = parse_alternative(alternative);

    match chi_square_test_two_sample(x1, n1, x2, n2, alternative_type, alpha, true) {
        Ok(result) => result,
        Err(e) => TwoSampleProportionTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: "X-squared".to_string(),
            },
            p_value: f64::NAN,
            test_name: "Two-sample proportion test".to_string(),
            alpha,
            error_message: Some(format!("Test failed: {}", e)),
            confidence_interval: ConfidenceInterval {
                lower: f64::NAN,
                upper: f64::NAN,
                confidence_level: 1.0 - alpha,
            },
            proportion_difference: f64::NAN,
        },
    }
}

/// WASM export for proportion sample size calculation
#[wasm_bindgen]
pub fn proportion_sample_size_wasm(p1: f64, p2: f64, alpha: f64, power: f64) -> f64 {
    prop_sample_size(p1, p2, alpha, power)
}
