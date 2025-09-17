//! WASM bindings for z-tests

#![cfg(feature = "wasm")]

use super::{one_sample::z_test, sample_size::z_sample_size, two_sample::z_test_ind};
use crate::stats::core::types::{OneSampleZTestResult, TwoSampleZTestResult, TestStatistic, ConfidenceInterval};
use crate::stats::helpers::parse_alternative;
use wasm_bindgen::prelude::*;

/// WASM export for one-sample z-test
#[wasm_bindgen]
pub fn z_test_one_sample(
    x: &[f64],
    mu: f64,
    sigma: f64,
    alpha: f64,
    alternative: &str,
) -> OneSampleZTestResult {
    let alternative_type = parse_alternative(alternative);
    z_test(x.iter().copied(), mu, sigma, alternative_type, alpha).unwrap_or_else(|e| {
        OneSampleZTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: "Z-Statistic".to_string(),
            },
            p_value: f64::NAN,
            test_name: "One-sample Z-test".to_string(),
            alpha,
            error_message: Some(e),
            confidence_interval: ConfidenceInterval {
                lower: f64::NAN,
                upper: f64::NAN,
                confidence_level: 1.0 - alpha,
            },
            effect_size: crate::stats::core::types::EffectSize {
                value: f64::NAN,
                effect_type: "Cohen's D".to_string(),
            },
        }
    })
}

/// WASM export for two-sample z-test
#[wasm_bindgen]
pub fn z_test_two_sample(
    x: &[f64],
    y: &[f64],
    sigma_x: f64,
    sigma_y: f64,
    alpha: f64,
    alternative: &str,
) -> TwoSampleZTestResult {
    let alternative_type = parse_alternative(alternative);
    z_test_ind(
        x.iter().copied(),
        y.iter().copied(),
        sigma_x,
        sigma_y,
        alternative_type,
        alpha,
    ).unwrap_or_else(|e| {
        TwoSampleZTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: "Z-Statistic".to_string(),
            },
            p_value: f64::NAN,
            test_name: "Independent two-sample Z-test".to_string(),
            alpha,
            error_message: Some(e),
            confidence_interval: ConfidenceInterval {
                lower: f64::NAN,
                upper: f64::NAN,
                confidence_level: 1.0 - alpha,
            },
            effect_size: crate::stats::core::types::EffectSize {
                value: f64::NAN,
                effect_type: "Cohen's D".to_string(),
            },
            mean_difference: f64::NAN,
            standard_error: f64::NAN,
        }
    })
}

/// WASM export for z-test sample size calculation
#[wasm_bindgen]
pub fn z_sample_size_wasm(effect_size: f64, alpha: f64, power: f64, test_type: &str) -> f64 {
    let alternative_type = parse_alternative(test_type);
    z_sample_size(effect_size, alpha, power, 1.0, alternative_type) // Using std_dev = 1.0 as default
}
