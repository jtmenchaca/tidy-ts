//! WASM bindings for t-tests

#![cfg(feature = "wasm")]

use super::{
    one_sample::t_test,
    sample_size::t_sample_size,
    two_sample::{t_test_ind, t_test_paired as t_test_paired_impl},
};
use crate::stats::core::types::{
    ConfidenceInterval, EffectSize, EffectSizeType, OneSampleTTestResult, PairedTTestResult,
    TestStatistic, TestStatisticName, TwoSampleTTestResult,
};
use crate::stats::helpers::parse_alternative;
use wasm_bindgen::prelude::*;

/// WASM export for one-sample t-test
#[wasm_bindgen]
pub fn t_test_one_sample(
    x: &[f64],
    mu: f64,
    alpha: f64,
    alternative: &str,
) -> OneSampleTTestResult {
    let alternative_type = parse_alternative(alternative);
    t_test(x.iter().copied(), mu, alternative_type, alpha).unwrap_or_else(|error| {
        OneSampleTTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: TestStatisticName::TStatistic.as_str().to_string(),
            },
            p_value: f64::NAN,
            test_name: "One-sample t-test".to_string(),
            alpha,
            error_message: Some(error),
            confidence_interval: ConfidenceInterval {
                lower: f64::NAN,
                upper: f64::NAN,
                confidence_level: 1.0 - alpha,
            },
            degrees_of_freedom: f64::NAN,
            effect_size: EffectSize {
                value: f64::NAN,
                name: EffectSizeType::CohensD.as_str().to_string(),
            },
        }
    })
}

/// WASM export for independent two-sample t-test
#[wasm_bindgen]
pub fn t_test_two_sample_independent(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: &str,
    pooled: bool,
) -> TwoSampleTTestResult {
    let alternative_type = parse_alternative(alternative);
    t_test_ind(
        x.iter().copied(),
        y.iter().copied(),
        alternative_type,
        alpha,
        pooled,
    )
    .unwrap_or_else(|error| TwoSampleTTestResult {
        test_statistic: TestStatistic {
            value: f64::NAN,
            name: "t-statistic".to_string(),
        },
        p_value: f64::NAN,
        test_name: "Independent two-sample t-test".to_string(),
        alpha,
        error_message: Some(error),
        confidence_interval: ConfidenceInterval {
            lower: f64::NAN,
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        },
        degrees_of_freedom: f64::NAN,
        effect_size: EffectSize {
            value: f64::NAN,
            name: "Cohen's d".to_string(),
        },
        mean_difference: f64::NAN,
        standard_error: f64::NAN,
    })
}

/// WASM export for paired t-test
#[wasm_bindgen]
pub fn t_test_paired(x: &[f64], y: &[f64], alpha: f64, alternative: &str) -> PairedTTestResult {
    let alternative_type = parse_alternative(alternative);
    t_test_paired_impl(
        x.iter().copied(),
        y.iter().copied(),
        alternative_type,
        alpha,
    )
    .unwrap_or_else(|error| PairedTTestResult {
        test_statistic: TestStatistic {
            value: f64::NAN,
            name: "t-statistic".to_string(),
        },
        p_value: f64::NAN,
        test_name: "Paired t-test".to_string(),
        alpha,
        error_message: Some(error),
        confidence_interval: ConfidenceInterval {
            lower: f64::NAN,
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        },
        degrees_of_freedom: f64::NAN,
        effect_size: EffectSize {
            value: f64::NAN,
            name: "Cohen's d".to_string(),
        },
        mean_difference: f64::NAN,
        standard_error: f64::NAN,
    })
}

/// WASM export for t-test sample size calculation
#[wasm_bindgen]
pub fn t_sample_size_wasm(effect_size: f64, alpha: f64, power: f64, std_dev: f64) -> f64 {
    let alternative_type = parse_alternative("two-sided"); // Default to two-sided
    let tail = alternative_type.to_tail_type();
    t_sample_size(effect_size, alpha, power, std_dev, tail)
}
