//! WASM bindings for proportion tests

#![cfg(feature = "wasm")]

use super::{
    chi_square_test::{chi_square_test_one_sample, chi_square_test_two_sample},
    sample_size::prop_sample_size,
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
) -> Result<JsValue, JsValue> {
    let alternative_type = parse_alternative(alternative);
    let result = chi_square_test_one_sample(x, n, p0, alternative_type, alpha, true)
        .map_err(|e| JsValue::from_str(&format!("Test failed: {}", e)))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
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
) -> Result<JsValue, JsValue> {
    let alternative_type = parse_alternative(alternative);
    let result = chi_square_test_two_sample(x1, n1, x2, n2, alternative_type, alpha, true)
        .map_err(|e| JsValue::from_str(&format!("Test failed: {}", e)))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for proportion sample size calculation
#[wasm_bindgen]
pub fn proportion_sample_size_wasm(p1: f64, p2: f64, alpha: f64, power: f64) -> f64 {
    prop_sample_size(p1, p2, alpha, power)
}
