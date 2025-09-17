//! WASM bindings for proportion tests

#![cfg(feature = "wasm")]

use super::{one_sample::z_test, sample_size::prop_sample_size, two_sample::z_test_ind};
use crate::stats::core::types::{OneSampleProportionTestResult, TwoSampleProportionTestResult, TestStatistic, TestStatisticName, ConfidenceInterval};
use crate::stats::helpers::parse_alternative;
use wasm_bindgen::prelude::*;

/// WASM export for one-sample proportion test
#[wasm_bindgen]
pub fn proportion_test_one_sample(
    x: f64,
    n: f64,
    p0: f64,
    alpha: f64,
    alternative: &str,
) -> OneSampleProportionTestResult {
    let alternative_type = parse_alternative(alternative);

    // For one-sample proportion test, we need to create a simple data vector
    // representing the successes and failures
    let successes = x as usize;
    let failures = (n - x) as usize;

    let mut data = Vec::new();
    data.extend(vec![1.0; successes]); // 1.0 for successes
    data.extend(vec![0.0; failures]); // 0.0 for failures

    match z_test(data, p0, alternative_type, alpha) {
        Ok(result) => result,
        Err(e) => OneSampleProportionTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: TestStatisticName::ZStatistic.as_str().to_string(),
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

/// WASM export for two-sample proportion test
#[wasm_bindgen]
pub fn proportion_test_two_sample(
    x1: f64,
    n1: f64,
    x2: f64,
    n2: f64,
    alpha: f64,
    alternative: &str,
    pooled: bool,
) -> TwoSampleProportionTestResult {
    let alternative_type = parse_alternative(alternative);

    // For two-sample proportion test, we need to create data vectors
    // representing the successes and failures for each group
    let successes1 = x1 as usize;
    let failures1 = (n1 - x1) as usize;
    let successes2 = x2 as usize;
    let failures2 = (n2 - x2) as usize;

    let mut data1 = Vec::new();
    data1.extend(vec![1.0; successes1]); // 1.0 for successes
    data1.extend(vec![0.0; failures1]); // 0.0 for failures

    let mut data2 = Vec::new();
    data2.extend(vec![1.0; successes2]); // 1.0 for successes
    data2.extend(vec![0.0; failures2]); // 0.0 for failures

    match z_test_ind(data1, data2, alternative_type, alpha, pooled) {
        Ok(result) => result,
        Err(e) => TwoSampleProportionTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: TestStatisticName::ZStatistic.as_str().to_string(),
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
