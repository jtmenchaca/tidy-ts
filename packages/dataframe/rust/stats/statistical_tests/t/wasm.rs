//! WASM bindings for t-tests

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

use super::{
    one_sample::t_test,
    sample_size::t_sample_size,
    two_sample::{t_test_ind, t_test_paired as t_test_paired_impl},
};
use crate::stats::helpers::parse_alternative;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for one-sample t-test
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn t_test_one_sample(
    x: &[f64],
    mu: f64,
    alpha: f64,
    alternative: &str,
) -> Result<JsValue, JsValue> {
    let alternative_type = parse_alternative(alternative);
    let result = t_test(x.iter().copied(), mu, alternative_type, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for independent two-sample t-test
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn t_test_two_sample_independent(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: &str,
    pooled: bool,
) -> Result<JsValue, JsValue> {
    let alternative_type = parse_alternative(alternative);
    let result = t_test_ind(
        x.iter().copied(),
        y.iter().copied(),
        alternative_type,
        alpha,
        pooled,
    )
    .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for paired t-test
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn t_test_paired(x: &[f64], y: &[f64], alpha: f64, alternative: &str) -> Result<JsValue, JsValue> {
    let alternative_type = parse_alternative(alternative);
    let result = t_test_paired_impl(
        x.iter().copied(),
        y.iter().copied(),
        alternative_type,
        alpha,
    )
    .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for t-test sample size calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn t_sample_size_wasm(effect_size: f64, alpha: f64, power: f64, std_dev: f64) -> f64 {
    let alternative_type = parse_alternative("two-sided"); // Default to two-sided
    let tail = alternative_type.to_tail_type();
    t_sample_size(effect_size, alpha, power, std_dev, tail)
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
#[napi]
pub fn t_test_one_sample_napi(
    x: &[f64],
    mu: f64,
    alpha: f64,
    alternative: String,
) -> Result<String, napi::Error> {
    let alternative_type = parse_alternative(&alternative);
    let result = t_test(x.iter().copied(), mu, alternative_type, alpha)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn t_test_two_sample_independent_napi(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: String,
    pooled: bool,
) -> Result<String, napi::Error> {
    let alternative_type = parse_alternative(&alternative);
    let result = t_test_ind(
        x.iter().copied(),
        y.iter().copied(),
        alternative_type,
        alpha,
        pooled,
    )
    .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn t_test_paired_napi(x: &[f64], y: &[f64], alpha: f64, alternative: String) -> Result<String, napi::Error> {
    let alternative_type = parse_alternative(&alternative);
    let result = t_test_paired_impl(
        x.iter().copied(),
        y.iter().copied(),
        alternative_type,
        alpha,
    )
    .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn t_sample_size_napi(effect_size: f64, alpha: f64, power: f64, std_dev: f64) -> f64 {
    let alternative_type = parse_alternative("two-sided");
    let tail = alternative_type.to_tail_type();
    t_sample_size(effect_size, alpha, power, std_dev, tail)
}
