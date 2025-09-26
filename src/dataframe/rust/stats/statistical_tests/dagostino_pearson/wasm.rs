//! WASM bindings for D'Agostino-Pearson K² test

#![cfg(feature = "wasm")]

use crate::stats::core::types::{DAgostinoPearsonTestResult, TestStatistic, TestStatisticName};
use wasm_bindgen::prelude::*;

/// WASM export for D'Agostino-Pearson K² normality test
#[wasm_bindgen]
pub fn dagostino_pearson_test(x: &[f64], alpha: f64) -> DAgostinoPearsonTestResult {
    use super::dagostino_pearson::DAgostinoPearsonTest;
    DAgostinoPearsonTest::new(x, alpha).unwrap_or_else(|e| DAgostinoPearsonTestResult {
        test_statistic: TestStatistic {
            value: f64::NAN,
            name: TestStatisticName::ChiSquare.as_str().to_string(),
        },
        p_value: f64::NAN,
        test_name: "D'Agostino-Pearson K² Test".to_string(),
        alpha,
        skewness: f64::NAN,
        kurtosis: f64::NAN,
        error_message: Some(e),
        sample_size: x.len(),
    })
}