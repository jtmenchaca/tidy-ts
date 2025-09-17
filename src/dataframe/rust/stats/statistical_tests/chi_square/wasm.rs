//! WASM bindings for Chi-square tests

#![cfg(feature = "wasm")]

use super::{
    categorical::{goodness_of_fit, independence},
    sample_size::chi2_sample_size_variance,
    variance::variance,
};
use crate::stats::core::types::{
    ChiSquareGoodnessOfFitTestResult, ChiSquareIndependenceTestResult, ChiSquareVarianceTestResult,
};
use wasm_bindgen::prelude::*;

/// WASM export for chi-square test of independence
#[wasm_bindgen]
pub fn chi_square_independence(
    observed: &[f64],
    rows: usize,
    cols: usize,
    alpha: f64,
) -> ChiSquareIndependenceTestResult {
    // Convert flattened data to 2D format
    if observed.len() != rows * cols {
        return ChiSquareIndependenceTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: f64::NAN,
                name: crate::stats::core::types::TestStatisticName::ChiSquare
                    .as_str()
                    .to_string(),
            },
            p_value: f64::NAN,
            test_name: "Chi-square test of independence".to_string(),
            alpha,
            error_message: Some("Observed data length must equal rows * cols".to_string()),
            degrees_of_freedom: 0.0,
            effect_size: crate::stats::core::types::EffectSize {
                value: 0.0,
                effect_type: crate::stats::core::types::EffectSizeType::CramersV
                    .as_str()
                    .to_string(),
            },
            sample_size: 0,
            phi_coefficient: 0.0,
            chi_square_expected: vec![],
            residuals: vec![],
        };
    }

    let mut data = Vec::new();
    for i in 0..rows {
        let start = i * cols;
        let end = start + cols;
        data.push(observed[start..end].to_vec());
    }

    match independence(&data, alpha) {
        Ok(result) => result,
        Err(error_msg) => ChiSquareIndependenceTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: f64::NAN,
                name: crate::stats::core::types::TestStatisticName::ChiSquare
                    .as_str()
                    .to_string(),
            },
            p_value: f64::NAN,
            test_name: "Chi-square test of independence".to_string(),
            alpha,
            error_message: Some(error_msg),
            degrees_of_freedom: 0.0,
            effect_size: crate::stats::core::types::EffectSize {
                value: 0.0,
                effect_type: crate::stats::core::types::EffectSizeType::CramersV
                    .as_str()
                    .to_string(),
            },
            sample_size: 0,
            phi_coefficient: 0.0,
            chi_square_expected: vec![],
            residuals: vec![],
        },
    }
}

/// WASM export for chi-square goodness of fit test
#[wasm_bindgen]
pub fn chi_square_goodness_of_fit(
    observed: &[f64],
    expected: &[f64],
    alpha: f64,
) -> ChiSquareGoodnessOfFitTestResult {
    match goodness_of_fit(observed.iter().copied(), expected.iter().copied(), alpha) {
        Ok(result) => result,
        Err(error_msg) => ChiSquareGoodnessOfFitTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: f64::NAN,
                name: crate::stats::core::types::TestStatisticName::ChiSquare
                    .as_str()
                    .to_string(),
            },
            p_value: f64::NAN,
            test_name: "Chi-square goodness of fit test".to_string(),
            alpha,
            error_message: Some(error_msg),
            degrees_of_freedom: 0.0,
            effect_size: crate::stats::core::types::EffectSize {
                value: 0.0,
                effect_type: crate::stats::core::types::EffectSizeType::CramersV
                    .as_str()
                    .to_string(),
            },
            sample_size: 0,
            chi_square_expected: vec![],
        },
    }
}

/// WASM export for chi-square test for variance
#[wasm_bindgen]
pub fn chi_square_variance(
    data: &[f64],
    pop_variance: f64,
    tail: &str,
    alpha: f64,
) -> ChiSquareVarianceTestResult {
    use crate::stats::core::TailType;

    let tail_type = match tail {
        "left" | "less" => TailType::Left,
        "right" | "greater" => TailType::Right,
        _ => TailType::Two,
    };

    match variance(data.iter().copied(), pop_variance, tail_type, alpha) {
        Ok(result) => result,
        Err(error_msg) => ChiSquareVarianceTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: f64::NAN,
                name: crate::stats::core::types::TestStatisticName::ChiSquare
                    .as_str()
                    .to_string(),
            },
            p_value: f64::NAN,
            test_name: "Chi-square test for variance".to_string(),
            alpha,
            error_message: Some(error_msg),
            degrees_of_freedom: 0.0,
            effect_size: crate::stats::core::types::EffectSize {
                value: 0.0,
                effect_type: crate::stats::core::types::EffectSizeType::CramersV
                    .as_str()
                    .to_string(),
            },
            sample_size: 0,
            confidence_interval: crate::stats::core::types::ConfidenceInterval {
                lower: f64::NAN,
                upper: f64::NAN,
                confidence_level: 0.0,
            },
        },
    }
}

/// WASM export for chi-square sample size calculation
#[wasm_bindgen]
pub fn chi_square_sample_size_wasm(effect_size: f64, alpha: f64, power: f64, _df: usize) -> f64 {
    chi2_sample_size_variance(effect_size, alpha, power, 1.0) // Using variance=1.0 as default
}
