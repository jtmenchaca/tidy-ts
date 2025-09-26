//! WASM bindings for Anderson-Darling test

#![cfg(feature = "wasm")]

use crate::stats::core::types::{AndersonDarlingTestResult, TestStatistic, TestStatisticName};
use wasm_bindgen::prelude::*;

/// WASM export for Anderson-Darling normality test
#[wasm_bindgen]
pub fn anderson_darling_test(x: &[f64], alpha: f64) -> AndersonDarlingTestResult {
    use super::anderson_darling::AndersonDarlingTest;
    AndersonDarlingTest::new(x, alpha).unwrap_or_else(|e| AndersonDarlingTestResult {
        test_statistic: TestStatistic {
            value: f64::NAN,
            name: TestStatisticName::AStatistic.as_str().to_string(),
        },
        p_value: f64::NAN,
        test_name: "Anderson-Darling Test".to_string(),
        alpha,
        error_message: Some(e),
        sample_size: x.len(),
    })
}