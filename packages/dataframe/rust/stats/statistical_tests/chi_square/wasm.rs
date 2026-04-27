//! WASM bindings for Chi-square tests

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

use super::{
    categorical::{goodness_of_fit, independence},
    sample_size::chi2_sample_size_variance,
    variance::variance,
};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for chi-square test of independence
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn chi_square_independence(
    observed: &[f64],
    rows: usize,
    cols: usize,
    alpha: f64,
) -> Result<JsValue, JsValue> {
    // Convert flattened data to 2D format
    if observed.len() != rows * cols {
        return Err(JsValue::from_str(
            "Observed data length must equal rows * cols",
        ));
    }

    let mut data = Vec::new();
    for i in 0..rows {
        let start = i * cols;
        let end = start + cols;
        data.push(observed[start..end].to_vec());
    }

    let result = independence(&data, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for chi-square goodness of fit test
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn chi_square_goodness_of_fit(
    observed: &[f64],
    expected: &[f64],
    alpha: f64,
) -> Result<JsValue, JsValue> {
    let result = goodness_of_fit(observed.iter().copied(), expected.iter().copied(), alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for chi-square test for variance
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn chi_square_variance(
    data: &[f64],
    pop_variance: f64,
    tail: &str,
    alpha: f64,
) -> Result<JsValue, JsValue> {
    use crate::stats::core::TailType;

    let tail_type = match tail {
        "left" | "less" => TailType::Left,
        "right" | "greater" => TailType::Right,
        _ => TailType::Two,
    };

    let result = variance(data.iter().copied(), pop_variance, tail_type, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for chi-square sample size calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn chi_square_sample_size_wasm(effect_size: f64, alpha: f64, power: f64, _df: usize) -> f64 {
    chi2_sample_size_variance(effect_size, alpha, power, 1.0) // Using variance=1.0 as default
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
#[napi]
pub fn chi_square_independence_napi(
    observed: &[f64],
    rows: u32,
    cols: u32,
    alpha: f64,
) -> Result<String, napi::Error> {
    let rows = rows as usize;
    let cols = cols as usize;
    if observed.len() != rows * cols {
        return Err(napi::Error::from_reason(
            "Observed data length must equal rows * cols",
        ));
    }

    let mut data = Vec::new();
    for i in 0..rows {
        let start = i * cols;
        let end = start + cols;
        data.push(observed[start..end].to_vec());
    }

    let result = independence(&data, alpha)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn chi_square_goodness_of_fit_napi(
    observed: &[f64],
    expected: &[f64],
    alpha: f64,
) -> Result<String, napi::Error> {
    let result = goodness_of_fit(observed.iter().copied(), expected.iter().copied(), alpha)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn chi_square_variance_napi(
    data: &[f64],
    pop_variance: f64,
    tail: String,
    alpha: f64,
) -> Result<String, napi::Error> {
    use crate::stats::core::TailType;

    let tail_type = match tail.as_str() {
        "left" | "less" => TailType::Left,
        "right" | "greater" => TailType::Right,
        _ => TailType::Two,
    };

    let result = variance(data.iter().copied(), pop_variance, tail_type, alpha)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn chi_square_sample_size_napi(effect_size: f64, alpha: f64, power: f64, _df: u32) -> f64 {
    chi2_sample_size_variance(effect_size, alpha, power, 1.0)
}
