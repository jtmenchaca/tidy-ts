//! WASM bindings for Mann-Whitney U test

#![cfg(feature = "wasm")]

use super::mann_whitney_u::MannWhitneyConfig;
use crate::stats::core::types::{
    EffectSize, EffectSizeType, MannWhitneyTestResult, TestStatistic, TestStatisticName,
};
use wasm_bindgen::prelude::*;

/// WASM export for Mann-Whitney U test (automatically chooses exact vs asymptotic)
#[wasm_bindgen]
pub fn mann_whitney_test(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: &str,
) -> MannWhitneyTestResult {
    use super::mann_whitney_u::MannWhitneyUTest;
    MannWhitneyUTest::independent(x, y, alpha, alternative).unwrap_or_else(|e| {
        MannWhitneyTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: TestStatisticName::UStatistic.as_str().to_string(),
            },
            p_value: f64::NAN,
            test_name: "Mann-Whitney U Test".to_string(),
            method: "Error".to_string(),
            alpha,
            error_message: Some(e),
            effect_size: EffectSize {
                value: f64::NAN,
                effect_type: EffectSizeType::RankBiserialCorrelation.as_str().to_string(),
            },
        }
    })
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
) -> MannWhitneyTestResult {
    use super::mann_whitney_u::MannWhitneyUTest;
    let config = MannWhitneyConfig {
        exact,
        continuity_correction,
        alternative: alternative.to_string(),
    };
    MannWhitneyUTest::independent_with_config(x, y, config, alpha, alternative)
        .unwrap_or_else(|e| MannWhitneyTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: TestStatisticName::UStatistic.as_str().to_string(),
            },
            p_value: f64::NAN,
            test_name: "Mann-Whitney U Test".to_string(),
            method: "Error".to_string(),
            alpha,
            error_message: Some(e),
            effect_size: EffectSize {
                value: f64::NAN,
                effect_type: EffectSizeType::RankBiserialCorrelation.as_str().to_string(),
            },
        })
}
