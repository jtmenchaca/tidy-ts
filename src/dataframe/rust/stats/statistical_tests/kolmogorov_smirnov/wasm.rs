//! WASM bindings for Kolmogorov-Smirnov test

#![cfg(feature = "wasm")]

use super::kolmogorov_smirnov::{kolmogorov_smirnov_test, kolmogorov_smirnov_one_sample};
use crate::stats::core::types::KolmogorovSmirnovTestResult;
use wasm_bindgen::prelude::*;

/// WASM export for two-sample Kolmogorov-Smirnov test
#[wasm_bindgen]
pub fn kolmogorov_smirnov_test_wasm(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> KolmogorovSmirnovTestResult {
    match kolmogorov_smirnov_test(x, y, alternative, alpha) {
        Ok(result) => result,
        Err(_error_msg) => KolmogorovSmirnovTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: 0.0,
                name: crate::stats::core::types::TestStatisticName::DStatistic
                    .as_str()
                    .to_string(),
            },
            p_value: 1.0,
            test_name: "Kolmogorov-Smirnov test".to_string(),
            alpha,
            sample1_size: x.len(),
            sample2_size: y.len(),
            critical_value: 0.0,
            d_statistic: 0.0,
            d_plus: 0.0,
            d_minus: 0.0,
            alternative: alternative.to_string(),
        },
    }
}

/// WASM export for one-sample Kolmogorov-Smirnov test against uniform distribution
#[wasm_bindgen]
pub fn kolmogorov_smirnov_uniform_wasm(
    x: &[f64],
    min: f64,
    max: f64,
    alternative: &str,
    alpha: f64,
) -> KolmogorovSmirnovTestResult {
    // Create uniform CDF function
    let uniform_cdf = move |value: f64| -> f64 {
        if value < min {
            0.0
        } else if value > max {
            1.0
        } else {
            (value - min) / (max - min)
        }
    };

    match kolmogorov_smirnov_one_sample(x, uniform_cdf, alternative, alpha) {
        Ok(result) => result,
        Err(_error_msg) => KolmogorovSmirnovTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: 0.0,
                name: crate::stats::core::types::TestStatisticName::DStatistic
                    .as_str()
                    .to_string(),
            },
            p_value: 1.0,
            test_name: "Kolmogorov-Smirnov test (uniform)".to_string(),
            alpha,
            sample1_size: x.len(),
            sample2_size: 0,
            critical_value: 0.0,
            d_statistic: 0.0,
            d_plus: 0.0,
            d_minus: 0.0,
            alternative: alternative.to_string(),
        },
    }
}

